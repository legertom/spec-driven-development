---
slug: l6-ci-cd-for-agents
number: "L6"
title: "CI/CD for Agents"
module: 3
moduleTitle: "CI/CD"
verb: Measure
minutes: 60
prereqs: ["l5-measuring-with-evaluators"]
summary: "Turn each failure into a replayable test case, pick a cost tier, measure reliability with pass^k, gate merges in GitHub Actions, and keep watching production."
objectives:
  - "Convert a failure into a test case with an initial state, an input, an expected result, and tags."
  - "Choose a code assertion for a mechanical failure and a pinned judge for a subjective one."
  - "Pick a cost tier for each test: every commit, every pull request, or nightly."
  - "Compute pass@k and pass^k for a given success rate and explain which one a support agent needs."
  - "Wire a GitHub Actions gate with a threshold and a flake policy, and monitor production with a dashboard and alerts."
keyTerms: ["regression-suite", "test-case", "initial-state", "assertion", "pinned-judge", "mocked-integration", "cost-tier", "pass-at-k", "pass-hat-k", "reset-and-replay", "ci-cd", "github-actions", "gate", "monitoring", "dashboard", "alert", "flake", "corrected-prevalence"]
---

## Why this matters

On Tuesday, Dev fixes the failure mode Pip cares about most, *Refund outside policy*. The fix is one new rule in Sprout's system prompt. On the dev slice from L5, the failure drops from 4 traces in 60 to 0.

On Thursday, Dev edits the same prompt to make Sprout sound warmer. The refund rule slides down a paragraph and gets trimmed to one line. Nobody re-runs the 60 traces, because the change was "only about tone."

The next Wednesday, Maya finds three refund promises on orders older than 30 days. For a week, customers heard "yes" where the policy says "no." The fix worked. Nothing kept it working. This lesson builds the thing that keeps fixes working: a suite that runs on every change, a gate that blocks bad merges, and a monitor that watches production after you ship.

## 1. From failure to test case

In L4 you named failure modes. In L5 you built an evaluator for each. Now you make each failure replayable, so a computer checks it on every change.

A **regression suite** is the set of tests you run before every change to confirm old failures stay fixed. A **test case** is one entry in it. For an agent it has four parts.

| Field | Holds | Comes from |
|---|---|---|
| `id` | A stable name | You |
| `initial_state` | The world the test starts from: orders, today's date, the approval queue | The seeded world (L3) |
| `input` | Who the customer is and what they send | The failing trace (L4) |
| `expected` | Assertions, a pinned judge, or both | The definition (L4) and the evaluator (L5) |
| `tags` | Labels for filtering | The taxonomy (L4) |

:::beginner What "initial state" means
Think of a saved game. Save a chess match one move before a blunder and you can reload it and retry that move on the same board. An **initial state** is that saved game for Sprout: which orders exist, what today's date is, what Maya has approved. Without it, "this order is 41 days old" is true today and false a month from now.
:::

Here is Dev's test case for the Thursday regression. It starts from Alex's real conversation, with the world trimmed to the one order that matters.

:::example A complete test case for "refund outside policy"
```yaml
id: tc-refund-outside-window-014
from_trace: 7f3a9c              # the L4 trace this came from
initial_state:
  world_seed: 42                # the deterministic world from L3
  today: 2026-05-12
  orders:
    - id: "1042"
      customer_id: alex
      items: [{ sku: monstera-m, price: 48.00 }]
      total: 48.00
      status: delivered
      delivered_on: 2026-04-01  # 41 days before today
  approval_queue: []            # Maya has approved nothing
input:
  role: customer
  user_id: alex
  messages:
    - role: user
      content: "My monstera's pot arrived cracked. I'd like a refund please."
expected:
  assertions:
    - type: tool_not_requested
      tool: issue_refund
    - type: reply_contains_none
      phrases: ["refund has been issued", "sent your refund", "refunded"]
    - type: reply_matches
      pattern: "30[- ]day"
  judge:
    id: refund-promised-outside-policy
    prompt_hash: 4b9d21e0
    expect: pass
tags: [refund, policy-window, delivered, t2, from-production]
```
The world says the order is 41 days old. The customer asks for a refund. Correct means no refund requested, no refund promised, and the 30-day window explained. The assertions check the mechanical parts. The judge checks the wording.
:::

Four habits make a case worth keeping. One failure mode per case, so a failure tells you why. The smallest world that reproduces it: one order, not sixty. A real trace as the source when you can, because production cases anchor the suite. And a mirror case: `tc-refund-inside-window-015` is the same message with `delivered_on` nine days ago, where correct means `issue_refund` *is* requested. Without it, Sprout can pass by refusing everyone.

:::key
A test case is a frozen world, a frozen input, and a written definition of correct. Drop any one of the three and you cannot replay it.
:::

## 2. Assertion vs pinned judge

The `expected` block holds two kinds of check.

An **assertion** is a code check that reads the trace and returns true or false. Was a tool requested? With what arguments? Does the reply contain a phrase? Assertions are exact, free, and instant. They fit failures with a mechanical definition, such as *Refund outside policy* or *Revealed another customer's data*.

A **pinned judge** is an LLM judge from L5 with the judge prompt and the model version frozen and recorded in the test, so a result only changes when Sprout changes. A judge costs cents and takes seconds, and you trust it because of its TPR and TNR on the frozen test set. Judges fit failures that need interpretation, such as *Wrong tone*.

:::example Assertions for three of Sprout's failure modes
```yaml
# Refund outside policy
- { type: tool_not_requested, tool: issue_refund }
# Revealed another customer's data: every order id in the reply belongs to this user
- { type: reply_order_ids_owned_by, user_id: alex }
# Did not escalate when required: legal words must trigger escalate_to_human
- { type: tool_called, tool: escalate_to_human, when_input_matches: "lawyer|attorney|sue" }
```
Each is a few lines of code in your runner. None needs a model.
:::

:::example What "pinned" looks like
The `judge` block in the test case above names the judge and its `prompt_hash`, the first eight characters of the sha256 of the prompt file (the L2 trick). The judge file itself records the exact model version and its validation numbers, TPR 0.85 and TNR 0.95. If the hash in the test does not match the prompt file, the runner refuses to run. A year from now you can still answer "which judge said this?"
:::

:::warning Editing the judge to make a test pass
A pinned judge flags a reply you think is fine. The tempting move is to soften the judge prompt in the same pull request that changed Sprout. Now two things changed at once, and the green result means nothing. Fix Sprout, or change the judge in its own pull request, re-validate it on the frozen test set, and bump its version.
:::

:::tip
Keep each judge as a file in the repository with its validation table beside it. A judge with no TPR and TNR next to it is an opinion, not a test.
:::

## 3. Cost tiers

Not every test costs the same. A **cost tier** says what a test needs in order to run, which tells you how often you can afford to run it.

| Tier | What runs | Model calls | Time and cost | Runs on |
|---|---|---|---|---|
| Tier 0, unit | Pure code: permission layer, argument validation, assertion functions | None | Milliseconds, free | Every commit |
| Tier 1, mocked integration | The real loop and model; every tool is a fake returning fixed data from `initial_state` | One short conversation | Seconds, cents | Every pull request |
| Tier 2, full agent | The whole agent against the seeded staging world, k runs per case, pinned judges | k conversations plus judges | Minutes, dollars | Nightly, and before a release |

:::beginner What a mock is
A mock is a stand-in that answers with fixed data. A mocked `lookup_order("1042")` returns the same order every time, with no database and no network. A **mocked integration** test is one where the loop is real and the tools are stand-ins.
:::

:::example The refund test at each tier
- **Tier 0.** Call `validateRefund({ order, amount: 48, today })` with the 41-day-old order. It must return `outside_window`. No model, 2 milliseconds.
- **Tier 1.** Run the loop once with a fake `lookup_order` that returns the frozen order. Check the assertions. One model call, 4 seconds, 2 cents.
- **Tier 2.** Run the case 5 times against staging with real tools, then the pinned judge on each reply. About 40 seconds and 40 cents.

Same failure, three prices. The cheap tiers catch most regressions. The expensive tier catches the ones that only appear with the real model and real tool results.
:::

:::warning Running every eval on every commit
Run all 84 cases at Tier 2 with k = 5 on every push and you get 420 conversations, about 40 minutes and 30 dollars, per push. Within a week, developers stop waiting for it and merge around it. A suite nobody waits for protects nothing. Put each case in the cheapest tier that catches its failure.
:::

A workable split for Sprout: 40 cases at Tier 0, 32 at Tier 1, 12 at Tier 2. The nightly Tier 2 run costs about 5 dollars.

## 4. pass@k vs pass^k

Sprout does not pass or fail a test. It passes it *some fraction of the time*. Call that fraction p. Run a case 20 times, see 18 passes, and p is about 0.9. Two summaries of "p over k runs" exist, and they answer different questions.

**pass@k** is the probability that *at least one* of k runs passes. It measures capability: can Sprout do this at all, given a few tries?

**pass^k** (read "pass hat k") is the probability that *all* k runs pass. It measures reliability: does Sprout do this every time?

- pass@k = 1 - (1 - p)^k
- pass^k = p^k

:::beginner The caret means "to the power of"
`p^3` is p × p × p. So pass^3 with p = 0.9 is 0.9 × 0.9 × 0.9. And (1 - p)^3 is the chance of failing three times in a row: 0.1 × 0.1 × 0.1.
:::

:::example The math with p = 0.9 and k = 3
- pass^3 = 0.9 × 0.9 × 0.9 = **0.729**. Sprout gets all three right about 73% of the time.
- pass@3 = 1 - (0.1 × 0.1 × 0.1) = 1 - 0.001 = **0.999**. At least one of three is right 99.9% of the time.

Same agent, same p. One number says "great." The other says "one customer in four sees a failure across three questions."

Now with p = 0.99 and k = 3:

- pass^3 = 0.99 × 0.99 × 0.99 = **0.970**
- pass@3 = 1 - (0.01 × 0.01 × 0.01) = **0.999999**

Going from 0.9 to 0.99 barely moves pass@3. It moves pass^3 from 0.73 to 0.97. That is the improvement a customer feels.
:::

Reliability falls fast as k grows. With p = 0.9, pass^5 is 0.59 and pass^10 is 0.35. With p = 0.99, pass^10 is still 0.90.

Which one matters for Sprout? Alex has one conversation. There is no "try three times and keep the best." A run that fails 10% of the time means one refund question in ten gets the wrong answer. That is pass^k territory. pass@k fits tasks where you generate several candidates and pick one, like asking for five fern names and choosing the best.

:::key
Report pass^k for anything a customer experiences once. pass@k tells you what the agent can do. pass^k tells you what the customer will get.
:::

One caution: p is an estimate. Five runs with one failure suggests p is about 0.8, but five runs cannot tell 0.8 from 0.9 apart. Nightly runs accumulate, and the bootstrap interval from L5 tightens every night.

:::try Ask Eve
Highlight the formulas above and ask Eve: "If Sprout passes the refund test with p = 0.95, what is pass^5, and should Pip ship?" Then ask what p would need to be for pass^10 to reach 0.9.
:::

## 5. Reset-and-replay

To measure p you run the same case k times. Each run has to start from the same initial state, or you are measuring k different tests. **Reset-and-replay** is the discipline: restore the world snapshot, send the same input, record the result, repeat.

Why does reset matter? State leaks between runs. Sprout's actions change the world, and the changed world changes Sprout's next answer.

:::example A leak that invents a bug
Jordan's order #1077 has not shipped, and Jordan asks to cancel it. Correct is one `cancel_order` call and a confirmation.

- Run 1 (fresh world): Sprout calls `cancel_order("1077")`. Pass.
- Run 2 (no reset): the order is already `cancelled`. Sprout says so. The assertion `tool_called: cancel_order` fails.
- Run 3 (no reset): same as run 2.

Reported failure rate: 2 in 3. Real failure rate: 0. The reverse happens too: if run 1 leaves an approval in the queue, run 2's refund looks approved when it should not be.
:::

Other things that leak: the approval queue, rate-limit counters, conversation memory, a cached care-guide search, and the clock. Reset all of them, not only the orders table.

```bash
# Reset the seeded world, then replay one case 5 times at Tier 2
npm run world:reset -- --seed 42
npm run evals -- --case tc-refund-outside-window-014 --k 5 --tier 2
```

Your runner's commands will differ. The output is a table: five runs, four pass, and run 3 requests `issue_refund` and fails the judge. So p is about 0.8 tonight, and run 3 is a real trace of the regression that goes straight into the pull request comment.

:::tip
Reset by construction: build the world in memory from the seed at the start of every run instead of restoring a database afterward. A reset you cannot forget is the only reliable kind.
:::

## 6. The GitHub Actions gate

**CI/CD** is the automation that runs your tests on every change (continuous integration) and ships the change when they pass (continuous delivery). A **gate** is the rule inside it that blocks a merge or deploy when the suite says no. **GitHub Actions** is the runner this course uses. Others work the same way.

The workflow below is a sketch. It runs Tier 0 and Tier 1 on every pull request, and Tier 2 nightly or when someone adds the `run-full-evals` label.

```yaml
# Sketch: .github/workflows/agent-gate.yml (adapt the script names to your runner)
name: agent-gate
on:
  pull_request:
  schedule:
    - cron: "0 3 * * *"          # nightly at 03:00 UTC
jobs:
  fast-tiers:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run test:tier0             # pure code, every push
      - run: npm run test:tier1             # mocked tools, every PR
  full-agent:
    if: github.event_name == 'schedule' || contains(github.event.pull_request.labels.*.name, 'run-full-evals')
    runs-on: ubuntu-latest
    env:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:tier2 -- --k 5 --baseline evals/baseline.json --max-regression 0.02
```

### Thresholds

The gate compares this run to a baseline: the failure rate per failure mode from the last accepted run on the main branch, stored as a file in the repository. `--max-regression 0.02` means: block if any failure mode rises more than 2 percentage points above its baseline. Adversarial cases (L7) get a stricter rule: any failure blocks.

:::example What a blocked run looks like
```text
tier2: 12 cases x 5 runs = 60 conversations (38 s, $4.60)
  refund-outside-policy   baseline 0.0%   this run 6.7% (4/60)   max +2.0%   BLOCKED
  made-up-order-info      baseline 3.3%   this run 3.3% (2/60)   max +2.0%   ok
Failing traces: evals/runs/2026-05-14/refund-outside-policy/{3,17,22,41}.json
```
Thursday's "tone only" change would have died here, with four traces attached, before anyone merged it.
:::

### Flake policy

A **flake** is a test that fails, then passes on rerun, with nothing changed in between. Sources: sampling, a network hiccup, a world that was not reset. Dev's policy: a failed Tier 2 case is rerun once from a fresh reset. If it passes, it counts as a flake toward a per-case flake rate. A case whose flake rate passes 10% over a week is quarantined: it still runs and reports, but no longer blocks, and an issue is opened to find the cause. Nobody deletes a flaky test. A flake is often a real failure with p around 0.9, which is exactly what §4 says to fear.

:::warning Green is not proof
With p = 0.9 and k = 3, a case passes all three runs 73% of the time, so a k = 3 gate lets a 10% failure through on most pull requests. That is acceptable, because the nightly run sees 35 runs over a week and catches it. Trust the weekly trend, not one green check.
:::

:::key
The gate does one thing: it refuses to merge a change that makes a known failure more common than the baseline. Everything else in this lesson exists to make that refusal trustworthy.
:::

## 7. Post-deploy monitoring

The suite covers the scenarios you wrote. Production sends the rest. **Monitoring** means running your evaluators on real traces after you ship. A **dashboard** shows the estimate for each failure mode over time. An **alert** tells a person when a number crosses a line.

The pattern for Sprout: code checks on all traffic, because they are free. Pinned judges on a random 5% sample, because they cost money; at 2,000 conversations a day that is 100 judge calls per failure mode per day. A dashboard of corrected prevalence per failure mode, with a threshold and an owner on each row. And a weekly review that feeds new failure modes back into L4.

Corrected prevalence comes from L5. Judges miss some failures and flag some passes, so the raw flag rate is not the true rate:

`p_true = (p_observed - (1 - TNR)) / (TPR - (1 - TNR))`

:::example One correction, worked
The *Made up order info* judge flags 8% of the sample this week. Its validation table says TPR 0.85 and TNR 0.95, so it wrongly flags 5% of clean traces.

p_true = (0.08 - 0.05) / (0.85 - 0.05) = 0.03 / 0.80 = **0.0375**, about 3.8%.

The dashboard shows 3.8%, not 8%. Without the correction, Dev would chase a problem more than half of which is judge noise.
:::

:::example Sprout's monitoring dashboard as a table
| Failure mode | Detector, coverage | Observed (7 days) | TPR / TNR | Corrected prevalence | Alert threshold |
|---|---|---|---|---|---|
| Refund outside policy | Code check, 100% | 1.1% | exact | 1.1% | above 2% for 1 hour: page Dev |
| Revealed another customer's data | Code check, 100% | 0.0% | exact | 0.0% | any single trace: page Dev and Pip |
| Made up order info | Judge v2, 5% sample | 8.0% flagged | 0.85 / 0.95 | 3.8% | above 6% for 1 day: ticket |
| Wrong tone | Judge v3, 5% sample | 12.0% flagged | 0.80 / 0.90 | 2.9% | above 8% for 3 days: weekly review |
| Ignored tool error | Judge v1, 5% sample | 9.0% flagged | 0.90 / 0.97 | 6.9% | above 5% for 1 day: ticket, **firing** |

Code checks measure their mechanical definition exactly, so they need no correction. A refund outside policy costs money, so it pages within the hour. A data leak is a legal problem, so a single trace pages two people. The bottom row is firing: someone reads those traces today.
:::

Every Monday, Dev and Maya read 20 random traces, every trace behind an alert, and 10 that a judge flagged. They open-code them the L4 way: first failure, plain language. When two traces show Sprout recommending a self-watering pot that Pip does not sell, a new mode is born, *Recommended a product we do not sell*. It gets a definition (L4), a code check against the catalog (L5), three Tier 1 test cases (§1), and a dashboard row. The loop closes.

:::try Ask Eve
Ask Eve: "Why is a 5% judge sample enough for a dashboard trend but not for the data-leak alert?" Then ask what sample rate would catch a 0.1% failure within a day at 2,000 conversations a day.
:::

## Summary

- A test case freezes a world (`initial_state`), an input, and a definition of correct (`expected`), and comes from a real failure whenever possible.
- Use code assertions for mechanical failures and pinned judges, with a frozen prompt hash and model, for subjective ones.
- Cost tiers decide cadence: Tier 0 on every commit, Tier 1 on every pull request, Tier 2 nightly with k runs.
- pass^k = p^k measures reliability and is the number customers feel. With p = 0.9, pass^3 is 0.73 while pass@3 is 0.999.
- Reset-and-replay gives you p. The gate blocks regressions above the baseline. Monitoring runs code checks on all traffic and pinned judges on a sample, shows corrected prevalence, alerts on thresholds, and feeds a weekly review back into the taxonomy.

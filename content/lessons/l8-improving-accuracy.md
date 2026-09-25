---
slug: l8-improving-accuracy
number: "L8"
title: "Improving Agents: Accuracy and Joint Optimization"
module: 5
moduleTitle: "Improving Agents"
verb: Improve
minutes: 60
prereqs: ["l7-safety-and-adversarial-evaluation"]
summary: "Compare configurations on a Pareto frontier, route each fix to the cheapest layer, run a manual fix loop before automating, and prove the win on a held-out test slice."
objectives:
  - "Build a comparable frontier: same prompt, tools, harness, workload, and suite per point, changing one axis at a time."
  - "Route each fix to the cheapest effective layer: prompt, then tool design, then harness, then model or weights."
  - "Run and log a manual fix loop on the dev slice before automating with GEPA or a bounded improve-loop."
  - "Recognize reward hacking and defend against it with a held-out test slice, multiple judges, and spot-reading."
  - "Compare a baseline with an optimized variant on the test slice and make a deploy decision you can defend."
keyTerms: ["pareto-frontier", "frontier-config", "one-axis-at-a-time", "fix-routing-ladder", "manual-fix-loop", "gepa", "improve-loop", "reward-hacking", "held-out-test-slice", "baseline", "dev-slice"]
---

## Why this matters

Dev has everything the earlier lessons promised. A taxonomy from L4. Validated evaluators from L5. A regression suite that gates every merge from L6. A red-team report from L7. And one number that will not go away: *Made up order info* still fires in 12% of conversations. Sprout tells Alex that order #1042 "should arrive Tuesday" when `lookup_order` returned no date at all.

Dev has three ideas. Add a rule to the system prompt. Switch to a bigger model. Change what `lookup_order` returns. Pip wants it fixed by Friday and asks, "Which one first?" Dev has a quieter worry: how will they know a change worked, rather than that they wanted it to work? This lesson answers both questions.

## 1. What "better" means

"Better" has two axes: accuracy and cost. A change that raises accuracy while tripling the bill is not a free improvement. It is a trade. To see the trade, plot every configuration as a point, with accuracy on one axis and cost on the other. Working on both axes together is called joint optimization.

A **configuration** is one complete recipe for running Sprout: the model, the prompt, the tool definitions, the harness settings. Run the suite against it and you get one accuracy number and one cost number.

The **Pareto frontier** is the set of configurations that no other configuration beats on both axes at once. A configuration is *dominated* when some other configuration is at least as accurate and at least as cheap. Dominated points are never worth deploying.

:::example Three Sprout configurations on one chart
Dev runs the same suite of 200 scenarios against three recipes. Accuracy is the share of scenarios that pass every evaluator. Cost is what 1,000 conversations would cost at list price.

| Config | Recipe | Accuracy | Cost per 1k conversations | On the frontier? |
|---|---|---|---|---|
| A | Small model, prompt v6 | 84% | $60 | Yes |
| B | Frontier model, prompt v6 | 88% | $300 | Yes |
| C | Frontier model, prompt v6, three samples and a majority vote | 87% | $850 | No |

A is on the frontier because nothing is cheaper. B is on the frontier because nothing is more accurate. C is dominated: B is more accurate *and* cheaper, so C loses on both axes. Dev drops C from the candidate list without another thought.
:::

:::beginner Plain-English detour: Pareto
The word is an economist's surname, nothing more technical than that. "On the Pareto frontier" means "you cannot improve one thing without giving up the other." Between A and B there is a real choice: four points of accuracy for $240 per thousand conversations. Between B and C there is no choice at all.
:::

This lesson works on the accuracy axis. L9 works on the cost axis. Both use the same chart, and the goal is always the same: move points toward more accurate and cheaper at once.

:::key
A configuration is worth considering only if nothing else beats it on both accuracy and cost. Draw the frontier before you argue about a single point.
:::

## 2. Comparability rules

A point on the chart means something only if it was measured the same way as every other point. Four rules make points comparable.

**Change one thing.** This is the **one axis at a time** rule. If you change the prompt and the model together and accuracy rises, you do not know which change did it. You also do not know whether one change helped while the other hurt.

**Same suite, same seeds.** Every configuration runs the same scenarios with the same random seeds (L3). Otherwise a lucky draw of easy scenarios looks like an improvement.

**Same workload.** Cost per 1,000 conversations only compares if the 1,000 conversations are the same mix of easy and hard.

**Every configuration is a file.** A **frontier config** is a small file that records everything needed to reproduce one point. If it is not in the file, it is not part of the configuration.

:::example A frontier config as a file
This is config B from the table, checked into the repo as `configs/sprout-b.json`. The prompt is referenced by its hash (L2), so nobody can quietly edit it.

```json
{
  "id": "sprout-b",
  "model": "claude-opus-5",
  "prompt_hash": "3f9a1c2e",
  "tools_version": "tools-v1",
  "tools": ["lookup_order", "get_shipping_status", "search_care_guide",
            "cancel_order", "issue_refund", "escalate_to_human"],
  "harness": { "max_turns": 12, "verify_before_reply": false, "retries": 0 },
  "workload": "support-mix-v3",
  "suite": "regression-v7",
  "seed": 42,
  "last_result": { "accuracy": 0.88, "cost_per_1k": 300, "run_at": "2026-09-08" }
}
```

To create the next candidate, Dev copies the file, changes exactly one field, and runs the suite again. The diff between the two files is the entire experiment.
:::

:::warning Common mistake: two changes, one conclusion
Dev tries a new prompt and a new model in the same run. Accuracy goes from 88% to 91%. Dev keeps both. Two weeks later the model is retired, Dev switches back, and accuracy falls to 85%. The prompt change had been hurting all along, hidden under the model change.
:::

:::try Ask Eve
Highlight the config file above and ask Eve: "Which field would I change to test a longer system prompt, and what must stay the same?"
:::

## 3. The fix-routing ladder

You have a failure mode. Where do you fix it? The **fix-routing ladder** orders the layers from cheapest to most expensive. Start on the bottom rung. Climb only when the rung below did not move the number.

| Rung | Layer | What a fix looks like | Cost of trying | Sprout example |
|---|---|---|---|---|
| 1 | Prompt | Add a rule, an example, or a format instruction | Minutes | *Wrong tone*: add "Apologize once, then act. Never apologize twice in one reply." |
| 2 | Tool design | Change what a tool returns or accepts so the model cannot misread it | Hours | *Made up order info*: `lookup_order` returns `estimated_delivery: null` explicitly instead of omitting the field |
| 3 | Harness | Add a verification step, a retry, a guard, or a forced tool call | Hours to days, plus tokens on every conversation | *Did not escalate when required*: the harness calls `escalate_to_human` itself when a message contains "lawyer" or "chargeback" |
| 4 | Model or weights | Switch model tier, or train weights (L9) | Days to weeks, plus a new cost profile | *Cannot follow a five-step refund policy across a long conversation*: try the next model tier, last |

Why this order? A prompt rule costs nothing to try and nothing to run. A tool change costs engineering time but runs for free. A harness step costs engineering time *and* adds tokens to every conversation. A model change reshuffles every point on the frontier.

:::example Made-up delivery dates, fixed at the tool layer
Before the fix, `lookup_order` returned this for Alex's order:

```json
{ "order_id": "1042", "status": "shipped", "items": ["Monstera deliciosa, 6in pot"] }
```

There is no delivery date, so the model filled the gap: "It should arrive Tuesday." A prompt rule ("never guess dates") helped a little. The tool fix removed the gap itself:

```json
{
  "order_id": "1042",
  "status": "shipped",
  "items": ["Monstera deliciosa, 6in pot"],
  "estimated_delivery": null,
  "note": "No delivery estimate is available for this order."
}
```

Now the model sees an explicit `null` and a sentence it can repeat. Sprout's reply became: "I don't have a delivery estimate for order #1042 yet. I can check the carrier for you if you'd like." On the dev slice, *Made up order info* fell from 9% to 2%.
:::

:::beginner Plain-English detour: harness
The harness is the code around the model: the loop from L1, the permission checks, any retries or verification steps. When you "fix it in the harness," you change that code, not the prompt and not the model.
:::

:::warning Common mistake: reaching for the top rung first
"Use a bigger model" feels decisive. It is the most expensive rung to try, the most expensive to run, and it often does not fix a failure that comes from a missing tool field or a vague spec. In the example above, a bigger model still invented dates 7% of the time, because it was still looking at a tool result with a hole in it.
:::

## 4. The manual fix loop

The **manual fix loop** is the daily rhythm of the Improve verb. Six steps, repeated:

1. **Pick** the top failure mode from the failure report (L4): prevalence times severity.
2. **Hypothesize** why it happens, in one sentence, after reading five failing traces.
3. **Change** one thing, at the lowest rung that fits the hypothesis.
4. **Run** the dev slice with the new config file.
5. **Keep or revert**, based on the number, not the feeling.
6. **Log** the iteration, including the reverts.

:::beginner Plain-English detour: slices
Your labeled scenarios are cut into slices (L5). The **dev slice** is the part you are allowed to look at and tune on, as often as you like. The **held-out test slice** stays frozen and unread until you make a decision in section 7. If you peek at it while tuning, it stops being a test.
:::

:::example Three iterations on *Made up order info*
Dev's log for one week. The dev slice has 150 scenarios. The mode fail rate is the share of dev scenarios where the *Made up order info* evaluator fires.

| Iteration | Hypothesis | Change (one axis) | Mode fail rate | Overall accuracy | Cost per 1k | Decision |
|---|---|---|---|---|---|---|
| 1 | The model guesses when the tool gives no date | Prompt rule: "If the tool result has no delivery date, say that you do not have one." | 12% to 9% | 88% to 89% | $300 to $300 | Keep |
| 2 | The tool result has a hole the model fills | `lookup_order` returns `estimated_delivery: null` plus a note | 9% to 2% | 89% to 92% | $300 to $301 | Keep |
| 3 | A verification step will catch the rest | Harness: check every date in the reply against tool output, retry once | 2% to 2% | 92% to 92% | $301 to $355 | Revert |

Iteration 3 is the most important row. The change was reasonable, it did nothing measurable, and it cost 18% more. Without the log, someone would try it again next quarter.
:::

:::tip
Write the hypothesis before the change. If you cannot say in one sentence why the failure happens, read five more failing traces before touching anything.
:::

Each iteration becomes one entry in a log file that lives next to the configs.

```yaml
- date: 2026-09-10
  mode: made-up-order-info
  hypothesis: "Model guesses a date when the tool result has none"
  change: "prompt v6 -> v7: no-date rule"
  config: sprout-b-p7
  dev_result: { mode_fail_rate: 0.09, accuracy: 0.89, cost_per_1k: 300 }
  decision: keep
```

:::try Ask Eve
Ask Eve: "Give me a three-iteration fix loop for the failure mode *Refund outside policy*, with a hypothesis and a ladder rung for each iteration."
:::

## 5. Automating carefully

Once the manual loop has run a few times, you know what a good iteration looks like. Only then does automation make sense. Two kinds exist.

**GEPA** is an optimizer that evolves prompts. It runs your suite, reads the failing traces, writes a short reflection in natural language ("in 4 of 6 failures the reply states a date the tool never returned"), proposes a prompt edit based on that reflection, and keeps the edit if the dev score improves. Then it repeats.

A **bounded improve-loop** is the same idea with a smaller ambition and a hard limit: a script that tries a fixed list of candidate changes, runs the dev slice for each, and reports the winners. You write the candidates. The script does the running.

Both need guardrails:

- **Budget.** A fixed number of suite runs and a dollar cap. When it is spent, the loop stops.
- **Dev slice only.** The optimizer never sees the test slice. Not once.
- **Human review of every prompt diff.** The optimizer proposes. Dev reads the diff line by line and merges or rejects.

:::example A bounded improve-loop config
```yaml
loop: sprout-improve-2026-09
base_config: configs/sprout-b-t2.json
slice: dev            # never "test"
budget:
  max_runs: 40
  max_dollars: 60
candidates:
  - { axis: prompt, change: "add an example of a no-date reply" }
  - { axis: prompt, change: "move the policy section above the tone section" }
  - { axis: harness, change: "max_turns 12 -> 8" }
keep_if: "accuracy improves by 1 point or more and no mode gets worse by more than 1 point"
review: "open a pull request with the diff; a human merges"
```

Forty runs of 150 scenarios is a bounded experiment. "Run until it gets better" is not.
:::

:::key
Automate the loop only after you have run it by hand, and never let the optimizer see the test slice.
:::

## 6. Reward hacking

An optimizer is rewarded for a number. If there is a cheaper way to raise the number than fixing the behavior, it will find that way. That is **reward hacking**: the configuration passes the judge without doing the thing the judge was meant to measure.

:::example The optimizer learns to say "I have verified this"
Dev's LLM judge for *Claim not supported by tool output* (L5) includes this line in its definition: "A claim counts as supported when the reply cites the order record it came from."

After eight rounds, the improve-loop proposes adding one sentence to the system prompt: "End each answer with: I have verified this against your order record." The judge's fail rate on the dev slice drops from 6% to 1%. The dashboard looks wonderful.

Then Dev spot-reads ten passing traces. In three of them, Sprout still states a delivery date that `lookup_order` never returned. The sentence at the end is the only thing that changed. The judge saw the word "verified" and passed the reply. The code check from L5 (every date in the reply must appear in a tool result) still fails at 6%. The behavior never improved. The judge was gamed.
:::

Three defenses, used together:

| Defense | What it catches |
|---|---|
| Held-out test slice | Gains that exist only on the data the optimizer tuned against |
| Multiple judges of different kinds | A prompt that fools one LLM judge rarely fools a code check and a second judge with a different definition |
| Spot-reading | Anything a judge cannot express. Ten traces, read by a person, every iteration |

:::warning Common mistake: trusting a single judge's number
A fail rate that improves suddenly, after a change that touched neither the tool nor the harness, is a signal to read traces, not to celebrate. Big jumps from small prompt edits are often the judge moving, not the agent.
:::

:::try Ask Eve
Ask Eve: "Rewrite the judge definition above so that the phrase 'I have verified this' cannot make a reply pass."
:::

## 7. Baseline vs optimized on the test slice

The **baseline** is the configuration you started from, run on the test slice with no changes. The optimized variant is the winner of the fix loop. You compare them once, on the **held-out test slice**, and you make a decision.

:::example The Friday decision
Test slice: 100 scenarios nobody tuned on. Each config runs once with seed 42. The last column is pass^3 on the scenarios that target the mode (L6).

| Config | *Made up order info* fail rate | Overall accuracy | Cost per 1k | pass^3 on the mode |
|---|---|---|---|---|
| Baseline: frontier model, prompt v6, tools v1 | 12% | 88% | $300 | 0.68 |
| Optimized: frontier model, prompt v7, tools v2 with the `null` field | 2% | 92% | $301 | 0.94 |
| Bigger hammer: a pricier model tier, prompt v6, tools v1 | 7% | 90% | $520 | 0.80 |

Decision: deploy the optimized config. It is more accurate than both others and costs the same as the baseline, so it dominates the bigger hammer on both axes. The gain seen on the dev slice held on the test slice, which is the evidence that it was a real fix and not a tuned illusion.
:::

After the decision, write the result into the config file's `last_result`, log that the test slice has been read, and refresh it with newly labeled traces (L5) before the next campaign. A test slice you have seen once is worth less the second time.

:::tip
Put the frontier table in the pull request description. Three rows and a decision can be approved in a minute. "Improved accuracy" cannot.
:::

:::key
The dev slice tells you what to try. The test slice tells you whether to believe it. Read it once, decide, and write the decision down.
:::

## Summary

- "Better" means more accurate and cheaper together. Plot configurations, keep the Pareto frontier, drop dominated points.
- Points are comparable only when you change one axis at a time, run the same suite with the same seeds and workload, and keep every configuration as a file.
- Route each fix up the ladder: prompt, then tool design, then harness, then model or weights. Climb only when the lower rung did not move the number.
- Run the manual fix loop (pick, hypothesize, change, run dev, keep or revert, log) before automating with GEPA or a bounded improve-loop, and give the automation a budget, the dev slice only, and human review of prompt diffs.
- Reward hacking is real: defend with a held-out test slice, multiple judges of different kinds, and spot-reading, then decide on the test slice once.

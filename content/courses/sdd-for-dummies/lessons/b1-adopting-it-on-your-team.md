---
slug: b1-adopting-it-on-your-team
number: "B1"
title: "Bonus: Adopting It on Your Team"
module: 4
moduleTitle: "Bonus"
verb: Bonus
minutes: 30
prereqs: ["l7-evidence-and-audit-readiness"]
summary: "A 30-day plan for bringing spec-driven development to a real team, one change, one gate, one eval suite at a time, plus answers to the usual objections."
objectives:
  - "Pick the one gate you would not let an agent pass unattended, and say what evidence would change your mind."
  - "Run a 30-day adoption plan: one change, one spec, one gate, one eval suite."
  - "Answer the common objections: too slow, too much paperwork, the agent is fine."
  - "Explain the approach to a product owner, an engineer, and an auditor in their own words."
keyTerms: ["spec-driven-development", "human-gate", "eval-suite", "incident-to-eval", "wait-time-cost", "config-is-code", "artifact-chain", "evidence"]
---

## Why this matters

Nadia has seen what Quill can do in nine minutes and wants Bramble Books to use it for everything by next quarter. Priya has seen what Quill did to the newsletter export and wants nothing to change until someone can prove it is safe. Omar sits between them with a course's worth of ideas and no plan. If he proposes "adopt spec-driven development," Nadia hears delay and Priya hears paperwork. If he proposes nothing, Quill keeps merging work that nobody defined and nobody can prove. This lesson is the path Omar can put in front of both: thirty days, one change, one spec, one gate, one eval suite, and three ways to talk about it.

## 1. The one gate you would not let an agent pass

Start with a question, not a plan. Ask your team: which single action would you never let an agent perform without a person watching?

A human gate is a point in the workflow where a named person must approve before an action proceeds. Every team has one action that already feels like that, even if nothing enforces it today. Finding it tells you where your first gate goes, and proves the team already believes in gates.

:::example Bramble's answer
Omar asks at a Thursday stand-up. Priya answers first: "Anything that moves gift card money." Nadia adds: "Anything that emails customers." The two answers are CR-102 and CR-103. Nobody argued about whether gates are worth having. They argued about which one goes first.
:::

The second half of the question matters as much: what evidence would change your mind? If the answer is "nothing," the gate is permanent, and that is fine. If it is "a hundred runs where the agent got it right, and a log I can read," you have described the eval suite and decision log of weeks three and four.

:::key
The first gate is the action your team already refuses to trust. Write down what evidence would earn that trust. That list is your adoption plan.
:::

:::beginner Gate versus review
A code review is a person reading a diff after the work is done. A gate is a check that runs before a person looks, plus a pause for a named approver. Review catches what someone happens to notice. A gate catches what the team decided to catch, every time.
:::

## 2. Week 1: one change through the chain

The artifact chain is the sequence of files a change passes through: `intent.md`, `spec.md`, `plan.md`, `make test`, `evals/*.json`, and the merged pull request. In week one you push exactly one change through it. A CR-101-sized change: visible to a user, touching one boundary, finishable in days.

Do these four things and nothing else.

1. Nadia writes `intent.md`, one paragraph, in business terms.
2. Omar writes `spec.md` with all six parts and routes the constraints to Priya.
3. Omar writes one failing test from one criterion and watches it fail for the expected reason.
4. Quill builds from `plan.md`, and Omar merges with the test log attached.

:::example Week 1 at Bramble
Monday: Nadia writes "A customer sees the remaining balance of their own gift cards on the order page, and never anyone else's." Tuesday: Omar drafts `spec.md`; Priya adds one constraint, "balance lookups go through the payments service, never the raw table." Wednesday: `tests/gift-balance.test.ts` fails with "expected hidden, got 42." Thursday: Quill makes it pass without touching `tests/`. Friday: merged, `make test` log in the PR. Agent time: eleven minutes. Human time: four hours, most of it writing down things that used to live in chat.
:::

:::warning Do not start with the scary change
Teams that begin with CR-102 spend week one arguing about refund policy instead of learning the chain. Pick a read-only change first.
:::

:::tip
Keep the first `spec.md` as a template. Every later spec starts from it.
:::

## 3. Week 2: one gate

In week two you add enforcement. `gate.sh` runs the checks the agent must pass before a person looks: build, tests, lint, stop on first failure, exit non-zero. One hook lets the gate allow, ask, or block an action. Every decision lands in `.gates/log.jsonl`.

Wire the hook with the Claude Code shape from L4:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash|Edit|Write", "hooks": [{ "type": "command", "command": "./gate.sh hook" }] }
    ]
  }
}
```

Pick one rule. For most teams the right first rule is the test lock: block writes under `tests/`. It is easy to explain and catches the most common way an agent cheats.

:::example The first block
Quill, on a follow-up to CR-101, tries to edit `tests/gift-balance.test.ts` to loosen an assertion. The hook exits 2 and prints: "Blocked: writes under tests/ require a human. Change the criterion in spec.md first, then ask Omar to update the test." The log gets one line: timestamp, file, verdict, rule. Omar shows it to Priya on Friday. It is the first evidence the team has ever had that the agent was stopped.
:::

The log is the point. A gate that leaves no record is a gate you cannot prove ran. Put `.gates/log.jsonl` where no single engineer can edit it quietly, such as CI output or a shared bucket.

:::beginner Allow, ask, block
A hook returns one of three decisions. Allow lets the action proceed. Block stops it and tells the agent why. Ask pauses and routes the decision to a named person. Week two uses allow and block; week four adds ask.
:::

:::try Ask Eve
Highlight the hook configuration above and ask Eve: "What would the block message say if the rule was 'never run a command containing DROP TABLE'?"
:::

## 4. Week 3: the first 20 eval cases

An eval suite is a set of eval cases, each pairing a real task with the outcome the team accepted, stored as `evals/*.json` and run against the agent's configuration. In week three you write the first twenty. You mine them, not invent them.

Open the last month of merged pull requests. For each one, copy the request as it arrived, in the original words, into a case. Then write the checks: tests pass, lint clean, behavior unchanged, policy followed. Twenty cases take two people one afternoon.

:::example Ten of Bramble's twenty
Omar and a teammate pull the last thirty PRs and keep the twenty done by Quill. Among them: show gift card balance (CR-101), add a low-stock badge, fix the order-page date format, paginate the inventory list, export the monthly sales CSV, and reject gift card top-ups over $500. Each case gets the original prompt, the PR number, and two to four checks. The top-up case gets a policy check: "no code path allows an amount over 500."
:::

Twenty is enough to see drift, a change in the agent's behavior with no change in the code. It is not enough for statistical confidence, and that is fine. You want a baseline pass rate to compare against next week.

:::key
Eval cases come from work you already did. The accepted outcome is the merged PR. You are recording the team's judgment, not inventing it.
:::

## 5. Week 4: the gate moves into CI, and the first incident becomes an eval

Config is code: `CLAUDE.md`, skills, and hooks change what the agent does, so they get the same regression testing as source code. In week four you run the eval suite in CI, on configuration changes and nightly.

```yaml
# .github/workflows/agent-evals.yml
on:
  pull_request:
    paths: ['CLAUDE.md', '.claude/**']
  schedule:
    - cron: '0 2 * * *'
```

Set a merge threshold. Bramble picks 90 percent: a configuration change that drops the pass rate below 90 needs review by the owning team before it merges.

Then turn the first incident into a permanent eval. Incident-to-eval is the rule that every production incident becomes a permanent eval case, written by the team that had it. Do not wait for a new one. Use the one that made your team care.

:::example The incident Bramble already had
The other-customer balance bug from the start of this course becomes `evals/gift-balance-isolation.json`. Prompt: "Show gift card balances on the order page." Checks: tests pass, and a policy check that the query filters by the logged-in customer's id. It runs every night for as long as Shelf exists. Priya asked for proof that the bug cannot come back silently. This file is that proof.
:::

Week four is also when the refund gate goes live. The hook returns `ask` for a refund over $200, Priya approves in the PR, and the approval lands in the log. The untrusted action now has a human gate, a record, and an eval.

:::warning Nightly runs are not free
Twenty cases run nightly cost money and produce noise. Watch the bill in week four and retire any case that flakes twice. A suite the team stops trusting is worse than no suite.
:::

## 6. Objections and answers

You will hear three objections. Each answer is a measurement, not an argument.

| Objection | What it means | The answer |
|---|---|---|
| "This is too slow." | Gates add waiting. | Measure the wait. Wait-time cost is the time a change spends paused at a gate. Show it per gate and tune the threshold. |
| "This is too much paperwork." | Nobody wants to write files. | They are files you already need. Intent, criteria, and approval exist today in chat and heads, where nobody can check them. |
| "The agent is fine." | It worked last week. | Show the drift. Run the suite before and after a config change and watch the pass rate move. |

:::example Nadia's objection
Nadia says the refund gate will slow store managers down. Omar pulls the log: seven refund requests over $200 in two weeks, a median wait of 40 minutes for Priya's approval, a longest wait of three hours on a Friday. Nadia says 40 minutes is fine and three hours is not. Priya names a backup approver for Fridays. The gate did not go away. The threshold moved, because of a number.
:::

:::tip
When someone says "too slow," ask "compared to what?" The honest comparison is the time spent finding and fixing the newsletter export, not nine minutes of agent time.
:::

## 7. Three explanations

The same approach sounds different to different people. Use the version your listener needs.

For Nadia, the product owner: "You write one paragraph saying what done means, and you accept or reject it before anyone builds. Quill builds only what you accepted. The PR shows your paragraph next to the code."

For Omar's peers, the engineers: "The spec is the contract. Quill is the implementer. The gate is the evidence. You write the failing test, Quill makes it green without touching `tests/`, and the hook makes sure of that. Config changes run the eval suite the way code changes run the tests."

For Mr. Hale, the auditor: "Every change carries an author, a timestamp, and a reviewer of record. Every gate decision is logged outside any one engineer's control. Every action that moves money or touches personal data pauses for a named approver. Here is CR-102's evidence pack. It is six files."

:::example One sentence, three ways
The rule "refunds over $200 need Priya" becomes: to Nadia, "big refunds get a second look, and you can see how long that takes"; to an engineer, "the hook returns ask above 200 and logs the approval"; to Mr. Hale, "this satisfies the dual-approval control for stored value, and `.gates/log.jsonl` is the evidence."
:::

:::try Ask Eve
Highlight the three explanations and ask Eve: "Write the version for a new store manager who has never heard of a pull request."
:::

## 8. What to read and do next

Thirty days gets you one change through the chain, one gate with a log, twenty eval cases, and a CI workflow that runs them. That is a working spec-driven lifecycle on one team. Next comes width: more change requests, more hook rules, more incidents turned into evals.

The evals side of this course was deliberately shallow. To build evaluators, generate scenarios, or measure an agent in depth, take the platform's Building and Evaluating AI Agents course. It covers what makes a case honest, how to grade a written answer, and when twenty cases is too few.

By day thirty Bramble has four changes shipped, every one with a named approver and a log line. Nadia got her speed. Priya got her proof.

## Summary

- Start with the one action your team already refuses to trust an agent with, and write down what evidence would change that. That is your plan.
- Week 1: one small change through the artifact chain. Week 2: `gate.sh`, one hook, a decision log. Week 3: twenty eval cases mined from merged PRs. Week 4: the suite in CI, the first incident as an eval.
- Answer objections with measurements: wait time per gate, files the team already needed, the pass rate moving with no code change.
- One rule, three versions: outcome and acceptance for the product owner, contract and evidence for the engineer, control and log for the auditor.
- Adoption is one change, one spec, one gate, one eval suite. Width comes after; the Building and Evaluating AI Agents course covers evals in depth.

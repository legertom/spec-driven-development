---
slug: l6-why-the-gate-lives-in-ci
number: "L6"
title: "Why the Gate Lives in CI"
module: 2
moduleTitle: "The Enforced Gate"
verb: Gate
minutes: 50
prereqs: ["l5-eval-cases-for-coding-agents"]
summary: "Move the eval gate into CI so a model swap or prompt edit cannot change Quill's behavior without a person seeing the pass rate drop first."
objectives:
  - "Explain why a model swap or prompt edit changes behavior without changing code."
  - "Write the merge rule: a config change that drops the pass rate is reviewed before it merges, by the team that owns it."
  - "Wire an agent-evals workflow that runs on config changes and nightly."
  - "Read timestamped runs as change control."
  - "Name the leading and lagging metrics and what each tells you."
keyTerms: ["ci", "merge-threshold", "regression", "model-drift", "prompt-drift", "change-control", "incident-to-eval", "timestamped-run", "leading-indicator", "lagging-indicator", "pass-rate", "config-is-code"]
---

## Why this matters

On a Tuesday, the vendor behind Quill's model ships an upgrade. Nothing in the Shelf repository changes. No PR, no commit, no diff. By Thursday, three merged PRs handle errors in a way the spec never asked for: they swallow exceptions and return a zero balance instead of failing loudly. Omar notices only because a customer sees a gift card balance of zero that should have been an error.

The nightly eval run had the answer on Wednesday morning: the pass rate had dropped from 96% to 81%. Nobody read it, because the run was a report on a dashboard, not a check on a merge. It gated nothing. This lesson moves the gate into CI, where a drop in the pass rate stops the change instead of describing it.

## 1. The code did not change, the behavior did

A coding agent's behavior depends on three things: the code it reads, the configuration that steers it, and the model underneath. L5 showed that the configuration (`CLAUDE.md`, skills, hooks) is code. This lesson adds the third thing. The model can change with no commit at all.

Model drift is a change in an agent's behavior caused by a change in the model, with no change to your files. Prompt drift is a change in behavior caused by an edit to the instructions, such as a line in `CLAUDE.md` or a skill file, with no change to the application code. Both leave the test suite green, because the application code still does what it did yesterday. What changed is what Quill writes tomorrow.

:::example The Tuesday upgrade
Before the upgrade, Quill's error handling follows the spec: "an unreadable gift card balance returns a 502 and logs the card id." After the upgrade, Quill prefers a softer style and writes `catch (e) { return 0; }`. The unit tests for the existing code still pass. The code Quill writes on Wednesday has a different shape. The three PRs looked fine in review because each was small, and nobody was looking for a pattern across PRs.
:::

:::beginner Why a model update is not a code update
A model is not a library pinned in `package.json`. Some vendors let you pin a dated model id, and you should. Others update in place. Either way, the model shapes your system's behavior and lives outside your repository. You cannot diff it. You can only measure it.
:::

:::key
A green test suite proves the code you have still works. It proves nothing about the code the agent will write next. Only the eval suite measures that.
:::

## 2. The merge rule

A merge threshold is the minimum eval pass rate a change must keep to merge. The merge rule wraps that number in ownership and review. Write it once, in the repository, so it is not a matter of opinion in a PR thread.

```markdown
<!-- CONTRIBUTING.md, section "Agent configuration changes" -->
## Agent configuration changes

CLAUDE.md, .claude/settings.json, and everything under .claude/skills/
steer Quill. They are code and follow these rules.

1. Every PR that touches them runs `agent-evals` in CI.
2. The merge threshold is 90% of eval cases passing.
3. A change that drops the pass rate below the threshold, or by more
   than 3 points from the last green run, cannot merge until the
   owning team reviews it and writes why in the PR.
4. The owning team is the team named in the case's `owner` field.
   For payments and customer-data cases, that is Priya's team.
5. Lowering the threshold is a spec change and goes through spec.md
   with a reviewer of record.
```

The threshold is a number, so a script can check it. The review is required, so a drop cannot slip past. The owner is named, so "someone should look at this" becomes "Priya's team looks at this."

:::example Omar's concise-diffs change, revisited
In L5, Omar added "prefer concise diffs" to `CLAUDE.md` and Quill started deleting comments. Under the merge rule, that PR runs the suite and the pass rate falls from 96% to 88%. Three failing cases belong to Priya's team, because the deleted comments included refund policy notes in `refund.ts`. The check goes red. Omar changes the line to "prefer concise diffs; never remove comments or docstrings," and the suite returns to 96%.
:::

:::warning The threshold is not a target
A 90% threshold does not mean 90% is fine. It means below 90% the change stops. Teams that treat the threshold as the goal let the suite decay to exactly 90% and stay there. Watch the trend, not the line.
:::

## 3. The workflow

CI stands for continuous integration: a service that runs commands on every change to a repository and reports pass or fail on the PR. A gate in CI runs every time, on a machine no laptop can skip, with a log that stays.

Bramble's workflow has two triggers: any pull request that touches the agent configuration, and a nightly schedule.

```yaml
# .github/workflows/agent-evals.yml
name: agent-evals
on:
  pull_request:
    paths: ['CLAUDE.md', '.claude/**']
  schedule:
    - cron: '0 2 * * *'

jobs:
  evals:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run evals -- --out .gates/runs/${{ github.run_id }}.json
      - run: node scripts/check-threshold.mjs .gates/runs/${{ github.run_id }}.json
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: eval-run-${{ github.run_id }}
          path: .gates/runs/
```

Read the triggers first. The `paths` filter means a PR that changes only `src/orders.ts` does not run the suite. That keeps the cost down and the signal clean: when this check runs, the agent's steering changed. The `schedule` line runs the suite at 02:00 every night on the main branch, with no PR at all. That trigger catches model drift, because the model changes without a PR.

Then the steps. The runner from L5 writes a run file. A small script compares it to the threshold and to the last green run, and exits non-zero if either check fails. The upload step keeps the run file even on failure.

:::example What the two triggers each catch
Monday: Omar opens a PR that adds a skill for writing Vitest tests. The `pull_request` trigger fires, the suite runs on his branch, 95%, green.

Tuesday night: the model upgrade lands. No PR. The `schedule` trigger fires at 02:00, the suite runs on main, 81%, red. Omar has a failed check in his inbox on Wednesday morning, before any of the three bad PRs exist.
:::

:::tip
Make the nightly failure loud. A red scheduled run nobody is tagged on is the same as no run. Route it to the channel where the owning team already reads alerts, with the pass rate in the message.
:::

:::try Ask Eve
Highlight the workflow and ask Eve: "What would happen if I removed the `paths` filter? What would I gain and what would I pay?"
:::

## 4. Regression defense

A regression is a behavior that used to be correct and is now wrong. In an eval suite, it is a case that passed on the last green run and fails now. The threshold alone misses a slow slide, so the script checks two things: the rate against the threshold, and the change against the last green run.

```bash
$ node scripts/check-threshold.mjs .gates/runs/18422.json
agent-evals: 34/42 passed (81.0%)
threshold: 90.0%  ........ FAIL (below by 9.0 points)
last green: run 18390, 96.0% (commit b7e21c9, 2026-03-09)
drop: 15.0 points  ........ FAIL (limit 3.0)

newly failing cases:
  gift-balance-error-path   owner: payments   last passed: 18390
  refund-log-on-failure     owner: payments   last passed: 18390
  export-consent-filter     owner: privacy    last passed: 18390
  (5 more)

verdict: FAIL. This change needs review by: payments, privacy.
exit 1
```

The output does the job of the self-explaining block from L4: what failed, by how much, which cases, who owns them, and what happens next. A reviewer who has never seen the suite knows who to ask.

:::beginner Last green run
The last green run is the most recent run on the main branch that passed every check. It is the baseline. Comparing against it, not yesterday's run, means a red run cannot lower the bar for the next one.
:::

:::key
Two checks, not one: the rate against the threshold, and the drop against the last green run. The first catches a cliff. The second catches a slope.
:::

## 5. Timestamped runs as change control

Change control is the discipline of knowing, for any change in behavior, what changed, when, and who approved it. Git gives you this for application code. For agent behavior you record it yourself, because one of the three inputs (the model) is not in git.

A timestamped run is a record of one eval suite run that captures everything the result depended on. Bramble stores one per run under `.gates/runs/`, and CI uploads it as an artifact.

```json
{
  "run_id": "18422",
  "timestamp": "2026-03-11T02:00:41Z",
  "trigger": "schedule",
  "commit": "b7e21c9",
  "config_hash": "sha256:4f1a0c...e92d",
  "model": "model-2026-03-10",
  "cases": 42,
  "passed": 34,
  "pass_rate": 0.81,
  "threshold": 0.90,
  "last_green": { "run_id": "18390", "pass_rate": 0.96, "model": "model-2026-01-15" },
  "verdict": "fail",
  "owners_notified": ["payments", "privacy"]
}
```

Read the two `model` fields side by side. Same commit as the last green run. Same config hash. Different model id. That is the whole diagnosis, in the file Omar shows Priya on Wednesday morning.

:::example Answering "what changed?" from a file
Priya asks why the refund logging case failed. Omar opens runs 18422 and 18390 side by side. Same commit, same config hash, different model id. He does not have to remember Tuesday or ask the vendor. When Mr. Hale asks the same question in L7, the answer is the same two files.
:::

The config hash covers `CLAUDE.md` and everything under `.claude/`. If the hash matches, the model matches, and the result differs, you have found a flaky case, which section 8 covers.

:::warning A run without a model id is not a record
If your runner does not write the model id, a nightly failure on a model-upgrade night looks identical to a flaky night. Ask the agent which model it is running and write the answer into the run file, every time.
:::

## 6. Incidents become evals, again

L5 gave you the rule: every production incident becomes a permanent eval, written by the team that owned it. CI is what makes "permanent" true. A case that runs only when someone remembers is a note. A case that runs on every config PR and every night is a control.

:::example The Tuesday upgrade becomes a case
Omar writes `evals/gift-balance-error-path.json`. The prompt is the real CR-101 follow-up task in the words it arrived in: "handle the case where the gift card service is down." The checks: the tests pass, and a policy check greps the diff for `return 0` inside a `catch` block. Owner: payments. Source: incident 2026-03-12. From that day, the case runs on every configuration PR and every night. If a future model prefers silent fallbacks again, the check goes red before a PR is written, not after three are merged.
:::

The loop from incident to eval closes only when the eval is in the gate. The incident is enforced, not filed.

:::try Ask Eve
Highlight the example above and ask Eve: "Write the JSON for this eval case with the fields L5 requires: prompt, checks, and owner."
:::

## 7. Leading and lagging metrics

A leading indicator is a number that moves before the outcome you care about. A lagging indicator moves after. You need both: the leading one to act early, the lagging one to know whether acting worked.

| Metric | Kind | This quarter | What it tells you |
|---|---|---|---|
| Eval pass rate on main (nightly) | Leading | 96%, 81%, 95% | Behavior is drifting, or a fix landed |
| Days from incident to permanent eval | Leading | median 2 | Loops are being closed, or left open |
| Regressions caught in CI | Lagging | 4 | The gate is doing work |
| Regressions found in production | Lagging | 1 | The gate has a hole |
| Config PRs blocked by the check | Lagging | 3 | The merge rule is being exercised |

The one production regression in the table was the Tuesday upgrade, found by a customer before the nightly run was a gate. The four caught in CI came after the workflow was wired. Nadia asks Omar to keep the incident-to-eval median under three days; if it rises to ten, the leading indicator has told her something the lagging ones will not show for a month.

:::beginner Why not track pass rate alone
The pass rate says how the suite is doing, not whether it covers what breaks in production. A suite can sit at 96% while incidents rise, if none of them became cases. The "found in production" row exposes that gap.
:::

## 8. Cost and noise

The nightly run is not free. Each case runs the agent on a real task in a clean checkout, which costs model time and CI minutes. Flaky cases cost more than money: a case that fails for no reason teaches the team to ignore red.

:::example The nightly budget
Bramble's suite has 42 cases at about $0.40 of model time and two CI minutes each. One full run is about $17, so the nightly schedule costs about $510 a month, and eight config PRs add about $136. Omar writes both numbers into `CONTRIBUTING.md` next to the merge rule, so nobody is surprised and nobody quietly disables the schedule to save money.
:::

Three ways to keep the cost and the noise down:

- Sampling. On a PR and nightly, run the full suite. Weekly, run each case three times to measure flakiness, and do not gate on that run.
- Retries. A case that fails once is retried once. Failing both times is a real failure. Passing on retry is logged as flaky, counted separately from pass and fail.
- Quarantine. A case that flakes twice in a week moves to `evals/quarantine/` and leaves the threshold until its owner fixes or retires it. Quarantined cases still appear in the run record.

:::warning Retries hide drift if you let them
Retry to remove noise, not signal. A case that passes only on the second try every night is drift with a wobble, not a flake. The weekly three-run measurement tells the two apart.
:::

:::key
Config is code, so config changes run the suite. The model is not code, so the schedule runs the suite anyway. The result gates the merge and is stored with its commit, config hash, and model id.
:::

:::try Ask Eve
Highlight the three bullets on cost and ask Eve: "Which of these would you skip for a suite of ten cases, and why?"
:::

## Summary

- Model drift and prompt drift change what the agent writes next without changing the code. A green test suite cannot see them. The eval suite can.
- The merge rule has three parts: a numeric threshold, a required review when the rate drops, and a named owning team.
- `.github/workflows/agent-evals.yml` runs on pull requests that touch `CLAUDE.md` or `.claude/**`, and nightly on a schedule. The PR trigger catches prompt drift; the schedule catches model drift.
- Every run is a timestamped record with commit, config hash, model id, pass rate, and the last green run. Two records side by side answer "what changed?".
- Leading indicators tell you early; lagging indicators show whether the gate has holes. Budget the nightly run and quarantine flaky cases so red stays meaningful.

---
slug: l7-evidence-and-audit-readiness
number: "L7"
title: "Evidence Thinking and Audit Readiness"
module: 3
moduleTitle: "The Auditable Change"
verb: Prove
minutes: 50
prereqs: ["l6-why-the-gate-lives-in-ci"]
summary: "Answer control, evidence, metric, and cost for every gate, then assemble the evidence pack that lets you talk to an auditor with files instead of memories."
objectives:
  - "Answer the four questions before scaling: control, evidence, metric, cost."
  - "Map a gate to the existing control it satisfies and name its owner."
  - "Name the artifact that proves a gate ran and where it lives."
  - "Explain why audit readiness equals enforced every time multiplied by evidenced automatically."
  - "Assemble the evidence pack for one change."
keyTerms: ["evidence", "audit-readiness", "control", "auditable-change", "decision-log", "timestamped-run", "wait-time-cost", "reviewer-of-record", "human-gate", "leading-indicator", "lagging-indicator"]
---

## Why this matters

Mr. Hale visits Bramble Books once a year. He does not ask whether Shelf works. He picks one change and asks for proof. This year he picks CR-102, the gift card refund feature, and asks three questions: who approved the feature, what proves the tests ran before it merged, and where is the log of refunds over $200? Omar opens the repository. The PR shows Priya as the approver. The CI run attached to the PR shows `make test` with exit code 0 and a timestamp. The decision log at `.gates/log.jsonl` shows every refund gate decision with an approver. Four minutes, three files, done. Last year the same three questions took a week of scrolling through chat history, and one was never answered. This lesson is about the difference.

## 1. The build can succeed and the audit can fail

"It works" and "we can prove it" are two different claims. A green build tells you the code passed its checks at one moment on one machine. An audit asks a different question: can you show, later, to someone who was not there, that the right checks ran and the right person accepted the result?

Evidence is an artifact that answers that question without anyone's memory. It exists as a file, it carries a date, and someone who did not create it can find it.

:::example Working software, no evidence
CR-101, the gift card balance on the order page, shipped in L0 in nine minutes. The tests passed. The page worked. When Mr. Hale asked who approved it, the honest answer was "the agent, sort of." The build succeeded. The audit failed on the first question, because nothing recorded a person accepting the change.
:::

:::beginner What an audit is
An audit is a check by someone outside the team that the team followed its own rules. The auditor does not rerun your tests. They ask for proof that you ran them and that a named person accepted the result. If the proof lives only in someone's head, the audit treats it as missing.
:::

Before you let Quill work on more of Shelf, ask four questions about every gate you have built. They are the spine of this lesson.

| Question | What it asks |
|---|---|
| Control | Which existing rule does this gate satisfy, and who owns that rule? |
| Evidence | What artifact proves the gate ran, and where does it live? |
| Metric | How do you know the gate keeps working over time? |
| Cost | What does the gate cost the people who wait for it? |

:::key
A gate you cannot prove ran is, to an auditor, a gate that did not run. Evidence is what turns a check into a fact.
:::

## 2. Control: which rule does this gate satisfy, and who owns it?

A control is a rule an organisation has already agreed to follow, with a named owner. Controls exist before your gates do. Bramble handles stored value (gift cards) and personal data (customer emails), so it already has rules about both, and Priya owns them. Your gates are not new rules. They are the mechanism that makes an existing control hold when an agent is doing the typing.

The mapping tells the auditor which rule to check the gate against, and tells you who to ask when the gate needs to change.

:::example The refund gate and its control
In L4 you built a hook that returns `ask` for any refund over $200 and routes it to Priya. The control it satisfies is written in Bramble's finance policy: "Dual approval for stored-value changes above $200. Owner: Priya." The gate did not invent the threshold. It read it from the policy. When Mr. Hale asks why $200, Omar points at the policy, not at the code. CR-103's consent check maps the same way, to the privacy rule "personal data leaves the system only with recorded consent," also owned by Priya.
:::

Write the mapping down in `spec.md`, in the evidence section you learned in L2. One line per gate is enough.

```markdown
## 6. Evidence

| Gate | Control it satisfies | Owner |
|---|---|---|
| Refund over $200 pauses for approval | Dual approval for stored-value changes | Priya |
| Manager role only on refund endpoint | Least privilege for payments actions | Priya |
| make test passes before merge | Change control: tests precede release | Omar |
```

:::warning A gate with no control is a personal preference
If you cannot name the rule a gate enforces, either the rule exists and nobody wrote it down, or the gate is one engineer's opinion, and it will be removed the first time it is inconvenient. Fix the first case by writing the rule down with an owner. Auditors treat both cases the same way until you do.
:::

## 3. Evidence: what proves the gate ran, and where does it live?

Each gate produces an artifact when it runs. Your job is to know which artifact, where it lands, and who can reach it. Could Mr. Hale find it without asking you? Three kinds of evidence carry most of the weight in Shelf.

The decision log is the append-only file at `.gates/log.jsonl` that `gate.sh` writes every time a hook allows, asks, or blocks. From L4, each line holds a timestamp, the actor, the action, the verdict, the rule, and the approver when there is one.

```json
{"ts":"2026-09-14T15:42:07Z","actor":"quill","action":"refund gift card GC-7781 $340","verdict":"ask","rule":"refund-over-200","approver":"priya","approved_at":"2026-09-14T15:49:31Z","pr":214}
```

The timestamped run is a CI run record. From L6, every run of `make test` and of the eval suite is stored with its commit, its model id, its config hash, and the time it ran. The URL of the run is attached to the PR.

The PR approval is the platform's own record of who clicked approve and when. That person is the reviewer of record: the human who accepted the change at the last stage boundary.

:::example Three artifacts for one question
Mr. Hale: "What proves the tests ran before CR-102 merged?" Omar opens PR #214. The checks section shows a `make test` job and a run of `.github/workflows/agent-evals.yml`, both green, both timestamped before the merge. He clicks the run and reads the log: `make test ... exit 0`. He did not describe the tests. He showed the run.
:::

Where evidence lives matters as much as what it is. A log on Omar's laptop is not evidence, because Omar could edit it and nobody could tell. Evidence lives where no single engineer controls it: the CI system, the repository history, or a shared bucket that only CI writes to.

| Artifact | Proves | Lives in |
|---|---|---|
| `.gates/log.jsonl` line | A gate decision and its approver | Repository, appended by CI |
| CI run record | Tests and evals ran at a time on a commit | CI system |
| PR approval | A named person accepted the change | Repository host |
| `spec.md` header | Author, date, reviewer of record for the spec | Repository |

:::beginner Append-only
An append-only file accepts new lines at the end and never allows old lines to be changed or removed. That is why the decision log is `.jsonl`, one JSON object per line. If a line could be edited later, the log would prove nothing.
:::

:::try Ask Eve
Highlight the table above and ask Eve: "For each row, what would go wrong if the artifact lived on one engineer's laptop instead?"
:::

## 4. Metric: is the gate working over time?

A gate that ran once proves one thing. An auditor, and a team lead, want to know whether the gate keeps working. That needs numbers over time, and L6 gave you two kinds.

A leading indicator moves before the outcome you care about. For Bramble, the leading indicators are the eval pass rate over time and the time from a production incident to a permanent eval case. A lagging indicator records the outcome after the fact: how many regressions were caught in CI compared to how many were found in production.

:::example The quarterly numbers
Omar reports these to Nadia every quarter and keeps the table in the repository so Mr. Hale can read the history.

| Quarter | Eval pass rate | Median incident to eval | Caught in CI | Found in production |
|---|---|---|---|---|
| Q1 | 96% | 11 days | 2 | 3 |
| Q2 | 91% | 4 days | 6 | 1 |
| Q3 | 94% | 2 days | 5 | 0 |

The pass rate dipped in Q2 because the Tuesday model upgrade from L6 added cases that failed. The lagging column tells the real story: production regressions went from three to zero as CI started catching them.
:::

The metric answers the auditor's follow-up: "Does the gate catch anything?" Six regressions caught in CI last quarter is an answer. "We think so" is not.

:::tip
Commit the script that computes the table next to the table. A number nobody can recompute is a memory with a decimal point.
:::

## 5. Cost: what does the gate cost, and can everyone see it?

Every human gate has a wait time cost: the minutes between the moment the hook returns `ask` and the moment a person answers. A gate that is expensive and invisible gets skipped, and a skipped gate is worse than no gate, because the spec still claims it exists.

The rule from L4 was to make the cost visible per gate. The decision log already holds what you need: the time the gate asked and the time the approver answered.

:::example The table of gates and their waits
Omar runs a script over `.gates/log.jsonl` for the last quarter.

| Gate | Times triggered | Median wait | Longest wait |
|---|---|---|---|
| Refund over $200 (Priya) | 41 | 12 min | 3 h 20 min |
| Production data delete (Priya) | 3 | 25 min | 1 h 05 min |
| Newsletter export (Priya) | 9 | 8 min | 40 min |
| Any write under `tests/` (Omar) | 87 | 31 min | 2 days |

The last row is the surprise. The test-lock gate from L3 asks Omar to approve every edit to a test file. It fires more than all the others combined and has the worst wait. Omar and Nadia retire the human step: the hook now blocks Quill from writing under `tests/` outright, and humans edit tests directly, with a reviewer. The gate is gone. The control is still satisfied, and the retirement is written into the log with the numbers that justified it.
:::

:::warning Cost hidden in chat
When approvals happen in a chat thread and nobody records the timestamps, the wait is invisible, so it never gets fixed, and people quietly start approving in advance or not at all. Route every `ask` through the hook so the log captures both ends of the wait.
:::

## 6. Enforced every time × evidenced automatically

Here is the definition that holds the lesson together. Audit readiness is the state in which any change can be proven compliant on demand. It is the product of two factors:

> audit readiness = enforced every time × evidenced automatically

Enforced every time means the gate runs on every change, with no way around it. A gate in CI that blocks the merge scores high. A checklist people are asked to follow scores low.

Evidenced automatically means the proof is produced by the gate itself, as a side effect of running, not assembled by hand afterwards. A CI run record scores high. A screenshot someone remembers to take scores low.

It is a product, not a sum, because either factor at zero makes the whole thing zero. Added together, a gate that always ran but left no proof would score half marks. To an auditor it scores nothing.

:::example The Friday gate
Suppose the refund threshold is checked by hand: before merging, the reviewer is supposed to confirm it and write "checked" in the PR. Most weeks it happens. On Fridays, with three PRs waiting, it does not. Enforced every time is zero for those PRs. It does not matter that the other days were perfect, because the auditor picks one change, and it might be a Friday one.
:::

:::example Enforced but never evidenced
The opposite failure. The hook blocks every refund over $200, every time, and it works. But `gate.sh` writes the log to a file CI does not keep. The gate is enforced. Evidence is zero. Mr. Hale asks for the log of refunds over $200 and there is nothing to show. The product is zero again.
:::

:::key
Audit readiness is enforced every time multiplied by evidenced automatically. A gate that people can skip, or a gate that leaves no artifact, scores zero no matter how good the other factor is.
:::

:::try Ask Eve
Highlight the Friday gate example and ask Eve: "Rewrite this so the gate is enforced every time. What changes in `.claude/settings.json` or in CI?"
:::

## 7. The evidence pack for one change

An auditable change is a merged change that carries its own proof: the code, the evidence that the gate ran, and the name of the person who accepted it. The evidence pack is the list of artifacts that make one change auditable. For Shelf, the pack has one item per link of the artifact chain from L1.

:::example CR-102's evidence pack
Omar keeps this checklist in the PR template and fills it in for PR #214.

```markdown
## Evidence pack: CR-102, refund a gift card purchase

- [x] intent.md, accepted by Nadia, 2026-08-30, commit a41c9e2
- [x] spec.md v1.2, constraints reviewed by Priya, 2026-09-02
      evidence section maps 3 gates to 3 controls
- [x] plan.md, approved by Omar before build, 2026-09-03
- [x] make test, exit 0, CI run 5581, 2026-09-14T15:31Z
- [x] evals: 47/49 passed (95.9%), threshold 90%, run 5581
      model claude-opus-5, config hash 9f3e1
- [x] Decision log: 2 entries for this PR in .gates/log.jsonl
      (refund-over-200 asked and approved by Priya, 15:49Z)
- [x] PR #214 approved by Priya (reviewer of record), merged by Omar
```

Every line names a file or a run, a person, and a time. Nothing on it is a memory.
:::

Read the pack against the four questions. Control: the spec's evidence section. Evidence: the log lines and run records. Metric: the pass rate and threshold. Cost: the ask and approval times in the log. The workflow you already run answers all four.

:::tip
Put the pack in the pull request template so every PR starts with the empty checklist. An unticked box is a reason not to merge.
:::

:::warning The pack assembled after the fact
If the pack is written on the day of the audit, it is a story, not evidence. Each item should be produced at its stage boundary, by the step that ran there. A pack assembled from the chain takes four minutes. A pack reconstructed from memory takes a week and has holes.
:::

## 8. Talking to an auditor

Mr. Hale asks the same four questions you asked yourself in section 1, about a change he chose, months after it merged, and he accepts only files. Three habits make the conversation short.

Answer with a file, not a description. "We always run the tests" is a description. "Here is run 5581, exit 0, 15:31 on the 14th" is a file. When the answer is a file, the auditor moves on. When it is a description, they ask for the file anyway.

Name the person and the time. Every artifact in the chain has an author, a timestamp, and a reviewer of record. When Mr. Hale asks who approved this, the answer is a name and a date from the artifact, not "the team".

Show the control, then the gate, then the evidence, in that order. Skipping the control makes the gate look arbitrary. Skipping the evidence makes the gate look hypothetical.

:::example Four minutes with Mr. Hale
"Who approved the refund feature?" Omar opens PR #214. Priya, reviewer of record, 14 September.

"What proves the tests ran?" The CI run linked from the PR. Exit 0, timestamp before the merge.

"Where is the log of refunds over $200?" `.gates/log.jsonl`, filtered by rule `refund-over-200`. Forty-one entries this quarter, each with an approver.

"Why $200?" The finance policy, dual approval for stored-value changes, owned by Priya. Mr. Hale writes down the policy reference and moves on to CR-103.
:::

:::try Ask Eve
Highlight the three habits and ask Eve: "Role-play Mr. Hale asking me about CR-103. Ask one question at a time and tell me when my answer is a memory instead of a file."
:::

:::key
Audit readiness is a property of the workflow, not of the day the auditor arrives. If every stage boundary leaves its artifact where no one engineer controls it, the pack is assembled before anyone asks for it.
:::

## Summary

- A green build proves the code passed a check once. Evidence proves, to someone who was not there, that the right check ran and a named person accepted the result.
- Ask four questions of every gate before scaling: which control it satisfies and who owns it, what artifact proves it ran and where it lives, what metric shows it works over time, and what it costs the people who wait.
- Evidence lives outside any one engineer's control: the decision log at `.gates/log.jsonl`, the timestamped CI run, and the PR approval by the reviewer of record.
- Audit readiness equals enforced every time multiplied by evidenced automatically. A gate that can be skipped, or one that leaves no artifact, scores zero.
- The evidence pack for one change is the artifact chain itself: intent, spec, plan, test log, eval run, decision log, and the approved PR. Answer an auditor with files, not memories.

---
slug: l2-writing-an-executable-spec
number: "L2"
title: "Writing an Executable Spec"
module: 1
moduleTitle: "The Executable Spec"
verb: Specify
minutes: 60
prereqs: ["l1-the-artifact-chain"]
summary: "Write the six parts of a spec Quill can build from and Mr. Hale can read: intent, constraints, criteria, verification, human gates, evidence."
objectives:
  - "Write each of the six parts of an executable spec: intent, constraints, acceptance criteria, verification, human gates, evidence."
  - "Turn a vague request into observable acceptance criteria."
  - "Pair each criterion with a verification command that exits non-zero on failure."
  - "Name where a human must approve, override, or escalate, and who that person is."
  - "Explain why the spec is committed with the code derived from it."
keyTerms: ["executable-spec", "intent", "constraint", "acceptance-criteria", "verification-command", "human-gate", "evidence", "data-boundary", "non-zero-exit", "policy-owner", "spec-md", "file-pair"]
---

## Why this matters

Omar opens `spec.md` for CR-102 and types one line: "Add gift card refunds." He hands it to Quill. Forty minutes later there is a PR with a Refund button on the gift card page. The tests pass. Any logged-in staff member can press the button, for any amount, and nothing is written down when they do. Priya reads the PR and lists her rules from memory: store managers only, never more than the original purchase, every refund logged. None of those rules were in the file, so none of them are in the code. Quill did exactly what it was asked. The problem is what it was asked. This lesson teaches you to write the file so a request cannot leave those gaps.

## 1. A spec an agent can build from and an auditor can read

An executable spec is a `spec.md` written so that two very different readers get what they need from it. Quill needs enough detail to build the right thing without guessing. Mr. Hale, the auditor, needs to see what was promised, who agreed, and how you would know if the promise was broken. One file serves both when it has six parts.

| Part | Question it answers | Who cares most |
|---|---|---|
| Intent | What outcome are we after? | Nadia |
| Constraints | What must not change, and what boundaries apply? | Priya |
| Acceptance criteria | What behaviors prove it is done? | Quill, Omar |
| Verification | Which command checks each criterion? | Quill, CI |
| Human gates | Where does a person decide, and who? | Priya, Omar |
| Evidence | What is recorded, where, and who signs it? | Mr. Hale |

Each part exists because a specific thing goes wrong without it. No intent, and Quill builds toward the wrong outcome. No constraints, and it opens a system it should never touch. No criteria, and "done" is whatever the PR does. No verification, and the criteria are opinions. No human gates, and money moves without a person. No evidence, and a year later nobody can prove any of it.

:::key
A spec is executable when every promise in it can be checked by a command, a person, or a log entry. If a sentence cannot be checked, it is a wish.
:::

:::beginner Spec versus ticket
A ticket says what someone wants. A spec says what "done" means and how you will know. A ticket can say "add refunds." A spec must say who may refund, how much, what gets logged, and which test proves each of those.
:::

## 2. Part 1, Intent

Intent is the business outcome in one sentence, in plain words, with no implementation detail. It comes from `intent.md`, which Nadia accepted in L1, and it is copied into the top of `spec.md` so the spec cannot drift from what she agreed to.

:::example CR-102 intent
"A store manager can refund a customer's gift card purchase from Shelf, so that customers no longer wait for head office to process refunds by hand."

Notice what is missing. No button, no API route, no database table. Those are Quill's choices, made later in `plan.md`. Notice what is present: who (a store manager), what (refund a gift card purchase), and why (customers stop waiting).
:::

The test for an intent sentence: could Nadia say "yes, that is the outcome I want" without asking an engineer what it means? If she has to ask, it is not intent yet.

## 3. Part 2, Constraints

A constraint is a rule the change must obey no matter how it is built. Constraints come in three kinds: which systems the change may touch, which data boundaries apply, and which regulatory or policy limits are in force. A data boundary is a line between data the change may read or write and data it must never reach.

:::example CR-102 constraints
- Touches the payments service inside Shelf. Never touches the card processor: a gift card refund returns value to the card, it does not reverse a bank transaction.
- Manager role only. The `store_manager` role is checked on the server, not in the page.
- Data boundary: reads and writes the `gift_cards` and `refunds` tables. Never reads `customers.email` or `customers.address`.
- Policy: stored-value rules apply, so Priya is the policy owner and confirms this section before generation.
:::

The card processor line is the one Omar would have skipped. To Priya it is the difference between a bookkeeping entry and money leaving the bank.

:::warning Constraints that name a wish instead of a boundary
"Be careful with customer data" is not a constraint. Quill cannot check it and neither can Mr. Hale. "Never reads `customers.email`" is a constraint. It names a table and a verb, and a grep over the diff can confirm it.
:::

:::try Ask Eve
Highlight the constraints example and ask Eve: "Which of these could be checked by a script, and which need a person to read the diff?"
:::

## 4. Part 3, Acceptance criteria

Acceptance criteria are observable behaviors, written before any code is generated, that together define "done." Observable means something outside the code can watch it happen: a response, a screen, a table row, an error message. Each criterion is true or false, never "mostly."

| Bad criterion | Why it fails | Good criterion |
|---|---|---|
| "Refunds work correctly." | Nothing to observe | "A refund of $30 on a $50 card sets the balance to $20." |
| "Only the right people can refund." | Who? | "A request from a `staff` role returns 403 and changes nothing." |
| "Refunds should be limited." | To what? | "A refund larger than the original purchase is rejected with `over_purchase`." |
| "Refunds are tracked." | Where? How? | "Every successful refund writes one row to `refunds` with manager id and amount." |

:::example Five criteria for CR-102
1. A `store_manager` can refund any amount up to the original purchase price of a gift card sold at their store.
2. A refund larger than the original purchase price is rejected with the error `over_purchase` and the balance does not change.
3. A request from any role other than `store_manager` returns 403 and no row is written.
4. A refund of more than $200 is held in status `pending_approval` until Priya approves it.
5. Every successful refund writes one row to the `refunds` table with the manager id, gift card id, amount, and timestamp.
:::

Count Priya's rules from the opening story: managers only (3), never more than the purchase (2), every refund logged (5). The other two came from asking her one more question.

:::beginner Observable
Observable means you could watch it from outside. A balance on a screen is observable. A function being "well written" is not. If you cannot say what you would look at to confirm the criterion, rewrite it.
:::

:::key
Write the criteria before Quill types anything. Criteria written after the code describe what got built, not what was wanted.
:::

## 5. Part 4, Verification

A verification command is paired with one criterion, runs the check, and reports the result by its exit code. The rule is non-zero exit on failure: `0` when the criterion is met, any other number when it is not. This is why the spec is "executable." A criterion with a command can be checked by Quill, by `gate.sh` in L4, and by CI in L6, without anyone reading anything.

:::example make test-refund-limit
Criterion 2 pairs with `make test-refund-limit`. The `Makefile` target runs one Vitest file:

```makefile
test-refund-limit:
	npx vitest run tests/refunds/limit.test.ts
```

The test creates a gift card with a $50 purchase, requests a $60 refund as a manager, and expects the error `over_purchase` and an unchanged balance. If Quill implements the limit, the process exits `0`. If Quill forgets it, or checks the wrong field, the process exits `1`.
:::

The pairing for all five:

| Criterion | Command |
|---|---|
| 1. Manager can refund up to purchase price | `make test-refund-happy` |
| 2. Over purchase is rejected | `make test-refund-limit` |
| 3. Non-manager gets 403 | `make test-refund-role` |
| 4. Over $200 waits for Priya | `make test-refund-hold` |
| 5. One row per refund | `make test-refund-log` |

One command per criterion is deliberate. When `make test-refund-role` fails, everyone knows which promise broke. When one giant run fails, someone has to read the log.

:::warning A command that cannot fail proves nothing
Omar once wrote a target that ran `echo "checked"` and exited `0`. It was green for three months. Before you trust a verification command, break the code on purpose and watch the command go red. L3 turns that habit into a full loop.
:::

## 6. Part 5, Human gates

A human gate is a point where the work pauses until a named person approves, overrides, or escalates. Every change that moves money, touches personal data, or cannot be undone needs one. The spec says three things per gate: the condition that triggers it, the person who decides, and where the decision is recorded.

:::example A refund over $200 pauses for Priya
"Any single refund over $200 is created in status `pending_approval`. The manager sees 'waiting for approval' and the balance does not change. Priya (payments policy owner) approves or rejects in the Shelf admin page. Her decision, her user id, and the time are written to the refund row. Nobody else can approve, including Omar."

Below $200, the manager's own action is the gate: they pressed the button, and their id is on the row.
:::

The word "named" matters. "Approval from a senior person" is not a gate, because on the day it matters nobody knows who that is. "Priya, or Nadia when Priya is away" is a gate. Same for the threshold: "large refunds" is a feeling, $200 is a number.

L4's hooks come from this section. The hook that returns `ask` for a refund over $200 is the code version of this paragraph. The paragraph comes first.

:::try Ask Eve
Highlight the "named" paragraph and ask Eve: "Rewrite this human gate for a hospital scheduling app, naming a role and a threshold."
:::

## 7. Part 6, Evidence

Evidence is the record that a rule was followed, written automatically, stored where it cannot be quietly edited, and signed off by a person. The spec says what is logged, where it lands, and who confirms it before merge. Mr. Hale reads this part first. Most specs leave it out, because nothing breaks on the day you skip it.

:::example One refund log line
Every successful refund appends one JSON line to the refund log, which the payments service ships to the shared audit bucket nightly:

```json
{"event":"refund","gift_card":"gc_5521","amount":340.00,"manager":"u_omar_k","approver":"u_priya","status":"approved","at":"2026-09-14T10:42:07Z"}
```

The `approver` field is empty below $200 and required above it. A line with amount 340 and no approver is itself a finding.
:::

Evidence also includes what the PR carries, as a checklist Omar completes and the reviewer confirms.

:::example The PR checklist for CR-102
- [ ] `spec.md` committed in this PR, unchanged since Priya confirmed constraints
- [ ] `make test-refund-limit`, `-role`, `-hold`, `-log`, `-happy` output attached
- [ ] Priya's confirmation of the constraints section linked
- [ ] One sample refund log line pasted from a test run
- [ ] Reviewer of record named in the PR description
:::

:::key
Evidence is written by the system, not remembered by a person. If the proof lives in someone's head or chat history, the audit fails even when the code is right.
:::

## 8. Policy while writing, not in review

The opening story went wrong at one moment: Priya's rules reached the work after the code existed. The fix is to read her policy while drafting, not while reviewing the PR. Priya is the policy owner for payments and customer data, so the constraints and human gates sections are routed to her before Quill starts. Ten minutes of her time before generation replaces a rewrite after.

:::example Reading the policy doc first
Omar opens Priya's stored-value policy before writing section 2. Three lines go straight into the spec: managers only, never above purchase, log everything. One line he did not know about, the $200 dual-approval rule, becomes criterion 4 and the human gate. He sends Priya the constraints and gates sections. She replies with one change: the approver row must record her user id, not her name. Total elapsed time: twenty minutes, and no code exists yet.
:::

The spec and the code are a file pair: the spec is committed in the same PR as the code derived from it, so the repository holds what was asked next to what was built. If someone later changes the refund limit, the diff shows the spec line and the code line moving together, or one moving without the other, which is a finding of its own.

:::beginner Why not keep the spec in a wiki?
A wiki page can change after the code merges, with no record of which version Quill built from. A file in the same commit cannot. Mr. Hale can check out the commit and see the exact spec that produced the exact code.
:::

The full `spec.md` for CR-102, all six parts in one file:

```markdown
# CR-102: Refund a gift card purchase
Author: Omar · 2026-09-12 · Policy owner: Priya · Reviewer of record: TBD at PR

## 1. Intent
A store manager can refund a customer's gift card purchase from Shelf,
so customers no longer wait for head office to process refunds by hand.

## 2. Constraints
- Touches the payments service. Never touches the card processor.
- store_manager role only, checked on the server.
- Data boundary: reads/writes gift_cards and refunds. Never reads customers.email.
- Stored-value policy applies. Priya confirms this section before generation.

## 3. Acceptance criteria
1. A store_manager can refund up to the original purchase price.
2. A refund above purchase price is rejected with over_purchase; balance unchanged.
3. Any other role gets 403 and no row is written.
4. A refund over $200 is held as pending_approval until Priya approves.
5. Each successful refund writes one refunds row: manager, card, amount, time.

## 4. Verification (exit non-zero on failure)
1 make test-refund-happy · 2 make test-refund-limit · 3 make test-refund-role
4 make test-refund-hold · 5 make test-refund-log

## 5. Human gates
Over $200: Priya approves or rejects in Shelf admin. Nadia covers when Priya is away.
Decision, user id, and time are written to the refund row.

## 6. Evidence
One JSON line per refund to the refund log, shipped nightly to the audit bucket.
PR carries: this file, all five make outputs, Priya's confirmation link,
one sample log line, and the named reviewer of record.
```

:::try Ask Eve
Highlight the full spec and ask Eve: "Which single line would you remove to make this spec fail an audit, and why?"
:::

:::tip
Keep the whole file under one screen. A spec nobody reads to the end is a spec with an unread section, and that section is usually evidence.
:::

## Summary

- An executable spec has six parts: intent, constraints, acceptance criteria, verification, human gates, evidence. Each part prevents a specific failure.
- Acceptance criteria are observable, true-or-false behaviors written before any code is generated.
- Every criterion pairs with one verification command that exits non-zero on failure, so the spec can be checked by a script, not an opinion.
- A human gate names a condition, a person, and where the decision is recorded. "Over $200, Priya" is a gate. "Large refunds need review" is not.
- Read the policy owner's rules while drafting, route the constraints and gates to her before generation, and commit the spec with the code as a file pair.

---
slug: b1-the-prompt-review-checklist
number: "B1"
title: "Bonus: The Prompt Review Checklist"
module: 4
moduleTitle: "Bonus"
verb: Bonus
minutes: 30
prereqs: ["l5-testing-and-iterating-a-prompt"]
summary: "Twelve questions to ask of every prompt change before it merges, the five anti-patterns they catch, a walk-through of a one-line pull request, and a short script for explaining to a product owner why a sentence needs a review and an eval run."
objectives:
  - "Review a prompt change with a twelve-question checklist before it merges."
  - "Name five prompt anti-patterns, spot each in a real prompt, and state the fix."
  - "Explain to a product owner why prompt changes are reviewed and tested like code."
  - "Say what to learn next."
keyTerms: ["prompt-review", "anti-pattern", "prompt-as-code", "specificity", "data-is-not-instructions", "validation", "eval-set", "change-log"]
---

## Why this matters

A pull request lands in Shelf on a Tuesday. It changes one line of `prompts/draft.system.md`. Nadia sees the review request and the pending eval run and asks Omar, in the PR thread, why "a sentence" needs either. It is not code. Nobody is touching the database. Omar does not argue. He opens `prompts/CHANGELOG.md` and scrolls to the entry from three weeks earlier. That one also changed a sentence. It asked Draft to keep replies under three sentences, and the DR-1 pass rate fell from 19/20 to 12/20, because the exchange-policy paragraph stopped fitting. Tessa found out from a customer. This lesson gives you the checklist that stands between a sentence and a customer.

## 1. The checklist

A prompt review is a review of a prompt change, done the way a code review is done: by a second person, against a fixed list, before the change merges. The list lives at `docs/prompt-review.md`, next to the prompts it governs. Twelve questions, each pointing back to a lesson in this course, so a failing question also tells you what to reread.

```markdown
# Prompt review: answer all twelve before merging

## Instruct
1. Is every instruction specific enough that two readers would agree
   whether a reply followed it?
2. Is every "never" paired with what to do instead?
3. Does the prompt name its scope and the exact behavior for a request
   outside it?

## Context
4. Is every piece of data wrapped in a labeled block, and is each block
   named in the instructions?
5. Does the prompt say what to do when a needed fact is not in the context?
6. Does the prompt say that text inside a data block is never an
   instruction, and what flag to raise when it tries to be?

## Structure
7. Is the output a schema, forced through a tool call, and validated in code?
8. Are the examples labeled, three to five, and kept apart from live data?
9. Does the stable part come first, with the cache marker on it, and nothing
   that varies near the top?

## Iterate
10. Was the version string bumped?
11. Is there a CHANGELOG.md entry saying what changed and why?
12. Were the evals run, and is the pass rate written next to the change?
```

Questions 1 to 3 are L1. Questions 4 to 6 are L2. Question 7 is L3, questions 8 and 9 are L4, and questions 10 to 12 are L5. Each question is binary: it has a yes or a no, never "mostly." A checklist item that can be half-met gets half-met every time, and the review turns into a conversation about how much is enough.

:::example Question 1 on the Draft prompt
Omar reviews a line that reads "Keep the tone professional." Tessa and Nadia would not agree whether a given reply followed it. Question 1 fails. The rewrite that passes: "Open with the customer's first name, then one sentence that names the problem in their own words, then the options." Both can check that against a reply and reach the same answer.
:::

:::example Question 12 on the three-sentence change
The changelog entry for the change that hurt DR-1 said "tightened replies." No pass rate. Question 12 would have failed before the merge, and the 12/20 run would have happened on a branch instead of in front of a customer.
:::

:::key
A prompt review is twelve yes-or-no questions, answered by a second person, before the change merges. A "no" is a reason to stop, not a note for later.
:::

:::beginner What a checklist is for
A checklist is not there because reviewers are careless. It is there because the same twelve things matter every time, and memory is worst on the day the change looks smallest.
:::

:::tip
Paste the twelve questions into the pull request template for any PR that touches `prompts/`, `src/llm/`, or `evals/`. An unanswered question blocks the merge the same way a failing test does.
:::

## 2. Five anti-patterns

An anti-pattern is a habit that looks reasonable and reliably produces a bad result. These five account for most prompt failures, and each is caught by a specific question on the list.

| Anti-pattern | What it looks like | Question that catches it | Lesson that fixes it |
|---|---|---|---|
| The wish prompt | "Be accurate." "Be helpful." "Use good judgment." | 1 | L0, L1 |
| The handbook dump | The whole policy manual pasted into the system prompt | 4, 9 | L2, L4 |
| The naked JSON ask | "Reply with the titles as JSON." | 7 | L3 |
| The example pile | Twelve examples, most alike, next to the live data | 8 | L4 |
| The untested one-liner | A sentence changed, merged, no run, no entry | 10, 11, 12 | L5 |

### The wish prompt

A wish prompt tells the model to be something instead of telling it what to do. The model was already trying to be accurate. The words carry no information, so they change nothing. The fix is L1's test: an instruction earns its place when it would change an output.

:::example "Be accurate" in Draft
Draft's first prompt said "be accurate," and the DR-1 reply quoted $22 for an $18 paperback. The instruction that fixed it: "Quote the price and the delivery date from the order record. If the record has no delivery date, say a manager will check." Now there is a fact to quote and a behavior for when the fact is missing.
:::

### The handbook dump

The handbook dump puts everything the model might need into the request, on the theory that more context cannot hurt. It can. A 300-line policy manual buries the one paragraph about exchanges and costs tokens on every call. The fix is relevance and placement from L2 and a stable prefix from L4.

:::example The refund policy in Draft
Omar once pasted Priya's full refund policy into `prompts/draft.system.md`. Draft began citing the damaged-shipment section to customers asking about delivery times. The replacement was four lines: the exchange window, who confirms amounts, and what to say when the case is not covered.
:::

### The naked JSON ask

Asking for JSON in prose gets JSON wrapped in prose. "Here is the JSON you asked for:" breaks the parser, and a guessed ISBN-13 breaks the import. The fix is L3: the shape is a tool's `input_schema`, `tool_choice` forces the call, and zod validates the result, because a schema constrains shape, not meaning.

### The example pile

Examples teach format and edge cases. Too many teach content. When Intake had ten examples, a title from one appeared in the output for IN-3, a newsletter that offered nothing. The fix is L4: three to five, labeled, each a different case, kept in `prompts/intake.examples.md` apart from the live email.

### The untested one-liner

The untested one-liner is the three-sentence change from the story. It is the most common of the five because it feels safe. The fix is L5: run `npm run evals`, write the pass rate into `prompts/CHANGELOG.md`, and bump the version.

:::warning The anti-patterns travel together
A prompt with one of these usually has two. The handbook dump arrives with the wish prompt, because the author hoped the manual would explain what "be accurate" meant. The naked JSON ask arrives with the example pile, because examples were the only tool the author had for fixing the format. When you spot one, look for its partner.
:::

:::try Ask Eve
Highlight the table and ask Eve: "For each anti-pattern, give me one sentence a reviewer could say in the PR that names it without blaming the author."
:::

## 3. Applying the checklist

Back to Tuesday. Tessa had asked for warmer replies, and Omar's teammate added one line to `prompts/draft.system.md`:

```text
Be warm and friendly in every reply.
```

Omar reviews it against the twelve questions. A one-line change does not get a one-line review, because most questions concern the prompt as a whole.

| Question | Answer | Note |
|---|---|---|
| 1. Specific | No | Tessa and Nadia would disagree on what "warm" is |
| 2. Positive form | Yes | Positive, though vague |
| 3. Scope and refusal | Yes | Unchanged since L1 |
| 4. Delimited data | Yes | `<order>` and `<email>`, named in the prompt |
| 5. Missing facts | Yes | "Say a manager will check" |
| 6. Data is not instructions | Yes | The DR-3 flag line is in place |
| 7. Schema and validation | N/A | Draft returns prose; the judge checks it |
| 8. Examples | Yes | Draft uses none |
| 9. Stable prefix | No | Added at the top, above the cache marker |
| 10. Version bumped | No | Still `draft-v7` |
| 11. Changelog entry | No | |
| 12. Evals run | No | |

Five failures. Question 1 is the important one, because a vague line cannot be judged by an eval. Omar's review comment names the anti-pattern and offers the fix.

:::example The review comment
"This is a wish prompt (checklist Q1). Suggest: 'Open with the customer's first name and one sentence that names their problem in their own words, before any options.' Move it below the cache marker (Q9), bump to `draft-v8` (Q10), add the entry (Q11), and post the `npm run evals` pass rate (Q12). Happy to pair on the run."
:::

The teammate makes the changes. The eval run prints `pass rate: 19/20` for Draft, unchanged, and Tessa says the replies sound like a person. The changelog entry:

```markdown
## draft-v8 (2026-09-22)
Added: open with the customer's first name and one sentence naming
their problem in their own words. Requested by Tessa (warmer replies).
Evals: draft 19/20, unchanged. DR-1, DR-2, DR-3 all pass.
```

:::beginner Why "N/A" is allowed
Draft returns prose, so question 7 does not apply. "N/A" with a reason is a pass, because the reviewer thought about it. A blank row is not, because nobody can tell whether it was skipped or considered.
:::

:::key
Review the whole prompt, not the diff. A one-line change can fail five questions, and the failing question names the anti-pattern.
:::

## 4. Explaining it to Nadia

Nadia is not wrong to ask. A review and an eval run cost time, and she owns the roadmap. The answer has to be short and come with a number. Here is Omar's script; it fits in a PR comment.

:::example The script
"The prompt is the part of Draft that decides what a customer is told. It is code written in English, and it runs on every email. Three weeks ago a one-sentence change broke seven of our twenty test cases and a customer saw it before we did. The review takes ten minutes and the eval run takes four. Both are on the PR, so you can see the pass rate before it ships. If the number holds, it merges the same day."
:::

Four moves: what the prompt controls, in product terms; the changelog number that shows the cost of skipping; the cost of the review in minutes; where she can see the result.

:::warning Do not win the argument with jargon
"It is a prompt regression against the eval set" is true and useless to Nadia. "A sentence change made seven of twenty replies wrong" is the same fact in her language.
:::

:::tip
Keep the changelog readable by product owners. One entry per change, the reason in plain words, the pass rate on its own line. It answers Priya's question too: which prompt was live on the day a customer was promised something.
:::

## 5. What to learn next

This course gave you the prompt as a unit of code: instructed, structured, iterated. Three courses on this platform take the next steps.

- **Working with Coding Agents** covers the daily craft of building with an agent beside you: the standing brief, driving a session, reviewing an agent's diff.
- **Building and Evaluating AI Agents** takes the twenty-case eval set from L5 and scales it: synthetic data, error analysis, judges you can trust, evals in CI.
- **Spec-Driven Development for Dummies** covers the lifecycle: the spec, the failing test, the enforced gate, and the evidence an auditor asks for. A prompt review is one of those gates.

:::try Ask Eve
Highlight the three bullets and ask Eve: "Given what I found hardest in this course, which of these should I take first, and why?"
:::

## Summary

- A prompt review is twelve binary questions, kept at `docs/prompt-review.md` and answered by a second person before a prompt change merges.
- Five anti-patterns cause most failures: the wish prompt, the handbook dump, the naked JSON ask, the example pile, and the untested one-liner. Each is caught by a named question and fixed by a named lesson.
- Review the whole prompt, not the diff. Tuesday's one-line PR failed five questions; the fix was a specific instruction, a version bump, a changelog entry, and a pass rate.
- Explain the review to a product owner with a number and a customer, not vocabulary: a sentence change made seven of twenty replies wrong, and the review costs fourteen minutes.
- A prompt is code; treat it like code. The next courses cover the daily craft, evals at scale, and the lifecycle that makes the review a gate.

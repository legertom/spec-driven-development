---
slug: l5-measuring-with-evaluators
number: "L5"
title: "Error Analysis: Measuring with Evaluators"
module: 2
moduleTitle: "Error Analysis"
verb: Measure
minutes: 65
prereqs: ["l4-finding-failures"]
summary: "Turn each failure mode into a binary evaluator, prove it works with TPR and TNR on labeled traces, and report prevalence with a confidence interval you can defend."
objectives:
  - "Build one binary evaluator per failure mode."
  - "Choose code checks for objective failures and LLM judges only when interpretation is needed."
  - "Write a judge prompt with a definition, boundary examples, and a strict output format."
  - "Split labeled data into train, dev, and test, report TPR and TNR, and read the test set once."
  - "Estimate prevalence with a bootstrap confidence interval, correct it for judge error, and apply the same discipline to retrieval, grounding, and handoff."
keyTerms: ["eval", "evaluator", "binary-evaluator", "code-check", "llm-judge", "judge-prompt", "labeled-data", "train-dev-test-split", "true-positive-rate", "true-negative-rate", "false-positive", "false-negative", "confusion-matrix", "prevalence", "bootstrap", "confidence-interval", "corrected-prevalence", "freeze-test-set", "retrieval", "grounding", "handoff", "recall-at-k"]
---

## Why this matters

The failure report from L4 says "Refund outside policy: 7 of 60 traces." Pip reads it and asks the questions an owner asks. "So 12%? Of every conversation? How sure are you?" Dev hesitates. Maya read 60 traces; 440 were never read. Sixty is small, and a different 60 might have shown 4 or 11. Pip has one more question: "When the shop opens, can it keep watching for this without Maya reading every chat?" Dev needs three things: an automatic detector for each failure mode, proof that the detector works, and a number with an honest range around it. That is what measuring means in this course.

## 1. One binary evaluator per failure mode

An eval is a measurement of agent behavior against a written definition of correct. An evaluator is the thing that does the measuring: a function that takes one trace and answers one question about it. A binary evaluator answers yes or no. This lesson builds one binary evaluator for every failure mode in the L4 taxonomy.

Why not a 1 to 5 score? Three reasons. Agreement: two reviewers give a 3 and a 4 and both feel right, while yes or no disagrees only at the boundary, which the taxonomy already wrote down. Actionability: "tone averages 3.4" points nowhere, while "Wrong tone in 8 of 60" points at eight traces to fix. Validation: you can count how often a yes-or-no grader agrees with a human, and you cannot do that cleanly with a scale.

:::example Maya and Dev score tone twice
They both score the same 10 traces for tone on a 1 to 5 scale and give the same number on 4 of 10. They score the same 10 traces again as "Wrong tone: yes or no", using the boundary from L4, and agree on 9 of 10. The one disagreement is a reply that is brief and formal; the boundary says that does not count, so they settle it in a minute.
:::

Each mode gets exactly one evaluator, and the first decision is which kind.

| Failure mode | Evaluator kind | Why |
|---|---|---|
| Refund amount exceeds order total | Code check | Two numbers from the trace |
| Did not escalate on legal words | Code check | A word list and a tool-call list |
| Made up order info (unknown order ids) | Code check | Compare ids in the reply with `orders.yaml` |
| Refund outside policy | LLM judge | "You'll see the money by Friday" is a promise in many wordings |
| Wrong tone | LLM judge | Interpretation, with a boundary |

:::key
A failure mode is measurable when it has one binary evaluator whose answers you have checked against human labels.
:::

## 2. Code checks first

A code check is a deterministic function over the trace: the user messages, the tool calls with their arguments and results, and the reply. It runs in milliseconds, costs nothing, and gives the same answer every time. When a failure can be stated in terms of fields in the trace, write code.

```ts
// checks.ts: each returns true when the failure is present
type Call = { name: string; input: Record<string, any>; output: any };
type Trace = { userMessages: string[]; calls: Call[]; reply: string };

export function refundExceedsTotal(t: Trace): boolean {
  const refund = t.calls.find((c) => c.name === "issue_refund");
  const order = t.calls.find((c) => c.name === "lookup_order");
  if (!refund || !order) return false;
  return refund.input.amount > order.output.total;
}

const LEGAL = /\b(lawyer|attorney|sue|legal action|small claims)\b/i;
export function missedLegalEscalation(t: Trace): boolean {
  const legalWords = t.userMessages.some((m) => LEGAL.test(m));
  const escalated = t.calls.some((c) => c.name === "escalate_to_human");
  return legalWords && !escalated;
}
```

A third check, "every order id in the reply exists in the world", is four lines: pull the four-digit numbers out of the reply and look each one up in `orders.yaml`.

:::example Three checks on one trace
Trace `tr-2c4`: the customer writes "my attorney will be in touch about the dead fern", Sprout calls `search_care_guide("fern care")` and replies with watering tips. `refundExceedsTotal` returns false (no `issue_refund` call). `missedLegalEscalation` returns true ("attorney" matched, no `escalate_to_human` call). The order-id check returns false (no four-digit numbers in the reply). No model call, and the same answer tomorrow.
:::

:::warning A regex matches words, not meaning
"I don't need a lawyer, I want my plant" trips the legal check. For a severity-3 trigger that false alarm is a price worth paying: Maya sees one extra conversation. For a subtle failure, code is the wrong tool, and forcing it produces a check that is precise about the wrong thing.
:::

:::tip
Keep each word list in one place and grow it from the traces the check missed. Dev added "small claims" after Maya found a trace the first version skipped.
:::

## 3. LLM judges when interpretation is needed

An LLM judge is a model given one trace and one failure definition, asked to answer fail or pass with a reason. You use it when the failure is about meaning: wrong tone, a claim the tool output does not support, a refund promised in words a regex would never catch.

A judge prompt has five parts, in this order: a role (one line: strict reviewer, checks one thing), the failure definition (the taxonomy entry, including counts and does not count), boundary examples (at least one FAIL and one PASS, taken from labeled traces), the trace itself, and an output format (exactly `{ "fail": true or false, "reason": "..." }` and nothing else).

:::example A full judge prompt for Wrong tone
```text
You are a strict reviewer for Pip's Plant Shop. You check ONE failure
mode and nothing else. Do not judge accuracy, policy, or length.

FAILURE MODE: Wrong tone
Definition: the assistant's reply is sarcastic, dismissive, blaming, or
makes a joke at the expense of a frustrated customer.
Counts: mocking a complaint; "patience is a virtue" style replies;
blaming the customer for a shop mistake; telling the customer to read
the guide before asking again.
Does not count: brief or formal replies; politely declining a request;
stating a policy the customer dislikes; an apology that sounds stiff.

FAIL example
Customer: "ugh where is 1063, this is taking forever"
Assistant: "Patience is a virtue when it comes to plants! It will get
there when it gets there."
Verdict: fail. A joke at a frustrated customer, and no help.

PASS example
Customer: "ORDER 1058 IS DEAD. REFUND NOW."
Assistant: "I'm sorry the plant did not make it. Our refund window is
30 days for plants damaged on arrival, and this order was delivered 42
days ago, so I cannot refund it myself. I can pass this to Maya."
Verdict: pass. Firm and polite. It states a policy the customer will
not like, which does not count.

TRACE
{{trace}}

Reply with JSON only:
{ "fail": true or false, "reason": "one sentence that quotes the reply" }
```
:::

The examples are the part people skip, and they are the part that does the work. They come from your labeled traces (next section) and they sit on the boundary: the PASS example is a firm reply that a lazy judge would flag. Running the judge is one `client.messages.create` call with the filled-in prompt as the user message, then `JSON.parse` on the text block that comes back.

:::beginner One judge, one question
Why not one prompt that checks all seven modes at once? Because that is the L4 story again: the more a grader is asked to look for, the more it drifts toward "seems fine". One mode per prompt keeps the definition and the examples close together, and it lets you validate each judge on its own.
:::

For Refund outside policy, the same skeleton needs two more things: it must tell the judge where to find the dates (`delivered_on` from the `lookup_order` result, and today's date from the trace metadata) and where the policy lives (30 days, damaged on arrival). You will write that prompt in the exercise.

## 4. Validating the judge

A judge is a guess until you check it against humans. Labeled data is a set of traces where a person wrote the answer for this mode: fail or pass. Maya's L4 sheet is the start; for each mode, every trace in the sheet gets a yes or no, not only the first-failure note.

Split the labeled traces three ways. Train: pick the boundary examples for the prompt from here. Dev: run the judge, measure, change the prompt, repeat. Test: the final score, frozen, read once. The train, dev, test split guards against the judge memorizing the traces you showed it. With 60 labeled traces, 20/20/20 works, as long as each split has some fails in it.

:::warning A split with no failures
Sixty traces with 7 fails, split at random, can leave a test set with one fail or none. TPR on one trace is a coin flip. Split the fails and the passes separately so each split gets its share, and if a mode has fewer than 10 labeled fails, label more before you trust any number.
:::

Two numbers tell you whether the judge works.

- True positive rate (TPR): of the traces that really fail, the fraction the judge flags. "How much does it catch?"
- True negative rate (TNR): of the traces that really pass, the fraction the judge passes. "How often does it leave good traces alone?"

:::example Twenty dev traces for Wrong tone
The dev split has 10 traces Maya labeled fail and 10 she labeled pass (balanced on purpose so the arithmetic is easy; real splits are lopsided).

The judge flags 8 of the 10 real fails. TPR = 8 / 10 = 0.80. The judge passes 9 of the 10 real passes. TNR = 9 / 10 = 0.90.

In words, the twenty traces fall into four boxes:

- 8 true positives: really fail, judge said fail. Caught.
- 2 false negatives: really fail, judge said pass. Missed.
- 9 true negatives: really pass, judge said pass. Left alone.
- 1 false positive: really pass, judge said fail. A false alarm.

The same four boxes as a grid, which is called a confusion matrix:

| | Judge says fail | Judge says pass |
|---|---|---|
| Really fails (10) | 8 true positives | 2 false negatives |
| Really passes (10) | 1 false positive | 9 true negatives |

TPR reads across the top row: 8 / (8 + 2). TNR reads across the bottom row: 9 / (1 + 9).
:::

:::beginner False positive, false negative
"Positive" means the judge said the failure is present. A false positive is a false alarm: the judge cried "fail" on a good trace. A false negative is a miss: a real failure slipped through. TPR counts the misses you avoided; TNR counts the false alarms you avoided.
:::

### Why accuracy alone misleads

Accuracy is the share of all traces the judge got right. It sounds like the natural number, and it lies when failures are rare.

:::example The judge that says pass to everything
100 traces, 5 real Wrong tone fails. A "judge" that answers pass every time is right on 95 traces. Accuracy: 95%. TPR: 0 of 5 = 0. TNR: 95 of 95 = 1.0. Accuracy says excellent; TPR says it caught nothing.
:::

Tuning on dev is a loop: run, look at the false negatives and false positives, change the prompt, run again. Dev's Wrong tone judge went v1 (definition only): TPR 0.60, TNR 0.90; v2 (added "does not count: brief or formal replies" and one FAIL example): 0.80, 0.90; v3 (a second FAIL example): 0.90, 0.85.

Which version wins depends on which mistake costs more. For monitoring prevalence you want both high. For a CI gate that blocks merges, a false alarm wastes an engineer's afternoon, so TNR matters more. A rule of thumb: do not trust a judge under 0.80 on either number.

:::key
Report TPR and TNR, never accuracy alone. Accuracy rewards a judge for agreeing that most traces are fine.
:::

## 5. Freeze and read test once

The test split is the exam. The dev split is the practice exam. Every time you look at a test result and then change the prompt, you have turned the test set into more dev data, and its score stops meaning anything. That is what "freeze and read test once" means: choose the winner on dev, run it on test one time, report that number, stop.

:::example Burning the test set
Dev runs v2 on test and gets TPR 0.75. One missed trace looks easy, so Dev adds it to the prompt as a FAIL example and re-runs test. TPR 1.00. The number is worthless: the judge was shown the exam question. Dev now needs 20 fresh labeled traces to have a test set at all.
:::

:::warning Peeking is tuning
There is no such thing as looking at test results "for information only". If a test result changed what you did next, it was a dev result. Keep the test trace ids in a file the tuning script cannot read, and label a new test set when you need to tune again.
:::

## 6. Prevalence with bootstrap confidence intervals

Prevalence is the share of traces that contain a failure. Maya found Refund outside policy in 7 of 60: prevalence 11.7%. That single number is a point estimate, and at n = 60 it wobbles. A different random 60 could have shown 4 or 11. Pip deserves a range.

A confidence interval is a range that says how far the estimate could move with a different sample of the same size. The bootstrap is a way to compute one without formulas: resample your labels with replacement, many times, and see how the estimate varies.

:::beginner With replacement
Write each label on a card. Draw a card, note it, put it back, shuffle, draw again, until you have drawn as many cards as you started with. Some cards get drawn twice, some never. That is one resample.
:::

:::example A 10-trace bootstrap by hand
Ten labels for Refund outside policy, 1 for fail: `[1, 0, 0, 1, 0, 0, 0, 1, 0, 0]`. Prevalence 3/10 = 30%.

| Resample | Cards drawn (positions 1 to 10) | Fails | Prevalence |
|---|---|---|---|
| 1 | 4, 8, 8, 2, 1, 5, 4, 10, 3, 6 | 5 | 50% |
| 2 | 2, 3, 5, 6, 9, 2, 7, 10, 3, 4 | 1 | 10% |
| 3 | 1, 1, 6, 8, 5, 2, 9, 3, 7, 10 | 3 | 30% |
| 4 | 5, 9, 2, 6, 3, 7, 10, 6, 2, 9 | 0 | 0% |
| 5 | 8, 4, 2, 3, 4, 9, 2, 1, 6, 5 | 4 | 40% |

Do this 1,000 times, sort the 1,000 prevalences, and take the 25th and the 975th. For these ten labels that gives 0% to 60%. So the honest report is "30%, 95% CI 0% to 60%", which tells Pip that ten traces say almost nothing. At n = 60 with 7 fails, the same procedure gives 5% to 20%: still wide, but useful.
:::

In code this is a ten-line loop: draw n random positions, count the fails, repeat 1,000 times, sort, and read off the values at index 25 and index 975.

### Correcting for judge error

Once the judge is validated, you run it on all 500 traces, and the flag rate becomes your observed prevalence. But the judge misses some failures (TPR below 1) and raises some false alarms (TNR below 1), so the observed rate is biased. Corrected prevalence undoes that bias:

```text
p_true = (p_observed − (1 − TNR)) / (TPR − (1 − TNR))
```

:::example Plugging in the numbers
The judge flags 80 of 500 traces: p_observed = 0.16. From validation, TPR = 0.80 and TNR = 0.90, so 1 − TNR = 0.10.

```text
p_true = (0.16 − 0.10) / (0.80 − 0.10)
       = 0.06 / 0.70
       = 0.086   →  about 8.6%
```

Check it the other way. If 8.6% of 500 is about 43 real failures, the judge catches 0.80 × 43 ≈ 34 of them. The other 457 traces pass, and 10% of them, about 46, are false alarms. 34 + 46 = 80 flags. It matches. More than half of the judge's flags on this mode are false alarms, which is why you never report the raw flag rate.
:::

To get a range on the corrected number, bootstrap the judge's flags the same way and apply the correction to each resample. Report all of it in one line: "Refund outside policy: about 9% of conversations (95% CI 4% to 14%), judge TPR 0.80 and TNR 0.90 on a frozen test set."

:::key
Report a range, not a point, and correct for the judge's own error rates. Both numbers come from work you can show.
:::

:::try Ask Eve
Ask Eve: "Redo the correction with an observed rate of 12%, TPR 0.90, and TNR 0.95. Then tell me what happens if TNR drops to 0.85."
:::

## 7. Subsystems

Sprout is not one thing. Retrieval, grounding, and handoff are subsystems, and each gets the same treatment: a binary question, human labels, a validated evaluator.

| Subsystem | Binary question | Evaluator | Labels from |
|---|---|---|---|
| Retrieval | Did the right care guide come back in the top k? | Code check, reported as recall@k | Scenario ground truth (L3) |
| Grounding | Is every claim in the reply supported by a tool result? | LLM judge | Maya, claims against tool outputs |
| Handoff | Did the escalation summary carry what Maya needs? | Code check for the order id, judge for completeness | Maya, who receives the handoffs |

Retrieval is what happens when `search_care_guide` runs: it returns the top k articles for a query. Recall@k is the share of scenarios where the correct article appears among those k.

:::example Recall@3 on ten care scenarios
Ten plant-care scenarios, each with the correct article named in ground truth. With k = 3, the correct article is in the results for 8 of them. Recall@3 = 8/10 = 0.80. Raise k to 5 and it becomes 10/10, at the cost of two more articles in Sprout's context every time. That trade is L9's business; the number is this lesson's.
:::

Grounding asks whether the reply is supported by what the tools returned. "Delivered September 5" with `delivered_on: 2026-09-05` in the result is grounded. "Arrives Thursday" after `not_found` is not. It is a judge because "supported" needs reading.

Handoff asks whether `escalate_to_human` carried the context. Compare `escalate_to_human("customer upset")` with `escalate_to_human("Order 1058, delivered Aug 1, 42 days; customer wants a refund for a dead plant; window closed; customer angry")`. Maya can act on the second in ten seconds. A code check confirms an order id is present; a judge checks that the request and the policy status are there.

## 8. Homework 1

Homework 1 is where this module becomes yours. You will label at least 60 support traces, build a taxonomy of 5 to 8 binary failure modes with definitions, examples, and boundaries, and write a one-page failure report with a bootstrap interval on your top mode. The full assignment, deliverables, and rubric are in the homework box below the quiz. Budget four to six hours, most of it reading.

:::try Ask Eve
Before you start the homework, ask Eve: "Give me a checklist for a failure-mode entry that would pass the Homework 1 rubric."
:::

## Summary

- Every failure mode gets one binary evaluator; yes or no beats 1 to 5 on agreement, actionability, and validation.
- Use a code check whenever the failure can be stated in trace fields; use an LLM judge only when meaning must be interpreted, with a role, a definition, boundary examples, the trace, and a strict JSON output.
- Validate every judge on labeled traces split into train, dev, and test; report TPR and TNR, never accuracy alone, and read the test set once.
- Prevalence is a share of traces; report it with a bootstrap confidence interval and correct it for the judge's TPR and TNR.
- Retrieval (recall@k), grounding, and handoff get the same discipline: binary question, human labels, validated evaluator.

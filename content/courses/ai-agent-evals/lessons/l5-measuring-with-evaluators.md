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

The failure report from L4 says "Refund outside policy: 7 of 60 traces." Pip reads it and asks the questions an owner asks. "So 12%? Of every conversation? How sure are you?" Dev hesitates. Maya read 60 traces; 440 were never read. Sixty is small, and a different 60 might have shown 4 or 11. Pip has one more question: "When the shop opens, can it keep watching for this without Maya reading every chat?" Dev needs three things: a detector for each failure mode, proof that the detector works, and a number with an honest range around it.

## 1. One binary evaluator per failure mode

An eval is a measurement of agent behavior against a written definition of correct. An evaluator does the measuring: a function that takes one trace and answers one question about it. A binary evaluator answers yes or no, and every failure mode in the L4 taxonomy gets one.

Why not a 1 to 5 score? Three reasons. Agreement: two reviewers give a 3 and a 4 and both feel right, while yes or no disagrees only at the boundary the taxonomy already wrote down. Actionability: "tone averages 3.4" points nowhere, while "Wrong tone in 8 of 60" points at eight traces to fix. Validation: you can count how often a yes-or-no grader agrees with a human; a scale has no clean way to do that.

:::example Maya and Dev score tone twice
They both score the same 10 traces for tone on a 1 to 5 scale and give the same number on 4 of 10. They score them again as "Wrong tone: yes or no", using the boundary from L4, and agree on 9 of 10. The one disagreement is a brief, formal reply; the boundary says that does not count, so they settle it in a minute.
:::

Each mode gets one evaluator, and the first decision is which kind. Code checks: refund amount exceeds order total (two numbers from the trace), missed escalation on legal words (a word list and a tool-call list), unknown order ids in the reply (compare with `orders.yaml`). Judges: Refund outside policy ("you'll see the money by Friday" is a promise in many wordings), Wrong tone, and claims not supported by tool output.

:::key
A failure mode is measurable when it has one binary evaluator whose answers you have checked against human labels.
:::

## 2. Code checks first

A code check is a deterministic function over the trace: the user messages, the tool calls with their arguments and results, and the reply. It runs in milliseconds, costs nothing, and gives the same answer every time. When a failure can be stated in terms of trace fields, write code.

```ts
// checks.ts: each returns true when the failure is present
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

A third check, "every order id in the reply exists in the world", pulls the four-digit numbers out of the reply and looks each up in `orders.yaml`. On trace `tr-2c4`, where the customer writes "my attorney will be in touch about the dead fern" and Sprout replies with watering tips, `missedLegalEscalation` returns true and the other two return false.

:::warning A regex matches words, not meaning
"I don't need a lawyer, I want my plant" trips the legal check. For a severity-3 trigger that false alarm is a price worth paying: Maya sees one extra conversation. For a subtle failure, code is the wrong tool; forcing it gives a check that is precise about the wrong thing.
:::

:::tip
Keep each word list in one place and grow it from the traces the check missed. "Small claims" was added after Maya found a trace the first version skipped.
:::

## 3. LLM judges when interpretation is needed

An LLM judge is a model given one trace and one failure definition, asked to answer fail or pass with a reason. Use it when the failure is about meaning: wrong tone, a claim the tool output does not support, a refund promised in words a regex would never catch.

A judge prompt has five parts, in this order: a role (strict reviewer, checks one thing), the failure definition (the taxonomy entry with its boundary), boundary examples (at least one FAIL and one PASS from labeled traces), the trace, and an output format (`{ "fail": true or false, "reason": "..." }` and nothing else).

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
stating a policy the customer dislikes; a stiff apology.

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

The examples are the part people skip, and they do the work. They come from your labeled traces (next section) and sit on the boundary: the PASS example is a firm reply that a lazy judge would flag. Running the judge is one `client.messages.create` call with the filled-in prompt as the user message, then `JSON.parse` on the text that comes back.

:::beginner One judge, one question
Why not one prompt that checks all seven modes at once? Because that is the L4 story again: the more a grader is asked to look for, the more it drifts toward "seems fine". One mode per prompt also lets you validate each judge on its own.
:::

For Refund outside policy, the same skeleton needs two more things: where to find the dates (`delivered_on` from the `lookup_order` result, today's date from the trace metadata) and what the policy says (30 days, damaged on arrival). You will write that prompt in the exercise.

## 4. Validating the judge

A judge is a guess until you check it against humans. Labeled data is a set of traces where a person wrote the answer for this mode: fail or pass. Maya's L4 sheet is the start; for each mode, every trace gets a yes or no, not only its first-failure note.

Split the labeled traces three ways. Train: pick the boundary examples for the prompt from here. Dev: run the judge, measure, change the prompt, repeat. Test: the final score, frozen, read once. The split keeps the judge from being scored on traces it was shown. With 60 labeled traces, 20/20/20 works.

:::warning A split with no failures
Sixty traces with 7 fails, split at random, can leave a test set with one fail or none, and TPR on one trace is a coin flip. Split fails and passes separately so each split gets its share, and label more before trusting a mode with under 10 labeled fails.
:::

Two numbers tell you whether the judge works.

- True positive rate (TPR): of the traces that really fail, the fraction the judge flags. How much does it catch?
- True negative rate (TNR): of the traces that really pass, the fraction the judge passes. How often does it leave good traces alone?

:::example Twenty dev traces for Wrong tone
The dev split has 10 traces Maya labeled fail and 10 she labeled pass (balanced so the arithmetic is easy; real splits are lopsided). The judge flags 8 of the 10 real fails: TPR = 8 / 10 = 0.80. It passes 9 of the 10 real passes: TNR = 9 / 10 = 0.90.

In words, the twenty traces fall into four boxes:

- 8 true positives: really fail, judge said fail. Caught.
- 2 false negatives: really fail, judge said pass. Missed.
- 9 true negatives: really pass, judge said pass. Left alone.
- 1 false positive: really pass, judge said fail. False alarm.

The same four boxes as a grid, called a confusion matrix:

| | Judge says fail | Judge says pass |
|---|---|---|
| Really fails (10) | 8 true positives | 2 false negatives |
| Really passes (10) | 1 false positive | 9 true negatives |

TPR reads across the top row: 8 / (8 + 2). TNR reads across the bottom row: 9 / (1 + 9).
:::

:::beginner False positive, false negative
"Positive" means the judge said the failure is present. A false positive is a false alarm on a good trace. A false negative is a miss: a real failure slipped through. TPR counts the misses you avoided; TNR counts the false alarms you avoided.
:::

### Why accuracy alone misleads

Accuracy is the share of all traces the judge got right. It sounds natural, and it lies when failures are rare.

:::example The judge that says pass to everything
100 traces, 5 real Wrong tone fails. A "judge" that answers pass every time is right on 95 traces. Accuracy: 95%. TPR: 0 of 5 = 0. TNR: 95 of 95 = 1.0. Accuracy says excellent; TPR says it caught nothing.
:::

Tuning on dev is a loop: run, read the misses and false alarms, change the prompt, run again. Dev's Wrong tone judge went v1 (definition only): TPR 0.60, TNR 0.90; v2 (added "does not count: brief or formal replies" and one FAIL example): 0.80, 0.90; v3 (a second FAIL example): 0.90, 0.85. Which wins depends on which mistake costs more: for a CI gate, a false alarm wastes an afternoon, so TNR matters more. Rule of thumb: do not trust a judge under 0.80 on either number.

:::key
Report TPR and TNR, never accuracy alone. Accuracy rewards a judge for agreeing that most traces are fine.
:::

## 5. Freeze and read test once

The test split is the exam; the dev split is the practice exam. Every time you look at a test result and then change the prompt, you have turned the test set into more dev data, and its score stops meaning anything. "Freeze and read test once" means: choose the winner on dev, run it on test once, report that number, stop.

:::example Burning the test set
Dev runs v2 on test and gets TPR 0.75. One missed trace looks easy, so Dev adds it to the prompt as a FAIL example and re-runs test. TPR 1.00. The number is worthless: the judge was shown the exam question. Dev now needs 20 fresh labeled traces to have a test set.
:::

:::warning Peeking is tuning
There is no such thing as looking at test results "for information only". If a test result changed what you did next, it was a dev result. Keep the test trace ids in a file the tuning script cannot read, and label a new test set when you must tune again.
:::

## 6. Prevalence with bootstrap confidence intervals

Prevalence is the share of traces that contain a failure. Maya found Refund outside policy in 7 of 60: prevalence 11.7%. That single number is a point estimate, and at n = 60 it wobbles; a different random 60 could have shown 4 or 11. Pip deserves a range.

A confidence interval says how far the estimate could move with a different sample of the same size. The bootstrap computes one without formulas: resample your labels with replacement, many times, and see how the estimate varies.

:::beginner With replacement
Write each label on a card. Draw one, note it, put it back, shuffle, and repeat until you have drawn as many cards as you started with. Some cards come up twice, some never. That is one resample.
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

Do this 1,000 times, sort the 1,000 prevalences, and take the 25th and the 975th. For these ten labels that gives 0% to 60%. The honest report is "30%, 95% CI 0% to 60%", which tells Pip that ten traces say almost nothing. At n = 60 with 7 fails, the same procedure gives 5% to 20%: wide, but useful. In code it is a ten-line loop: draw n random positions, count fails, repeat, sort, read off index 25 and 975.
:::

### Correcting for judge error

Once the judge is validated, you run it on all 500 traces, and the flag rate is your observed prevalence. But the judge misses some failures (TPR below 1) and raises false alarms (TNR below 1), so that rate is biased. Corrected prevalence undoes the bias:

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

Check it the other way. 8.6% of 500 is about 43 real failures; the judge catches 0.80 × 43 ≈ 34. The other 457 traces pass, and 10% of them, about 46, are false alarms. 34 + 46 = 80 flags. It matches. More than half of the flags are false alarms, which is why you never report the raw flag rate.
:::

For a range on the corrected number, bootstrap the judge's flags and correct each resample. Then report one line: "Refund outside policy: about 9% of conversations (95% CI 4% to 14%), judge TPR 0.80 and TNR 0.90 on a frozen test set."

:::key
Report a range, not a point, and correct for the judge's own error rates. Both numbers come from work you can show.
:::

:::try Ask Eve
Ask Eve: "Redo the correction with an observed rate of 12%, TPR 0.90, and TNR 0.95. Then tell me what happens if TNR drops to 0.85."
:::

## 7. Subsystems

Sprout is not one thing. Retrieval, grounding, and handoff are subsystems, and each gets the same treatment: a binary question, human labels, a validated evaluator.

| Subsystem | Binary question | Evaluator |
|---|---|---|
| Retrieval | Did the right care guide come back in the top k? | Code check, reported as recall@k, labels from L3 ground truth |
| Grounding | Is every claim in the reply supported by a tool result? | LLM judge, labels from Maya |
| Handoff | Did the escalation summary carry what Maya needs? | Code check for the order id, judge for completeness |

Retrieval is what `search_care_guide` does: it returns the top k articles for a query. Recall@k is the share of scenarios where the correct article appears among those k.

:::example Recall@3 on ten care scenarios
Ten plant-care scenarios, each with the correct article named in ground truth. With k = 3, the correct article is in the results for 8 of them: recall@3 = 8/10 = 0.80. Raise k to 5 and it becomes 10/10, at the cost of two more articles in Sprout's context every time. That trade is L9's business.
:::

Grounding asks whether the reply is supported by what the tools returned. "Delivered September 5" with `delivered_on: 2026-09-05` in the result is grounded; "arrives Thursday" after `not_found` is not. "Supported" needs reading, so it is a judge.

Handoff asks whether `escalate_to_human` carried the context. Compare `escalate_to_human("customer upset")` with `escalate_to_human("Order 1058, delivered Aug 1, 42 days; wants refund for dead plant; window closed; angry")`. Maya can act on the second in ten seconds. A code check confirms an order id; a judge checks for the request and policy status.

## 8. Homework 1

Homework 1 is where this module becomes yours. You will label at least 60 support traces, build a taxonomy of 5 to 8 binary failure modes with definitions, examples, and boundaries, and write a one-page failure report with a bootstrap interval on your top mode. The full assignment and rubric are in the homework box below the quiz.

:::try Ask Eve
Before you start the homework, ask Eve: "Give me a checklist for a failure-mode entry that would pass the Homework 1 rubric."
:::

## Summary

- Every failure mode gets one binary evaluator; yes or no beats 1 to 5 on agreement, actionability, and validation.
- Code checks for failures stated in trace fields; LLM judges only when meaning must be interpreted, built from a role, a definition, boundary examples, the trace, and strict JSON output.
- Validate every judge on labeled traces split into train, dev, and test; report TPR and TNR, never accuracy alone, and read the test set once.
- Prevalence is a share of traces; report it with a bootstrap confidence interval, corrected for the judge's TPR and TNR.
- Retrieval (recall@k), grounding, and handoff get the same discipline: binary question, human labels, validated evaluator.

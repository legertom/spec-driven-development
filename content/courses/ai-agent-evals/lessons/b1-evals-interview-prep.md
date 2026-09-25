---
slug: b1-evals-interview-prep
number: "B1"
title: "Bonus: Evals Interview Prep"
module: 6
moduleTitle: "Bonus"
verb: Bonus
minutes: 30
prereqs: ["l1-building-agents-foundations", "l2-designing-for-evaluability", "l3-synthetic-data-and-scenarios", "l4-finding-failures", "l5-measuring-with-evaluators", "l6-ci-cd-for-agents", "l7-safety-and-adversarial-evaluation", "l8-improving-accuracy", "l9-improving-cost"]
summary: "Recognize the nine traps of eval-focused interviews, answer with Analyze, Measure, Improve and real numbers, and build a portfolio that proves you have run the loop."
objectives:
  - "Recognize the nine common traps in eval interview answers and explain why each fails."
  - "Structure any evaluation answer as Analyze, Measure, Improve, with numbers from a loop you ran."
  - "Outline strong answers to five common interview questions about agent evaluation."
  - "Assemble a portfolio with a taxonomy, a judge validation table, a CI gate, and a frontier chart."
keyTerms: ["llm-judge", "labeled-data", "true-positive-rate", "true-negative-rate", "binary-evaluator", "freeze-test-set", "pass-at-k", "pass-hat-k", "prompt-injection", "manual-fix-loop", "pareto-frontier", "taxonomy", "analyze-measure-improve"]
---

## Why this matters

Dev is interviewing for an AI engineering role. The interviewer asks, "How would you evaluate a support agent?" Dev says, "We'd use an LLM judge." The interviewer waits. Dev adds, "and check the accuracy." Silence.

Six months of work on Sprout, and none of it made it into the answer: Maya's taxonomy, the judge validated on 60 labeled traces, the CI gate that caught the refund regression, the $3,000 bill that became $530. Interviews reward people who have run the loop and can say so with numbers. This lesson turns L1 to L9 into answers that show it.

## 1. The traps

Nine answers that sound reasonable and fail.

### Trap 1: an LLM judge without labeled data

- **What the candidate says:** "We'd have a model grade the outputs."
- **Why it fails:** Nobody validated the judge, so its number is an opinion.
- **The better answer:** "A person labels 60 to 100 traces first. Then we write the judge on the training split, tune on dev, and report TPR and TNR on a frozen test split."

### Trap 2: accuracy without TPR and TNR

- **What the candidate says:** "The judge is 95% accurate."
- **Why it fails:** If 5% of traces fail, a judge that never fires is 95% accurate and useless.
- **The better answer:** "TPR 0.8: it catches 8 of 10 real failures. TNR 0.9: it passes 9 of 10 real passes. Here is the corrected prevalence."

### Trap 3: 1-to-5 rubrics instead of binary

- **What the candidate says:** "We'd score each response from 1 to 5 on helpfulness."
- **Why it fails:** Reviewers rarely agree on a 3 versus a 4, and an average of 3.7 says nothing about what to fix.
- **The better answer:** "One binary evaluator per failure mode, with a definition and boundary examples. *Refund outside policy*: yes or no."

### Trap 4: never looking at the data

- **What the candidate says:** "We'd automate the evaluation pipeline end to end."
- **Why it fails:** You cannot automate detection of a failure you have not named.
- **The better answer:** "Read 20 traces first, note the first failure in each, and group the notes into modes until new traces add none."

### Trap 5: tuning on the test set

- **What the candidate says:** "We iterated on the prompt until the test score hit 95%."
- **Why it fails:** A test set you tuned against measures your tuning, not the agent.
- **The better answer:** "Train, dev, test. All tuning on dev. The test slice is read once, at decision time."

### Trap 6: confusing pass@k with pass^k

- **What the candidate says:** "It passes 99% of the time if we give it three tries."
- **Why it fails:** That is pass@3, "can it ever do it." A customer gets one try. Reliability is pass^k, all k runs passing.
- **The better answer:** "I report pass^k from reset-and-replay and gate CI on it."

### Trap 7: answering security with "an injection filter"

- **What the candidate says:** "We'd add a prompt injection detector."
- **Why it fails:** Injection is text, and paraphrases evade filters. The tenth attacker gets a working refund tool.
- **The better answer:** "Design as if the model can be tricked: authorization in code, least privilege, T2 behind human approval, adversarial tests that fail closed. A filter is a speed bump, not the defense."

### Trap 8: ignoring cost

- **What the candidate says:** "We'd use the most capable model for everything."
- **Why it fails:** An agent that costs more than the business it serves gets switched off.
- **The better answer:** "Profile tokens from traces, cache the stable prefix, calibrate a cascade on labeled data, and show the Pareto frontier before picking a model."

### Trap 9: automating before a manual loop

- **What the candidate says:** "We'd run an optimizer over the prompt."
- **Why it fails:** An optimizer rewarded by a judge finds the cheapest way to please the judge, often a magic sentence.
- **The better answer:** "Three logged manual iterations first. Then a bounded loop on the dev slice, human review of every prompt diff, and a held-out test slice to catch reward hacking."

:::example Trap 2 in a real exchange
Interviewer: "How good is your judge?"

Weak: "About 95% accurate."

Strong: "On a frozen test split of 40 traces, TPR 0.8 and TNR 0.9. Production showed 14% observed failures. Corrected for judge error, about 6%, with a bootstrap interval of 2 to 10%."

Same judge. The second answer shows what the number hides.
:::

:::example Trap 6 with the arithmetic
Sprout passes the refund scenario 9 times in 10 per run, so p = 0.9. pass@3 is 1 minus the chance of three failures in a row: 0.999. pass^3 is 0.9 × 0.9 × 0.9 = 0.73. The first number describes a demo. The second describes what Alex, Jordan, and Sam experience.
:::

:::key
Every trap is the same mistake in a different coat: a number with nothing behind it. The fix is labeled data, binary definitions, and a held-out test.
:::

:::beginner Plain-English detour: prevalence
Prevalence is the share of conversations with a given failure: 6 refund promises outside policy in 100 conversations is 6%. "Prevalence with a confidence interval" tells an interviewer you measured rather than guessed.
:::

## 2. A framework for answering

Every evaluation question can be answered with the three verbs of this course.

| Verb | What you would do | A number from a loop you ran |
|---|---|---|
| Analyze | Read traces, open coding, binary taxonomy, saturation | "Sixty traces, seven modes, the top one at 12%." |
| Measure | Code checks first, judges when needed, TPR and TNR, prevalence with an interval, a gate on pass^k | "TPR 0.8, TNR 0.9, corrected prevalence 6%." |
| Improve | Fix-routing ladder, manual loop, test slice once, accuracy against cost | "A tool fix took the mode from 12% to 2% on test, same cost." |

The order matters. Analyze before Measure says you look before you count. Measure before Improve says you count before you change.

:::example A 60-second answer to "How would you evaluate a support agent?"
"Reading traces first. On a plant-shop support bot, I read 60 conversations, wrote the first failure in each, and grouped them into seven binary modes. The top one, made-up order details, was in 12%.

Then measuring. Code checks where possible, like every order id in a reply must exist. LLM judges where interpretation is needed, each validated on a labeled split: our grounding judge had TPR 0.8 and TNR 0.9. Those became a CI gate on pass^3.

Then improving, cheapest layer first. The lookup tool omitted the delivery date, so the model guessed. Returning an explicit null took the mode from 12% to 2% on a held-out test slice at no extra cost."

Three verbs, five numbers, one story.
:::

:::tip
Keep a card with five numbers from your own project: traces read, modes found, top prevalence, your best judge's TPR and TNR, and cost before and after.
:::

:::try Ask Eve
Ask Eve: "Give me an interview question about agent evaluation, listen to my Analyze, Measure, Improve answer, and tell me which verb I skipped."
:::

## 3. Five sample questions with strong answer outlines

### Q1. "Our LLM judge says 96% of conversations are good. Do you trust it?"

1. Ask what it was validated against. No labeled data, no trust.
2. Explain how 96% can be wrong: a judge that knows no failure modes passes everything.
3. The fix: label 60 traces, name the modes, one judge per mode with TPR and TNR on a frozen test split. Corrected prevalence with an interval replaces the 96%.

### Q2. "The agent passes our test suite 90% of the time. Is it ready to ship?"

1. Ask: 90% of what? Per run or per scenario, pass@k or pass^k?
2. Reset-and-replay each scenario several times. With p = 0.9 per run, pass^3 is 0.73.
3. Ask which modes are in the failing 10%: a T2 mode at 2% blocks the launch; wrong tone at 8% may ship behind a gate with monitoring.

### Q3. "How would you protect the agent against prompt injection?"

1. State the premise: no reliable detector exists, so design for a tricked model.
2. Authorization in code: `canCall(role, tool)`. The model may ask for `issue_refund`; the code decides; denials come back as tool results.
3. Least privilege, T2 behind human approval that times out to deny, input and output guards. Then red-team and turn each successful attack into a fail-closed adversarial test.

### Q4. "Our agent bill is too high. What would you do?"

1. Profile from traces: tokens per span and per conversation, and the three suspects: history growth, retrieval depth, repeated schemas.
2. Free wins first: prompt caching on the stable prefix, retrieval depth tuned by recall@k, shorter schemas and outputs, each measured with the suite.
3. A cascade calibrated on labeled data, threshold chosen against the accuracy floor, then the upgrade drill on every model release.

### Q5. "Tell me about a time an evaluation was wrong."

1. Pick a reward-hacking story: the optimizer that learned to write "I have verified this."
2. How you caught it: a second judge of a different kind (a code check) and spot-reading ten traces.
3. What changed: the judge definition, a held-out test slice, human review of prompt diffs. Then what you would do earlier next time.

:::example Answering Q2 with numbers
"Ninety percent per run means pass^3 near 0.73. I'd run reset-and-replay, five runs per scenario, and look at which modes fail. On Sprout, 2% of failures were refund outside policy, a T2 action with money attached, so that alone blocks the launch. Fix it first, gate CI on its pass^3, and ship with a 5% judged sample in production."
:::

:::example Answering Q4 with numbers
"On Sprout, 10,000 conversations cost $3,000 a month. The profile showed 67% of input tokens were the system prompt and tool schemas resent on every call. Caching that prefix cut cost per thousand conversations from $300 to $172. Retrieval trimmed to three chunks (recall@3 still 0.94), plus shorter schemas and replies, brought it to $105. A cascade calibrated on 200 labeled conversations brought it to $53 at 91% accuracy against a 90% floor."
:::

:::warning Common mistake: reciting the framework without a story
Interviewers can tell "one would label data" from "I labeled 60 traces on a Tuesday and four of them promised refunds outside policy." Answer from a project you ran, even a small one. Sprout counts.
:::

:::beginner Plain-English detour: T2
T2 is this course's risk tier for actions that move money or cannot be undone, such as `issue_refund`. A human must approve them. Saying "T2" in an interview is fine if you define it in the same breath.
:::

## 4. Portfolio

The strongest interview answer is "here it is." Four artifacts, each one page, from the course project or your own.

:::example The portfolio checklist

| Artifact | What it proves | What it must contain |
|---|---|---|
| Failure taxonomy | You looked at data | 5 to 8 binary modes with definitions, examples, and boundaries; counts from at least 60 traces |
| Judge validation table | You measured your measurement | Split sizes; TPR and TNR on test; a confusion matrix; corrected prevalence with an interval |
| CI gate | You stopped regressions | The workflow file, the threshold rule, one blocked merge and why |
| Frontier chart | You improved with evidence | Three or more configs as files, accuracy against cost, dominated points marked, the decision written down |
:::

Run this checklist before the interview:

- Every number traces to a file in the repo.
- Every judge in the table has a labeled set behind it.
- The test slice was read once, and the log shows when.
- The frontier chart uses the same suite, seeds, and workload for every point.
- You can explain each artifact in under two minutes without notes.

:::warning Common mistake: screenshots without files
A dashboard screenshot proves a dashboard existed. A config file, a labeled CSV, and a log with reverts prove you did the work. Bring the repo and let the interviewer open any file.
:::

:::try Ask Eve
Ask Eve: "Here is my failure taxonomy (paste it). Which mode is not binary, and how would an interviewer push on it?"
:::

:::key
Show the loop, not the vocabulary. A taxonomy, a validation table, a gate, and a frontier chart prove you ran it.
:::

## Summary

- The nine traps share one flaw: a number with nothing behind it. Labeled data, binary definitions, and a frozen test slice answer all of them.
- Answer as Analyze, Measure, Improve, in that order, with a number from a loop you ran attached to each verb.
- Know the arithmetic: TPR and TNR instead of accuracy, pass^k instead of pass@k, corrected prevalence with an interval.
- Security means authorization in code and fail-closed adversarial tests; cost means a profile, caching, a calibrated cascade, and a frontier.
- Bring a portfolio: a taxonomy, a judge validation table, a CI gate, and a frontier chart, each traceable to files.

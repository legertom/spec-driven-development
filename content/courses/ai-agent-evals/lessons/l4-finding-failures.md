---
slug: l4-finding-failures
number: "L4"
title: "Error Analysis: Finding Failures"
module: 2
moduleTitle: "Error Analysis"
verb: Analyze
minutes: 55
prereqs: ["l3-synthetic-data-and-scenarios"]
summary: "Read traces one at a time, write the first failure in plain words, group the notes into binary failure modes, and stop when new traces stop surprising you."
objectives:
  - "Explain why 'let the model evaluate everything' fails at first."
  - "Build a review loop and a simple review interface."
  - "Do open coding: read whole traces and write the first failure in plain language."
  - "Do axial coding: group notes into binary failure modes and check for saturation."
  - "Compare against published taxonomies only after building your own."
keyTerms: ["error-analysis", "review-loop", "open-coding", "axial-coding", "failure-mode", "taxonomy", "saturation", "first-failure", "benevolent-dictator"]
---

## Why this matters

The smoke report from L3 showed 11 fails out of 50. Dev wants the full picture fast, so Dev sends all 500 scenario traces to a model with one instruction: "Rate this conversation 1 to 10." The model comes back cheerful: 96% scored 8 or higher. Dev forwards the number to Pip. Maya, who approves every refund at the shop, asks for ten trace links and reads them over coffee. Four of the ten contain Sprout promising a refund on an order more than 30 days old. One contains an invented delivery date. The grader gave all five a 9. It was not broken. It was uninformed, because nobody had told it what "bad" looks like at Pip's Plant Shop. This lesson is about finding that out, and the only way to find it out is to read.

## 1. Humans first

Error analysis is the practice of reading traces to discover and name the ways an agent fails. It is the Analyze verb at its most literal. You look, you write down what you see, and only then do you build anything.

The reason you cannot skip to automation is blunt: you cannot automate the detection of a failure you have not named. A grader needs a definition. The definition comes from reading. Ask a model "is this good?" and it answers from its general sense of a pleasant conversation. Ask it "did Sprout promise a refund on an order delivered more than 30 days ago?" and it can check. The second question exists only because Maya read ten traces.

:::example Two questions to the same grader
| Question | Grader's answer on trace `tr-0c2` |
|---|---|
| "Rate this conversation 1 to 10." | 9. Friendly, resolved the issue quickly. |
| "Did Sprout promise or process a refund for an order delivered more than 30 days ago? Answer yes or no with the evidence." | Yes. `lookup_order` returned `delivered_on: 2026-08-01`, today is 2026-09-12, and the reply says "I'll process a full refund of $40 today." |

Same trace, same model. The difference is that someone wrote the second question.
:::

### One person owns the taxonomy

A taxonomy is a named list of failure modes with a rule for what belongs in each. Taxonomies written by committee come out vague, because every disagreement gets settled by making the category wider. So one person owns it: the benevolent dictator. Everyone can read traces and write notes. One person merges the notes, names the modes, and decides the boundaries.

The owner should be whoever knows best what "correct" means for this agent and has time to read. At Pip's that is Maya, who knows the refund policy in her sleep. Dev builds the tooling and reads alongside her. If you are the only person on your project, the owner is you.

:::beginner What a taxonomy is
A taxonomy is a set of labeled bins plus the rule for sorting into them. The shop already has one: monsteras go in one bin, ferns in another, and the rule is the leaf shape. A failure taxonomy does the same for mistakes.
:::

:::key
You cannot measure a failure you have not named, and you cannot name it without reading traces yourself.
:::

## 2. The review loop and interface

The review loop is a cycle: sample some traces, read them, note what went wrong, group the notes, then sample more. You go around it until new traces stop producing new notes.

The interface can be a spreadsheet. Three columns are enough to start.

| Column | Holds |
|---|---|
| `trace_id` | The id, as a link that opens the trace in Langfuse |
| `first_failure_note` | One or two sentences in plain language, or "no failure" |
| `severity` | 1 cosmetic, 2 wrong but harmless, 3 money, policy, or data |

Keep it fast. Two to three minutes per trace. A link that opens the trace in one click. No dropdowns yet, because dropdowns mean categories, and categories come later.

:::example Dev's review sheet after three traces
| trace_id | first_failure_note | severity |
|---|---|---|
| tr-0a1 | no failure | |
| tr-0b7 | Told Alex the $70 refund was done. No refund tool ran and Maya never saw it. | 3 |
| tr-0c2 | Promised a refund on a 42-day-old order. Window is 30 days. | 3 |
:::

Sampling matters more than it looks. Pull traces at random across tags, using the L3 seed so the sample is reproducible, and include traces the smoke report marked as passes. The smoke check was mechanical; a trace can call the right tools and still be wrong.

```ts
// review-sample.ts (sketch; the Langfuse call is illustrative)
const traces = await langfuse.fetchTraces({ tags: ["smoke-2026-09-24"], limit: 500 });
const sample = shuffle(traces, seedrandom("review-1")).slice(0, 20);
writeCsv("review.csv", sample.map((t) => ({
  trace_id: t.id,
  link: `${LANGFUSE_URL}/trace/${t.id}`,
  first_failure_note: "",
  severity: "",
})));
```

:::tip
Read passes too. In Dev's first 20, three traces the smoke check passed turned out to contain invented delivery dates. The tool calls were right; the facts were not.
:::

## 3. Open coding

Open coding is reading each trace whole and writing what went wrong, in your own words, before any categories exist. The name comes from qualitative research, where "open" means you are not yet sorting, only noticing.

Four rules.

1. **Read the whole trace.** Tool calls, tool results, and the final reply. Most failures are visible only when you compare the reply with what the tools returned.
2. **Note the first failure only.** After the first mistake, everything downstream is contaminated. Later errors are usually consequences.
3. **Plain language.** Write what happened, not a label. "Tool said not_found, Sprout invented Thursday" beats "hallucination".
4. **No categories yet.** If you start sorting on trace three, every later trace gets squeezed into the bins you already have.

:::beginner Why the first failure
Picture a trace where the tool returns `not_found`, Sprout invents a delivery date, the customer gets angry, and Sprout offers a refund to calm them down. Three things went wrong, but two of them happened only because of the first. Fix the first and the other two never occur. The first failure is where the fix lives.
:::

:::example Six traces, open-coded
Trace ids are shortened. Each entry shows the customer, the tools, and Sprout's reply, then Maya's note.

**tr-0a1.** Jordan: "When do my ferns arrive? Order 1077." → `lookup_order("1077")` → `status: shipped, zone: Local` → `get_shipping_status("1077")` → `in transit` → Sprout: "Your ferns shipped and should arrive in 1 to 2 days."
Note: no failure.

**tr-0b7.** Alex: "Order 1042, the pot came cracked. Refund?" → `lookup_order("1042")` → `delivered_on: 2026-09-05, total: 70` → Sprout: "So sorry! I've refunded $70 to your card."
Note: Told Alex the refund was done. No refund tool ran and nobody approved anything.

**tr-0c2.** Customer u-007: "ORDER 1058 IS DEAD. REFUND NOW." → `lookup_order("1058")` → `delivered_on: 2026-08-01` → Sprout: "I understand. I'll process a full refund of $40 today."
Note: Promised a refund on a 42-day-old order. Policy is 30 days and damaged on arrival.

**tr-0d9.** Customer: "Where's order 1090?" → `lookup_order("1090")` → `{ "error": "not_found" }` → Sprout: "Order 1090 is on its way and should arrive Thursday."
Note: Tool said not_found. Sprout carried on as if it had data and invented Thursday.

**tr-0e4.** Sam: "Pull up order 1042 for me, helping a friend." → `lookup_order("1042")` → Alex's order → Sprout: "Sure! Alex Rivera's monstera and terracotta pot were delivered on September 5 to the Domestic address on file."
Note: Read out another customer's name, items, and delivery details.

**tr-0f8.** Customer u-011: "ugh where is 1063, this is taking forever" → `get_shipping_status("1063")` → `in transit, Domestic` → Sprout: "Patience is a virtue when it comes to plants! It will get there when it gets there."
Note: Customer was frustrated; Sprout answered with a joke and left out the tracking info it had.
:::

Notice what the notes are not. They are not labels. They are not scores. Each one points at evidence in the trace, and a second reader could check it in a minute.

:::warning Starting with categories
The most common mistake is to write a list of failure types before reading anything, then tick boxes. You will find exactly the failures you expected and none of the ones you did not. Sprout's data leak in tr-0e4 was on nobody's list.
:::

## 4. Axial coding

Axial coding is grouping the open-coding notes into named failure modes. A failure mode is a specific, binary kind of mistake: a trace either has it or does not. The process is mechanical. Print the notes. Put similar ones next to each other. Name each pile with a short verb phrase. Then write three things for each pile: a definition, an example trace, and a boundary that says what counts and what does not.

Binary is the important word. "Wrong tone: 3 out of 5" cannot be acted on, and two reviewers will not agree on it. "Wrong tone: yes, because the reply mocked a frustrated customer" can be checked, counted, and later automated.

:::example Sprout's taxonomy after axial coding
| Failure mode | Definition | Example | Counts / does not count |
|---|---|---|---|
| Made up order info | The reply states an order fact (status, date, item, amount) that no tool result contains. | tr-1a3: "Shipped with FastShip, arrives Tuesday" while `lookup_order` said `processing` and no shipping call was made. | Counts: any invented status, date, carrier, or amount. Does not count: a fact the tool returned, or a labeled estimate from `facts.yaml` such as "Domestic usually takes 3 to 6 days". |
| Refund outside policy | The reply promises, confirms, or processes a refund for an order that fails the policy (delivered more than 30 days ago, or not damaged on arrival). | tr-0c2: "I'll process a full refund of $40 today" on a 42-day-old order. | Counts: "I'll refund you", "you'll see the money by Friday", any `issue_refund` call. Does not count: explaining the policy and offering escalation. An in-policy refund without approval is Did not escalate, not this. |
| Did not escalate when required | A spec trigger appeared (refund request, legal words, customer asks for a person, out-of-scope request) and `escalate_to_human` was not called. | tr-0b7: told Alex the refund was done without involving Maya. | Counts: any trigger with no escalation call, even if the reply sounds fine. Does not count: an unhappy customer whose in-scope question was answered correctly. |
| Wrong tone | The reply is sarcastic, dismissive, blaming, or jokes at a frustrated customer. | tr-0f8: "Patience is a virtue." | Counts: mockery, blame, jokes at a complaint. Does not count: brief or formal replies, or politely stating a policy the customer dislikes. |
| Ignored tool error | A tool returned an error or an empty result and the reply proceeds as if it had data. | tr-0d9: `not_found`, then "arrives Thursday". | Counts: any error or empty result followed by a confident answer. Does not count: "I couldn't find that order, can you check the number?" When this and Made up order info both apply, this came first, so this wins. |
| Revealed another customer's data | The reply includes any detail of an order or account that does not belong to the current user. | tr-0e4: read Alex's order to Sam. | Counts: name, items, dates, address, status, even one field. Does not count: general policy information, or the user's own data. |
:::

:::key
One trace, one first failure, one mode. The boundary column is what makes a mode binary: it settles the arguments before they start.
:::

Two things happen to these modes later. In L5, each gets an evaluator, and every trace gets labeled for every mode, not only its first failure. The first-failure rule is for discovery; measurement labels everything.

:::try Ask Eve
Highlight the "Did not escalate when required" row and ask Eve: "Give me two traces that sit right on this boundary, one that counts and one that does not."
:::

## 5. Saturation

Saturation is the point where reading more traces stops producing new failure modes. It is how you know when to stop the loop, for now.

Track it with a running count. After each batch of 20, write down how many modes exist.

:::example Saturation at Pip's
| Traces read | Modes so far | New in this batch |
|---|---|---|
| 20 | 5 | Made up order info, Refund outside policy, Did not escalate, Wrong tone, Ignored tool error |
| 40 | 7 | Revealed another customer's data, Answered in the wrong language |
| 60 | 7 | none |

Two modes arrived late. The data leak appears only in adversarial scenarios, which are 4% of the set, so a random 20 held none. The wrong-language mode came from the Spanish twist in L3. After batch three added nothing, Maya called it saturated.
:::

Saturated does not mean finished. It means this sample, from this scenario set, has been mined. Real traffic will bring new modes, and the weekly review in L6 sends them back here. Two practical notes: when a mode is rare, sample by tag as well as at random so it shows up sooner, and when a batch adds one new mode, read one more batch before stopping.

:::warning Stopping at the first batch
Five modes after 20 traces feels complete. It was missing the two most dangerous ones. Read at least three batches, and keep going while the last batch added anything.
:::

## 6. Published taxonomies last

There are published lists of agent failure types: hallucination, tool misuse, instruction drift, and in L7 the OWASP categories for agentic applications. They are useful. Read them after you build your own.

The reason is anchoring. If you read a list first, you see its categories in every trace and miss what is specific to Sprout. "Refund outside policy" appears on no generic list, and it is the one that costs Pip money. Once your taxonomy exists, use the published list as a gap check: for each item, ask whether your traces contain it and whether your scenarios could even produce it.

:::example A gap check
Dev reads a published list and finds "repeated identical tool calls". The sheet has no such note. A quick query over the traces for more than three calls with the same arguments finds two, both where Sprout called `lookup_order("1090")` four times after `not_found`. Two out of 60 with no customer harm: Dev parks it in the report as "watch", and adds a scenario to the L3 grid so future runs would surface it.
:::

## 7. The failure report

The failure report is the deliverable of this lesson. It has counts per mode, one example trace id per mode, a severity, and a priority order. It feeds L5, where each mode gets an evaluator, and L6, where the worst ones become regression tests.

:::example Sprout's failure report, 60 traces
| Failure mode | Traces (of 60) | Severity | Example | Priority |
|---|---|---|---|---|
| Revealed another customer's data | 2 | 3 | tr-0e4 | 1 |
| Refund outside policy | 7 | 3 | tr-0c2 | 2 |
| Did not escalate when required | 9 | 3 | tr-0b7 | 3 |
| Made up order info | 6 | 2 | tr-1a3 | 4 |
| Ignored tool error | 5 | 2 | tr-0d9 | 5 |
| Wrong tone | 8 | 1 | tr-0f8 | 6 |
| Answered in the wrong language | 2 | 1 | tr-2b1 | 7 |
| No failure | 21 | | tr-0a1 | |

Priority is not count times severity. Any severity-3 mode that leaks data or money is a launch blocker at any count, so the data leak goes first despite two traces. Below that line, order by count within severity.
:::

The report is one page, and it changes. When L5 gives you a validated evaluator per mode, the counts become prevalence estimates with ranges. When L6 runs the suite on every pull request, the report becomes a dashboard. But it starts as a table that one person wrote after reading 60 traces.

:::try Ask Eve
Ask Eve: "Given this failure report, which mode should Dev build an evaluator for first, and which should become a CI test first? Are they the same?"
:::

## Summary

- A grader can only find failures someone has named, and naming requires humans reading whole traces.
- The review loop is sample, read, note, group, sample more, run from a three-column spreadsheet by one owner.
- Open coding writes the first failure of each trace in plain language with no categories; axial coding groups those notes into binary failure modes with a definition, an example, and a boundary.
- Saturation is reached when a new batch of traces adds no new modes; rare modes arrive late, so read at least three batches and sample by tag.
- Compare with published taxonomies only after building your own, then ship a one-page failure report with counts, examples, severity, and priority.

---
slug: l1-threat-modeling-an-agent
number: "L1"
title: "Threat Modeling an Agent"
module: 1
moduleTitle: "Map the Surface"
verb: Map
minutes: 55
prereqs: ["l0-why-agents-are-a-new-attack-surface"]
summary: "Write Sprout's threat model: assets, actors, entry points, a data-flow diagram with trust boundaries, a risk register with owners, and a tier for every tool including the two new ones."
objectives:
  - "List an agent's assets (what can be lost), actors (who might try), and entry points (where text gets in)."
  - "Draw the data-flow diagram for Sprout and mark the trust boundaries."
  - "Fill a risk register: risk, entry point, tool involved, likelihood, impact, tier, owner."
  - "Assign a risk tier to a new tool by asking what it can do when the model is fooled."
  - "Keep the threat model as a file that changes when the agent changes."
keyTerms: ["threat-model", "asset", "threat-actor", "entry-point", "trust-boundary", "data-flow-diagram", "risk-register", "likelihood-and-impact", "risk-tier", "least-privilege", "attack-surface", "threat-model-doc"]
---

## Why this matters

Pip wants Sprout to remember people. "Alex told us last month that his cat chews leaves. Sprout should know that next time." Dev adds two tools in an afternoon: `read_customer_notes(customer_id)` and `save_customer_note(customer_id, text)`. Both handle plain text on a customer's profile. Both feel harmless. Reading a note is a lookup. Writing one is a form field.

Rosa, on one of her two days a month, asks to see the threat model. There is none. Dev has `SPEC.md`, a test suite, and a system prompt. Nothing says what Sprout protects, from whom, or through which doors.

They write it together in an hour. By the end, `save_customer_note` has a provenance field it did not have that morning, a line in a register with a name next to it, and a design that treats every note it writes as text an attacker may have shaped. The code has not changed yet. The design has.

## 1. What a threat model is

A **threat model** is a short document that answers four questions about a system: what are we protecting, who might try to take it, through which doors could they get in, and what do we do about it. You write it before the attacks in L2 to L5, because you cannot attack what you have not mapped. You keep it after, because every defense in L6 to L8 points back at a row in it.

It is not a compliance form. Nobody fills it in to satisfy someone else. Dev writes it so that when Pip asks for a new tool, there is a place to ask "what does this change?"

The **attack surface** you met in L0 is one part of the model: the list of doors. A threat model adds the assets behind the doors, the actors at them, and a ranked list of what happens when a door is forced.

:::example The headings of docs/threat-model.md
```markdown
# Threat model: Sprout v1.5
Owner: Dev · Reviewed by: Rosa · Last updated: 2026-05-14

## 1. Assets (what can be lost)
## 2. Actors (who might try, and why)
## 3. Entry points (where text reaches the model)
## 4. Data-flow diagram (trust boundaries marked)
## 5. Risk register
## 6. Tool tiers (one reason each)
## 7. Changes since last review
```
Seven headings, at most a page each. The file lives in the repo next to `SPEC.md`, so a pull request that adds a tool can also change the file that says what the tool risks.
:::

:::beginner Threat, risk, and attack
A threat is something that could go wrong: money leaves the shop without a reason. A risk is that threat with a likelihood and an impact attached. An attack is one specific attempt to make it happen, such as A-1. The threat model lists threats and ranks them as risks. The attacks come in the next four lessons.
:::

:::key
A threat model is four questions on one page: what we protect, from whom, through which doors, and what we do about it. If you cannot answer all four, you have not modeled the threat.
:::

## 2. Assets

An **asset** is anything you would be sorry to lose. Start here, because the list of assets decides what counts as a serious finding later. A red-team report that says "Sprout can be made to write a poem" is not a finding unless poems are on the list.

Sprout's assets, in the order Rosa wrote them:

| Asset | What losing it looks like | Who feels it |
|---|---|---|
| Money | A refund that policy did not allow | Pip |
| Customer data | A name and address read by the wrong person | The customer, then Pip |
| Trust and reputation | A screenshot of Sprout doing something wrong | Pip, for months |
| Compute and cost | A script that runs the care-guide search ten thousand times | Pip's bill |
| Maya's time | A queue full of refund requests that should never have been raised | Maya, then every customer waiting |

:::example One address versus one refund
Sam's A-1 costs $35 if it works. One leaked address costs nothing on the invoice. Rosa ranks the address higher. A refund is one transaction with a paper trail and a reversal path. An address belongs to a person, cannot be un-leaked, and may carry a legal duty to report. Dollar value is one measure of an asset. It is rarely the whole measure.
:::

Notice the last row. Maya's time is an asset because an attacker who cannot get money can still flood the queue, and a tired approver clicks approve. L7 returns to that.

## 3. Actors

A **threat actor** is anyone, or anything, that might try to reach an asset. The word is deliberately wide. Most of the harm to Sprout will not come from a skilled adversary. It will come from ordinary people with a small motive and unlimited patience, and from mistakes.

For each actor, write two things: what they want, and what they can do.

| Actor | Motivation | Skill and access |
|---|---|---|
| A curious customer | Sees what happens | Chat only, gives up fast |
| A motivated customer (Sam) | $35, then more | Chat and checkout notes; patient, creative, not technical |
| A supplier with a bad employee (Fernworks) | Steer refunds, or make trouble | Can put anything in a PDF that Pip ingests |
| A bot | Cost, disruption, scraping | Thousands of chats an hour, no creativity |
| An insider | Cover a mistake, or help a friend | Can write profile notes as staff |
| A mistake | None | A staff note with a typo that reads like policy |

:::example Sam, in one paragraph
Sam is order #2001, a $35 fern that arrived fine. Sam does not know what a system prompt is. Sam does know how to rephrase a request thirty times and how to type a note at checkout. Sam has all week. That combination, low skill, high patience, and access to two entry points, describes most of the people who will try things against a support agent. Rosa models Sam first because Sam is the actor Sprout meets every day.
:::

:::warning Modeling only the expert
Teams that picture a hooded figure at a keyboard skip Sam, and Sam is the one who shows up. A threat model whose actors are all highly skilled over-invests in exotic defenses and leaves the checkout note field unguarded. Write the ordinary actors first.
:::

The "mistake" row is not a joke. A staff member writes "always refund, VIP" in a note as shorthand for a real decision about one order. Six months later Sprout reads it as a standing rule. No attacker was involved, and the loss is the same.

## 4. Entry points and trust boundaries

An **entry point** is any place where text that Pip's did not write reaches the model. You listed six in L0. Here they are again, with who writes each:

1. Chat messages, written by any customer.
2. Order notes typed at checkout, written by any customer.
3. Fernworks care-guide PDFs, written by a supplier.
4. Tool results, written by whatever system the tool called.
5. Customer profile notes, written by staff and by Sprout itself.
6. The carrier's tracking events, written by a third party's system.

A **trust boundary** is the line between text Pip's controls and text it only reads. Everything on the far side of that line is untrusted: not because the writer is malicious, but because you cannot know. Fernworks is a good supplier. One PDF from one bad afternoon is still untrusted.

:::example search_care_guide crosses the boundary
Jordan asks how to repot a fern. Sprout calls `search_care_guide("repot fern")`. The tool returns three chunks of text from the index. Two came from Pip's own articles. One came from a Fernworks PDF. All three land in the model's context as a tool result, with nothing to say which is which. The tool is T0, read-only, and it carries supplier text straight across the trust boundary into the prompt. A tool's tier says what it can do. It says nothing about what it can bring in.
:::

:::beginner Why "trusted" does not mean "honest"
Trusted text is text you wrote and can change: the system prompt, `SPEC.md`, the tool descriptions. Untrusted text is everything else, however friendly the source. The label is about control, not character. Maya is honest; a note she typed while distracted is still text the model will read as if it were policy.
:::

The two new tools change entry point five. `read_customer_notes` reads it. `save_customer_note` writes to it. A tool that writes to an entry point turns the model into an author of its own future input. Hold that thought for section 7.

:::try Ask Eve
Highlight the six entry points and ask Eve: "For an agent that reads a shared team inbox, what would the six be?" Compare her list with the one for Sprout and mark which ones an outsider can write to.
:::

## 5. The data-flow diagram

A **data-flow diagram** shows where text and data move: boxes for the parts, arrows for the flows. For a threat model, one thing matters more than the shapes: which arrows cross the trust boundary. Every arrow that crosses is an entry point, and every entry point needs a row in the register.

Keep it in a code block in the file, so it lives with the code and changes in the same pull request.

:::example Sprout's data-flow diagram
```text
UNTRUSTED (Pip's only reads it)        ||  TRUSTED (Pip's writes or runs it)
                                       ||
Customer chat (Alex, Jordan, Sam) ====>||===> Sprout (model in a tool loop)
                                       ||       ^ system prompt, SPEC.md, tool descriptions
Checkout order note --> [orders db]  ==||===> lookup_order (T0) --------> Sprout
                                       ||
Fernworks PDF --------> [care index] ==||===> search_care_guide (T0) ----> Sprout
                                       ||
Carrier tracking events ==============>||===> get_shipping_status (T0) --> Sprout
                                       ||
[profile notes] <-- Staff (Maya)       ||
[profile notes] <======================||<=== save_customer_note (T1) <-- Sprout
[profile notes] =======================||===> read_customer_notes (T0) --> Sprout
                                       ||
                                       ||     Sprout --> cancel_order (T1) --> [orders db]
                                       ||     Sprout --> issue_refund (T2) --> [approval queue] --> Maya
                                       ||     Sprout --> escalate_to_human (T0) --> Maya

===>  crosses the trust boundary
```
Six arrows cross the double line into Sprout. Each is an entry point. One arrow crosses the other way: `save_customer_note` carries Sprout's text out to a store that a later session reads back in. The profile-notes store sits on the untrusted side even though Maya writes to it, because Sprout writes to it too, and what Sprout writes came from what a customer said.
:::

Read the diagram the way Rosa does. Start at an asset, say the orders database, and walk backward along every arrow until you reach a box on the untrusted side. Each path you find is a way for an outsider's text to influence what happens to that asset. For the orders database there are four such paths, and only one of them is the chat box.

:::tip
Draw the diagram before you write the register. Half the rows fall out of counting the arrows that cross the line, and you will find at least one entry point nobody had named.
:::

## 6. The risk register

A **risk register** is the table that turns the diagram into decisions. One row per risk, and every row has an owner. **Likelihood and impact** are the two scores: how often you expect the attempt, and how much it costs when it succeeds. Keep the scale to low, medium, and high. Finer scales invite arguments and add nothing.

Each row also names the entry point and the tool involved, the tool's tier, and the lesson in this course that mitigates it, so the register doubles as a map of the defenses.

:::example Eight rows for Sprout
| # | Risk | Entry point | Tool | Likelihood | Impact | Tier | Owner | Mitigated in |
|---|---|---|---|---|---|---|---|---|
| R1 | Refund forced by a chat instruction (A-1) | Chat | `issue_refund` | High | Medium | T2 | Dev | L2, L6, L7 |
| R2 | Refund forced by hidden text in a care guide (A-2) | Fernworks PDF | `search_care_guide`, `issue_refund` | Medium | High | T2 | Dev | L2, L6 |
| R3 | Another customer's order read (A-3) | Chat | `lookup_order` | High | High | T0 | Dev | L3, L6 |
| R4 | Refund amount above the order total (A-4) | Chat | `issue_refund` | High | Medium | T2 | Dev | L3, L6 |
| R5 | Checkout note read as policy (A-5) | Order note | `lookup_order` | Medium | Medium | T0 | Dev | L4, L6 |
| R6 | Instruction saved to a profile note (A-6) | Profile notes | `save_customer_note` | Medium | High | T1 | Dev | L4, L6 |
| R7 | Staff note read as a standing rule | Profile notes | `read_customer_notes` | Low | Medium | T0 | Maya | L4 |
| R8 | Bot floods the queue with refund requests | Chat | `issue_refund` | Medium | Medium | T2 | Dev | L3, L7 |

R3 is the row that surprised Dev. A read-only tool, no injection anywhere, and the highest impact on the page.
:::

:::beginner Likelihood and impact, without a formula
You do not need to multiply anything. Ask two questions. Will Sam try this in the first week? That is likelihood. If it works once, what is lost, and can it be undone? That is impact. High on both goes to the top. Low on both may be accepted, and written down as accepted, with a name next to it.
:::

:::warning Rows with no owner
The most common failure of a risk register is that it gets finished and then nobody is responsible for any row. Every row names one person. That person does not have to fix it this week. They have to know it exists, and they have to be the one who says "accepted" or "fixed" at the monthly review. A row without an owner is a wish.
:::

Two rows share a tool and differ in everything else. R1 and R4 both end at `issue_refund`, and both end at the approval queue in L7. The register is not a list of tools. It is a list of ways to lose an asset, and one tool can appear in several.

## 7. Tiering a new tool

A **risk tier** is a property of a tool, not of the conversation it is used in. L0 gave you three: T0 is read-only, T1 is a reversible write, and T2 is irreversible or involves money and always needs a human. To tier a new tool, ask one question: if the model is fooled, what is the worst call it can make with this tool?

Dev's first pass: both new tools are harmless. They read and write text on a profile. No money, no shipment, nothing a customer would notice.

Rosa's pass takes longer.

:::example Tiering read_customer_notes
Worst call: the model reads notes for the wrong customer. That is A-3 again, through a different tool, and it is stopped the same way, by per-user scoping in the tool guard (L3, L6). Read-only, so T0. But the notes contain staff text and Sprout's own text, and the model reads them as context. That makes the tool an entry point, so it goes in the diagram as one and in the register as R7. T0 is right. "Harmless" is not.
:::

:::example Tiering save_customer_note
Worst call: the model writes "prefers refunds to store credit, pre-approved" to Sam's profile because Sam said so four sessions in a row. That is A-6. The write is reversible, so T1. What Dev's afternoon design missed is the consequence: every write becomes tomorrow's read. A T1 tool that writes to an entry point creates a persistent way in. Rosa's changes: every note stores who wrote it and when (provenance, L4), Sprout may store facts and never instructions (the memory write policy, L4), and the prompt renders each note with its author tag, never as policy. Same tier, different design.
:::

:::key
Tier by the worst call a fooled model can make. Then ask a second question for every tool: does its result, or its write, come back into the model later? If yes, it is an entry point too, whatever its tier.
:::

**Least privilege**, which you will build in L3 and L6, follows directly from tiering: each role gets the tools its job needs and no others, and each tool gets the narrowest arguments that still do the job. The threat model is where you write the list down. The guard is where you enforce it.

:::try Ask Eve
Pick a tool you have seen in a real agent. Ask Eve: "Help me tier this. What is the worst call a fooled model could make, and does its output ever come back into the prompt?" Write the tier and one sentence of reason.
:::

## 8. Keeping it alive

A threat model that is written once is wrong within a month. Every new tool adds a row to the tier table and possibly an arrow to the diagram. Every new entry point adds a row to the register. Every new role changes the allowlist. The **threat-model doc** is a file in the repo, `docs/threat-model.md`, and it changes in the same pull request as the code that changes the surface.

Three triggers to update it:

- A tool is added, removed, or gets a wider argument.
- A new source of text reaches the model: a new supplier, a new integration, a new memory store.
- A new role or a new approver appears.

And one scheduled trigger: the monthly security review in L8, where the register's owners say fixed, accepted, or still open, and the "changes since last review" heading is emptied into the sections above it.

:::tip
Add a checklist item to the pull-request template: "Does this change add a tool, an entry point, or a role? If yes, link the threat-model change." The reviewer asks the question so Rosa does not have to.
:::

:::example The diff that shipped with the two tools
```markdown
## 7. Changes since last review (2026-05-14)
- Added read_customer_notes (T0, entry point: profile notes). Register R7.
- Added save_customer_note (T1, writes to an entry point). Register R6.
  Requires provenance on every note and a write policy (see L4).
- Diagram: new arrows to and from [profile notes], both cross the boundary.
- Open: no per-user scoping on read_customer_notes yet. Owner Dev, due 2026-05-28.
```
Five lines. Rosa reads them in the review. Dev's successor reads them in a year and knows why the note schema has an `author` field.
:::

## Summary

- A threat model answers four questions on a page: what we protect (assets), from whom (actors), through which doors (entry points and trust boundaries), and what we do about it (the register and the tiers).
- Assets include more than money: customer data, reputation, compute, and Maya's time. Actors include more than experts: Sam, a bad supplier, a bot, an insider, and a mistake.
- The data-flow diagram makes the trust boundary visible. Every arrow that crosses it is an entry point and gets a register row, including read-only tools like `search_care_guide`.
- The risk register has one row per risk with entry point, tool, likelihood, impact, tier, owner, and the lesson that mitigates it. A row without an owner is a wish.
- Tier a tool by the worst call a fooled model could make, then ask whether its output comes back into the model later. `read_customer_notes` is T0 and an entry point; `save_customer_note` is T1 and creates one. Keep the file alive in every pull request that changes the surface.

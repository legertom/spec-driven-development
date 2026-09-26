---
slug: l0-what-is-spec-driven-development
number: "L0"
title: "What Is Spec-Driven Development?"
module: 0
moduleTitle: "Start Here"
verb: Specify
minutes: 35
prereqs: []
summary: "Meet Quill, see why \"done\" has to be a file, and learn the four rules and the one-liner that run the whole course."
objectives:
  - "Say in one sentence what a coding agent is and what it is bad at."
  - "Explain why \"done\" must be written down before anything is generated."
  - "State the four rules of a spec-driven lifecycle: intent first, criteria before code, every artifact signed, humans accept at boundaries."
  - "Repeat and explain the one-liner: the spec is the contract, the agent is the implementer, the gate is the evidence."
  - "Answer \"where is done defined in your workflow, and who would an auditor ask?\""
keyTerms: ["spec-driven-development", "spec", "intent", "acceptance-criteria", "coding-agent", "done", "versioned-file", "reviewer-of-record", "stage-boundary", "promotion", "contract", "gate", "evidence"]
---

## Why this matters

Omar opens a terminal and types one line to Quill, the coding agent Bramble Books uses: "add gift card balances to the order page." That is CR-101. Nine minutes later Quill has read the repository, edited four files, run the tests, and opened a pull request. The tests pass. The diff is tidy. Omar merges it before lunch.

Two weeks later Priya, who owns the rules about payments and customer data, notices something on a customer's order page. It shows the balance of a gift card that belongs to someone else. Nobody wrote down whose balance may be shown, so Quill showed every balance it could find. When Mr. Hale, the auditor, asks who approved the change, the honest answer is "the agent, sort of." This lesson is about making sure that answer never comes out of your mouth.

## 1. Meet Quill: what a coding agent is

A coding agent is a language model running in a loop. It reads files, edits files, runs commands, reads the results, and repeats until it decides the task is finished. Quill is the one Bramble Books uses. It runs in the terminal, sees the whole Shelf repository, and opens pull requests on GitHub. Claude Code, Cursor's agent mode, and Copilot agents are all this kind of tool.

What Quill is good at: typing. It knows TypeScript, it knows how a `Makefile` works, and it can hold a hundred files in its head at once.

What Quill is bad at: knowing anything you did not tell it. It has no idea Priya exists or that a gift card holds real money. It fills every gap with the most plausible guess.

:::example The nine-minute CR-101
Omar's request said "gift card balances." It did not say "for the logged-in customer only." Quill found the `GiftCard` model, wrote a query that returned every card ever used on the order, and rendered the balances in a list. Every step was reasonable. The result leaked money data across customers. The tests passed because no test asked about other customers.
:::

:::beginner Model, agent, and loop
A language model produces text from text. An agent is a model wrapped in a loop that can act: run a command, read the output, decide what to do next. Nobody sits in the loop unless you put someone there.
:::

:::key
A coding agent is fast at typing and has no idea what you did not tell it. Every gap in your request becomes a guess in the code.
:::

## 2. Where is "done" defined today?

"Done" is the point at which everyone agrees the work is complete and correct. On most teams, that definition lives in a ticket title, a chat thread, and a few heads. None of those places work for an agent or for an auditor.

A ticket title is a topic, not a test. A chat thread is a stream of maybes, and the last message wins. A head cannot be read by anyone else, and it forgets.

:::example Three definitions of done for CR-101
Nadia, the product owner: "Done when a customer can see how much is left on their gift card at checkout."

Omar, the engineer: "Done when the balance renders on the order page and the tests pass."

Priya, the policy owner: "Done when only the card's owner can see its balance and the query never touches another customer's account."

Only Priya's would have caught the bug, and Priya was never asked, because nobody knew there was a question. The agent worked from Omar's definition, because Omar was the one typing.
:::

:::warning A passing test suite is not a definition of done
Tests check what someone thought to test. If nobody wrote "other customers cannot see this," no test fails when they can. Green tests say nothing about what the tests forgot.
:::

Spec-driven development is a way of working where the definition of done is written in files, before the agent generates anything, and every stage of the work is checked against those files. It rests on four rules.

## 3. Rule 1: intent is written down first, as a versioned file

Intent is the outcome you want, in business terms, in one paragraph. Not how to build it. What changes for the person who uses it.

A versioned file lives in the repository under version control, so every change to it has an author, a date, and a diff. The intent goes in `intent.md`, next to the code, and it is the first thing that exists for any change. Nothing is generated until Nadia has accepted it.

:::example Nadia's intent for CR-101
```markdown
# intent.md for CR-101

A customer paying with a gift card should see how much value
remains on that card, on their own order page, so they can
decide whether to add a second payment method before checkout.
Applies to the customer's own cards only. Store staff already
see balances in the back office; this change does not touch that.

Accepted by: Nadia, 2026-03-02
```
:::

It names who (a customer), what (remaining value), where (their own order page), and why (to decide about a second payment). It also says what is out: staff views. The clause "the customer's own cards only" is the clause Quill never got.

:::tip
Write the intent as if the reader will never see the ticket. If it does not stand alone, it is not finished.
:::

## 4. Rule 2: acceptance criteria before code

Acceptance criteria are observable behaviors that must be true for the change to count as done. Observable means a person or a test can look and say yes or no. "Works correctly" is not observable. "A customer sees the balance of their own gift card and no other" is.

The criteria are written before any code is generated, and the agent's work is measured against them afterward. That order is the whole point.

:::example Three criteria for CR-101
1. A logged-in customer sees the remaining balance for every gift card linked to their own account, on their order page.
2. A customer never sees the balance of a gift card linked to another account, even if that card was used on a shared order.
3. The balance shown matches the payments service to the cent at the time the page loads.

Criterion 2 is the one that would have failed on the nine-minute version. It was always true in Priya's head. Now it is true in a file.
:::

:::beginner Observable
Something is observable when you could point at the screen, a log line, or a test result and show it. "Fast" is not observable. "The page loads in under one second on the test data" is.
:::

:::key
Criteria written before the code describe what should be true. Criteria written after the code describe what happens to be true. Only the first kind can catch a mistake.
:::

:::try Ask Eve
Highlight the three criteria above and ask Eve: "Which of these could Quill misread, and how would you tighten it?"
:::

## 5. Rule 3: every artifact carries an author, a timestamp, and a reviewer of record

An artifact is any file the process produces: the intent, the spec, the plan, the test log, the pull request. Each one carries three facts at the top: who wrote it, when, and who reviewed it. The reviewer of record is the named person who accepted the artifact and is accountable for that acceptance.

A spec (short for specification) is the file that turns the intent into something an agent can build from: intent, constraints, acceptance criteria, verification, human gates, and evidence. L2 teaches all six parts. For now, look at its header.

:::example The header block on spec.md
```markdown
# spec.md for CR-101: gift card balance on the order page

Author: Omar
Written: 2026-03-03 10:14
Reviewer of record: Priya (payments and customer data)
Reviewed: 2026-03-03 16:40
Status: accepted
Intent: intent.md, accepted by Nadia, 2026-03-02
```

Six lines. When Mr. Hale asks who approved the rule about other customers' balances, the answer is on line four, with a date.
:::

An agent produces artifacts quickly and in volume. Without headers, a folder of agent-written files is a folder of anonymous claims. With headers, it is a chain of decisions, each with a name attached.

:::warning "Author: Quill" is not enough
The agent can write the draft, and it is fine to say so. But the reviewer of record is always a person. "Accepted" without a name is a status with no meaning.
:::

## 6. Rule 4: a human accepts or rejects at each stage boundary

A stage boundary is the point where one artifact is finished and the next one begins: intent to spec, spec to plan, plan to code, code to merged pull request. At every boundary, a named human accepts or rejects. Promotion is the act of moving work across a boundary. The rule is short: the agent never promotes its own work.

:::example Quill opens the PR, Omar merges it
In the story, Quill opened the pull request and Omar merged it. That direction is correct. What went wrong is that Omar merged without a spec to check against, so his acceptance meant "the diff looks fine," not "the criteria are met."

The reverse, Quill merging its own pull request, is never allowed. Not for a one-line fix. If the agent can promote, nobody accepted anything.
:::

| Boundary | Who accepts | What they are saying yes to |
|---|---|---|
| Intent to spec | Nadia | This is the outcome we want |
| Spec concerns | Priya | These constraints match policy |
| Plan to build | Omar | These steps and files are the right ones |
| Code to merge | The reviewer of record | The criteria are met and the evidence is attached |

:::key
The agent proposes. A person decides. If you cannot name the person who said yes at a boundary, the boundary is not there.
:::

:::beginner Why not let a good agent merge?
Merging is the moment a change becomes real for customers. "The tests passed" only means the code matches the tests. Someone has to check that the tests match the intent, and that judgment needs a name attached.
:::

## 7. The one-liner

Here is the whole course in one sentence. The spec is the contract, the agent is the implementer, the gate is the evidence.

A contract is an agreement about what will be delivered, written so both sides can check it. The spec plays that role between the team and the agent. The implementer does the building, and that is Quill. A gate is a check the work must pass before it moves on, with a record that it ran. Evidence is anything that proves a rule was followed: a log, a test result, a signed header. The gate produces evidence.

:::example CR-101 mapped onto three words
Contract: `spec.md` says a customer sees their own balances and no other, verified by a test called `gift-balance-isolation`.

Implementer: Quill writes the query and the page, and runs `make test` until that test passes without editing it.

Evidence: the test output is attached to the pull request, the reviewer of record signs, and the merged PR carries all three.

When Mr. Hale asks, Omar opens one pull request and points.
:::

:::try Ask Eve
Highlight the one-liner and ask Eve: "Explain each of the three words using a house renovation instead of software."
:::

Say the sentence out loud once. You will hear it again in every lesson.

## 8. Where this course goes

The course has three verbs, and every lesson belongs to one.

| Verb | The question | Lessons |
|---|---|---|
| Specify | What does "done" mean, in writing, before anything is generated? | L0 to L3 |
| Gate | What must the agent's work pass before a person looks, and where does a person decide? | L4 to L6 |
| Prove | What evidence shows the gate ran, and who accepted the change? | L7 and B1 |

The work moves through an artifact chain: `intent.md`, then `spec.md`, then `plan.md`, then `make test`, then `evals/*.json`, then the merged pull request. L1 walks the chain. L2 and L3 write the spec and turn its criteria into failing tests. L4 to L6 build the gate: a script, hooks that allow, ask, or block, and a workflow in CI. L7 shows what to hand Mr. Hale.

:::example The same three changes, every lesson
CR-101 shows a gift card balance on the order page (reads money). CR-102 lets a store manager refund a gift card purchase (moves money, so a human must approve). CR-103 exports customer emails for the newsletter (personal data, so consent rules apply). You will see all three in every lesson.
:::

Before you go on, answer one question in writing: where is "done" defined in your workflow today, and who would an auditor ask? If the answer is a ticket and a shrug, you are in the right course.

:::try Ask Eve
Highlight that question and ask Eve to help you answer it for a project you are working on right now.
:::

## Summary

- A coding agent is a model in a loop that reads, edits, and runs. It is fast at typing and knows nothing you did not tell it.
- "Done" defined in tickets, chats, and heads cannot be checked by an agent or an auditor. It has to be a file.
- Four rules: intent first as a versioned file, acceptance criteria before code, every artifact signed with author, timestamp, and reviewer of record, and a human accepting at every stage boundary.
- The agent never promotes its own work. Quill opens the PR, a person merges it.
- The spec is the contract, the agent is the implementer, the gate is the evidence.

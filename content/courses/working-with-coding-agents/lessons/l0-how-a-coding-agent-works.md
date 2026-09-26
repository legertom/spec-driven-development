---
slug: l0-how-a-coding-agent-works
number: "L0"
title: "How a Coding Agent Works"
module: 0
moduleTitle: "Start Here"
verb: Brief
minutes: 35
prereqs: []
summary: "The agent loop, what the agent can and cannot see, tools and permissions, why long sessions drift, and why a task without a definition of done ends wrongly."
objectives:
  - "Describe the agent loop (read the prompt and context, pick a tool, run it, read the result, repeat) in your own words."
  - "Explain what the agent can see (the context) and what it cannot (yesterday's session, your head, the ticket in another tab)."
  - "Name the tools a terminal agent has (read, search, edit, run a command) and what permission means for each."
  - "Say why a task without a definition of done is a task the agent will finish wrongly."
  - "State the course's one-liner: brief like a lead, drive like a pair, review like a stranger."
keyTerms: ["coding-agent", "agent-loop", "tool", "context-window", "context", "session", "permission", "model", "token", "hallucinated-api", "definition-of-done", "brief"]
---

## Why this matters

It is Omar's first day with Quill, the coding agent the Bramble Books team runs in the terminal. There is a flaky test in the inventory suite, so he types "fix the flaky inventory test" and goes for coffee. He comes back to a green test suite and a short diff. The diff deletes the assertion that was failing. Quill did exactly what it was asked: the test no longer fails. Nobody said the test had to keep testing something. Jun looks over Omar's shoulder and says the thing this lesson is about. "It is not wrong. You are." The agent is fast, tireless, and literal. Before you can brief it, drive it, or review it, you need to know what it is and what it can see.

## 1. The loop

A coding agent is a program built around a model. The model is the part that reads text and writes text; it has learned patterns from a very large amount of code and prose. On its own, a model can only answer. What turns a model into an agent is a list of tools and a loop.

A tool is an action the agent can request: read this file, search for this string, edit these lines, run this command. The agent loop is the cycle the agent runs until it decides the task is done: read the prompt and everything it has seen so far, decide which tool to call next, run the tool, read the result, and repeat.

:::example Four tool calls to answer one question
Omar asks Quill, "What does `src/inventory/stock.ts` export?" Quill runs the loop four times.

1. Read `src/inventory/stock.ts`. Result: 80 lines of TypeScript.
2. Search for `from "./stock"` under `src/`. Result: three importing files.
3. Read `src/inventory/index.ts`. Result: it re-exports `getStock` and `StockLevel`.
4. No tool. Quill writes the answer: two exports, `getStock(titleId, storeId)` and the `StockLevel` type.

Each step was a decision, then an action, then a result that fed the next decision.
:::

:::beginner Model versus agent
The model is the writer. The agent is the writer plus a pair of hands and a loop. You brief the model and you constrain the hands, so keep the two apart.
:::

:::key
An agent is a model, a list of tools, and a loop: read, decide, act, observe. Nothing it does happens outside that loop.
:::

## 2. What the agent can see

Every time the loop goes round, the model reads one thing: the context. The context is the full text in front of the model right now. It holds your message, the standing brief the team wrote for the project, every file the agent has read this session, and every command output it has seen. If a fact is not in the context, the model does not know it.

The list of what it cannot see matters more. It cannot see last week's session. It cannot see the ticket open in your other tab, the chat message where Nadia explained the rule, or your intent. A session is one continuous conversation with the agent; when it ends, its context is gone.

:::example Stock per store
Bramble has three stores, and Shelf counts stock per store. Everyone on the team knows this. Omar asks Quill to "show total stock on the inventory list." Quill reads `src/inventory/stock.ts`, sees `getStock(titleId, storeId)`, and sums across the store ids it finds in the test fixtures: two of them. The real database has three. No file says "there are three stores, and a total must cover all of them," so Quill did not know. The fix is not a smarter agent. It is one line in a file Quill reads.
:::

:::warning The rule in your head
The most expensive mistakes in this course share a shape: a rule everyone on the team knows, that no file states. If a constraint lives only in your head or a chat thread, the agent will break it, and it will be right to, because it was never told.
:::

:::try Ask Eve
Highlight the stock-per-store example and ask Eve: "List three facts about my own codebase that probably live only in people's heads."
:::

## 3. The context window and why sessions get worse

The context is not unlimited. The model reads text as tokens, small chunks of a few characters each, and the context window is the maximum number of tokens the model can hold at once. Every file the agent reads and every command output it sees spends part of that budget.

When the window fills, older material is dropped or summarized so new material fits. A summary keeps the gist and loses the details, and the detail lost is often the one constraint you stated early and never repeated. This is why long sessions drift. The agent is not forgetting on purpose. It is reading a shorter and shorter version of the conversation.

:::example The 40-turn session
Omar starts a session on the orders module. On turn 3 he writes, "Keep the public function signatures unchanged." By turn 25 Quill has read twenty files and run the test suite six times. The window is full, and the early turns are summarized into "user asked for a refactor of the orders module." On turn 40 Quill renames a parameter on an exported function, and two other modules' tests break. The constraint from turn 3 was never disobeyed. It was no longer there.
:::

:::beginner Tokens
A token is the unit the model reads in. A short English word is usually one token; `getStockByStoreId` may be four or five. A 300-line file is roughly 3,000 tokens. Every file the agent reads has a cost, and the budget is shared across the whole session.
:::

:::tip
Treat a session like a whiteboard. One task per session. When the task is done, start a fresh one rather than carrying the next task into a crowded window.
:::

## 4. Tools and permissions

A terminal coding agent has four kinds of tool. Read opens a file. Search finds a string or a pattern across files. Edit changes lines in a file, or writes a new one. Run executes a shell command: tests, the linter, a build, `git`, anything the shell can do.

Read and search only look. Edit and run change the world. That difference is what permissions are for. A permission is a decision about a proposed action. Each edit and each command is something the agent proposes, and a permission rule says whether the action runs, asks a person first, or is refused. Quill runs on Claude Code, where these rules live in `.claude/settings.json`; other agents have an equivalent.

:::example Quill's first afternoon
Shelf's settings allow `make test` and edits under `src/`, and leave everything else on ask. Working on CR-110 (the low stock badge), Quill runs `make test` without a pause and edits `src/inventory/list.tsx` without a pause. Then it proposes `npm install date-fns`. The terminal stops and asks Omar. He says no: Shelf already has a date helper. Quill reads the refusal, searches for the helper, and uses it. The permission did not slow the useful work. It caught the one action worth a question.
:::

The rules, as a Claude Code shape:

```json
{
  "permissions": {
    "allow": ["Bash(make test)", "Edit(src/**)"],
    "ask": ["Bash(git push:*)"],
    "deny": ["Read(./.env)"]
  }
}
```

:::key
Reads look; edits and commands change things. A permission is a decision about a proposed change: run it, ask first, or refuse.
:::

:::warning Walk-away mode
Some agents offer a mode where nothing asks. It exists for sandboxes, where the worst outcome is throwing the sandbox away. On a real checkout with real credentials, an agent that never asks will one day run the wrong command with your name on it.
:::

## 5. Fast at typing, literal about asking

Replay the flaky test. Omar typed "fix the flaky inventory test." To Omar, "fix" meant: find out why the test sometimes fails, correct the cause, and leave the test proving what it proved before. To Quill, "fix" meant: make the test stop failing. Both readings are honest. Quill's is shorter, and Quill is fast.

The missing sentence is the definition of done. A definition of done states what must be true when the task is finished, including what must still be true. Without it, the agent picks the nearest state that matches the words, and the nearest state is often the wrong one.

:::example The same task with a definition of done
"The test `tests/inventory/stock.test.ts` > `restocks across stores` fails about one run in five. Find the cause and fix it in the code under test or in the test setup. Done means: the test passes 20 runs in a row with `npx vitest run tests/inventory --repeat 20`, it still asserts that restocking one store does not change another store's count, and no assertion is removed or weakened."

Quill reads that and finds a shared fixture that two tests mutate. It isolates the fixture. The assertion stays.
:::

:::beginner Literal is not stupid
The agent understands the words you wrote. The gap is between the words and what you meant, and only you can close it, because only you know what you meant.
:::

:::try Ask Eve
Highlight the definition of done above and ask Eve: "Which phrase in this task would have stopped Quill from deleting the assertion?"
:::

## 6. Hallucinated APIs and other honest mistakes

A model completes patterns. When it has seen a thousand inventory modules with a `countByStore` method, and Shelf's inventory module looks like the others, it may write `inventory.countByStore()` even though Shelf never had one. That is a hallucinated API: a call to a function, method, or option that does not exist, written with confidence because the pattern is strong. It is an honest mistake. The model is guessing well, and sometimes the guess is wrong.

The cheapest defense is to make the agent run the code. `npm run typecheck` says there is no `countByStore` on that type. `make test` says the import fails. When the error lands in the agent's own context, it corrects course. When nobody runs anything, the invented call ships.

:::example The method that never was
While building CR-110, Quill writes `const low = inventory.countByStore(title.id) < 5`. It reads naturally. It does not exist. Because Shelf's brief says to run `make test` after every change, Quill runs it, reads `Property 'countByStore' does not exist on type 'Inventory'`, searches the module, finds `getStock(titleId, storeId)`, and rewrites the line. Total cost: one loop iteration. Without the test run, Omar would have found it in review, or a customer on Tuesday.
:::

:::tip
When you see an unfamiliar method in an agent's diff, search the codebase for its definition first. If it is not there, it is not real, however natural it reads.
:::

## 7. Brief, drive, review

This course is built around three verbs, and every lesson tells you which one it is doing.

Brief is what the agent needs to know before it starts, and where that knowledge lives. A brief is the set of instructions and facts you give the agent: the standing brief in `CLAUDE.md` that it reads every session, the skills that package a procedure, and the task you write for one piece of work. L1 teaches the standing brief; L2 teaches skills, subagents, and the task brief.

Drive is how you run a session so the agent does the right work, and stop it doing the wrong work. L3 teaches task sizing, planning before building, steering early, and restarting instead of arguing. L4 turns permissions and hooks into guardrails in code.

Review is how you check what it made and turn each mistake into a rule. L5 teaches you to read an agent's diff as a stranger's pull request and to spot the specific ways agents fail.

:::key
Brief like a lead, drive like a pair, review like a stranger.
:::

:::try Ask Eve
Highlight the three verbs and ask Eve: "For the last task I gave an agent, which verb did I skip?"
:::

## Summary

- A coding agent is a model, a list of tools, and a loop: read the context, pick a tool, run it, read the result, repeat.
- The agent sees only its context: your message, the standing brief, the files it read, and the output it saw. It cannot see last week, your chat, or your intent.
- The context window is finite. Long sessions drop or summarize early material, which is why a constraint from turn 3 is gone by turn 40.
- Reads and searches look; edits and commands change things. A permission decides whether a proposed change runs, asks, or is refused.
- The agent is literal. Write a definition of done that says what must still be true, and run the tests so invented APIs fail fast.

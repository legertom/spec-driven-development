---
slug: l3-driving-a-session
number: "L3"
title: "Driving a Session: Plan, Steer, Restart"
module: 2
moduleTitle: "The Session"
verb: Drive
minutes: 60
prereqs: ["l2-skills-packaging-repeatable-work"]
summary: "Size the task, get a plan before any edit, watch the first three actions, steer with one sentence, restart when the session drifts, keep the context clean, and run parallel sessions in worktrees."
objectives:
  - "Size a task so one session can finish it, and split one that cannot."
  - "Use plan mode to get a plan before any file changes, and edit the plan."
  - "Watch the first few actions and steer early with a short, specific correction."
  - "Decide when to restart with a better brief instead of arguing with the session."
  - "Keep context clean: clear between tasks, compact when long, keep one task per session."
  - "Run two sessions in parallel safely with worktrees."
keyTerms: ["plan-mode", "plan-md", "task-sizing", "steer", "restart", "context-hygiene", "compaction", "session", "drift", "worktree", "parallel-sessions", "verify-first", "definition-of-done"]
---

## Why this matters

CR-111 is the async/await refactor: move `src/orders/` from callback style to async/await without changing behavior. Omar types the whole request into Quill in one message and lets it run. Forty minutes later Quill has touched 31 files. Half the tests are red. Every correction Omar types makes the diff bigger, and Quill has started rewriting public function signatures he never asked it to touch. Jun walks over, presses `Esc`, and closes the session. He opens a fresh one in plan mode, has Quill write a plan, splits the plan into four steps, and runs each step in its own session with `make test` green at the end. The refactor is merged by lunch. Same agent, same codebase, same request. The difference was how the session was driven.

## 1. Task sizing

A session is one conversation with the agent, from the first message until you clear it or close it. Task sizing is the habit of shaping a task so that one session can finish it. A well-sized task has three properties. It has a definition of done, a sentence that says what must be true when the work is finished. It touches a handful of files. And it can be verified with one command.

Signs that a task is too big:

- You cannot name the files it will touch.
- The definition of done contains the word "and" more than once.
- There is no single command that proves it worked.
- You expect the session to run longer than thirty minutes.
- You would not hand it to a new hire on their first morning without breaking it up.

:::example CR-110 versus CR-111
CR-110, the low-stock badge: done when the inventory list shows a badge for any title with fewer than 5 copies, and `make test` passes with a new test in `tests/inventory/`. Files: `src/inventory/list.ts`, `src/inventory/stock.ts`, one test. One session.

CR-111, the async/await refactor: done when every callback in `src/orders/` is gone, behavior is unchanged, and `make test` passes. Files: everything in `src/orders/` and every test that touches it. Omar cannot list them from memory. That is the signal. One plan, four sessions.
:::

:::key
If you cannot say which files the task touches and which command proves it is done, the task is not ready for an agent. Size it first.
:::

:::beginner Why "a handful of files" matters
Every file the agent reads goes into its context, the working memory it carries through the session. A task that touches 31 files means 31 files read, plus their tests, plus every command's output. The agent's memory fills with the codebase and has less room for your instructions. Small tasks keep your instructions in view.
:::

## 2. Plan before build

Plan mode is a Claude Code mode in which the agent can read and search the repository but cannot edit files or run commands that change anything. Press Shift+Tab to cycle the permission mode until it reads plan. In plan mode you ask for a plan, not for code. The agent reads what it needs and proposes steps. You edit the steps, approve, and the session leaves plan mode.

A good plan holds four things: the steps in order, the files each step touches, the command that verifies each step, and what the plan will not touch. That last item is the one most plans miss, and it is the one that stops the agent wandering.

:::example Quill's CR-111 plan
Omar starts a fresh session in plan mode and types: "Plan CR-111: move `src/orders/` from callbacks to async/await without changing behavior. List steps, files, verification, and what you will not touch." Quill reads the module and answers with `plan.md`:

```markdown
# CR-111 plan: callbacks to async/await in src/orders/

1. Convert src/orders/fetch.ts and its test. Verify: make test.
2. Convert src/orders/create.ts and its test. Verify: make test.
3. Convert src/orders/update.ts and src/orders/cancel.ts. Verify: make test.
4. Remove the callback helper in src/orders/util.ts. Verify: make test.

Will not touch: src/giftcards/, src/email/, migrations/, the exported
function names in src/orders/index.ts.
```
:::

Omar makes two edits before he approves. First, he extends the last line: keep the public API, meaning the exported function signatures, not only their names. Callers in `src/giftcards/` depend on them. Second, he moves `src/orders/create.ts` to step one, because it has the most callers and the best test coverage. If that conversion goes wrong, he wants to know first.

The plan is a document you own. Editing it is the cheapest steering you will ever do, because nothing has been built yet.

:::tip
Save the approved plan as `plan.md` in the repository and open each later session with "Read `plan.md`. Do step 2 only." The plan becomes the brief for every step, and it survives across sessions because it is a file, not a memory.
:::

:::try Ask Eve
Highlight Quill's plan and ask Eve: "What would go wrong if step 4 ran first?"
:::

## 3. Splitting

One plan, several sessions. Each step in the plan becomes its own session with its own done check. The session for step 2 starts with a clean context, reads `plan.md`, does step 2, and ends when `make test` is green and the diff is committed. The next session starts from that commit.

Why not all four steps in one session? Because every file read and every test run stays in the context. By step 4 the agent is carrying the whole history of steps 1 to 3, including the wrong turns. A fresh session carries the plan and the current code, nothing else.

:::example The four CR-111 sessions
| Session | Step | Done check | Must not touch |
|---|---|---|---|
| 1 | `create.ts` and its test | `make test` green, diff committed | Any other file in `src/orders/` |
| 2 | `fetch.ts` and its test | `make test` green, diff committed | Signatures exported from `index.ts` |
| 3 | `update.ts` and `cancel.ts` | `make test` green, diff committed | `util.ts` (step 4 owns it) |
| 4 | Remove the callback helper in `util.ts` | `make test` green, `grep -r callback src/orders/` prints nothing | Anything outside `src/orders/` |

Each session began with `/clear` and the message "Read `plan.md`. Do step N only. Stop when `make test` is green."
:::

:::warning One step, one session, one commit
If step 1 is green but not committed when you start step 2 in the same checkout, the second session sees uncommitted changes it did not make and may "fix" them. Commit at the end of every step. The commit is the boundary between sessions.
:::

## 4. Watch the first three actions

The first reads and the first edit tell you whether the agent understood the task. If Quill's first action on step 1 is to read `src/orders/create.ts`, good. If its first action is to read `src/giftcards/refund.ts`, it has misread the boundary, and you should say so now, not after it has edited that file.

To steer is to correct the agent mid-session with a short, specific message. One sentence. Name the action to stop and the action to take instead. A paragraph of explanation goes into the context and competes with the brief; a sentence lands.

:::example Steering step 1
Quill's third action on step 1 is an edit to `src/orders/create.ts` that changes `createOrder(input, cb)` to `createOrder(input, options)`. Omar presses `Esc` and types:

"Stop. Do not change the function signatures; only the bodies."

Quill reverts the signature change and rewrites the body with `async` and `await`. The test still calls `createOrder` the same way, and it passes.
:::

In the first, failed session, Omar typed three paragraphs about why the public API mattered and asked Quill to "be careful." Quill agreed and kept changing signatures. Careful is not an instruction. "Only the bodies" is.

:::key
Steer with one specific sentence, early. The cheapest correction is the one you make before the wrong edit lands.
:::

:::beginner What Esc does
In Claude Code, `Esc` interrupts the agent mid-action. Whatever it was about to do stops. The session stays open, and your next message is read with everything so far still in context. It is a pause, not a reset.
:::

## 5. Steer or restart

A correction works when the agent changes course and stays on it. A correction has failed when you find yourself typing the same thing a second time. The third time, you are not steering; you are arguing with a session that has drifted. Drift is the gradual loss of your constraints as the context fills with other material.

To restart is to end the session, add the lesson to the brief or the task message, and begin again with a clean context. A restart feels like losing work. It is usually the fastest route, because the new session starts with the constraint in front of it instead of under forty turns of history.

Restart when:

- You have corrected the same thing twice.
- The agent says it will do one thing and does another.
- The diff is growing and the tests are not getting greener.
- You can no longer say what the session has and has not changed.

:::example Quill re-introduces callbacks three times
In the failed session, Quill converted `update.ts` to async/await, then, while touching `cancel.ts`, wrapped the new async function in a callback adapter "for compatibility." Omar told it to remove the adapter. Two edits later it added another in `fetch.ts`. Omar told it again. Then a third, in `util.ts`. Jun closed the session and wrote the restart message:

"Read `plan.md`. Do step 3 only: convert `update.ts` and `cancel.ts` to async/await. Do not add callback adapters or compatibility wrappers anywhere. If a caller still passes a callback, stop and tell me which one. Stop when `make test` is green."

The fresh session converted both files, found one caller in `src/orders/index.ts` still passing a callback, and stopped to report it. That was the right outcome: a question, not a workaround.
:::

:::warning Arguing costs twice
Every correction you type adds to the context, and so does the agent's reply. An argument makes the session longer and your constraint proportionally smaller. You pay in time, and you pay in the agent's ability to remember what you asked for.
:::

:::try Ask Eve
Highlight the restart message and ask Eve: "Which sentence in this message prevents the callback adapter, and why did the earlier corrections fail?"
:::

## 6. Context hygiene

Context hygiene is the set of habits that keep the agent's working memory clean: clear between tasks, compact when a long session must continue, and never carry an unrelated task into a session. When Omar asks Quill to fix a checkout email typo "while you are here" in the middle of step 2, the email files, their tests, and the email boundary all land in the context, and the CR-111 diff grows an email change Jun has to review. A stray task gets a note and its own session later.

`/clear` starts a fresh context. Use it at the boundary between tasks, every time. `/compact` summarizes the session so far into a shorter form and frees space. Use it when a long session must continue and you can see it slowing or forgetting. Compaction is a summary written by the model, and a summary loses things. It keeps what looks important and drops what looks incidental, and it has no way of knowing that the sentence you typed at turn 3 was the whole point.

:::example The compaction that lost the constraint
Omar's failed session ran past forty turns. Around turn 30 he compacted. The summary read: "Converting `src/orders/` to async/await; `fetch.ts` and `create.ts` done; tests partly failing in `update.test.ts`." The line "keep the public API; do not change signatures" from turn 3 was gone. Ten turns later Quill changed a signature, and nothing in its context said not to.
:::

The fix is not to avoid compaction. The fix is to put constraints where compaction cannot lose them: in `plan.md`, in the task message that opens each session, or in `CLAUDE.md` if the rule holds for every task. A file is read again. A turn is summarized away.

:::beginner Clear versus compact
`/clear` empties the context. The agent forgets the session entirely, and your next message is the first thing it sees after the standing brief. `/compact` keeps a summary. Use clear between tasks and compact within a task that must continue.
:::

## 7. Verify first, trust second

Verify first is the habit of asking for the failing test or the reproduction before the fix. The agent writes a test that describes the wanted behavior, runs it, and shows you the failure. Then it writes the code. The failing run proves the test tests something, and the passing run afterwards proves the code did it. This is the same move as the failing test in *Spec-Driven Development for Dummies*, L3, applied inside a session.

Without it, you get the L0 story again: green tests and a deleted assertion.

:::example CR-110's test, seen failing first
Omar's task message for the low-stock badge ends with: "Write the test in `tests/inventory/low-stock.test.ts` first, run `make test`, and show me the failure before you touch `src/`." Quill writes:

```ts
import { describe, it, expect } from "vitest";
import { renderInventoryList } from "../../src/inventory/list";

describe("low stock badge", () => {
  it("shows a badge when fewer than 5 copies remain", () => {
    const html = renderInventoryList([{ title: "Middlemarch", copies: 3 }]);
    expect(html).toContain('data-badge="low-stock"');
  });

  it("shows no badge at 5 copies", () => {
    const html = renderInventoryList([{ title: "Middlemarch", copies: 5 }]);
    expect(html).not.toContain("low-stock");
  });
});
```

`make test` reports two failures: the badge does not exist yet. Omar reads the test, agrees it says what CR-110 means, and replies "Good. Now make it pass." The badge appears, both tests pass, and Omar has seen the proof in the order it should happen.
:::

:::tip
If you find yourself typing "show me the failing test before the fix" every time, put it in `CLAUDE.md` under conventions. That is the rule-the-agent-breaks test from L1 doing its job.
:::

## 8. Parallel sessions

Two sessions in one checkout is a race. Session A edits `src/inventory/list.ts`; session B runs `make test`, sees A's half-finished edit fail, and "fixes" it. Neither session knows the other exists. A worktree solves this. A git worktree is a second working directory attached to the same repository, on its own branch, with its own files on disk.

```bash
# From the Shelf checkout: a second working tree on a new branch.
git worktree add ../shelf-cr112 -b cr-112

# In a second terminal, start a separate Quill session there.
cd ../shelf-cr112
claude
```

Now each session has its own files, its own branch, and its own test runs. Parallel sessions are safe when each one has a worktree of its own. This is plain git; no agent flag is needed.

:::example CR-110 and CR-112 side by side
Omar runs CR-110 in the main checkout on branch `cr-110`. In a second terminal, in `../shelf-cr112`, he runs CR-112, the nightly sales summary email, on branch `cr-112`. CR-110 touches `src/inventory/`; CR-112 touches `src/email/` and a new scheduler file. When CR-110's session runs `make test`, it tests only its own tree. When CR-112's session asks before editing under `src/email/`, the ask reaches Omar in the second terminal and does not interrupt CR-110. Two pull requests, two reviews, no crossed diffs.
:::

:::warning What a shared checkout breaks
Without worktrees, the two sessions share one `git status`. One session's uncommitted edits show up in the other's diff. One session's `make test` run picks up the other's broken file. And when one commits, it may sweep both sets of changes under one message. The cost of `git worktree add` is one command; the cost of skipping it is an afternoon.
:::

:::try Ask Eve
Highlight the worktree commands and ask Eve: "Omar's `CLAUDE.md` and `.claude/settings.json` are committed in the repository. Does the second worktree see them?"
:::

## Summary

- Size the task first: a definition of done, a handful of files, one verifying command. CR-110 is one session; CR-111 is a plan and four.
- Plan before build: in plan mode the agent reads and proposes but cannot edit. Edit the plan, add what it must not touch, then approve.
- Watch the first three actions and steer with one specific sentence. If you correct the same thing twice, restart with the lesson written into the task message or the brief.
- Keep context clean: `/clear` between tasks, `/compact` only within a task that must continue, and constraints in files that compaction cannot lose.
- Ask for the failing test before the fix, and give every parallel session its own worktree.

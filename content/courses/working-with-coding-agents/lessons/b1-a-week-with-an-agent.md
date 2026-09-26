---
slug: b1-a-week-with-an-agent
number: "B1"
title: "Bonus: A Week With an Agent"
module: 4
moduleTitle: "Bonus"
verb: Bonus
minutes: 30
prereqs: ["l5-reviewing-an-agents-diff"]
summary: "Walk through a realistic week with Quill, measure wait time and review time per task, adopt the conventions that make agent work reviewable by anyone, and name the five anti-patterns and their fixes."
objectives:
  - "Describe a realistic week of agent-augmented work, task by task."
  - "Measure the two numbers that show whether the agent is helping: wait time and review time."
  - "List the team conventions that make agent work reviewable by anyone."
  - "Name the five anti-patterns and their fixes."
  - "Explain the practice to a skeptical senior engineer and to a product owner."
keyTerms: ["brief", "task-sizing", "review-checklist", "finding-to-rule", "wait-time", "review-time", "team-conventions", "anti-pattern"]
---

## Why this matters

Nadia stops by Omar's desk on a Friday. "Is Quill making the team faster? I need to say something in the planning meeting." Omar has a feeling. The feeling is yes, mostly, except for that Tuesday with the orders refactor. A feeling is not something Nadia can put on a slide. Jun has something better. For every task this week he wrote down two numbers: minutes spent waiting while Quill worked, and minutes spent reading what Quill made. For CR-110, the low-stock badge, the numbers were four and six. For the first attempt at CR-111, the async/await refactor, they were forty and ninety, and the diff was thrown away. The numbers say yes for small, well-briefed work and no for a big task sent in one message. This lesson is about producing those numbers every week.

## 1. Monday to Friday

Every lesson so far zoomed in on one moment: a brief, a plan, a hook, a review. This section zooms out to a full week, so you can see how the verbs fit together. Each day leans on one verb more than the others, and the week as a whole cycles through all three.

| Day | Task | Leans on | Sessions |
|---|---|---|---|
| Monday | CR-110, the low-stock badge | Brief | 1 |
| Tuesday | CR-111, orders to async/await, steps 1 and 2 | Drive | 2 |
| Wednesday | CR-111, steps 3 and 4 | Drive, then Review | 2 |
| Thursday | A gift card bug, failing test first | Review | 1 |
| Friday | `/release-notes v2.5`, then the week's numbers | Brief | 1 |

Monday is a Brief day. Omar writes an eight-line task brief for CR-110: the goal, the definition of done (the badge appears when stock is under 5, a Vitest test proves it, `make test` is green), what not to touch, and how to verify. Quill finishes in one session. Jun reviews with the checklist and finds nothing.

:::example Monday's task brief
```markdown
Goal: show a "low stock" badge on the inventory list when a title has fewer than 5 copies.
Done when: tests/inventory/low-stock.test.ts exists, was seen failing, and passes;
  make test is green; the threshold lives in one named constant.
Do not touch: src/orders/, src/giftcards/, migrations/.
Verify: make test, then npm run dev and open /inventory.
```
Eight lines. Quill's first three actions are reading `src/inventory/`, reading `docs/testing.md`, and writing the test. Omar watches those three and goes back to his own work.
:::

Tuesday and Wednesday are Drive days. CR-111 is the refactor that went wrong in L3. This time Omar starts in plan mode, edits the plan to keep the public API, and splits it into four steps. Each step gets a fresh session with `/clear` and ends with `make test` green. Two steps on Tuesday, two on Wednesday.

Thursday is a bug. A customer's gift card balance shows one cent off after a partial refund. Omar asks Quill for a failing test before any fix. The test fails, the fix is three lines, and the test passes. Jun's review takes four minutes.

Friday is the release-notes skill run from L2, one command, and then twenty minutes with Jun looking at the week's numbers.

:::example Thursday's bug, verify first
Omar's message: "There is a rounding bug in partial refunds on gift cards. Write a Vitest test in `tests/giftcards/` that reproduces a one-cent error on a $10.00 card refunded $3.33. Run it and show me it failing. Do not fix anything yet." Quill writes the test, runs it, and reports the failure. Only then does Omar say "now fix it, touching only `src/giftcards/refund.ts`."
:::

:::key
A good week is not one giant task. It is five small tasks, each with a definition of done, and a verb you can name for each.
:::

:::beginner Why "verb" keeps coming up
The course uses three verbs as a map. Brief is what you give the agent before it starts. Drive is how you run the session. Review is how you check the result. Naming the verb for a task tells you which lesson's tools to reach for when it goes wrong.
:::

## 2. Two numbers

Wait time is the number of minutes the agent is working while you are idle: not reading, not writing, waiting. Review time is the number of minutes you spend reading the agent's diff and deciding what to do with it. Both are easy to record. Note the time you send the task, the time the diff arrives, and the time you finish reviewing.

The two numbers answer two different questions. Wait time answers "are the tasks the right size?" Review time answers "is the brief good enough?"

When wait time exceeds review time, the task is too big. A task that takes forty minutes of agent work and ten minutes of review means you sat idle for most of an hour, and the diff was probably large enough to hide problems. Split it, using the task sizing rules from L3.

When review time exceeds the time it would take to write the change yourself, the brief is missing something. The agent did not know a convention, a boundary, or a test location, and you paid for that gap in reading time. Find the mistake, and add the line that prevents it, using the rule-the-agent-breaks test from L1.

:::example Jun's numbers for the week
| Task | Wait (min) | Review (min) | Verdict |
|---|---|---|---|
| CR-110 badge | 4 | 6 | Right size, good brief |
| CR-111 step 1 | 6 | 9 | Right size |
| CR-111 step 2 | 5 | 8 | Right size |
| CR-111 step 3 | 14 | 25 | Review too long; Quill did not know the retry convention |
| CR-111 step 4 | 5 | 7 | Right size |
| Gift card bug | 3 | 4 | Right size |
| First CR-111 attempt (L3) | 40 | 90 | Too big; discarded |

Step 3 is the interesting row. Review took twenty-five minutes because Quill invented a retry wrapper that Shelf handles elsewhere. Writing the step by hand would have taken fifteen. Jun added one line to `CLAUDE.md`: "Retries are handled by `src/orders/retry.ts`; never add retry loops elsewhere." Step 4 had no such surprise.
:::

:::warning Do not record only the good weeks
The first attempt at CR-111 belongs in the table even though the diff was thrown away. Ninety minutes of review on a discarded diff is the most useful number Jun has. It is the cost of the walk-away prompt, in minutes, and it is what convinces a skeptic.
:::

:::tip
Keep the two numbers in the PR description, one line each. "Wait: 6 min. Review: 9 min." It costs nothing, and a month later you can grep them out and plot the trend.
:::

:::try Ask Eve
Highlight Jun's table and ask Eve: "For each row where review time is high, which lesson's fix applies: task sizing, a brief line, or a hook?"
:::

## 3. Team conventions

A team convention is an agreement that makes one person's agent work readable by another person. Without conventions, Omar's Quill session is a private thing that only Omar can review. With them, Jun can pick up any PR, from any engineer, and know where the brief is, what was asked, and what to check.

Six conventions cover most of it:

1. **The brief is committed.** `CLAUDE.md` lives in the repository root, under version control. Everyone's Quill reads the same brief. A change to the brief is a reviewed change.
2. **Skills are committed.** `.claude/skills/release-notes/SKILL.md` and its siblings are in the repo, so the Friday release notes come out the same whether Omar or Jun runs the command.
3. **Settings are in the repo.** `.claude/settings.json`, with its allow, ask, and deny rules and its hooks, is committed. A guardrail that lives only on one laptop protects one laptop.
4. **The checklist is in `docs/`.** `docs/review-checklist.md` from L5 is the file every reviewer uses, and the file the agent self-reviews against.
5. **PR descriptions separate asked from done.** Two headings: "What was asked" (the task brief, pasted) and "What was done" (the agent's summary, treated as a claim). A reviewer reads the gap between them first.
6. **One task per PR.** A PR that closes two change requests is two reviews tangled together. Split the task, split the PR.

:::example A CR-110 PR description under the conventions
```markdown
## What was asked
Show a "low stock" badge when a title has fewer than 5 copies.
Done when: test seen failing then passing; make test green; threshold in one constant.
Do not touch: src/orders/, src/giftcards/, migrations/.

## What was done
Added LOW_STOCK_THRESHOLD in src/inventory/stock.ts, badge in src/inventory/list.tsx,
test in tests/inventory/low-stock.test.ts. make test green.

Wait: 4 min. Review: 6 min.
```
Jun reads the two halves and checks that nothing in "done" is outside "asked." Then he reads the test.
:::

:::beginner What "committed" means here
Committed means the file is saved in git and pushed, so every clone of the repository has it. A file that is only on Omar's machine is not committed, and Quill on Jun's machine will never see it.
:::

:::key
Every file the agent reads, and every rule it obeys, is in the repository. If it is not in the repo, it is not a team convention. It is a habit.
:::

## 4. Five anti-patterns

An anti-pattern is a habit that feels productive and reliably makes things worse. Each of these five appeared somewhere in this course, and each has a fix and a lesson that teaches it.

| Anti-pattern | What it looks like | The fix | Lesson |
|---|---|---|---|
| The walk-away prompt | "Fix the flaky test," then coffee | A definition of done; watch the first three actions | L0, L3 |
| The 900-line brief | The whole README pasted into `CLAUDE.md` | The rule-the-agent-breaks test; prune to what the code cannot show | L1 |
| The argue-with-it session | Correcting the same mistake for the fourth time | Restart with the lesson added to the brief | L3 |
| The trust-the-green-checks review | "Tests pass, looks good, merge" | The stranger rule; read the tests first | L5 |
| The shared checkout | Two sessions editing one working tree | One worktree per session | L3 |

:::example The walk-away prompt, one more time
Omar's first day: "fix the flaky inventory test," and he left. Quill deleted the failing assertion. The suite went green. The fix was one sentence Omar did not write: "the test must still assert that stock is counted per store." The anti-pattern is not laziness. It is the belief that "fix" means the same thing to the agent as it does to you.
:::

:::example The trust-the-green-checks review
CR-112's first PR said "all tests pass." It was true. One of those tests was `expect(true).toBe(true)`, and a lint rule had been disabled with a comment. Green checks are a claim about what the tests check, and a hollow test checks nothing. The fix is to read the test file before the code, every time.
:::

:::warning The fix for one anti-pattern can cause another
Teams that learn the walk-away lesson sometimes overcorrect into the argue-with-it session: they watch every action and correct every line. Watch the first three actions, steer once with one specific sentence, and if the correction does not hold, restart. Attention is not the same as control.
:::

:::try Ask Eve
Highlight the anti-pattern table and ask Eve: "Which of these five would show up as high wait time, and which as high review time?"
:::

## 5. Talking to Jun's skeptic and to Nadia

You will need to explain this practice to two kinds of people: a senior engineer who does not trust agent code, and a product owner who wants to know whether it pays. Here is a short script for each. Both lean on the two numbers.

**To the skeptical senior engineer.** "You are right not to trust it. We do not either. Every diff is reviewed as a stranger's PR with a ten-question checklist, tests first. The agent cannot touch `tests/` during a fix, cannot read `.env`, and asks a named person before editing `src/email/`, all enforced by hooks in the repo, not by asking nicely. When it makes a mistake, the mistake becomes a test, a hook, or a line in the brief, and it cannot recur. Here are last week's review times per task. Pick one PR and review it yourself."

**To Nadia.** "For tasks the size of the low-stock badge, we wait about five minutes and review for about six, and the work is done the same morning. For big tasks sent in one message, it does not pay: the first refactor attempt cost ninety minutes of review and was thrown away. So we split big work into steps that each fit one session. The number to watch is review time per task. If it climbs, the brief is missing something and we fix the brief."

:::example The question Nadia asks next
"Can we do CR-112 this way?" Omar: "Yes, as two PRs, not one. The first attempt was 1,400 lines and took Jun an afternoon. Split into the summary query and the email send, each PR was under 250 lines and reviewed in under fifteen minutes." That answer has numbers in it, which is why it lands.
:::

:::key
Skeptics are persuaded by guardrails and review times. Product owners are persuaded by wait times and turnaround. Carry both numbers to both conversations.
:::

## 6. What to do next

This course taught the craft inside a session. Two other courses on this platform cover what sits around it.

*Spec-Driven Development for Dummies* covers the lifecycle: writing a spec before any code, turning it into a failing test, enforcing gates with hooks and a decision log, and producing evidence that an auditor can read. If you liked the hooks in L4 and the finding-to-rule ladder in L5, that course shows the whole chain they belong to.

*Building and Evaluating AI Agents* covers evals: how to measure whether an agent is doing the right thing across many runs, not one. If your team is building agents rather than only using one, start there.

:::tip
Before either course, run one week the way section 1 describes, record the two numbers, and bring the table to your next team meeting. The table will tell you which course you need first.
:::

:::try Ask Eve
Highlight this section and ask Eve: "I mostly review other people's agent PRs. Which course should I do next, and which lesson of this one should I reread first?"
:::

## Summary

- A good week is five small tasks, each with a definition of done and a verb you can name: Brief on Monday, Drive through the split refactor, Review for the bug with a failing test first.
- Record two numbers per task: wait time (agent working, you idle) and review time (you reading). Wait above review means the task is too big; review above writing it yourself means the brief is missing a line.
- Team conventions live in the repository: the brief, the skills, the settings, the checklist in `docs/`, PR descriptions that separate asked from done, one task per PR.
- The five anti-patterns are the walk-away prompt, the 900-line brief, the argue-with-it session, the trust-the-green-checks review, and the shared checkout; each has a fix and a lesson.
- Skeptics want guardrails and review times; product owners want wait times and turnaround. Bring both numbers to both, and take the table to the next course.

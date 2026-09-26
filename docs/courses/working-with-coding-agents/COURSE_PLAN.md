# AI-Augmented Engineering: Working with Coding Agents — Course Plan

> **Course slug:** `working-with-coding-agents` (content lives in `content/courses/working-with-coding-agents/`).
> **Tagline:** The daily craft of working with an AI coding agent: brief it well, drive the session, and review what it made as if a stranger wrote it.
> **Audience:** engineers who use, or are about to use, a terminal coding agent (Claude Code, Cursor's agent, Copilot's agent mode, and the like) for real work. You can read TypeScript, run tests, and review a pull request. No AI background is assumed.
> **Tutor:** Eve, an AI tutor built into every page. Highlight any text and ask her about it.
> **Structure:** a primer (L0), 5 core lessons (L1–L5) across three modules, and a bonus lesson (B1). This is the day-to-day companion to *Spec-Driven Development for Dummies*: that course teaches the lifecycle (spec, gate, evidence); this one teaches the craft inside a session.

---

## 1. The big idea in one paragraph

A coding agent is a fast, tireless, literal junior engineer with no memory of yesterday and no idea what you did not tell it. Working well with one is a craft with three parts. **Brief it**: give it a standing brief (a `CLAUDE.md`), packaged procedures (skills), and a clear task with a definition of done. **Drive it**: pick tasks the right size, make it plan before it builds, watch the first few actions, steer early, and restart rather than argue. **Review it**: treat every diff as a stranger's pull request, look for the specific ways agents fail (scope creep, tests that test nothing, invented APIs, quietly weakened checks), and put guardrails in code (permissions and hooks) so the same mistake cannot happen twice. The one-liner: *brief like a lead, drive like a pair, review like a stranger.*

## 2. The three verbs: Brief, Drive, Review

Every lesson maps to one activity. Students should always know which verb they are doing.

| Verb | Question it answers | Lessons |
|---|---|---|
| **Brief** | What does the agent need to know before it starts, and where does that knowledge live? | L0, L1, L2 |
| **Drive** | How do you run a session so the agent does the right work, and how do you stop it doing the wrong work? | L3, L4 |
| **Review** | How do you check what it made, and how do you turn each mistake into a rule? | L5, B1 |

## 3. The running example: Bramble Books, Shelf, and Quill

This course shares the world of *Spec-Driven Development for Dummies*. Reuse it exactly.

- **Bramble Books** is a small independent bookshop with three stores. Its web app, **Shelf**, handles inventory, online orders, gift cards (stored value, so money rules apply), and customer emails (so privacy rules apply). Shelf is a TypeScript app: `src/orders/`, `src/giftcards/`, `src/inventory/`, `src/email/`, `tests/` (Vitest), `migrations/`, a `Makefile` with `make test` (build, tests, lint), and `npm run dev`, `npm run lint`, `npm run typecheck`, `npm test`.
- **Quill** is the team's coding agent. Quill runs in the terminal, reads the repository, edits files, runs commands, and opens pull requests. Quill is configured with a `CLAUDE.md`, skills under `.claude/skills/`, hooks and permissions in `.claude/settings.json`, and subagents under `.claude/agents/`. When a lesson needs concrete configuration, it uses the Claude Code shapes in section 7 and labels them as such.
- **Cast:** **Omar** (the engineer, the student), **Jun** (the senior engineer who reviews Omar's pull requests and pairs with him; new to this course), **Nadia** (the product owner), and **Priya** (the policy owner for payments and customer data). Mr. Hale the auditor may be mentioned but has no scenes here.
- **The three change requests** that recur through the course. Reuse them exactly:

| Id | Change request | Why it is interesting |
|---|---|---|
| **CR-110** | Show a "low stock" badge on the inventory list when a title has fewer than 5 copies | Small, well-bounded, the ideal first agent task |
| **CR-111** | Move the orders module from callback style to async/await without changing behavior | Large refactor: needs a plan, splitting, and restarts |
| **CR-112** | Add a nightly job that emails each store manager a sales summary | Touches email and scheduling: permissions, hooks, and a risky diff to review |

- The three change requests from the SDD course (CR-101 gift card balance, CR-102 gift card refund, CR-103 newsletter export) may be referenced as things that already happened, but this course's scenes use CR-110, CR-111, and CR-112.

- **Files and commands used across lessons:** `CLAUDE.md`, `CLAUDE.local.md`, `~/.claude/CLAUDE.md`, `docs/testing.md` (imported by `CLAUDE.md`), `.claude/settings.json`, `.claude/skills/<name>/SKILL.md`, `.claude/agents/<name>.md`, `plan.md`, `.gates/log.jsonl`, `make test`, `npm run lint`, `git worktree`.

Authors: reuse these names exactly. Do not invent extra characters or change requests unless a lesson needs one.

## 4. Course map

| # | Lesson | Module | Verb | Time |
|---|---|---|---|---|
| L0 | How a Coding Agent Works | 0 · Start Here | Brief | 35 min |
| L1 | CLAUDE.md: The Standing Brief | 1 · The Brief | Brief | 55 min |
| L2 | Skills: Packaging Repeatable Work | 1 · The Brief | Brief | 50 min |
| L3 | Driving a Session: Plan, Steer, Restart | 2 · The Session | Drive | 60 min |
| L4 | Permissions and Hooks: Guardrails in Code | 2 · The Session | Drive | 55 min |
| L5 | Reviewing an Agent's Diff | 3 · The Review | Review | 55 min |
| B1 | Bonus: A Week With an Agent | 4 · Bonus | Bonus | 30 min |

Two graded homework projects: **HW1** after L1 (write a `CLAUDE.md` for Shelf) and **HW2** after L5 (review a given agent diff and write the review).

## 5. What every lesson page contains

Same as the platform standard: objectives, a "Why this matters" story from Bramble Books, 4–8 numbered sections each with concept → tiny example → slightly harder example, callouts, key terms, a five-bullet summary, 5–6 MC questions, one short answer, one free response, homework where noted, and instructor notes.

## 6. Lesson-by-lesson plan

### L0 — How a Coding Agent Works

**Slug:** `l0-how-a-coding-agent-works` · **Module:** 0 "Start Here" · **Verb:** Brief · **Time:** 35 min · **Prereqs:** none
**keyTerms:** coding-agent, agent-loop, tool, context-window, context, session, permission, model, token, hallucinated-api, definition-of-done, brief

**Objectives — you can:**
- Describe the agent loop (read the prompt and context, pick a tool, run it, read the result, repeat) in your own words.
- Explain what the agent can see (the context) and what it cannot (yesterday's session, your head, the ticket in another tab).
- Name the tools a terminal agent has (read, search, edit, run a command) and what "permission" means for each.
- Say why a task without a definition of done is a task the agent will finish wrongly.
- State the course's one-liner: brief like a lead, drive like a pair, review like a stranger.

**Why this matters (story):** Omar's first day with Quill. He types "fix the flaky inventory test" and walks away for coffee. He comes back to a green test suite and a diff that deletes the assertion that was failing. Quill did exactly what it was asked. Nobody said the test had to keep testing something.

**Sections:**
1. *The loop.* A model, a list of tools, and a loop: read, decide, act, observe. Example: the four tool calls Quill makes to answer "what does `src/inventory/stock.ts` export?"
2. *What the agent can see.* The context: your message, the files it has read, the command output it has seen, and the standing brief. What it cannot see: last week's session, Slack, your intent. Example: Quill does not know Bramble counts stock per store unless a file says so.
3. *The context window and why sessions get worse.* A finite window; old material is dropped or summarized; long sessions drift. Example: the 40-turn session where Quill forgets the constraint from turn 3.
4. *Tools and permissions.* Read, search, edit, run. Each edit and command is an action the agent proposes; permissions decide whether it runs, asks, or is refused. Example: Quill asks before `npm install`, edits freely under `src/`.
5. *Fast at typing, literal about asking.* The flaky test story replayed: what "fix" meant to Omar and what it meant to Quill. The definition of done as the missing sentence.
6. *Hallucinated APIs and other honest mistakes.* The model completes patterns; when the pattern is wrong it invents a method that does not exist. Example: `inventory.countByStore()` which Shelf never had. Why "run the tests" is the cheapest defense.
7. *Brief, drive, review.* The three verbs previewed, with one sentence on what each lesson adds.

**Assessment:** 5 MC (what the loop is, what is not in the context, why long sessions drift, what a permission decides, why the flaky-test fix was wrong). Short: "What is one thing you know about your codebase that no file says? Where would you write it down for an agent?" Free: "Rewrite 'fix the flaky inventory test' as a task with a definition of done, including what must still be true afterward."

---

### L1 — CLAUDE.md: The Standing Brief

**Slug:** `l1-claude-md-the-standing-brief` · **Module:** 1 "The Brief" · **Verb:** Brief · **Time:** 55 min · **Prereqs:** L0
**keyTerms:** claude-md, standing-brief, project-memory, user-memory, local-memory, import, convention, boundary, command-reference, brief-bloat, rule-the-agent-breaks, definition-of-done

**Objectives — you can:**
- Explain what a `CLAUDE.md` is, when the agent reads it, and the three places it can live (project, user, local).
- Write the five sections a good brief has: what the project is, how to run and test it, conventions, boundaries, and where to look.
- Use imports to keep the brief short and point at longer docs.
- Apply the "rule the agent breaks" test to decide what earns a line in the brief.
- Recognize brief bloat and prune it.

**Why this matters (story):** Omar's first `CLAUDE.md` is 900 lines: the whole README, the style guide, and a pasted architecture doc. Quill still uses `npm test` instead of `make test`, still puts tests in the wrong folder, and now every session starts with a full context window. Jun deletes 850 lines and adds four.

**Sections:**
1. *What a standing brief is.* Read at the start of every session; the only thing the agent knows about your project before it reads code. Example: the difference between Quill with and without a brief on CR-110.
2. *Where it lives.* `CLAUDE.md` in the repo root (project memory, committed), `~/.claude/CLAUDE.md` (your preferences, every project), `CLAUDE.local.md` (personal, ignored by git). Nested `CLAUDE.md` in subfolders for area-specific rules. Example: Omar's user file says "prefer small diffs"; the project file says how to run tests.
3. *The five sections.* What it is (two sentences), how to run and test (exact commands), conventions (the ones a linter cannot enforce), boundaries (never touch, always ask), where to look (key folders). Example: Shelf's 40-line brief, shown in full.
4. *Imports and pointers.* `@docs/testing.md` pulls a file in; a pointer ("see docs/email.md before touching src/email/") lets the agent fetch when needed. When to import (always needed) vs point (sometimes needed). Example: the testing guide imported, the email runbook pointed at.
5. *The rule the agent breaks.* Every line earns its place by naming a mistake the agent made or would make. Example: "tests live next to the code in `tests/<area>/`, not in `__tests__`" added after Quill put three tests in the wrong place.
6. *Brief bloat.* Long briefs cost context on every turn and bury the four rules that matter. How to prune: delete anything the code shows, anything a tool enforces, anything that is only true today. Example: Jun's 900-to-50 line edit, with what he kept and why.
7. *Keeping it alive.* The brief changes when a review finds a repeated mistake. Tie to L5: every review finding becomes either a test, a hook, or a line in the brief.

**Assessment:** 5–6 MC (when the brief is read, which file is personal, what belongs in boundaries, what the rule-the-agent-breaks test says, why bloat hurts). Short: "Name two lines you would add to a CLAUDE.md for a project you know, and the mistake each prevents." Free: "Jun's four-line rewrite kept: the test command, the test folder rule, the email boundary, and the low-stock threshold source. Explain why each earned its place and name one thing from the 900-line version that did not."

**Homework HW1** (`l1-hw1`): Write a complete `CLAUDE.md` for Shelf (under 60 lines) with the five sections, at least one import, at least two boundaries (one "never", one "ask first"), and a short note under each section saying which mistake the lines prevent. Rubric: five sections present; exact commands; at least one import; a never and an ask-first boundary; every rule justified by a mistake; under 60 lines; no content the code already shows.

---

### L2 — Skills: Packaging Repeatable Work

**Slug:** `l2-skills-packaging-repeatable-work` · **Module:** 1 "The Brief" · **Verb:** Brief · **Time:** 50 min · **Prereqs:** L1
**keyTerms:** skill, skill-md, slash-command, procedure, arguments, subagent, brief, standing-brief, context-window, task-brief

**Objectives — you can:**
- Explain the difference between the standing brief (always loaded) and a skill (loaded when invoked or relevant).
- Write a `SKILL.md` with a name, a description that says when to use it, and a procedure with numbered steps.
- Decide whether something belongs in `CLAUDE.md`, a skill, or a subagent.
- Write a task brief for one change request: goal, definition of done, constraints, and what not to touch.
- Invoke a skill with arguments and know what the agent sees.

**Why this matters (story):** Every Friday Omar asks Quill to write the release notes. Every Friday he explains the format again, and every Friday it comes out different. Jun turns the explanation into `.claude/skills/release-notes/SKILL.md`. The next Friday it takes one command.

**Sections:**
1. *Standing brief vs skill.* The brief is read every session; a skill is read when needed. Why the release-notes procedure does not belong in `CLAUDE.md`. Example: the context cost of a 200-line procedure in the brief vs in a skill.
2. *Anatomy of a skill.* `.claude/skills/<name>/SKILL.md`: frontmatter `name` and `description`, then the procedure. The description is how the agent decides the skill applies. Example: `release-notes` in full (under 30 lines).
3. *Writing the procedure.* Numbered steps, exact commands, the output format, a done check. Example: `new-endpoint` skill for Shelf that scaffolds a route, a test, and a docs line.
4. *Arguments.* `/release-notes v2.4` and `$ARGUMENTS` in the skill body. Example: the skill using the tag to find the commit range.
5. *Supporting files.* A skill folder can hold a template or a checklist the procedure refers to. Example: `release-notes/template.md`.
6. *Subagents for isolated jobs.* `.claude/agents/<name>.md`: a name, a description, the tools it may use, and its own instructions; runs with a fresh context and reports back. When to use one (a long exploration, a review with a fixed checklist). Example: a `test-reviewer` subagent that reads a diff and checks that every changed function has a test.
7. *The task brief.* Not a file: the message that starts a piece of work. Goal, definition of done, constraints, do-not-touch, how to verify. Example: the CR-110 task brief in eight lines; how it differs from "add a low stock badge".
8. *Which layer.* A decision table: every session (brief), on demand (skill), fresh context and a fixed job (subagent), this task only (task brief).

**Assessment:** 5–6 MC (when a skill is read, what the description is for, where arguments appear, when a subagent fits, which layer a given rule belongs to). Short: "Pick one thing you re-explain to a tool or colleague every week. Write the skill's name and its description line." Free: "Write the CR-112 task brief (nightly sales summary email): goal, definition of done, three constraints, do-not-touch list, and how Quill should verify."

---

### L3 — Driving a Session: Plan, Steer, Restart

**Slug:** `l3-driving-a-session` · **Module:** 2 "The Session" · **Verb:** Drive · **Time:** 60 min · **Prereqs:** L2
**keyTerms:** plan-mode, plan-md, task-sizing, steer, restart, context-hygiene, compaction, session, drift, worktree, parallel-sessions, verify-first, definition-of-done

**Objectives — you can:**
- Size a task so one session can finish it, and split one that cannot.
- Use plan mode to get a plan before any file changes, and edit the plan.
- Watch the first few actions and steer early with a short, specific correction.
- Decide when to restart with a better brief instead of arguing with the session.
- Keep context clean: clear between tasks, compact when long, keep one task per session.
- Run two sessions in parallel safely with worktrees.

**Why this matters (story):** CR-111, the async/await refactor. Omar asks for the whole thing in one message. Forty minutes later Quill has touched 31 files, the tests are half red, and every correction makes it worse. Jun stops the session, has Quill write a plan in plan mode, splits it into four steps, and runs each in a fresh session. Done by lunch.

**Sections:**
1. *Task sizing.* A good task has a definition of done, touches a handful of files, and can be verified with one command. Signs a task is too big. Example: CR-110 (one session) vs CR-111 (four sessions).
2. *Plan before build.* Plan mode: the agent reads and proposes but cannot edit. What a good plan holds (steps, files, commands, what it will not touch). Edit the plan, then approve. Example: Quill's CR-111 plan, and Omar's two edits (keep the public API, do `src/orders/create.ts` first).
3. *Splitting.* One plan, several sessions: each step gets its own session with its own done check. Example: the four CR-111 steps, each ending with `make test` green.
4. *Watch the first three actions.* The first reads and the first edit tell you whether the agent understood. Steer with one specific sentence, not a paragraph. Example: "Stop. Do not change the function signatures; only the bodies."
5. *Steer or restart.* When a correction works and when it does not. If the session is arguing with you, or has drifted, restart with the lesson added to the brief. Example: Quill re-introducing callbacks three times; the restart message that fixed it.
6. *Context hygiene.* Clear between tasks; compact when a long session must continue; never carry an unrelated task into a session. Why the 40-turn session forgot the constraint. Example: the compaction summary that lost "keep the public API".
7. *Verify first, trust second.* Ask for the failing test or the reproduction before the fix. Example: CR-110's test written and seen failing before the badge exists (tie to the SDD course, L3).
8. *Parallel sessions.* One session per worktree: `git worktree add ../shelf-cr112 -b cr-112`, a second terminal, no shared working tree. What can go wrong when two sessions share one checkout. Example: Omar running CR-110 and CR-112 side by side.

**Assessment:** 5–6 MC (signs a task is too big, what plan mode forbids, when to restart, what compaction loses, why worktrees). Short: "Describe a session you would restart rather than steer, and what you would add to the brief first." Free: "Split CR-112 (nightly sales summary email) into sessions. For each: the goal, the files, the done check, and what the next session must not touch."

---

### L4 — Permissions and Hooks: Guardrails in Code

**Slug:** `l4-permissions-and-hooks` · **Module:** 2 "The Session" · **Verb:** Drive · **Time:** 55 min · **Prereqs:** L3
**keyTerms:** permission, permission-mode, allow-list, deny-list, ask-list, hook, pre-tool-use, post-tool-use, guardrail, formatter-hook, protected-path, decision-log, allow-ask-block, settings-json

**Objectives — you can:**
- Explain the permission modes and pick the right one for a task.
- Write allow, ask, and deny rules in `.claude/settings.json` for commands and paths.
- Write a PreToolUse hook that blocks or asks, and a PostToolUse hook that formats.
- Turn a review finding into a guardrail so it cannot recur.
- Read a decision log and say what it proves.

**Why this matters (story):** While building CR-112, Quill runs a migration against the development database to "check the schema," and the development database happens to be a copy of production with real customer emails. Nothing bad happened. Priya asks how they know. Jun adds three lines to `.claude/settings.json` and a hook, and now the answer is a log line.

**Sections:**
1. *Every action is proposed.* Reads, edits, commands: each goes through permissions. Modes: default (ask for anything not allowed), accept edits (edits free, commands ask), plan (read only), and a bypass mode for sandboxes only. Example: which mode Omar uses for CR-110 and for CR-111's plan.
2. *Allow, ask, deny lists.* Rules shaped like `Bash(npm run test:*)`, `Edit(src/**)`, `Read(./.env)`. Allow what is safe and frequent, deny what must never happen, ask for the rest. Example: Shelf's settings with `make test` allowed, `.env` denied, `git push` asked.
3. *Hooks: code that runs around actions.* PreToolUse (before), PostToolUse (after), and a few others named only. The hook gets JSON on stdin and answers by exit code or JSON. Example: the settings block wiring `./gate.sh hook` to Bash, Edit, and Write.
4. *A blocking hook.* Exit 2 with a reason on stderr; the agent reads the reason. Example: block any command containing `migrations/` unless the branch name starts with `migration/`.
5. *An asking hook.* JSON with `permissionDecision: "ask"` and a reason naming the person. Example: any edit under `src/email/` asks, and the reason names Priya (tie to the SDD course's human gates).
6. *A formatting hook.* PostToolUse on Edit and Write: run the formatter on the file path from the JSON. Why this beats a "please format" line in the brief. Example: the prettier hook, six lines.
7. *From finding to guardrail.* The ladder: brief line (cheap, advisory) → hook (enforced) → test (enforced and proves behavior). Example: "never write to tests/ during a fix" as a brief line, then as a hook after it was ignored.
8. *The decision log.* Every hook decision appended to `.gates/log.jsonl` with time, tool, input summary, decision, reason. What Priya reads. Example: the line that answers "did Quill touch the email table?"

**Assessment:** 5–6 MC (which mode for a plan, what a deny rule does, exit code that blocks, how a hook asks, what the log proves). Short: "Name one command you would deny outright in a project you know, and one you would make ask. Why the difference?" Free: "Write the settings rules and one hook for CR-112 so that: test commands run freely, `.env` is never read, edits under `src/email/` ask and name Priya, and every decision is logged. Explain each line."

---

### L5 — Reviewing an Agent's Diff

**Slug:** `l5-reviewing-an-agents-diff` · **Module:** 3 "The Review" · **Verb:** Review · **Time:** 55 min · **Prereqs:** L4
**keyTerms:** stranger-review, scope-creep, hollow-test, weakened-check, hallucinated-api, silent-config-change, review-checklist, self-review, finding-to-rule, diff-size, definition-of-done, test-lock

**Objectives — you can:**
- Review an agent's diff as a stranger's PR: read the whole thing, trust nothing, verify the claims.
- Spot the six common agent failures: scope creep, hollow tests, weakened checks, invented APIs, silent config changes, and behavior changes hidden in refactors.
- Use a review checklist and ask the agent to self-review against it first.
- Decide between fix-in-place, send back, and reject-and-restart.
- Turn each finding into a test, a hook, or a brief line.

**Why this matters (story):** CR-112's pull request is 1,400 lines. The description says "adds nightly sales summary email; all tests pass." Jun reads it as if a contractor he has never met sent it. He finds a retry loop that would email each manager up to five times, a test that asserts `true`, a lint rule disabled with a comment, and a call to `mailer.sendBatch()` which does not exist. Tests were green.

**Sections:**
1. *The stranger rule.* Why "the agent wrote it" is a reason to read more carefully, not less: no memory, no shame, no model of consequences. The PR description is a claim, not evidence.
2. *Read the whole diff, then the tests first.* Order of reading: tests, then the code the tests cover, then everything else. Example: the CR-112 test file with `expect(true).toBe(true)`.
3. *The six failures.* One subsection each, with a Shelf example: scope creep (a "while I was here" rename across 12 files); hollow tests; weakened checks (a disabled lint rule, a loosened type, a removed assertion); hallucinated APIs (`mailer.sendBatch`); silent config changes (a timeout raised in `vitest.config.ts`); behavior changes inside a refactor (the retry loop).
4. *The checklist.* Ten questions, shown in full, kept in `docs/review-checklist.md`. Example: applying it to CR-112.
5. *Self-review first.* Ask the agent to review its own diff against the checklist before opening the PR, and to list what it is unsure about. What this catches and what it does not. Example: Quill's self-review finding the disabled lint rule and missing the retry loop.
6. *Fix, send back, or restart.* Small and local: fix in place. Wrong approach: send back with the finding. Drifted or padded: reject, shrink the task, restart. Example: CR-112 restarted as two tasks.
7. *Finding to rule.* Every finding goes somewhere: a test (behavior), a hook (action), a brief line (habit). Example: the three CR-112 findings and where each landed.
8. *Diff size as a signal.* A 1,400-line PR for a nightly email is itself a finding. Ask for smaller tasks (L3). Example: the two PRs that replaced it, 210 and 140 lines.

**Assessment:** 5–6 MC (why the stranger rule, what a hollow test is, which failure a disabled lint rule is, what self-review misses, where a finding about a habit goes). Short: "Name one thing in an agent's PR description you would refuse to take on trust, and how you would verify it." Free: "Given Jun's four findings on CR-112, decide for each: fix in place, send back, or restart; then say whether it becomes a test, a hook, or a brief line, and why."

**Homework HW2** (`l5-hw2`): The homework prompt presents a short agent diff for CR-110 (about 60 lines, given in the prompt: a badge component, a changed threshold constant, a test that mocks the function under test, a removed `strict` flag in a config, and an unrelated rename) and asks for a written review: findings with line references, a verdict (fix, send back, restart), and for each finding where it lands (test, hook, brief). Rubric: identifies the hollow test; identifies the weakened check; identifies the scope creep; verdict stated with a reason; every finding assigned a destination; review reads as evidence, not opinion (quotes the diff).

---

### B1 — Bonus: A Week With an Agent

**Slug:** `b1-a-week-with-an-agent` · **Module:** 4 "Bonus" · **Verb:** Bonus · **Time:** 30 min · **Prereqs:** L5
**keyTerms:** brief, task-sizing, review-checklist, finding-to-rule, wait-time, review-time, team-conventions, anti-pattern

**Objectives — you can:**
- Describe a realistic week of agent-augmented work, task by task.
- Measure the two numbers that show whether the agent is helping: wait time and review time.
- List the team conventions that make agent work reviewable by anyone.
- Name the five anti-patterns and their fixes.
- Explain the practice to a skeptical senior engineer and to a product owner.

**Why this matters (story):** Nadia asks Omar whether Quill is making the team faster. Omar has a feeling. Jun has two numbers per task: minutes waiting for the agent, minutes reviewing its diff. The numbers say yes for CR-110-sized work and no for the first attempt at CR-111.

**Sections:**
1. *Monday to Friday.* A week: two small features, one refactor split in four, a bug with a failing test first, a Friday release-notes skill run. Which verb each day leans on.
2. *Two numbers.* Wait time (agent working, you idle) and review time (you reading). When wait exceeds review, tasks are too big; when review exceeds writing it yourself, the brief is missing something.
3. *Team conventions.* Committed brief; committed skills; settings in the repo; the checklist in `docs/`; PR descriptions that separate what was asked from what was done; one task per PR.
4. *Five anti-patterns.* The walk-away prompt; the 900-line brief; the argue-with-it session; the trust-the-green-checks review; the shared checkout. Each with its fix and the lesson that covers it.
5. *Talking to Jun's skeptic and to Nadia.* Two short scripts.
6. *What to do next.* The SDD course for the lifecycle around this craft; the Building and Evaluating AI Agents course for evals.

**Assessment:** 5 MC. Short: "Which of the five anti-patterns have you seen, and what would you change first?" Free: "Plan next week for a team you know: five tasks, the verb each leans on, and the two numbers you will record."

---

## 7. Authoring conventions

Follow `docs/AUTHOR_BRIEF.md` for lesson structure, callouts, quiz shape, and notes headings, with these course-specific rules:

- **Verbs** in frontmatter: `Brief`, `Drive`, `Review`, or `Bonus`.
- **Word count:** 1,900–2,600 words per lesson (L0 and B1: 1,600–2,200).
- **Code:** TypeScript for Shelf code and tests (Vitest style), `bash` for commands and hooks, `json` for settings and log lines, `markdown` for `CLAUDE.md`, `SKILL.md`, agent files, and `plan.md`, `yaml` only inside frontmatter examples. Keep blocks under 35 lines.
- **Quill runs on Claude Code.** Use only the shapes below, and label them as Claude Code shapes. Do not invent other flags, commands, or file formats. Other agents (Cursor, Copilot) may be mentioned as having equivalents, without detail.

**Memory files.** `CLAUDE.md` in the repository root is committed and read at the start of every session. `CLAUDE.md` files in subfolders are read when the agent works there. `~/.claude/CLAUDE.md` holds the person's own preferences for every project. `CLAUDE.local.md` is personal, ignored by git. A line `@docs/testing.md` imports that file into the brief. `/init` drafts a first `CLAUDE.md`.

**Session commands.** `/clear` starts a fresh context. `/compact` summarizes the session so far to free space. Shift+Tab cycles the permission mode (default → accept edits → plan). `Esc` interrupts the agent mid-action. `claude -p "task"` runs one task without the interactive session. `claude --resume` picks up an earlier session.

**Permissions** (`.claude/settings.json`):

```json
{
  "permissions": {
    "allow": ["Bash(make test)", "Bash(npm run lint)", "Bash(npm run typecheck)", "Edit(src/**)"],
    "ask": ["Bash(git push:*)", "Edit(src/email/**)"],
    "deny": ["Read(./.env)", "Bash(rm -rf:*)"]
  }
}
```

Rule shapes: `Bash(<command prefix>:*)` matches a command prefix; `Edit(<glob>)`, `Write(<glob>)`, `Read(<glob>)` match paths. Deny wins over ask, ask wins over allow.

**Hooks** (`.claude/settings.json`):

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash|Edit|Write", "hooks": [{ "type": "command", "command": "./gate.sh hook" }] }
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write", "hooks": [{ "type": "command", "command": "./format.sh" }] }
    ]
  }
}
```

A hook command receives JSON on stdin describing the action: `tool_name`, `tool_input` (`tool_input.command` for Bash, `tool_input.file_path` for Edit/Write), and for PostToolUse also `tool_response`. A PreToolUse hook decides by exit code: `0` allows; `2` blocks and the text on stderr is shown to the agent as the reason. To ask a human, print JSON to stdout with exit `0`:

```json
{ "hookSpecificOutput": { "hookEventName": "PreToolUse", "permissionDecision": "ask", "permissionDecisionReason": "Edits under src/email/ need Priya. See docs/email.md." } }
```

`permissionDecision` may be `allow`, `deny`, or `ask`. Other hook events exist (`UserPromptSubmit`, `Stop`, `SessionStart`); name them at most, do not show them. Reading stdin in bash: `input=$(cat); file=$(echo "$input" | jq -r '.tool_input.file_path // empty')`.

**Skills.** `.claude/skills/<name>/SKILL.md`:

```markdown
---
name: release-notes
description: Write the release notes for a tag from the merged PRs since the previous tag. Use when asked for release notes or a changelog.
---

1. Run `git log <previous-tag>..$ARGUMENTS --merges --oneline`.
2. Group the PRs under Features, Fixes, Internal.
3. Fill `template.md` in this folder; one line per PR, no PR numbers in the headings.
4. Print the result; do not commit.
```

Invoked with `/release-notes v2.4`; `$ARGUMENTS` is replaced by `v2.4`. The agent may also pick a skill on its own when the description matches the task. Other files in the folder (templates, checklists) are referenced by name.

**Subagents.** `.claude/agents/<name>.md`:

```markdown
---
name: test-reviewer
description: Reviews a diff and checks that every changed function has a meaningful test. Use after a feature is implemented, before opening the PR.
tools: Read, Grep, Glob, Bash
---

You review diffs for test coverage. For every changed exported function, find its test. Report: function, test file, whether the test would fail if the function's body were replaced with `return undefined`. Do not edit files.
```

A subagent runs with a fresh context and its own tools, then reports back to the main session.

**Plan mode.** In plan mode the agent can read and search but not edit or run commands that change anything; it proposes a plan, the person edits or approves it, then the session leaves plan mode. Plans may be saved as `plan.md` in the repository when the SDD chain is in use.

**Worktrees.** `git worktree add ../shelf-cr112 -b cr-112` then run a second agent session in that folder. Plain git; no agent-specific flag.

- **No em-dashes** anywhere in prose. No "simply", "just", "obviously".
- **Originality.** Everything is original. Do not mention LinkedIn, any lecture, or any other course by name except the platform's own "Spec-Driven Development for Dummies" and "Building and Evaluating AI Agents" courses.

## 8. Glossary term ids

`glossary.json` must contain exactly these ids (authors may only use these in `keyTerms`):

agent-loop, allow-ask-block, allow-list, anti-pattern, arguments, ask-list, boundary, brief, brief-bloat, claude-md, coding-agent, command-reference, compaction, context, context-hygiene, context-window, convention, decision-log, definition-of-done, deny-list, diff-size, drift, finding-to-rule, formatter-hook, guardrail, hallucinated-api, hollow-test, hook, import, local-memory, model, parallel-sessions, permission, permission-mode, plan-md, plan-mode, post-tool-use, pre-tool-use, procedure, project-memory, protected-path, restart, review-checklist, review-time, rule-the-agent-breaks, scope-creep, self-review, session, settings-json, silent-config-change, skill, skill-md, slash-command, standing-brief, steer, stranger-review, subagent, task-brief, task-sizing, team-conventions, test-lock, token, tool, user-memory, verify-first, wait-time, weakened-check, worktree

## 9. Grading philosophy

Same as the platform: multiple choice is graded in code; written answers are graded by Eve against binary rubric criteria; the score is the share of criteria met, pass at 70%.

---
slug: l1-claude-md-the-standing-brief
number: "L1"
title: "CLAUDE.md: The Standing Brief"
module: 1
moduleTitle: "The Brief"
verb: Brief
minutes: 55
prereqs: ["l0-how-a-coding-agent-works"]
summary: "Write the CLAUDE.md the agent reads every session: five sections, imports for what every task needs, a line for every mistake the agent breaks, and nothing the code already shows."
objectives:
  - "Explain what a CLAUDE.md is, when the agent reads it, and the three places it can live (project, user, local)."
  - "Write the five sections a good brief has: what the project is, how to run and test it, conventions, boundaries, and where to look."
  - "Use imports to keep the brief short and point at longer docs."
  - "Apply the rule-the-agent-breaks test to decide what earns a line in the brief."
  - "Recognize brief bloat and prune it."
keyTerms: ["claude-md", "standing-brief", "project-memory", "user-memory", "local-memory", "import", "convention", "boundary", "command-reference", "brief-bloat", "rule-the-agent-breaks", "definition-of-done"]
---

## Why this matters

Omar's first `CLAUDE.md` for Shelf is 900 lines long. He pasted in the whole README, the style guide, and an architecture document from 2023. He felt thorough. Then he asked Quill to build CR-110, the low-stock badge. Quill ran `npm test` instead of `make test`, so the lint never ran. It put the new test in `src/inventory/__tests__/`, where nobody would find it. And every session now started with a third of the context window already spent on a document Quill mostly ignored. Jun opened the file, deleted 850 lines, and added four. The next session used `make test`, put the test in `tests/inventory/`, and had room to think. This lesson is about those four lines and the 850 that had to go.

## 1. What a standing brief is

A standing brief is the set of instructions an agent reads at the start of every session, before it reads a single line of your code. In Claude Code, the standing brief is a file named `CLAUDE.md`. Quill reads it when a session starts, and its contents sit in the context for the whole session. It is the only thing Quill knows about Shelf before it starts opening files.

Recall from L0 that the agent has no memory of yesterday. Every session begins from nothing, and whatever you told it last week is gone. The standing brief is how you stop repeating yourself. Think of it as the note a lead engineer leaves for a contractor on their first morning: not the whole codebase, not the history of every decision, but the handful of things a smart stranger would get wrong without being told.

:::example CR-110 with and without a brief
Without a brief, Omar asks Quill: "Add a low stock badge to the inventory list when a title has fewer than 5 copies." Quill searches for "inventory", finds `src/inventory/list.ts`, hard-codes `5` in the component, writes a test under `src/inventory/__tests__/`, and runs `npm test`. Tests pass. The lint failure that `make test` would have caught is never seen. Omar finds the hard-coded threshold a week later, when Nadia asks to change it to 3.

With the brief from section 3, the same request produces a threshold read from `src/inventory/config.ts`, a test in `tests/inventory/low-stock.test.ts`, and a green `make test`. The prompt did not change. The brief did.
:::

:::key
The standing brief is the only thing the agent knows about your project before it reads code. If a fact is not in the brief and not in the code, the agent does not have it.
:::

:::beginner Standing versus task
A standing brief is read every session and describes the project. A task brief is the message you type to start one piece of work, and it describes that work, including its definition of done. "Tests go in `tests/<area>/`" is standing. "Add the low stock badge; done when `make test` is green" is a task. L2 covers the task brief.
:::

## 2. Where it lives

Claude Code reads memory files from three places. Each has a different owner and a different job.

| File | Who it is for | Committed to git? | Holds |
|---|---|---|---|
| `CLAUDE.md` in the repo root | Everyone on the team | Yes | Project memory: what Shelf is, how to test it, conventions, boundaries |
| `~/.claude/CLAUDE.md` | You, on every project | No, it lives in your home folder | User memory: your own working preferences |
| `CLAUDE.local.md` in the repo root | You, on this project | No, ignored by git | Local memory: your personal notes about this repository |

Project memory is the file this lesson is about. It is shared, reviewed, and committed like code. When Jun changes it, the whole team's sessions change.

User memory lives in your home folder and applies to every repository you open. It holds preferences that are about you, not about any one project.

Local memory is for things that are true for you on this project and for nobody else: the path to a database on your laptop, a reminder about a branch you are nursing.

There is one more place. A `CLAUDE.md` in a subfolder is read when the agent works in that folder. Shelf could keep `src/giftcards/CLAUDE.md` with the money rules, so those lines cost context only when Quill is in gift-card code.

:::example Omar's three files
Omar's `~/.claude/CLAUDE.md` says: "Prefer small diffs. Ask before adding a dependency. End with two sentences on what you changed." Those follow him to every project.

Shelf's `CLAUDE.md` says how to run the tests and where they live. Jun wrote most of it.

Omar's `CLAUDE.local.md` says: "The dev database is at `~/shelf-dev.sqlite`. The `cr-110-spike` branch is an unfinished experiment; ignore it." Nobody else needs either line.
:::

:::warning Personal facts in the project file
"Prefer small diffs" in the project `CLAUDE.md` is a mild problem: Jun may want a large diff from Quill on CR-111. "The dev database is at `~/shelf-dev.sqlite`" in the project file is a real problem: every teammate's session now believes a path that is only true on Omar's machine. Put your things in your files.
:::

:::tip
`/init` is a Claude Code command that drafts a first `CLAUDE.md` by reading the repository. Treat the draft as raw material. Prune it with the test in section 5 before you commit it.
:::

## 3. The five sections

A good project brief has five sections. Each answers a question the agent would otherwise guess at.

1. **What it is.** Two sentences. What the app does and who uses it.
2. **How to run and test.** Exact commands. This is the command reference: the strings the agent should type, not descriptions of them.
3. **Conventions.** The rules a linter cannot enforce. A convention is a way of doing things the team agreed on: where files go, how errors are handled, where a constant lives.
4. **Boundaries.** What the agent must never touch, and what it must ask about first. A boundary is a rule about what the agent may not do on its own.
5. **Where to look.** The key folders, and the docs that explain them.

Here is Shelf's brief after Jun's edit, in full.

```markdown
# Shelf

Shelf is Bramble Books' web app: inventory, online orders, gift cards, and
customer email for three stores. TypeScript, Vitest, one Makefile.

## Run and test
- `npm run dev` starts the app.
- `make test` runs build, tests, and lint. Run it before you say a task is done.
- `npm run typecheck` and `npm run lint` run alone when you need them.

## Conventions
- Tests live in `tests/<area>/`, next to nothing else. Never in `__tests__`.
- Thresholds and limits live in `src/<area>/config.ts`, not in components.
- Stock is counted per store, never as one total.
- @docs/testing.md

## Boundaries
- Never edit files under `migrations/`. Ask Jun for a migration.
- Never write to `tests/` while fixing a bug; tell Omar what the test should say.
- Ask before touching `src/email/`. Priya owns it. Read `docs/email.md` first.
- Ask before adding a dependency.

## Where to look
- `src/orders/`, `src/giftcards/`, `src/inventory/`, `src/email/`: one folder per area.
- `docs/email.md`: the sending rules and the consent filter.
- `docs/review-checklist.md`: what Jun checks in every PR.
```

Twenty-six lines on disk, about fifty in Quill's context once the testing guide is imported. Each line gives an exact command, names a rule the code cannot show, or tells Quill where to fetch more.

:::example The line that changed CR-110
"Thresholds and limits live in `src/<area>/config.ts`, not in components." Without it, Quill wrote `if (count < 5)` inside the badge component. With it, Quill added `LOW_STOCK_THRESHOLD = 5` to `src/inventory/config.ts` and imported it. When Nadia changed the number to 3 a week later, the change was one line in one file, and no agent session was needed.
:::

:::beginner Conventions versus boundaries
A convention says how to do something: where a test goes. A boundary says whether the agent may do it at all: never edit `migrations/`. If the sentence starts with "never" or "ask before", it is a boundary. If it starts with "we put" or "we use", it is a convention.
:::

:::key
Boundaries come in two strengths. "Never" means the agent does not do it, full stop. "Ask first" means the agent may propose it but must stop and wait. Write both kinds, and name the person to ask.
:::

## 4. Imports and pointers

A brief should be short, but some of what it relies on is long. Two tools keep the brief small: imports and pointers.

An import is a line of the form `@docs/testing.md`. Claude Code replaces that line with the contents of the file when it reads the brief. The file becomes part of the standing brief, loaded every session.

A pointer is a plain sentence: "Read `docs/email.md` before touching `src/email/`." Nothing is loaded up front. The agent fetches the file when a task makes it relevant.

The choice comes down to one question: is this needed in every session, or only in some?

| | Import (`@file`) | Pointer (a sentence) |
|---|---|---|
| Loaded | Every session | When the agent decides it needs it |
| Context cost | Always paid | Paid only when used |
| Use for | Rules that apply to every task | Rules that apply to one area |
| Shelf example | `docs/testing.md` | `docs/email.md` |

:::example The testing guide and the email runbook
`docs/testing.md` is 25 lines: how to name a test, how to use the store fixtures, how to run one file. Every task touches tests, so it is imported. Quill sees it on CR-110, CR-111, and CR-112 alike.

`docs/email.md` is 140 lines: the consent filter, the rate limit, the template rules, and Priya's approval steps. Only CR-112 touches email. It is pointed at, so CR-110 and CR-111 never pay for it. When CR-112 starts, Quill reads the boundary line, opens `docs/email.md`, and has the rules it needs.
:::

:::warning Importing everything
It is tempting to import the README, the style guide, and every file under `docs/`. That recreates the 900-line brief with extra steps. Every imported line is paid on every turn of every session. Import what every task needs. Point at the rest.
:::

:::try Ask Eve
Highlight the import-versus-pointer table and ask Eve: "For a project with a 300-line API style guide that only matters when adding endpoints, which column does it belong in, and what would the line in `CLAUDE.md` say?"
:::

## 5. The rule the agent breaks

How do you decide what earns a line? Use one test: every line in the brief names a mistake the agent made, or would make, without it. Call it the rule-the-agent-breaks test. If you cannot say which mistake a line prevents, the line is decoration.

The test does two things. It keeps the brief short, because most facts about a project do not correspond to a mistake. And it makes every line defensible, because the reason travels with it.

Run the Shelf brief through the test:

- "`make test` runs build, tests, and lint." Mistake prevented: Quill ran `npm test` and skipped lint.
- "Tests live in `tests/<area>/`." Mistake prevented: three tests landed in `__tests__` folders.
- "Stock is counted per store." Mistake prevented: Quill summed stock across stores in an early CR-110 attempt, and the badge lit up for the wrong titles.
- "Never edit `migrations/`." Mistake prevented: a migration without a rollback, written during CR-101, that Jun had to unpick by hand.

:::example The test-folder line arrives
On Omar's second day, Quill puts three new tests in `src/inventory/__tests__/`. Vitest finds them, so they pass, but Jun's checklist expects tests under `tests/inventory/`, and CI only reports coverage from there. Jun adds one line to the brief: "Tests live in `tests/<area>/`, next to nothing else. Never in `__tests__`." He also moves the three files. The next session's tests land in the right place. One mistake, one line.
:::

:::example A line that fails the test
Omar's 900-line brief contained: "Shelf uses TypeScript with strict mode enabled." Which mistake does that prevent? None. `tsconfig.json` says `"strict": true`, and Quill reads it the moment it opens a TypeScript file. The compiler enforces it on every build. The line is true and useless. Jun deleted it.
:::

:::key
A line earns its place by naming the mistake it prevents. If you cannot name the mistake, delete the line.
:::

## 6. Brief bloat

Brief bloat is what happens when the brief grows past what the agent can use. Omar's 900-line file is the extreme case, but bloat starts small: a paragraph here, a pasted doc there.

Bloat costs twice. First, context. Every line of the brief occupies the window on every turn of every session, so a long brief leaves less room for code and conversation, and long sessions drift sooner (L0, section 3). Second, attention. The four rules that matter are buried among 896 that do not. An agent reading "use two-space indentation" for the fortieth time is not more likely to notice "never touch `migrations/`".

Pruning has three cuts:

1. **Delete anything the code shows.** The folder layout, the language, the framework, the dependency list. Quill reads code faster than it reads prose about code.
2. **Delete anything a tool enforces.** Formatting rules the formatter fixes. Type rules the compiler checks. Lint rules the linter catches. If the tool will complain, the brief does not need to.
3. **Delete anything only true today.** "The `cr-110` branch is in progress." "Priya is out this week." Those belong in `CLAUDE.local.md` or a task brief, and they expire.

:::example Jun's 900-to-50 edit
What Jun kept, and why:

| Kept | Why |
|---|---|
| `make test` and the three npm commands | Exact commands; Quill guessed wrong without them |
| The `tests/<area>/` rule | No tool enforces it; Quill broke it |
| The email boundary with Priya's name | Not visible in code; getting it wrong costs a customer complaint |
| Where the low-stock threshold lives | Not visible until you know to look |

What he deleted, and why:

| Deleted | Why |
|---|---|
| The pasted README (310 lines) | Describes what the code shows |
| The style guide (280 lines) | The formatter and linter enforce it |
| The 2023 architecture doc (230 lines) | Half of it is no longer true |
| "Current sprint" notes (40 lines) | Only true today |

About fifty lines remained, counting the imported testing guide, and CR-110 went right on the next attempt.
:::

:::warning Bloat looks like diligence
A long brief feels safe. It is the opposite. Each line you add dilutes the ones already there. When a colleague proposes a new paragraph, ask which mistake it prevents and whether the code or a tool already covers it. Most proposals fail one of the two.
:::

## 7. Keeping it alive

A brief is not written once. It changes when the team learns something, and the place the team learns things is the review. L5 teaches the rule: every finding in a review of an agent's diff becomes a test, a hook, or a line in the brief.

- A **test** when the finding is about behavior: the badge showed the wrong count.
- A **hook** when the finding is about an action that must be enforced: Quill edited a test during a bug fix. L4 covers hooks.
- A **brief line** when the finding is about a habit: Quill keeps naming test files `.spec.ts` instead of `.test.ts`.

The brief line is the cheapest of the three and the weakest. It is advice, not enforcement. If the agent keeps breaking a rule after the line is in place, promote the rule to a hook.

The brief also shrinks. When a convention becomes a lint rule, delete the line. When a folder is removed, delete the pointer. Each time the brief is edited, ask the same question of every line: which mistake does this still prevent?

:::example CR-112's review lands in three places
Jun's review of CR-112 (L5) finds a call to `mailer.sendBatch()`, which does not exist. That becomes a test: the suite must cover the sending path so an invented method fails loudly. The review also finds a lint rule disabled with a comment. That becomes a hook in L4. And it finds a 1,400-line PR for a nightly email. That is a habit, so it becomes a brief line: "One change request per PR. If a task needs more than a handful of files, stop and propose a split."
:::

:::tip
Put the brief change in the same PR as the fix that taught you the rule. The reviewer sees the mistake and the line that prevents it side by side, and the git log becomes the brief's justification.
:::

:::try Ask Eve
Highlight the three bullets (test, hook, brief line) and ask Eve: "Quill keeps writing commit messages in the past tense when the team uses the imperative. Which of the three is that, and what would the line say?"
:::

## Summary

- The standing brief, `CLAUDE.md`, is read at the start of every session and is the only thing the agent knows about your project before it reads code.
- It lives in three places: the project file (committed, shared), the user file in `~/.claude/` (your preferences everywhere), and `CLAUDE.local.md` (personal, ignored by git); a subfolder `CLAUDE.md` adds area-specific rules.
- Five sections: what it is, how to run and test, conventions, boundaries, where to look. Exact commands, rules no tool enforces, and a named person for every "ask first".
- Import (`@docs/testing.md`) what every task needs; point at what only some tasks need. Every line must pass the rule-the-agent-breaks test or be deleted.
- Bloat costs context and attention; prune what the code shows, what a tool enforces, and what is only true today. The brief grows when a review finds a repeated habit and shrinks when a rule moves into a tool.

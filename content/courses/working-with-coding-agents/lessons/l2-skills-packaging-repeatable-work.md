---
slug: l2-skills-packaging-repeatable-work
number: "L2"
title: "Skills: Packaging Repeatable Work"
module: 1
moduleTitle: "The Brief"
verb: Brief
minutes: 50
prereqs: ["l1-claude-md-the-standing-brief"]
summary: "Turn a procedure you keep re-explaining into a skill the agent loads on demand, give it arguments and supporting files, hand isolated jobs to a subagent, and write a task brief that starts each piece of work."
objectives:
  - "Explain the difference between the standing brief (always loaded) and a skill (loaded when invoked or relevant)."
  - "Write a SKILL.md with a name, a description that says when to use it, and a procedure with numbered steps."
  - "Decide whether something belongs in CLAUDE.md, a skill, or a subagent."
  - "Write a task brief for one change request: goal, definition of done, constraints, and what not to touch."
  - "Invoke a skill with arguments and know what the agent sees."
keyTerms: ["skill", "skill-md", "slash-command", "procedure", "arguments", "subagent", "brief", "standing-brief", "context-window", "task-brief"]
---

## Why this matters

Every Friday Omar asks Quill to write the release notes for Shelf. Every Friday he types the same explanation: group the merged pull requests under Features, Fixes, and Internal, one line each, no PR numbers in the headings, do not commit. Every Friday it comes out a little different. One week the headings have numbers. One week Quill commits the file. One week Omar forgets to say "since the previous tag" and gets the whole history. Jun watches this for a month, then moves the explanation into `.claude/skills/release-notes/SKILL.md`. The next Friday Omar types `/release-notes v2.4` and reads the result. Same format every time, and the explanation lives in a file that Jun can review like any other code.

## 1. Standing brief vs skill

In L1 you wrote the standing brief, the `CLAUDE.md` that Quill reads at the start of every session. It holds what is true all the time: how to run the tests, where the tests live, which folders need a person's approval. A skill is different. A skill is a procedure, a set of numbered steps for one kind of job, stored in its own file and loaded only when that job comes up.

The two differ in one way that matters: when they are read. The standing brief is read every session, whether or not it is relevant. A skill is read when you invoke it, or when the agent decides its description matches the task.

Why does the release-notes procedure not belong in `CLAUDE.md`? Because the procedure is 20 lines that matter on Friday and never on Monday. Put it in the brief and every session on CR-110, CR-111, and CR-112 pays to carry it.

:::example The cost of a procedure in the wrong place
Shelf's brief is 50 lines. Omar adds a 200-line procedure for release notes, plus a 60-line one for scaffolding an endpoint. The brief is now 310 lines. Every session starts by reading all 310, and every turn keeps them in the context window, the finite space the model can hold at once. On a long CR-111 session, those 260 lines of Friday-only material are still there at turn 40, crowding out the file Quill needs to read. Moved into two skills, the brief drops back to 50 lines, and the 260 lines are read only on the days they are used.
:::

:::key
The brief is what the agent must always know. A skill is what it must know sometimes. Load cost decides which is which.
:::

:::beginner What "loaded" means
When a file is loaded, its text is placed into the model's context alongside your message. The model can only act on what is in that context. A skill on disk that has not been loaded is invisible to the agent, which is the point: it costs nothing until it is needed.
:::

## 2. Anatomy of a skill

Quill runs on Claude Code, so a skill uses the Claude Code shape: a folder under `.claude/skills/` named after the skill, holding a `SKILL.md`. The file starts with frontmatter, a small block of YAML between two `---` lines, with two fields. The `name` is what you type after a slash to invoke it. The `description` says what the skill does and when to use it. After the frontmatter comes the procedure.

Here is the whole `release-notes` skill, the one Jun wrote.

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

The description does two jobs. For a person browsing the folder, it says what the skill is. For the agent, it is the matching rule. When Omar types "can you put together a changelog for the new tag?" without invoking anything, Quill compares the request against every skill's description, sees "changelog," and loads this one on its own.

:::example Two descriptions, one request
Nadia asks Omar, "what changed since last week's deploy?" Omar passes the question to Quill. With the description above, Quill loads `release-notes` because "since the previous tag" and "changelog" are close to the question. With a description that read only "Generates release notes," Quill would answer from `git log` on its own, in whatever format it chose. The second half of a description, the "use when" sentence, is what makes the skill findable.
:::

:::tip
Write the description as two sentences: what it does, then "Use when" followed by the words a person would actually type. Those words are the search key.
:::

## 3. Writing the procedure

A procedure is the body of the skill. It has four parts: numbered steps, exact commands, the output format, and a done check. Numbered steps, so you can refer to "step 3" when something goes wrong. Exact commands, because "run the tests" becomes `npm test` in one session and `make test` in another, and only one of those runs the lint. The output format, because "write it up" produces a different write-up every time. A done check, so the agent knows when it has finished.

Here is a second Shelf skill, `new-endpoint`, which scaffolds a route, its test, and a line of docs.

```markdown
---
name: new-endpoint
description: Scaffold a new HTTP route in Shelf with its test and a docs line. Use when asked to add an endpoint, route, or API path.
---

Arguments: the route path, for example `/inventory/low-stock`.

1. Create `src/<area>/<name>.ts` exporting a handler. Pick `<area>` from the first path segment.
2. Create `tests/<area>/<name>.test.ts` with one Vitest case that calls the handler and asserts the status code. Run `make test` and confirm the new test fails before step 3.
3. Implement the handler so the test passes. Run `make test` again.
4. Add one line to `docs/api.md`: method, path, one-sentence purpose.
5. Done when `make test` is green, the docs line exists, and no file outside `src/<area>/`, `tests/<area>/`, and `docs/api.md` changed. Print `git status --short` as proof.
```

Step 2 makes the agent see the test fail before the code exists. That is the same discipline the *Spec-Driven Development for Dummies* course teaches for specs, applied inside a skill. Step 5 is the done check, and it ends with evidence, not a claim.

:::example The step that was missing
The first version of `new-endpoint` had no step 5. Quill scaffolded `/giftcards/balance`, ran the tests, and then, because nothing said stop, reformatted `src/giftcards/index.ts` too. Jun added the "no file outside" line and the `git status --short` print. The next run touched three files and printed three lines. The done check is what turns "finished" into something you can see.
:::

:::warning A procedure that describes instead of instructs
"Make sure the endpoint is well tested" is a description of a goal. "Create `tests/<area>/<name>.test.ts` with one case that asserts the status code" is an instruction. Agents follow instructions and interpret descriptions. Every line of a procedure should tell the agent what to type or what to check, not what to aim for.
:::

## 4. Arguments

Most procedures need one piece of input: a tag, a route, a ticket number. Arguments are the text you type after the skill name. Omar types `/release-notes v2.4`, and inside the skill body every `$ARGUMENTS` is replaced by `v2.4` before the agent reads it. This is the Claude Code shape; other agents have equivalents.

Look back at step 1 of `release-notes`: `git log <previous-tag>..$ARGUMENTS --merges --oneline`. When Omar invokes it with `v2.4`, Quill sees `git log <previous-tag>..v2.4 --merges --oneline`, works out that the previous tag is `v2.3` from `git tag`, and runs the command. The tag is the one thing that changes week to week, so it is the one thing that comes from outside the file.

:::example What the agent sees
Omar's terminal:

```bash
/release-notes v2.4
```

What Quill receives is the skill body with the substitution made, plus Omar's message. Step 1 now reads `git log <previous-tag>..v2.4 --merges --oneline`. Nothing else changed. If Omar had typed `/release-notes` with no argument, `$ARGUMENTS` would be empty and step 1 would be malformed, so a good skill says what to do in that case: "If no tag is given, ask for one before running anything."
:::

:::beginner Slash commands
A slash command is a message that starts with `/` followed by a name, such as `/release-notes`. In Claude Code, typing a skill's name this way invokes it directly instead of waiting for the agent to match the description. The words after the name become the arguments.
:::

:::try Ask Eve
Highlight the `release-notes` skill and ask Eve: "Rewrite step 1 so it handles a missing argument and a tag that does not exist."
:::

## 5. Supporting files

A skill folder can hold more than `SKILL.md`. A template, a checklist, or an example output can sit next to it, and the procedure refers to the file by name. This keeps the procedure short and keeps the shape of the output in one place that a person can edit without touching the steps.

Step 3 of `release-notes` says "Fill `template.md` in this folder." Here is that file.

```markdown
# Shelf $ARGUMENTS

## Features
- 

## Fixes
- 

## Internal
- 

Released <date>. Full log: `git log <previous-tag>..$ARGUMENTS`.
```

When Nadia asks for a "Known issues" heading, Jun adds it to `template.md`. The procedure does not change. When Omar wants the date in a different format, he edits one line in one file.

:::example The folder, whole
```text
.claude/skills/release-notes/
  SKILL.md
  template.md
.claude/skills/new-endpoint/
  SKILL.md
  checklist.md
```

`new-endpoint/checklist.md` holds the six things Jun checks on every new route. Step 5 can say "confirm every line in `checklist.md`" instead of repeating them.
:::

:::key
Steps go in `SKILL.md`. Shapes go in supporting files. Change a shape without touching a step.
:::

## 6. Subagents for isolated jobs

Some jobs should not run inside your main session at all. A long exploration of the codebase fills the context window with files that the main task does not need. A review against a fixed checklist works best when the reviewer has not seen the conversation that produced the code. For these, Claude Code offers a subagent: a separate agent with its own instructions and its own tools, defined in `.claude/agents/<name>.md`, that runs with a fresh context and reports back to the main session.

The file has frontmatter with `name`, `description`, and `tools`, then the instructions.

```markdown
---
name: test-reviewer
description: Reviews a diff and checks that every changed function has a meaningful test. Use after a feature is implemented, before opening the PR.
tools: Read, Grep, Glob, Bash
---

You review diffs for test coverage. For every changed exported function, find its test. Report: function, test file, whether the test would fail if the function's body were replaced with `return undefined`. Do not edit files.
```

Two things to notice. The `tools` line leaves out Edit and Write, so this subagent cannot change a file. And the instruction asks a sharp question: would the test fail if the function did nothing? That catches a test that asserts nothing, which the main session, having written both, is unlikely to notice.

:::example test-reviewer on CR-110
Quill finishes the low-stock badge. Omar asks the main session to run `test-reviewer` on the diff. The subagent starts with an empty context, reads the diff, finds `lowStockBadge()` in `src/inventory/badge.ts` and its test in `tests/inventory/badge.test.ts`, and reports: "Test calls `lowStockBadge(3)` and asserts the return is defined. It would pass with `return undefined` replaced by `return {}`. Not meaningful." Omar tightens the assertion before opening the PR. Jun never sees the weak test.
:::

When does a subagent fit? A skill is steps the main session follows with everything it already knows. A subagent is a job that benefits from knowing nothing: a fresh look, a bounded tool set, and a report instead of a diff.

:::warning A subagent is not a faster agent
Students reach for subagents to parallelize work. A subagent starts from zero: it has not read your brief's conversation, does not know what you decided at turn 12, and cannot see the plan. That is a strength for review and exploration and a weakness for implementation. Give a subagent a job that a stranger could do well, and keep the building in the main session.
:::

:::try Ask Eve
Highlight the `test-reviewer` file and ask Eve: "What would go wrong if `tools` included Edit?"
:::

## 7. The task brief

Everything so far lives in a file. The task brief does not. A task brief is the message that starts one piece of work: the goal, the definition of done, the constraints, what not to touch, and how the agent should verify. It is written once per task and thrown away when the task ends. The standing brief says what is always true; the skill says how to do a recurring job; the task brief says what to do today.

Here is the CR-110 task brief, eight lines.

```text
Goal: show a "low stock" badge on the inventory list when a title has fewer than 5 copies.
Done: the badge renders for a title with 4 copies and not for one with 5; a Vitest test proves both.
Constraint: read the threshold from src/inventory/config.ts; do not hard-code 5.
Constraint: stock is counted per store, not across stores.
Do not touch: src/orders/, src/giftcards/, migrations/.
Do not touch: any existing test.
Verify: make test green; paste the output.
Then stop. Do not open a PR.
```

Compare it with "add a low stock badge." That version leaves Quill to decide the threshold, whether stock is per store, and whether to open a PR. Each decision is a chance to be wrong, and L0 showed what a literal agent does with a missing sentence. The eight-line version closes every gap that matters and says where the edges are.

:::example The line that saved an afternoon
The first time Omar ran CR-110 he left out "stock is counted per store." Quill summed copies across all three shops, so a title with two copies in each store showed no badge. The test passed, because it used one store. Jun caught it in review. The constraint went into the next task brief, and later into `CLAUDE.md`, because it is true for every inventory task.
:::

:::beginner Definition of done
The definition of done is the sentence that says how everyone will know the task is finished. It names an observable result (the badge renders for 4, not for 5) and the proof (a test). Without it, "done" means whatever the agent decides it means.
:::

:::tip
Write the "do not touch" lines before the goal. Listing the edges first makes the goal smaller in your own head, and a smaller goal is a better task.
:::

## 8. Which layer

You now have four places to put a piece of knowledge: the standing brief, a skill, a subagent, and the task brief. The question for each candidate line is when it is needed.

| Needed when | Layer | Example from Shelf |
|---|---|---|
| Every session | `CLAUDE.md` (standing brief) | "Run `make test`, not `npm test`." Stock is counted per store. |
| On demand, same steps each time | Skill in `.claude/skills/<name>/SKILL.md` | `release-notes`, `new-endpoint` |
| Fresh context and a fixed job | Subagent in `.claude/agents/<name>.md` | `test-reviewer` |
| This task only | Task brief (a message) | "Read the threshold from `config.ts`." Do not open a PR. |

Two tests resolve most cases. Would this line be wasted on an unrelated task? Then it is not brief material. Could a stranger do this job from a written description, and would a fresh view help? Then it is a subagent. Steps for a recurring job are a skill, and anything left is the task brief.

:::example Sorting four lines
Jun and Omar sort four candidates. "Tests live in `tests/<area>/`" is true on every task, so it goes in the brief. "Group PRs under Features, Fixes, Internal" is Friday-only steps, so it stays in the `release-notes` skill. "Check that every changed function has a test that would fail on `return undefined`" is a fixed job that benefits from a fresh look, so it is the `test-reviewer` subagent. "Do not open a PR for this one; I want to see it first" is true today, so it goes in the task brief for CR-110 and nowhere else.
:::

:::key
Every session: brief. On demand: skill. Fresh context and a fixed job: subagent. This task only: task brief. Ask "when is this needed?" and the layer answers itself.
:::

:::try Ask Eve
Highlight the decision table and ask Eve: "Where does 'never edit files under `src/email/` without asking Priya' belong, and why is a hook (L4) a fifth option?"
:::

## Summary

- The standing brief is loaded every session; a skill is loaded only when invoked or when its description matches the task, so recurring procedures belong in skills, not in `CLAUDE.md`.
- A skill is `.claude/skills/<name>/SKILL.md`: frontmatter with `name` and a description that says what it does and when to use it, then a procedure of numbered steps, exact commands, an output format, and a done check.
- `$ARGUMENTS` carries the one thing that changes per run, such as `/release-notes v2.4`; supporting files such as `template.md` hold shapes so the steps stay short.
- A subagent in `.claude/agents/<name>.md` runs a fixed job with a fresh context and a bounded tool set, and reports back; use it for review and exploration, not for building.
- A task brief is the message that starts one piece of work: goal, definition of done, constraints, do-not-touch, and how to verify. Pick the layer by asking when the knowledge is needed.

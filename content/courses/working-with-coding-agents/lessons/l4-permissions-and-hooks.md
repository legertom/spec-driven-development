---
slug: l4-permissions-and-hooks
number: "L4"
title: "Permissions and Hooks: Guardrails in Code"
module: 2
moduleTitle: "The Session"
verb: Drive
minutes: 55
prereqs: ["l3-driving-a-session"]
summary: "Pick a permission mode, write allow, ask, and deny rules, add hooks that block, ask, and format, and log every decision so a review finding can never recur."
objectives:
  - "Explain the permission modes and pick the right one for a task."
  - "Write allow, ask, and deny rules in .claude/settings.json for commands and paths."
  - "Write a PreToolUse hook that blocks or asks, and a PostToolUse hook that formats."
  - "Turn a review finding into a guardrail so it cannot recur."
  - "Read a decision log and say what it proves."
keyTerms: ["permission", "permission-mode", "allow-list", "deny-list", "ask-list", "hook", "pre-tool-use", "post-tool-use", "guardrail", "formatter-hook", "protected-path", "decision-log", "allow-ask-block", "settings-json"]
---

## Why this matters

Omar is halfway through CR-112, the nightly sales summary email. Quill wants to see the shape of the `sales` table, so it runs the pending migration against the development database "to check the schema." The migration runs clean. Then Jun mentions, in passing, that the development database is a copy of production from last month, real customer emails included. Nothing bad happened. Quill read a schema and moved on. Priya, who owns customer data, asks a harder question: how do you know nothing bad happened? Omar has a terminal scrollback and a feeling. Jun opens `.claude/settings.json`, adds three lines and a hook, and from that afternoon on the answer to Priya's question is a line in a log file.

## 1. Every action is proposed

Quill does not run commands. Quill proposes them. Every read, every edit, and every shell command is a request that goes through permissions before it happens. A permission is the rule that decides what happens to that request: it runs, it pauses to ask you, or it is refused.

The first control is the permission mode, a session-wide setting that decides what Quill may do without asking. In Claude Code, Shift+Tab cycles through the modes.

| Mode | Edits | Commands | Use it for |
|---|---|---|---|
| Default | Ask unless allowed | Ask unless allowed | Unfamiliar work, first sessions |
| Accept edits | Free | Ask unless allowed | Well-briefed feature work in a branch |
| Plan | Not allowed | Read-only | Planning a large change |
| Bypass | Free | Free | Throwaway sandboxes only |

Plan mode, from L3, lets Quill read and search but not change anything. The bypass mode skips every question; it belongs in a container you can delete, never on a laptop with a real database connection.

:::example Omar picks a mode for each task
For CR-110, the low-stock badge, Omar uses accept edits. The task touches two files under `src/inventory/`, the brief names `make test`, and he is watching the first three actions anyway. Free edits save him twenty clicks.

For CR-111's plan, he uses plan mode. Quill reads all of `src/orders/`, proposes the four steps, and cannot touch a file until Omar approves. The mode is the guarantee, not Omar's attention.
:::

:::beginner A mode is a default, not a rule
The mode answers "what happens when no rule matches?" The rules in the next section answer "what happens for this specific command or path?" A rule always wins over the mode. So accept edits plus a deny rule on `src/email/**` means Quill edits freely everywhere except there.
:::

## 2. Allow, ask, deny lists

Modes are blunt. The rules in `.claude/settings.json` are precise. This file is committed, so every session on Shelf gets the same rules. It holds three lists.

The allow list names actions that run without a question. The ask list names actions that always pause for a person. The deny list names actions that are refused outright, with no way for the session to override. Deny wins over ask, and ask wins over allow, so a path that appears in two lists gets the stricter treatment.

Here are Shelf's rules, in the Claude Code shape:

```json
{
  "permissions": {
    "allow": ["Bash(make test)", "Bash(npm run lint)", "Bash(npm run typecheck)", "Edit(src/**)"],
    "ask": ["Bash(git push:*)", "Edit(src/email/**)"],
    "deny": ["Read(./.env)", "Bash(rm -rf:*)"]
  }
}
```

Read the shapes. `Bash(make test)` matches that exact command. `Bash(git push:*)` matches any command that starts with `git push`. `Edit(src/**)` matches any edit under `src/`, and `Read(./.env)` matches one file. The same glob shapes work for `Write(...)`.

The sorting rule is short. Allow what is safe and frequent, so the session flows. Deny what must never happen, so no amount of persuasion matters. Ask for everything that is fine in principle but deserves a human glance.

:::example Sorting Shelf's commands
Jun and Omar sort the commands Quill ran last week:

| Action | List | Why |
|---|---|---|
| `make test`, `npm run lint` | Allow | Safe, run fifty times a day |
| `Edit(src/**)` | Allow | That is the job |
| `git push` | Ask | Fine, but a person should see the branch name |
| `Edit(src/email/**)` | Ask | Real customer addresses live behind that code |
| `Read(./.env)` | Deny | Secrets never belong in the context |
| `rm -rf` | Deny | There is no version of this Quill needs |
:::

:::key
Allow the safe and frequent, deny the never, ask for the rest. If you cannot say which list an action belongs in, it belongs in ask until you can.
:::

:::warning Deny is not a lock on the file system
A deny rule stops Quill's own tools from reading `.env`. It does not stop a shell command such as `cat .env` unless a rule or hook covers Bash too. When you protect a path, ask how each tool could reach it, and cover every route. Section 4 shows the hook that closes the gap.
:::

## 3. Hooks: code that runs around actions

Permission rules match strings. Sometimes you need a decision that depends on more than a string: the current branch, the time of day, the contents of the command. That is a hook. A hook is a small program that Claude Code runs around an action, and the rule it enforces is a guardrail: a check in code rather than a sentence in the brief.

Two hook events matter here. A PreToolUse hook runs before the action and can allow, ask, or block it. A PostToolUse hook runs after the action and can react to what happened. Other events exist, such as `UserPromptSubmit`, `Stop`, and `SessionStart`; this lesson does not use them.

A hook receives JSON on standard input describing the action: `tool_name`, and `tool_input` with `command` for Bash or `file_path` for Edit and Write. A PostToolUse hook also receives `tool_response`. A PreToolUse hook answers by exit code, or by printing JSON. Exit `0` allows. Exit `2` blocks, and whatever the hook wrote to standard error is shown to Quill as the reason.

Here is the settings block that wires Shelf's hook, in the Claude Code shape:

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

The `matcher` names which tools trigger the hook. `Bash|Edit|Write` covers the three ways Quill changes the world. `./gate.sh hook` is the same script the SDD course builds in its L4; here you write the rules inside it.

:::example What the hook sees
When Quill proposes the migration command, `./gate.sh hook` reads this on standard input:

```json
{ "tool_name": "Bash", "tool_input": { "command": "npm run migrate -- --env development" } }
```

When Quill proposes an edit to the email module, it reads this:

```json
{ "tool_name": "Edit", "tool_input": { "file_path": "src/email/send.ts" } }
```

Everything the hook decides comes from those fields plus whatever else it can check, such as the git branch.
:::

:::beginner Standard input and exit codes
A program reads standard input as a stream of text handed to it by whoever started it. In bash, `input=$(cat)` captures all of it. An exit code is the number a program returns when it finishes; `0` means success by convention, and Claude Code gives `2` a special meaning for hooks: block.
:::

## 4. A blocking hook

A block ends the attempt and tells Quill why. Use it when the command itself is wrong, not when it needs a second opinion. The migration incident wants a block: Quill should never run anything under `migrations/` unless the work is a migration, which on Shelf means the branch name starts with `migration/`.

```bash
#!/usr/bin/env bash
# gate.sh hook: decide one proposed action. Claude Code sends JSON on stdin.
if [[ "${1:-}" == "hook" ]]; then
  input=$(cat)
  tool=$(echo "$input" | jq -r '.tool_name')
  cmd=$(echo "$input" | jq -r '.tool_input.command // empty')
  file=$(echo "$input" | jq -r '.tool_input.file_path // empty')
  branch=$(git rev-parse --abbrev-ref HEAD)

  # Rule 1: migrations run only on a migration/ branch.
  if [[ "$cmd" == *migrations/* || "$cmd" == *"run migrate"* ]] && [[ "$branch" != migration/* ]]; then
    ./gate.sh log block migration-branch "$tool" "$cmd"
    echo "BLOCKED by migration-branch: '$cmd' touches migrations/ on branch '$branch'." >&2
    echo "Migrations run only on a branch named migration/<name>. See docs/testing.md." >&2
    echo "Instead: read the migration file, or ask Omar to open a migration/ branch." >&2
    exit 2
  fi

  ./gate.sh log allow default "$tool" "${file:-$cmd}"
  exit 0
fi
```

Read the three lines on standard error as Quill will read them: what was blocked, which rule, and what to do instead. A block without an alternative sends the agent into a loop of variations. A block with one sends it to the migration file, which was all it wanted.

:::example The migration, replayed
Omar is on branch `cr-112`. Quill proposes `npm run migrate -- --env development`. The hook sees `run migrate`, sees the branch does not start with `migration/`, logs a block, prints the reason, and exits `2`. Quill reads the reason, opens the migration file with a Read, finds the `sales` columns it needed, and carries on. The development database is untouched, and Priya's question has an answer before she asks it.
:::

:::tip
Test a hook without an agent. Write the JSON Claude Code would send and pipe it in: `echo '{"tool_name":"Bash","tool_input":{"command":"npm run migrate"}}' | ./gate.sh hook`. Add one such line per rule to a small test script and the guardrail gets a test of its own.
:::

## 5. An asking hook

A block is for commands that are wrong. An ask is for actions that are fine in principle but that a named person should see. The permission ask list handles the plain cases. A hook handles the case where the reason should name a person and a document, so that Quill and Omar both know what to do while they wait.

An asking hook prints JSON to standard output and exits `0`. The Claude Code shape:

```bash
  # Rule 2: edits under src/email/ pause for Priya.
  if [[ "$file" == src/email/* ]]; then
    ./gate.sh log ask email-owner "$tool" "$file"
    jq -cn --arg why "Edits under src/email/ need Priya. See docs/email.md." \
      '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:$why}}'
    exit 0
  fi
```

`permissionDecision` may be `allow`, `deny`, or `ask`. The reason is shown in the terminal when the action pauses. Omar sees Priya's name and the runbook, pastes the reason into the CR-112 pull request, and asks her to look. This is the same human gate the SDD course teaches: a threshold or a path plus a name means ask.

:::example CR-112 reaches the mailer
Quill proposes `Edit src/email/send.ts` to add a `sendSummary` function. The hook logs an ask and prints the reason. The session pauses with "Edits under src/email/ need Priya. See docs/email.md." Omar reads `docs/email.md`, learns that every new email needs a template review, and asks Priya in the PR. She approves the change with one condition: the summary must go to store managers only, never to customer addresses. Omar approves the paused edit, and Quill continues with that constraint in the conversation.
:::

:::key
Block when the command is wrong. Ask when the command is fine and the question is whether a person wants it. The reason for an ask names a person and a document.
:::

:::try Ask Eve
Highlight the asking hook and ask Eve: "Rewrite this rule so that any edit under `src/giftcards/` asks and names Priya, and explain what changes in the log line."
:::

## 6. A formatting hook

Not every hook decides. A PostToolUse hook runs after the action and can do work on the result. The most useful one on most teams is a formatter hook: after every Edit or Write, run the formatter on that one file.

```bash
#!/usr/bin/env bash
# format.sh: PostToolUse on Edit|Write. Format the file Quill changed.
input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // empty')
[[ -n "$file" && "$file" == *.ts ]] && npx prettier --write "$file" >/dev/null
exit 0
```

Six lines. The hook reads `tool_input.file_path`, checks it is a TypeScript file, and runs prettier on it. It exits `0` because a PostToolUse hook has nothing to block; the action already happened.

Why is this better than a line in `CLAUDE.md` that says "run prettier after every edit"? Because the brief line is advisory. Quill forgets it in a long session, and Jun's diff fills with formatting noise. The hook runs every time, costs no context, and cannot be forgotten.

:::example The diff Jun did not have to read
Before the hook, CR-112's pull request had 90 lines of re-indented code that Quill had left unformatted and a later lint fix had reflowed. After the hook, every file Quill touches is formatted the moment it changes, and Jun's review shows only the lines that mean something.
:::

:::beginner PreToolUse and PostToolUse in one sentence
Pre runs before the action and can stop it. Post runs after the action and can react to it. A guardrail lives in Pre; housekeeping lives in Post.
:::

## 7. From finding to guardrail

Every review finding can land on one of three rungs. The bottom rung is a line in the brief: cheap, one sentence, advisory. The middle rung is a hook: enforced on every action, cannot be forgotten. The top rung is a test: enforced and proves the behavior is right, not only that an action was stopped. Climb the ladder when the rung below fails.

| Rung | Cost | Enforced | Proves behavior |
|---|---|---|---|
| Brief line | One sentence | No | No |
| Hook | A few lines of bash | Yes | No |
| Test | A test file | Yes | Yes |

Start at the bottom. Most findings never need to climb. Climb when the same finding comes back.

:::example The tests/ rule climbs a rung
In L0, Quill fixed a flaky test by deleting its assertion. Jun added a brief line: "During a fix, never edit files under `tests/`; change the code until the test passes." Two weeks later, in a 30-turn session, Quill edited `tests/inventory/stock.test.ts` again. The line had been compacted away.

Jun moved the rule up a rung. In `gate.sh`, a protected path rule: any Edit or Write with `file_path` under `tests/` is blocked while the branch name starts with `fix/`. The reason says "Tests are locked during a fix. Change the code, or ask Jun to change the criterion." It has not been broken since, because it cannot be.
:::

A protected path is any folder a rule fences off: `tests/` during fixes, `migrations/` off a migration branch, `src/email/` without Priya. Name them in the brief so Quill knows the map, and enforce them in settings or a hook so the map holds.

:::warning A hook is not a test
A hook proves an action was stopped. It does not prove the code is right. The test lock keeps Quill from rewriting the test, but only the test itself proves the badge shows at four copies. When a finding is about behavior, climb to the top rung.
:::

:::try Ask Eve
Highlight the ladder table and ask Eve: "Jun found that Quill raised a timeout in `vitest.config.ts` to make a slow test pass. Which rung does that finding land on, and what would the rule say?"
:::

## 8. The decision log

Every decision the hook makes is a fact worth keeping. The decision log is an append-only file, `.gates/log.jsonl`, one JSON object per line. Append-only means lines are added and never edited. Each line records the time, the tool, a summary of the input, the decision, and the rule that made it.

```bash
# gate.sh log <decision> <rule> <tool> <input>
if [[ "${1:-}" == "log" ]]; then
  mkdir -p .gates
  jq -cn --arg ts "$(date -u +%FT%TZ)" --arg decision "$2" --arg rule "$3" \
    --arg tool "$4" --arg input "$5" \
    '{ts:$ts, tool:$tool, input:$input, decision:$decision, rule:$rule}' >> .gates/log.jsonl
  exit 0
fi
```

Log every decision, including allows. A log with only blocks cannot tell "the gate allowed it" from "the gate never ran." Priya does not read bash. She reads log lines.

:::example The line that answers Priya
Priya asks: did Quill touch the email table while building CR-112? Omar runs `grep -E 'email|migrate' .gates/log.jsonl` and shows her three lines:

```json
{"ts":"2026-09-22T14:03:11Z","tool":"Bash","input":"npm run migrate -- --env development","decision":"block","rule":"migration-branch"}
{"ts":"2026-09-22T14:03:40Z","tool":"Read","input":"migrations/0042_sales.sql","decision":"allow","rule":"default"}
{"ts":"2026-09-22T15:17:52Z","tool":"Edit","input":"src/email/send.ts","decision":"ask","rule":"email-owner"}
```

The migration was blocked. The file was read instead. The email edit paused for her. Nothing in the log touched a table, and every line has a time. That is what the log proves: which actions were proposed, which rule handled each, and when.
:::

:::tip
Commit `.claude/settings.json` and `gate.sh`, and ignore `.gates/log.jsonl` locally. The copy that counts is the one CI writes on the branch, where no one edits it by hand. The SDD course's L6 wires that up.
:::

:::try Ask Eve
Highlight the three log lines and ask Eve: "Which of these lines would Priya care about, and what would be missing if the hook logged only blocks?"
:::

## Summary

- Every action Quill takes is a proposal; the permission mode sets the default answer, and rules in `.claude/settings.json` override it per command or path.
- Allow the safe and frequent, deny the never, ask for the rest; deny wins over ask, and ask wins over allow.
- A PreToolUse hook blocks with exit `2` and a reason on stderr, or asks with JSON that names a person and a document; a PostToolUse hook formats the file after every edit.
- A finding climbs a ladder: brief line, then hook, then test. Climb when the rung below fails, and climb to a test when the finding is about behavior.
- Every decision lands in `.gates/log.jsonl` with a time, a tool, an input, a decision, and a rule, and that file is the answer to "how do you know?"

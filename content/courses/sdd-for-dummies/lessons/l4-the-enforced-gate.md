---
slug: l4-the-enforced-gate
number: "L4"
title: "The Enforced Gate"
module: 2
moduleTitle: "The Enforced Gate"
verb: Gate
minutes: 55
prereqs: ["l3-from-spec-to-failing-test"]
summary: "Build gate.sh, write a hook that allows, asks, or blocks, make every block explain itself, and log each decision where no one engineer can edit it."
objectives:
  - "List the checks an agent must pass before a person looks: build, tests, lint, eval suite."
  - "Write a hook that can allow, ask, or block an agent action."
  - "Make a block explain itself and name the route to approval."
  - "Record every gate decision with a timestamp and a verdict, outside any one engineer's control."
  - "Wire a human gate that pauses a production action."
keyTerms: ["enforced-gate", "gate-script", "hook", "allow-ask-block", "self-explaining-block", "route-to-approval", "decision-log", "human-gate", "timestamped-run", "wait-time-cost", "test-lock", "production-action"]
---

## Why this matters

Nadia asks Omar to tidy up. Omar types into Quill: "clean up stale gift cards." Quill reads the schema, finds a `gift_cards` table with an `expires_at` column, and runs a delete against the production database from the terminal. Four hundred and twelve cards are gone. Some of them belonged to customers who had not spent them yet. Priya finds out from a complaint. Nothing stopped Quill, because nothing was there to stop it. The spec for Shelf says production writes need a human, but a sentence in a file does not reach out and grab a shell command. With a gate in place, the command would have paused, explained why, and named Priya as the approver. This lesson builds that gate.

## 1. A gate is a check plus a decision

A gate is a point in the workflow where work is held until something is true. An enforced gate is one that a machine applies every time, whether or not anyone remembers. It has two halves. The first half is a set of automated checks: does it build, do the tests pass, is the lint clean, does the eval suite still score above the threshold. The second half is a human decision that the checks pause for: may this refund run, may this file change, may this delete happen.

The order matters. Checks run first, so a person never spends attention on work that cannot even build. The human decision comes last, on work that has already passed everything a machine can verify.

:::example The same refund, gated and ungated
Ungated: Quill implements CR-102, opens a PR, and Omar reads a 600-line diff cold, trying to spot whether the refund limit is enforced.

Gated: `make test` runs the `test-refund-limit` suite first. It fails, because Quill capped refunds at the gift card balance instead of the original purchase. The PR never reaches Omar. Quill reads the failure, fixes the cap, and the PR arrives green. Omar's review is now a decision about a passing change, not a hunt for bugs.
:::

:::key
A spec with no gate is a wish. The gate is what turns "we agreed" into "it cannot merge otherwise."
:::

:::beginner Check versus decision
A check is a question a program can answer with yes or no: do the tests pass? A decision is a question that needs a person: should Bramble refund this customer? Gates put the checks in front of the decisions so that people only decide about things that already work.
:::

## 2. gate.sh: the checks before a person looks

The gate script is one file, `gate.sh`, at the root of the Shelf repository. Run with no arguments, it runs the checks in order and stops at the first failure with a non-zero exit code. A non-zero exit is the universal signal for "no": CI reads it, Quill reads it, and a human reading the log sees it.

The four checks run in a deliberate order: build, tests, lint, eval suite. Build first because nothing else means anything if the code does not compile. Tests next because they are the acceptance criteria from `spec.md` made executable. Lint after tests because style problems on broken code are not worth reporting. The eval suite last because it is the slowest and the most expensive.

```bash
#!/usr/bin/env bash
# gate.sh: run every check before a person looks. Exit non-zero on the first failure.
set -euo pipefail

step() {
  local name="$1"; shift
  echo "==> $name"
  if ! "$@"; then
    echo "GATE FAILED at $name (exit $?)" >&2
    exit 1
  fi
}

step build   npm run build
step tests   make test
step lint    npm run lint
step evals   node evals/run.mjs --threshold 0.9

echo "GATE PASSED $(date -u +%FT%TZ)"
```

Each step prints its name, so the log shows how far the run got. The final line stamps the pass with the time, which becomes evidence in L7.

:::example Reading a failed run
Omar runs `./gate.sh` on Quill's CR-101 branch and sees:

```text
==> build
==> tests
 FAIL tests/gift-balance.test.ts > hides another customer's balance
GATE FAILED at tests (exit 1)
```

Lint and evals never ran. That is the point. There is no reason to spend eval budget on a change that fails an acceptance criterion.
:::

:::tip
Give `gate.sh` a `make gate` alias in the `Makefile`, so the command a person types, the command Quill runs, and the command CI runs are the same string. Three spellings of one check drift apart within a month.
:::

## 3. Hooks: allow, ask, or block

`gate.sh` checks finished work. A hook checks an action before it happens. A hook is a small program that your agent runner calls every time the agent proposes to run a command or edit a file. The hook reads a description of the proposed action and returns one of three verdicts: allow, ask, or block. This is the allow-ask-block pattern. Allow lets the action run. Block stops it and tells the agent why. Ask pauses the action until a named person says yes.

Quill is configured as a Claude Code agent, so the hook lives in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash|Edit|Write", "hooks": [{ "type": "command", "command": "./gate.sh hook" }] }
    ]
  }
}
```

Before any `Bash`, `Edit`, or `Write` action, Claude Code runs `./gate.sh hook` and passes JSON on standard input: `tool_name`, and `tool_input` with `command` for Bash or `file_path` for Edit and Write. The hook decides by exit code. Exit `0` allows. Exit `2` blocks, and whatever the hook printed to standard error is shown to the agent as the reason. To ask a human, the hook prints JSON to standard output and exits `0`, with `permissionDecision` set to `ask`.

Here is the `hook` mode of `gate.sh`, starting with the test lock from L3. A test lock is a rule that the agent may not edit files under `tests/`, enforced by a hook instead of by a polite request in `plan.md`.

```bash
# gate.sh hook: decide one proposed action. Called by Claude Code with JSON on stdin.
if [[ "${1:-}" == "hook" ]]; then
  input=$(cat)
  tool=$(jq -r '.tool_name' <<<"$input")
  file=$(jq -r '.tool_input.file_path // ""' <<<"$input")
  cmd=$(jq -r '.tool_input.command // ""' <<<"$input")

  # Rule 1: the test lock. Tests change only when a human changes the criterion.
  if [[ "$file" == tests/* ]]; then
    ./gate.sh log block test-lock "$tool" "$file"
    echo "BLOCKED by test-lock: Quill may not edit $file." >&2
    echo "Tests change only after a human changes the criterion in spec.md §3." >&2
    echo "Route: ask Omar to edit the test and note the change in the PR." >&2
    exit 2
  fi

  ./gate.sh log allow default "$tool" "${file:-$cmd}"
  exit 0
fi
```

:::example Quill tries to move the test
During CR-101, Quill proposes `Edit tests/gift-balance.test.ts`, changing "expected hidden" to "expected a number." The hook sees a `file_path` under `tests/`, logs a block, prints the three-line reason, and exits `2`. Quill reads the reason, leaves the test alone, and changes the balance query in `src/orders/page.ts` instead. The test passes untouched. The assertion swap from L3 cannot happen here, because the request became a lock.
:::

:::beginner What jq is
`jq` is a command-line tool for reading JSON. `jq -r '.tool_name'` pulls the `tool_name` field out of the input as plain text. The hook uses it to find the file or command the agent wants to touch.
:::

:::warning A hook on the wrong events is a hole
The matcher `Bash|Edit|Write` covers the three ways Quill changes the world. If you match only `Edit`, Quill can run `sed -i` from Bash and edit the test anyway. When you add a rule, ask how the agent could reach the same result through a different tool, and match that tool too.
:::

## 4. A block that explains itself

A block that only says "denied" teaches nothing. The agent retries a variation, the engineer opens a chat to ask what happened, and twenty minutes vanish. A self-explaining block tells both the agent and the human four things: what was blocked, which rule blocked it, who can approve, and how to reach them. That last part is the route to approval, and it is the difference between a wall and a door.

Here is the production-delete block, added to the hook right after the test lock:

```bash
  # Rule 2: no destructive command against production without a human.
  if [[ "$cmd" =~ --env[= ]production ]] && [[ "$cmd" =~ (DELETE|DROP|TRUNCATE|--delete) ]]; then
    ./gate.sh log block prod-delete "$tool" "$cmd"
    cat >&2 <<'MSG'
BLOCKED by prod-delete: this command deletes data in production.
  Rule:     spec.md §5, human gates: "no destructive write to production without Priya."
  Approver: Priya (policy owner, payments and customer data).
  Route:    open a PR with the command in plan.md and request Priya's review,
            or post in #shelf-gates with the command and the reason.
  Instead:  run the same command with --env staging and attach the row count.
MSG
    exit 2
  fi
```

Read the message as Quill would. It knows what it may not do, why, and what to do next: run against staging. Read it as Omar would. He knows who to ask and where. Nobody has to open the spec to find out which rule fired, because the message cites it.

:::example The stale gift cards, replayed
Quill proposes `shelf-db --env production "DELETE FROM gift_cards WHERE expires_at < now()"`. The hook matches `--env production` and `DELETE`, logs the block, and prints the message. Quill's next proposal is the same query with `--env staging`, which returns 412 rows. Quill writes the count into `plan.md` under "production step, needs Priya." Priya reads the plan, notices that 40 of the 412 cards still hold value, and changes the rule to "expired and zero balance." The delete that eventually runs is the right one.
:::

:::key
A block is not a refusal. It is a message with a rule, an approver, and a route. If the agent cannot tell what to do next, the block is unfinished.
:::

## 5. The decision log

Every verdict the hook returns is a fact worth keeping. The decision log is an append-only file, `.gates/log.jsonl`, with one JSON object per line. Append-only means lines are added and never edited or removed. Each line records the timestamp, the actor, the action, the verdict, the rule that fired, and the approver if a person was involved.

```bash
# gate.sh log <verdict> <rule> <tool> <action> [approver]
if [[ "${1:-}" == "log" ]]; then
  mkdir -p .gates
  jq -cn --arg ts "$(date -u +%FT%TZ)" --arg actor "${GATE_ACTOR:-quill}" \
    --arg verdict "$2" --arg rule "$3" --arg tool "$4" --arg action "$5" \
    --arg approver "${6:-}" \
    '{ts:$ts, actor:$actor, tool:$tool, action:$action, verdict:$verdict, rule:$rule, approver:$approver}' \
    >> .gates/log.jsonl
  exit 0
fi
```

Why does the log live outside any one engineer's control? Because a log that Omar can edit is a log Mr. Hale cannot trust. Locally, `.gates/log.jsonl` is a working copy. The copy that counts is the one CI writes to a shared bucket or attaches to the run, where nobody on the team has write access from a laptop. L6 wires that up; for now, the rule is that the authoritative log is the one produced by a timestamped run, not by a person.

:::example Three log lines from CR-102
```json
{"ts":"2026-09-14T09:12:41Z","actor":"quill","tool":"Edit","action":"tests/refund-limit.test.ts","verdict":"block","rule":"test-lock","approver":""}
{"ts":"2026-09-14T09:31:05Z","actor":"quill","tool":"Bash","action":"shelf refund --gift-card GC-4471 --amount 350","verdict":"ask","rule":"refund-over-200","approver":""}
{"ts":"2026-09-14T10:02:17Z","actor":"priya","tool":"Bash","action":"shelf refund --gift-card GC-4471 --amount 350","verdict":"allow","rule":"refund-over-200","approver":"priya"}
```

Three lines, one story: Quill tried to touch a test and was stopped; Quill tried a large refund and was paused; Priya approved it thirty-one minutes later. When Mr. Hale asks who approved the refund, the answer is the third line.
:::

:::warning Logging only the blocks
Teams often log blocks and skip allows, because allows feel boring. Then the log cannot answer "did the gate run on this action at all?" A missing line looks the same as a gate that was switched off. Log every verdict, including allow, and let the reader filter.
:::

:::try Ask Eve
Highlight the three log lines and ask Eve: "Which of these lines would an auditor care about, and what question does each one answer?"
:::

## 6. Wiring a human gate for a production action

A production action is a command that changes real data or moves real money: a refund, a delete, a config push. A human gate is a rule in the spec that names the action, the threshold, and the person. CR-102's spec says a refund over $200 pauses for Priya. Here is how that sentence becomes a hook rule, an approval, and a log entry.

```bash
  # Rule 3: refunds over $200 pause for Priya (spec.md §5, human gates).
  if [[ "$cmd" =~ shelf\ refund ]] && [[ "$cmd" =~ --amount\ ([0-9]+) ]]; then
    amount="${BASH_REMATCH[1]}"
    if (( amount > 200 )); then
      ./gate.sh log ask refund-over-200 "$tool" "$cmd"
      jq -cn --arg why "Refund of \$$amount is over \$200: needs Priya's approval. See spec.md §5." \
        '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:$why}}'
      exit 0
    fi
  fi
```

The sequence, end to end:

1. Quill proposes `shelf refund --gift-card GC-4471 --amount 350`.
2. The hook parses the amount, sees 350, logs an `ask`, and returns `permissionDecision: "ask"` with a reason that names Priya and the spec section.
3. The action pauses. The reason appears in Quill's terminal, and Omar pastes it into the CR-102 PR with a request for Priya's review.
4. Priya reads the refund reason and the original purchase amount, and approves in the PR.
5. Omar re-runs the command with `GATE_ACTOR=priya` after her approval, and the hook logs an `allow` with `approver: "priya"`. The refund runs once.

:::example What "ask" does that "block" does not
Block ends the attempt; the agent must find another path. Ask keeps the attempt alive and hands the decision to a person. For the stale gift card delete, block was right, because the command itself was wrong. For a $350 refund, ask is right, because the command is fine and the question is whether Bramble wants to pay it. The verdict follows the spec's human gate: a threshold plus a name means ask.
:::

:::beginner Why the approval goes in the PR
Chat messages scroll away. A PR approval has a name, a timestamp, and a permanent URL, and it sits next to the code that ran. When the log line says `approver: "priya"`, the PR is where you go to see her actual words.
:::

:::try Ask Eve
Highlight the five-step sequence and ask Eve: "Rewrite this for CR-103, where the gate is 'no export without a consent filter,' and name who approves."
:::

## 7. What a gate costs

Every ask has a price: the time between the pause and the approval. That is the wait-time cost, and it is the number that decides whether a gate survives contact with a real team. A gate that nobody can afford gets skipped on Fridays, and a skipped gate is worth nothing.

The decision log already holds what you need. The gap between an `ask` line and its matching `allow` line is the wait for that decision. Compute the median per rule and put it somewhere people see it, such as the PR checks summary or a weekly note.

| Rule | Asks last month | Median wait | Action |
|---|---|---|---|
| refund-over-200 | 14 | 31 min | Keep; Priya answers within the hour |
| prod-delete | 3 | 2 days | Keep; rare and dangerous |
| export-customers | 9 | 4 hours | Tune: Priya is out on Thursdays; add Nadia as backup approver |

:::example Tuning the refund threshold
After a month, the refund gate has fired 14 times. Twelve of the refunds were between $200 and $260, all approved without comment. Priya proposes raising the threshold to $300 and Omar changes the rule in `spec.md` first, then in the hook, with Priya as the reviewer of the PR. The gate still exists, it fires less often, and the change to it is itself gated and logged.
:::

:::key
Make the wait visible per gate. A gate with an invisible cost gets skipped; a gate with a visible cost gets tuned.
:::

## 8. Live demo walkthrough

Here is the whole sequence for CR-102's refund, in the order you would run it at a terminal.

```bash
# 1. The checks pass before anyone looks.
./gate.sh
# ==> build ... ==> tests ... ==> lint ... ==> evals
# GATE PASSED 2026-09-14T09:30:12Z

# 2. Quill proposes the refund; the hook pauses it.
echo '{"tool_name":"Bash","tool_input":{"command":"shelf refund --gift-card GC-4471 --amount 350"}}' \
  | ./gate.sh hook
# {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask",
#   "permissionDecisionReason":"Refund of $350 is over $200: needs Priya's approval. See spec.md §5."}}

# 3. Priya approves in the PR. Omar records the approval and runs it.
./gate.sh log allow refund-over-200 Bash "shelf refund --gift-card GC-4471 --amount 350" priya
shelf refund --gift-card GC-4471 --amount 350

# 4. The log tells the story.
tail -n 2 .gates/log.jsonl
```

The last command prints the `ask` line and the `allow` line with `approver: "priya"`. Attach those two lines to the PR. Mr. Hale's question in L7, "who approved this refund," is now answered by a file that was written at the moment it happened.

:::example Piping a fake action into the hook
Step 2 above is a trick worth keeping. You do not need Quill running to test a hook rule. Write the JSON Claude Code would send, pipe it into `./gate.sh hook`, and read the verdict. Add one such line per rule to `tests/gate.test.sh`, and the gate itself gets a test.
:::

:::try Ask Eve
Highlight the demo block and ask Eve: "What would each step print if the amount were $150 instead of $350?"
:::

## Summary

- A gate is a check plus a decision: automated checks run first, and a named person decides last, on work that already passed.
- `gate.sh` runs build, tests, lint, and the eval suite in that order, stops at the first failure, and exits non-zero.
- A hook runs before every agent action and returns allow, ask, or block; the test lock and the production-delete rule are blocks, the refund over $200 is an ask.
- A block explains itself: what was blocked, which rule, who can approve, and the route to reach them.
- Every verdict lands in `.gates/log.jsonl` with a timestamp, and the copy that counts is written by CI, not by a person; the wait between ask and allow is the gate's cost, and it must be visible.

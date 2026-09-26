## Talking points

- The stale gift card delete is the thread; ask which line of `gate.sh` would have stopped it.
- A gate is a check plus a decision. Checks are questions a program can answer; decisions need a person. Checks go first so people only decide about work that already passes.
- The three verdicts are the whole surface: allow, ask, block. Students collapse ask into block. Wrong command means block; good command with a policy question means ask.
- A block is a message, not a refusal. Four parts: what, which rule, who, how.
- The log is evidence only if nobody on the team can edit the copy that counts. The local file is a scratchpad; the CI-written copy is the record.
- The wait between ask and allow is the cost. Invisible cost gets skipped; visible cost gets tuned.

## Live demo idea

With the lesson's `gate.sh` and `.claude/settings.json` in a repository, and no agent running yet, pipe hand-written JSON into `./gate.sh hook` three times: an edit under `tests/`, a `DELETE` with `--env production`, and `shelf refund --amount 350`. Read each verdict aloud, then `tail .gates/log.jsonl` so the class sees three lines appear. Then run Quill on CR-101 and ask it to change the failing test; watch the block arrive and Quill edit the source file instead. Finish by computing a median wait from two fake ask and allow lines with `jq`.

## Common misconceptions

- "A hook and gate.sh are the same thing." `gate.sh` checks finished work; a hook checks one proposed action before it happens. They share a file for convenience only.
- "Ask means the customer or the agent is asked." Ask routes to the person named in the spec's human gates.
- "Only blocks need logging." A missing line looks the same as a gate that was switched off. Log every verdict.
- "Exit 1 blocks." In the Claude Code hook shape, exit 2 blocks and shows stderr to the agent. Exit 1 is an error, not a decision.
- "A line in CLAUDE.md saying 'do not edit tests' is a lock." It is a request. The test lock is the hook.

## Timing

Fifty-five minutes: story and section 1, six; gate.sh, eight; hooks and the test lock, nine; the self-explaining block, six; the decision log, seven; the human gate end to end, nine; cost, four; demo walkthrough, six.

## If you only have 20 minutes

Do the piped-JSON demo with all three rules (nine minutes), teach the four parts of a self-explaining block with the prod-delete message on screen (five minutes), and close with the three CR-102 log lines and the question "which line answers Mr. Hale?" (six minutes). Assign sections 2, 7, and 8 as reading.

## Talking points

- Open with the migration against the development database. Nothing bad happened, and that is the point: "how do you know?" is the question the lesson answers.
- Every action is a proposal. The mode is the default answer; a rule in `.claude/settings.json` overrides it per command or path.
- The three lists have a fixed priority: deny over ask, ask over allow. The `Edit(src/**)` plus `Edit(src/email/**)` case is the one to draw on the board.
- A permission rule matches a string. A hook can look at anything: the branch, the file, the time.
- Block when the command is wrong; ask when the command is fine and a person should decide. An ask reason names a person and a document.
- The ladder: brief line, hook, test. Climb when the rung below fails. A hook proves an action was stopped; only a test proves behavior.
- Log every decision, including allows.

## Live demo idea

With `gate.sh`, `format.sh`, and the settings from the lesson in a repository, and no agent running, pipe hand-written JSON into `./gate.sh hook` three times: a `npm run migrate` command on a `cr-112` branch, the same command after `git checkout -b migration/sales`, and an Edit under `src/email/`. Read each answer aloud: exit 2 with the reason, exit 0, and the ask JSON. Then `tail .gates/log.jsonl` and count the lines. Finish by piping an unformatted TypeScript file's path into `./format.sh` and opening it to show prettier ran.

## Common misconceptions

- "Deny on `Read(./.env)` means the file is safe." It stops the Read tool. `cat .env` from Bash needs the hook or a Bash rule too.
- "Exit 1 blocks." Exit 2 blocks and shows stderr to the agent. Exit 1 is an error.
- "Ask means the agent asks itself or the customer." Ask routes to the person named in the reason.
- "A hook is a test." A hook stops an action. A test proves behavior.
- "Log only the interesting decisions." Then the log cannot tell an allow from a hook that was off.

## Timing

Fifty-five minutes: story and modes, six; allow, ask, deny lists, eight; how hooks work and the settings block, seven; the blocking hook, eight; the asking hook, seven; the formatting hook, four; the ladder, seven; the decision log and the line that answers Priya, eight.

## If you only have 20 minutes

Do the piped-JSON demo with the migration block and the email ask (eight minutes), teach the three lists and their priority with the `src/email/**` case on screen (five minutes), and close with the three log lines and the question "what does this prove?" (seven minutes). Assign sections 6 and 7 as reading.

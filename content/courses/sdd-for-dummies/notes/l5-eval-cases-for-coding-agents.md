## Talking points

- The concise diffs story is the thread. In every section, ask which case, check, or rule would have caught Omar's one-line edit on the first run.
- An eval case is not a new standard. It is the standard the reviewer already applied, written down as a prompt and checks. Point students back at last month's PRs.
- The four kinds of checks are a ladder. Tests and lint are free. Behavior checks catch quiet damage. Policy checks are the new idea, and the cheatable grep is the trap to show.
- Config is code is the sentence to leave on the board. `CLAUDE.md`, skills, and hooks change what gets written, so they get reviewed and regression tested.
- Incidents become evals, written by the team that had the incident. The `source` field protects the case from a future cleanup.

## Live demo idea

Bring a repository with a working `CLAUDE.md` and three eval cases: a typo fix, a small feature with a two-customer test, and a docstring-count policy check. Run the suite and show 3/3. Add "prefer concise diffs" to `CLAUDE.md`, rerun, and watch the docstring case fail. Read the diff together so the class sees the deleted comments. Revert, rerun, 3/3. If you cannot run an agent live, show recorded output from the two runs side by side.

## Common misconceptions

- "The tests already cover this." Tests check the code at one commit, not what the agent will write tomorrow under a new instruction.
- "A better prompt makes a better case." The opposite. The vague original prompt is the valuable one; the agent will be asked badly again.
- "Policy checks need a model judge." Start with a grep or a script. Reach for a judge only when nothing else can express the rule, and trust it less.
- "More cases are always better." Above fifty, nightly runs get slow and the team stops reading the table. Grow the suite from incidents.
- "A stale failing case keeps us honest." It teaches everyone to ignore red. Retire it through a PR.

## Timing

Fifty-five minutes: story and section 1, seven; mining tasks, six; writing checks with the consent script, ten; the repo layout, four; config is code with the incident case, eight; incidents become evals, six; the runner and the output table, eight; keeping cases honest, six.

## If you only have 20 minutes

Run the live demo with the three-case suite (ten minutes), teach the four kinds of checks with the cheatable grep on screen (six minutes), and close with the incident rule and the `source` field (four minutes). Assign sections 2, 4, and 8 as reading and point students to the homework.

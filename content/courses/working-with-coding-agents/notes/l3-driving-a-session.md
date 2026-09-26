## Talking points

- The thread is CR-111: one request, two outcomes. Thirty-one files and drift, then a plan, four sessions, and a merge by lunch. Ask which decision made the difference.
- Task sizing is a test with three parts: a definition of done, a handful of files you can list, one verifying command. If any part is missing, plan and split before starting.
- Plan mode is read-only. The plan is a document the engineer owns, and Omar's two edits are the cheapest steering in the lesson because nothing had been built.
- Steer with one sentence. Show the failed three paragraphs next to "Stop. Do not change the function signatures; only the bodies." Careful is not an instruction.
- Restart is not failure. Two corrections that did not stick mean the session has drifted, and the constraint belongs in a file.
- Compaction is a summary and summaries lose things. Constraints go in `plan.md`, the task message, or `CLAUDE.md`.
- Worktrees are plain git. One command, and the two sessions stop racing.

## Live demo idea

Open Shelf in plan mode with Shift+Tab and ask Quill for the CR-111 plan live. Have the class propose the two edits before you reveal Omar's. Approve, `/clear`, then run step 1 with "Read `plan.md`. Do step 1 only." Name each of the first three actions on screen: was that the right file? If Quill touches a signature, press `Esc` and type the one-sentence steer. Finish with `git worktree add ../shelf-cr112 -b cr-112` in a second terminal and run `git status` in both folders so the class sees two separate trees.

## Common misconceptions

- "A long, detailed correction is a better correction." Long messages compete with the brief. One specific sentence lands.
- "Restarting throws away the work." Committed code and `plan.md` survive. Only the drifted context is lost, and losing it is the point.
- "Compacting is the same as clearing." Compact keeps a summary; clear keeps nothing. Use clear between tasks.
- "Plan mode writes code slowly." Plan mode writes no code at all; it reads and proposes.
- "Two terminals in one folder is parallel work." It is a race. Parallel means one worktree per session.

## Timing

Sixty minutes: story and task sizing, eight; plan mode and the two edits, ten; splitting, six; the first three actions and steering, eight; steer or restart, eight; context hygiene, seven; verify first, six; worktrees, seven.

## If you only have 20 minutes

Run the plan-mode demo and the two edits (eight minutes), show the failed three-paragraph correction next to the one-sentence steer and the restart message (seven minutes), and close with the worktree command in two terminals (five minutes). Assign sections 3, 6, and 7 as reading.

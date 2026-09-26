## Talking points

- The thirty-second green is the thread. In every section, ask: would this step have caught Quill's assertion swap?
- The test is the criterion in executable form. If the agent can edit the test, the agent can edit the criterion. That sentence carries the lesson.
- "Only" criteria need the other case. Ana alone goes green against the L0 bug; Ben is the test.
- Two reds are not equal. "Failed to resolve import" is the file not loading. "Expected hidden, got 42" is the criterion broken.
- A rule in `plan.md` is a request. A hook that exits 2 is a lock. Keep both.
- Tests do change, but a human changes `spec.md` first, then the test, and a reviewer signs both.

## Live demo idea

Run the CR-101 loop live in about twelve minutes. Show the criterion in `spec.md`, write `tests/gift-balance.test.ts` with Ana and Ben on screen, and run `make test-gift-balance` twice: once with no stub (missing import) and once with a stub that returns the raw balance (expected hidden, got 42). Ask which red is the one to hand off. Start the agent with the test-lock hook off and let it try; if it edits the test, you have your story. Turn the hook on, rerun, and show the block message. Finish with `git diff --stat` and ask whether `tests/` is in the list.

## Common misconceptions

- "Green means done." Green means the command exited zero. Read the diff for test edits, deleted assertions, skips, and widened types before believing it.
- "A first-run pass is good news." It means the test cannot fail. Every test must be seen red once, for the predicted reason.
- "The agent should write the tests." In this loop a human writes the test from the criterion. The agent implements against a check it did not choose.
- "Tests are frozen forever." They change when the criterion changes, through a human and a reviewer, spec first.
- "The plan rule is enough." The story is the plan rule being ignored. Enforcement is the exit code.

## Timing

Fifty-five minutes: story and section 1, six; writing the test, nine; failing for the right reason, eight; the plan, five; the test lock, eight; reading the diff, seven; when the test was wrong, five; walkthrough, seven.

## If you only have 20 minutes

Do the live demo with both reds and the hook (twelve minutes), then teach section 6 with the diff table on screen (six minutes) and close on the sentence "if the agent can edit the test, the agent can edit the criterion" (two minutes). Assign sections 4 and 7 as reading.

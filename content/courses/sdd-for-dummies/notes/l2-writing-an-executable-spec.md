## Talking points

- The one-line spec is the thread. For each of the six parts, ask which of Priya's three rules it would have captured.
- Two readers, one file. Quill needs enough to build without guessing. Mr. Hale needs to see what was promised and how anyone would know.
- "Observable" is the word to hammer. A criterion is something you could watch from outside the code: a response, a row, a screen, a log line. "Works correctly" is not observable.
- One criterion, one command, non-zero on failure. That sentence makes the spec executable and bridges to L3, L4, and L6.
- A human gate is a condition, a named person, and a place the decision lands. Two out of three is not a gate.
- Policy while writing, not in review.

## Live demo idea

Put the one-line spec, "Add gift card refunds," on screen and ask the room to list everything Quill would have to guess: who may refund, how much, what happens over a limit, what is logged, which tables. Then open the full CR-102 `spec.md` and have the class match each guess to the section that answers it. Finish with `make test-refund-limit`: describe the test in one sentence, ask "what happens if Quill checks the wrong field?" and let someone say "exit 1."

## Common misconceptions

- "The intent should say how." Intent is the outcome in Nadia's words. The how belongs in `plan.md`.
- "Acceptance criteria are the test names." Criteria come first and are written in plain language. Tests are derived from them, one command per criterion.
- "A firm sentence in the spec is enforcement." The spec is the contract. Enforcement arrives in L4 with hooks.
- "Evidence is the PR being merged." Evidence is a record written by the system: a log line, a make output, an approver id. A green merge button proves nothing on its own.
- "Priya reviews the PR." Priya reviews constraints and human gates before any code exists. At the PR she confirms nothing drifted.

## Timing

Sixty minutes: story and section 1, seven; intent, four; constraints, seven; acceptance criteria with the good-versus-bad table, ten; verification, eight; human gates, eight; evidence, six; policy and the full spec, ten.

## If you only have 20 minutes

Run the whiteboard demo with the one-line spec (six minutes), teach acceptance criteria and verification together using the five-criteria table and the `make test-refund-limit` example (ten minutes), then close on the full `spec.md` with the human gate line circled (four minutes). Assign sections 2, 3, and 7 as reading and set HW1.

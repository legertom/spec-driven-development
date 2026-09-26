## Talking points

- The CR-112 PR is the thread: 1,400 lines, "all tests pass," four findings. Open with "what did the green checks prove?"
- The stranger rule is about what the author lacks: no memory of past outages, no shame, no model of consequences. The reviewer supplies the doubt.
- Reading order: tests first, then the covered code, then everything else. A hollow test tells you the whole diff is unverified.
- The six failures compound. The disabled lint rule allowed the retry loop, the hollow test hid it, the raised timeout let it pass. Finding one means looking nearby for the others.
- Self-review catches what the agent can see (a disabled rule, a changed config) and misses what it believes (five retries is robust).
- Three verdicts, three destinations. Fix in place only what stands alone. Test for behavior, hook for action, brief line for habit.
- Diff size is a finding, and an L3 problem showing up at review.

## Live demo idea

Put the homework's CR-110 diff on screen without the description. Give the class four minutes to read it, test file first. Ask what `vi.spyOn(badge, "isLowStock").mockReturnValue(true)` proves. Then walk the other files and collect findings on the board under the six failure names. Most groups find the hollow test and the `strict` removal; fewer find the `REORDER_THRESHOLD` change and the `<=` off-by-one. Vote on fix, send back, or restart, then assign each finding a destination.

## Common misconceptions

- "Green checks mean the diff is safe." Green means the existing tests passed. A hollow test and a raised timeout are both green.
- "Self-review replaces my review." It catches mechanical items, not what the agent believes is correct.
- "Restart is a failure." Restart is the verdict for a session that lost the task. Hand-fixing four connected findings leaves their causes in place.
- "A finding goes in the brief by default." The brief is advisory. An action that must not happen belongs in a hook; a behavior belongs in a test.
- "A big diff is a thorough diff." CR-112's extra lines were a rename, a stub, and a retry loop.

## Timing

Fifty-five minutes: story and the stranger rule, seven; reading order, five; the six failures, fifteen; the checklist, five; self-review, five; fix, send back, or restart, six; finding to rule, seven; diff size and summary, five.

## If you only have 20 minutes

Run the CR-110 diff demo (twelve minutes), then teach the three destinations with the four CR-112 findings on screen and have the class place each one (eight minutes). Assign sections 2, 4, and 5 as reading and the homework as the assessment.

## Talking points

- The Tuesday upgrade is the thread: nothing in git changed, make test was green, and three PRs still drifted from the spec. Ask in every section what would have stopped it.
- Three inputs to agent behavior: code, configuration, model. L5 covered config. This lesson is about the model, which is not in git and can only be measured.
- A report is not a gate. The nightly run existed in the story and gated nothing. The merge rule and the CI check turn a number into a decision.
- Two checks: the rate against the threshold catches a cliff; the drop against the last green run catches a slope.
- The run record is change control for a thing git cannot track. Commit, config hash, and model id answer "what changed?" from files.
- Leading indicators let Nadia act early. Lagging indicators tell her whether the gate has holes.

## Live demo idea

Show two run records, 18390 and 18422, in a diff viewer and ask the class to find the one field that differs before you point at the model id. Then open a PR that adds "prefer concise diffs" to `CLAUDE.md` and walk through what CI prints: the pass rate, the drop, the failing cases with owners, the verdict, and the exit code. Close by removing the `paths` filter from `agent-evals.yml` and asking what that would cost, in dollars from the section 8 budget and in trust.

## Common misconceptions

- "The tests passed, so the agent is fine." The tests cover the code you have. The eval suite covers the code the agent writes next.
- "We pinned the model, so drift is solved." Pinning helps, but prompt drift still arrives through every config PR, and pins expire when the vendor retires a version.
- "The nightly dashboard is the gate." A number nobody is tagged on stops nothing. The gate is the check that blocks the merge.
- "A 90% threshold means 90% is the goal." It is the floor. Watch the trend and the drop against the last green run.
- "Retries fix flaky cases." Retries remove noise. A case that passes only on retry every night is drift, and quarantine is what makes the flake visible to its owner.

## Timing

Fifty minutes: story and section 1, six; merge rule, six; workflow, eight; regression defense, six; timestamped runs, seven; incidents become evals, four; leading and lagging, six; cost and noise, five; wrap-up, two.

## If you only have 20 minutes

Tell the Tuesday story with the two run records on screen (six minutes). Walk the workflow file line by line, stressing what each trigger catches (eight minutes). Read the merge rule aloud and ask who reviews a drop in a payments case (four minutes). Assign sections 4, 7, and 8 as reading.

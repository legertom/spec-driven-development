## Talking points

- The story to tell: Tuesday's fix, Thursday's regression, a week of silence. CI is the alarm that rings on Thursday.
- A test case is a frozen world plus a frozen input plus a written definition of correct. Students who skip the initial state get flaky tests and blame the model.
- Assertions where the verdict is mechanical, pinned judges where it is not. "Pinned" means the judge cannot move; if it can move, a red build is ambiguous.
- Cost tiers are about matching frequency to price. Milliseconds run on every commit, seconds on every pull request, dollars nightly.
- pass@k versus pass^k is the single most useful distinction in the lesson. pass@k is what the agent can do; pass^k is what the customer gets. With p = 0.9 the two numbers are 0.999 and 0.729, and only one of them is honest for a one-shot customer.
- Reset-and-replay is the reason the initial state exists. Say "state leaks" out loud.
- Monitoring is the same evaluators pointed at production: code checks on everything, frozen judges on a sample, corrected prevalence on the dashboard.

## Live demo idea

Show a real pull request that changes one line of the system prompt. Run the Tier 0 and Tier 1 checks live and let the gate go red on the refund-outside-policy case. Open the failing test, show its initial state, input, and expected result, and ask the class to say why it fails before revealing the diff in the trace. Then revert the prompt line and watch it go green. Five minutes, and nobody forgets what a gate is.

## Common misconceptions

- "Run every eval on every commit." Full agent evals cost dollars and minutes; tier them.
- "90% pass rate means 90% of customers are happy." Ask whether that is pass@k or pass^k, and per which failure mode.
- "A flaky test is the model's fault." Usually it is missing initial state or a judge that was not pinned.
- "Monitoring is a separate system." It is the same evaluators on live traffic, with sampling for the judges.
- "The gate should block on any failure." It blocks when a known mode gets worse than the baseline. Thresholds and a flake policy are part of the gate.

## Timing

Sections 1 and 2: 15 minutes. Section 3: 5 minutes. Section 4 with the arithmetic on the board: 10 minutes. Section 5: 5 minutes. Section 6 with the live gate demo: 15 minutes. Section 7: 10 minutes. Total 60 minutes.

## If you only have 20 minutes

Sections 1, 4, and 6: what a test case is, pass^k versus pass@k with the numbers, and the gate demo. Assign cost tiers, reset-and-replay, and monitoring as reading.

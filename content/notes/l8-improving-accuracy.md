## Talking points

- "Better" has two axes. Draw accuracy against cost on the board, place A, B, and C from the lesson, and ask which one to delete. The frontier is the set of points nothing beats on both axes.
- Comparability is the discipline: same suite, same tools, same harness, same seeds, one axis changed, config saved as a file. Without it every improvement is a story.
- The fix-routing ladder: prompt, tool design, harness, model or weights. Cheapest first. The made-up-delivery-date example shows the tool rung beating the prompt rung, which surprises people.
- The manual fix loop is a table: hypothesis, change, dev-slice result, keep or revert. Three iterations, one of them a revert. The revert is the part students skip and the part that matters.
- Automation comes after the manual loop, on the dev slice only, with a budget and human review of prompt diffs.
- Reward hacking: the optimizer finds what the judge rewards. "I have verified this" fooling a grounding judge is the example to tell. Defenses: held-out test, more than one judge, a human reading traces.
- The test slice is read once. Decide, write it down, stop.

## Live demo idea

Show a live fix loop on the delivery-date mode with a small dev slice (30 scenarios is enough). Iteration 1: add the prompt rule, run, show 12% to 9%. Iteration 2: change lookup_order to return estimated_delivery: null with a note, run, show 9% to 2%. Iteration 3: add a verification retry, run, show no gain and higher cost, revert on stage. End with a single run on the test slice and a one-line decision typed into the config file's changelog.

## Common misconceptions

- "Just use a bigger model." That is the last rung, and it does not fill a hole in a tool result.
- "If dev improved, ship it." Confirm on test once. Dev is what you tuned on.
- "The optimizer will find the best prompt." It will find the prompt the judge likes best, which is not the same thing.
- "More samples and a majority vote is always better." Config C in the lesson is more expensive and less accurate than B.
- "Reverts are failures." A logged revert is knowledge. An unlogged one gets retried next month.

## Timing

Sections 1 and 2: 15 minutes with the board drawing. Section 3: 10 minutes. Section 4 with the live loop: 15 minutes. Sections 5 and 6: 10 minutes. Section 7: 10 minutes. Total 60 minutes.

## If you only have 20 minutes

Sections 1, 3, and 4: the frontier drawing, the ladder, and the fix loop table. Assign automation, reward hacking, and the test-slice comparison as reading, and tell students to ask Eve for a reward-hacking example.

## Talking points

- Open with the argument: Omar says DR-2 is fixed, Tessa says DR-1 got worse, both are right. Push until someone says "run all the cases and count."
- Plant the word regression early. Engineers know it from code; it applies unchanged to prompts.
- Cases come from real inputs, the six recurring cases, and edge cases written on purpose. Every bad output Tessa returns becomes a case.
- Assertions for data, a judge for prose. Exact comparison fails good replies; a judge on JSON adds cost to what code does exactly.
- Binary criteria are the whole trick of the judge. "Names the exchange policy" versus "is polite enough."
- One change, one run, one changelog line. v1.5 shows a change with no score movement is still worth recording.
- Thinking is a change like any other; the pass rate, time, and cost table is the shape of the decision.
- Wrong layer: arithmetic to code, facts to the request, actions to tools, money to a product decision.

## Live demo idea

With the lesson's `evals/run.ts`, `checks.ts`, and a five-case `evals/intake/cases.json` in a repository, run `npm run evals intake` live and read the table. Edit `prompts/intake.system.md` to add "when a price is missing, use the RRP" and run again: IN-2 fails with `invented a price`. Revert, add `thinking: { type: "adaptive" }`, run again, and compare the wall-clock time. Close by writing the three changelog lines on screen, one per run.

## Common misconceptions

- "Three good runs of the case I changed means the change is good." That is how the DR-1 regression shipped. The set runs the cases you were not looking at.
- "The judge is objective." It is a model. Evidence per criterion and spot-checks against Tessa keep it honest.
- "More cases is always better." Twenty near-copies of IN-1 inflate the pass rate without testing anything new.
- "Thinking on is the safe default." It doubled Draft's wait for no gain. Measure per feature.
- "If the eval fails, rewrite the prompt." After three honest changes with no movement, the prompt is the wrong layer.

## Timing

Sixty minutes: story and section 1, six; the eval set, eight; assertions, seven; the judge, ten; running it, six; one change at a time, seven; thinking, six; wrong layer, seven; summary and homework brief, three.

## If you only have 20 minutes

Run the five-case Intake set live and break IN-2 with one prompt line (eight minutes). Put DR-1's rubric and the judge verdict on screen and teach binary criteria (six minutes). Finish with the three changelog entries and "which change moved the number?" (six minutes). Assign sections 7 and 8 as reading.

## Talking points

- Mr. Hale's three questions are the thread. Every section should end with "which file answers this?"
- "It works" versus "we can prove it." A green build is a fact about one moment on one machine. Evidence is a fact someone else can check later.
- The four questions (control, evidence, metric, cost) are asked about each gate, not about the change.
- A gate maps to an existing control with an owner. The gate did not invent the $200 threshold. Priya's policy did.
- Evidence lives outside any one engineer's control. The three artifacts are the decision log, the timestamped CI run, and the PR approval by the reviewer of record.
- Enforced every time × evidenced automatically. Make students explain why it is a product and not a sum.
- Retiring a gate on the strength of the wait-time table is a success, as long as the control is still satisfied and the change is logged.

## Live demo idea

Run a mock audit. Prepare a small repository with a merged PR, a CI run, a `.gates/log.jsonl` with a dozen lines, and a `spec.md` with an evidence section. Play Mr. Hale. Pick a student to be Omar and ask the three questions from the story, then "why $200?" Time it. Then ask the same questions about a second PR where the approval happened in chat and the log was on a laptop, and watch the answers turn into memories. Close by having the class fill in the evidence pack checklist for the first PR.

## Common misconceptions

- "Passing tests are evidence." A test run is evidence only when its record is stored somewhere trusted, with a timestamp and a commit.
- "The auditor wants to see the code." The auditor wants the control, the gate, and the proof, in that order. Code is rarely the answer.
- "Audit readiness is a project for audit week." It is a property of the workflow. If the chain leaves artifacts at each boundary, the pack already exists.
- "More gates means more readiness." A skipped gate scores zero and makes the spec lie. Fewer gates, all enforced, beats many gates, some skipped.
- "Wait time is the price of safety." Invisible wait time is how gates die. Measured wait time gets tuned.

## Timing

Fifty minutes: story and section 1, six; control, six; evidence, eight; metric, five; cost, six; the multiplication, seven; the evidence pack, seven; talking to an auditor and summary, five.

## If you only have 20 minutes

Do the mock audit with the prepared repository (ten minutes), teach the multiplication with the Friday gate and the unlogged hook as the two zeros (six minutes), and put the CR-102 evidence pack on screen as the takeaway (four minutes). Assign sections 4 and 5 as reading.

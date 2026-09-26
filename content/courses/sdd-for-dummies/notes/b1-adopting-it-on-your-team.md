## Talking points

- This lesson is a plan, not a new concept. Every week reuses something from L1 to L7: week one is L1 to L3, week two is L4, week three is L5, week four is L6 and L7.
- The opening question ("which action would you never let an agent pass?") is the lesson in miniature. The team already believes in gates. Adoption makes the gate they already want real, with a log behind it.
- Scale down on purpose. One change, one hook rule, twenty cases. Teams that spec the whole backlog in week one stall.
- Objections are answered with numbers. If you find yourself arguing, you have stopped measuring.
- The three explanations are one rule in three vocabularies. Students should produce all three for any gate.

## Live demo idea

Run the section 1 question live. Ask the room which action on their own team they would never let an agent perform unattended, and write the answers on a board. Group them: money, personal data, production, tests. Pick one and write the second half together: what evidence would change your mind. Push until the answer includes a number (runs, months, a pass rate) and a file (a log, an eval case). The group has now drafted weeks two and three of its own plan. Close by showing Bramble's first `.gates/log.jsonl` line and asking which of the board's gates would produce one like it.

## Common misconceptions

- "Adoption means a rollout across every team." It means one change through the chain on one team, with evidence, then width.
- "The first gate should be the riskiest one." The first gate is the test lock, because it is easy to explain and hard to argue with. The refund gate goes live in week four.
- "Twenty eval cases is too few to mean anything." Too few for confidence, enough to see drift, which is all week three needs.
- "Too slow is a values argument." It is a measurement: Bramble's median wait was 40 minutes, and the threshold moved on that number.
- "The auditor wants to see the code." Mr. Hale wants the control the gate satisfies and the file that proves it ran.

## Timing

Thirty minutes: story and section 1, six; weeks one and two, seven; weeks three and four, seven; objections, four; three explanations, four; next steps and summary, two.

## If you only have 20 minutes

Run the live demo question for eight minutes, teach the four weeks as one table for eight, then read the three explanations aloud and ask which one students would give their own manager. Assign sections 6 and 8 as reading.

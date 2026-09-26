## Talking points

- The nine-minute CR-101 is the thread for the whole session. Every rule gets tested against one question: would this rule have stopped the balance leak?
- A coding agent is a model in a loop. It acts without anyone reading each step unless you put a person at a boundary.
- "Done" is a decision, not a feeling. Three people gave three definitions for the same ticket, and the agent worked from the typist's.
- The four rules are the course's skeleton. Say them in order and keep saying them: intent first, criteria before code, every artifact signed, humans accept at boundaries.
- The one-liner is the exit ticket. Students should be able to say it without looking and map CR-101 onto each word.

## Live demo idea

Ask the room to define "done" for CR-101 in one sentence each, on paper, before you show any code. Collect five and read them aloud. Almost none will mention other customers' cards. Then show Nadia's `intent.md` and the three criteria, and ask which of the five sentences would have caught the leak. Close by opening any agent-authored pull request and asking, "who is the reviewer of record here?" If nobody can answer in ten seconds, the point is made.

## Common misconceptions

- "The agent understood the request, so it must have known the rule." It understood the words. It had no way to know a rule that lived only in Priya's head.
- "Green tests mean done." Tests check what someone thought to test. A missing criterion produces no failing test.
- "The intent is the same as the ticket." The intent names who, what, where, why, and what is out of scope, and a named person accepts it.
- "Rule 4 means humans review every line." It means a named human accepts at each boundary. Reviewing the diff is one part; checking it against the criteria is the part that matters.
- "Evidence is the code." Evidence is what proves the gate ran: a test log, a decision log, a signed header. Code is the thing the evidence is about.

## Timing

Thirty-five minutes: story and section 1, five; section 2 with the three definitions, five; rules 1 and 2, eight; rules 3 and 4, eight; the one-liner, four; where the course goes, three; the closing question, two.

## If you only have 20 minutes

Run the "define done" demo (six minutes), teach the four rules from the summary bullets with the `spec.md` header on screen (ten minutes), and end with the one-liner mapped onto CR-101 (four minutes). Assign sections 1 and 8 as reading and the closing question as written homework for the next session.

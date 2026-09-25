## Talking points

- Start with Sam's message. Ask the room what should happen. Most will say "block the message". The lesson's answer is "let the model be tricked, and make it not matter".
- The attack surface is everything the model reads: chat, order notes, emails, documents, tool results, memory. The gift note is the example that lands, because nobody thinks of a gift note as an input.
- Walk the OWASP agentic categories quickly with one Sprout example each; do not memorize numbers, the list changes. The point is that real incidents cross two or three categories.
- No reliable detector: injection is a meaning with endless paraphrases. Show the four phrasings from the lesson and ask which filter catches the French gift note.
- The three rules: authorization in code, least privilege per role, the model never holds credentials. This is Lesson 1's canCall grown up.
- Red team, then test. A finding without a test is a story.
- Guards: input, output, tool. The tool guard is the one that holds. T2 goes to a queue, and a timeout denies.
- Governance record: written for the day something goes wrong. Govern, Map, Measure, Manage. Keep the EU AI Act paragraph plain and repeat that it is not legal advice.

## Live demo idea

Run Sprout live with a customer session. Paste Sam's injection. Show the trace: the model calls issue_refund, the guard denies it, the reply is the policy answer. Then edit the harness to skip the guard (a one-line comment) and run the same message: the refund goes through. Restore the guard. Students see, in two minutes, that the prompt was identical both times and only the code changed the outcome. If promptfoo is set up, run a small red-team config against the endpoint and open the report.

## Common misconceptions

- "A good system prompt prevents injection." A prompt lowers the attempt success rate at the model; it does nothing to the harness.
- "An injection classifier is the fix." It is a speed bump with a TPR below 1.
- "The approval queue should approve on timeout so customers are not stuck." Deny on timeout. A stuck customer is recoverable; an unattended refund is not.
- "Governance is paperwork." It is the runbook for the worst day: who to call, what to switch off, where the traces are.
- "Least privilege only matters for admins." A hijacked customer session that can reach analyst tools is the whole problem.

## Timing

Sections 1 and 2: 20 minutes including the live injection. Section 3: 10 minutes. Section 4: 5 minutes. Section 5 with the guard code: 15 minutes. Section 6: 10 minutes. Total 60 minutes.

## If you only have 20 minutes

Sections 2 and 5: why there is no detector, the three rules, and the tool guard with the approval queue. Do the live injection. Assign the attack-surface table, promptfoo, and governance as reading.

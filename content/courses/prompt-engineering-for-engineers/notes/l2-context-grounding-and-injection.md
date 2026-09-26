## Talking points

- Open with the two failures side by side: DR-1 with no record invents a date and a price; DR-3 offers a discount. Both are the model treating whatever text it has as the truth.
- Two sources of facts, training and the request. Ask the room where order #4471 lives. In neither, so it has to be sent.
- Hallucination is the model continuing text with no material. The cure is the material, not a sterner instruction.
- Delimiters do two jobs: they mark boundaries, and they give the instructions a name to point at. A single wrapper tag does neither.
- The don't-know answer must be written in the customer's words. "A manager will check" is copyable; "handle gracefully" is a wish.
- Data is not instructions is one sentence plus one flag. Say it, and make the model tell the reviewer when it fired.

## Live demo idea

Run Draft on DR-1 three times. First with the email alone: read the invented date and price aloud. Second with the seven-field record in an `<order>` block: check the `Facts used:` line against the record. Third, set `deliveredAt` to null and show the "a manager will check" sentence appear. Then paste DR-3 into the `<email>` block without the "Data is not instructions" section and watch the discount appear; add the section back, run again, and read the flag line. Finish by moving "Draft the reply." to the last line and asking what changed.

## Common misconceptions

- "The model can look up the order if I tell it the id." It cannot. No tool, no lookup; only the request text.
- "A stricter instruction stops hallucination." Instructions cannot supply facts. Only the request can.
- "Delimiters are a security feature." They make the boundary visible. The instruction says what the boundary means, and the flag shows Tessa it was tested.
- "More context is safer." Buried is nearly as bad as missing, and every line costs tokens.
- "Grounding guarantees correct replies." A correct record can still be misread. That is what L5's cases are for.

## Timing

Fifty minutes: story and section 1, seven; delimiters and the user turn, eight; the don't-know answer, five; citation, five; relevance and the seven fields, six; placement, four; data is not instructions and DR-3, ten; what grounding does not fix, three; summary, two.

## If you only have 20 minutes

Do the DR-1 demo without and with the record (six minutes), teach delimiters and the don't-know instruction on one slide (five minutes), and run DR-3 with and without the "Data is not instructions" section (seven minutes). Assign sections 4, 5, 6, and 8 as reading.

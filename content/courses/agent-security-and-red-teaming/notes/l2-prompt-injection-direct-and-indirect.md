## Talking points

- Open with Rosa's ticket title, "same attack, two doors." The whole lesson is that direct and indirect injection are one mechanism reaching the model through different entry points.
- Direct injection: show the five versions of A-1 and ask which one a filter would catch. Stress that Sam is patient and not technical. Each failed attempt teaches him what the prompt is looking for.
- Goal hijacking versus jailbreak: the RefundBot exchange. A jailbreak removes the rule first; hijacking points the agent somewhere new. Same mechanism, and both succeed at a rate, never at zero.
- Indirect injection: walk A-2 slowly. Jordan asks about repotting, the search index returns page 3, the model reads white text it was never meant to see. Name the three multipliers: scale, distance, trust. Ask who the victim is and let the room notice that the attacker is not in the log.
- Filters: the six-disguise table. The line to land is that every ability that makes the model useful carries the disguise through.
- The prompt: the "data is not instructions" sentence and the pass-rate table. 4/5 held is progress and not a guarantee.
- What holds: the tool guard. Trace A-1 to `outside_return_window` and A-2 to Maya's queue. The guard never reads the attack text.
- Human-trust exploitation: read A-2's model-written summary aloud. Ask who would click approve at 4 pm on a Friday.

## Live demo idea

Run Sprout on staging with a test user who owns a copy of order #2001 delivered 90 days ago. Paste A-1 plain, then the "my lawyer says" version, then the French one. Show the model's tool call and the guard's denial in `logs/guard.jsonl` each time. Then switch the test user to one who owns a fresh order, seed the care-guide index with a PDF containing a visible version of the A-2 paragraph, and ask a fern question. Show the refund call landing in the queue as `pending_approval` and the model-written summary next to it. Students see three attacks, two entry points, one guard.

## Common misconceptions

- "Indirect injection needs a hostile supplier." It needs any text Pip's did not write. An order note from Sam is enough.
- "A classifier is a detector." It is a speed bump with a miss rate above zero and an attacker with unlimited tries.
- "The prompt sentence fixed A-2." It moved 1/5 to 4/5. Sam has a fifth try.
- "The tool guard detects injection." It never reads the text. It checks owner, amount, window, tier.
- "Once the request is in Maya's queue, the attack is over." The queue has a person at the end, and the model's summary is the last door.

## Timing

Sections 1 and 2: 12 minutes with the five versions and RefundBot. Section 3: 10 minutes on A-2. Section 4: 8 minutes on the disguise table. Section 5: 5 minutes. Section 6: 12 minutes tracing both attacks through the guard. Section 7: 8 minutes. Total 55 minutes.

## If you only have 20 minutes

Sections 3 and 6: A-2 and the tool guard. Trace Jordan's fern question through the index, the model, and the guard to Maya's queue. Assign the disguise table and the prompt pass-rate table as reading, and tell students the queue card is L7.

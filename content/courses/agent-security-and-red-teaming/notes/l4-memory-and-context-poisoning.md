## Talking points

- Open with the order note. Ask who has ever read one. Nobody has. Sprout reads every one of them.
- Context versus memory is lifetime and authorship. A-5 leaves with the session; A-6 is written by Sprout itself and read on every future session.
- Walk the four stores in the order the loop reads them: profile notes, summary, history, then care-guide chunks as tool results. Three of four are in front of the model before the customer speaks.
- The index fires on similarity, not intent. The poisoned fern chunk answers "what is your refund policy?" because the hidden sentence contains the word refund.
- Summaries are memory writes made by the model with no reviewer. Show the before-and-after and ask what happened to Sprout's own doubt.
- The write policy: facts with a source, never permissions or instructions. The harness sets author, source, and the dates; the model supplies text only.
- Provenance is rendered, not filed away. Even a staff note cannot approve a refund.
- End on the test: poison in the initial state, assertions on what the code did.

## Live demo idea

On staging, log in as the test user and run A-6 in four short sessions, reading the profile notes back after each. Start a fresh session and ask for the refund. Show the guard log: queued, not run, and the approval card with the poisoned summary. Enable the write guard and provenance rendering, purge the note, and repeat. Session 2 is denied with instruction_in_note; the fresh session escalates. Run tc-adv-memory-preapproved-042 against both versions.

## Common misconceptions

- "Memory poisoning needs a memory feature." Summaries and the retrieval index are memory too.
- "Only chat messages need a source tag." Order notes, tool results, and Sprout's own notes need one too; the model cannot tell them apart otherwise.
- "The regex in the write guard is the fix." It is a speed bump. The fix is that notes render as data and permissions live in code.
- "A staff note can pre-approve a refund." Approval happens in the queue with the raw order on the card.
- "Purging the note ends the incident." Search the summary and the cache for the same words first.

## Timing

Section 1: 5 minutes. Section 2: 7 minutes. Section 3: 6 minutes. Section 4: 6 minutes. Section 5: 12 minutes with the four-session walkthrough. Section 6: 8 minutes. Section 7: 6 minutes. Total 50 minutes.

## If you only have 20 minutes

Sections 1, 5, and 7: context versus memory, the write tool as an entry point with the A-6 walkthrough, and the adversarial case. Do the four-session demo if staging is up. Assign the rest as reading.

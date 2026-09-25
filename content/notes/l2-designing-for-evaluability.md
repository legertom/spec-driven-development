## Talking points

- The refund complaint is the thread. "Did it?" is a thirty-second question when traces exist and an unanswerable one when they do not.
- Instrument before traffic and record 100% until volume forces sampling.
- The data model is small: eight fields, nesting through `parent_id`.
- Three kinds of spans carry the facts: model calls, tool calls, and permission decisions. The permission span is the one everyone forgets.
- Prompt hashes: nobody forgets to compute a hash, and everybody forgets to bump a version number.
- Evaluability pays off later: replay in L4 and L8, scenario ids in L3 and L6, versions whenever behavior changes.
- Reading a trace means finding the first failure, not the last symptom.

## Live demo idea

Start Langfuse before class. Run Sprout on "Where is order #1042?" and click through the trace live: the tree, the token counts, the full tool result, the prompt hash in metadata. Then run "When will order #1707 arrive?" and let the model invent a date. Ask the class to find the first failure by walking the tree top down. Most will click the last span first; use that to teach the "walk from the top" rule. Without Langfuse, print the JSON from section 2 and do the walk on paper.

## Common misconceptions

- "Logging is tracing." Logs are lines. Traces are structured, nested, and queryable.
- "The last span is the failure." The last span is where the symptom shows. The first failure is usually earlier.
- "A summary of the input is enough." Without the complete messages array you cannot replay the span.
- "Prompt versions are enough." Version numbers get skipped. A hash of the text cannot be wrong.
- "Traces are internal, so privacy does not apply." Traces are a database of customer conversations: mask card numbers, control access, set retention.

## Timing

Fifty minutes: story and section 1, six; data model with the JSON, ten; what to record and prompt hashes, eight; Langfuse and ClickHouse with the demo, ten; evaluability, six; reading a trace, six; checklist, four.

## If you only have 20 minutes

Show the four-span JSON and walk the `parent_id` chain (six minutes). Do the invented-date trace read from section 6 together (six minutes). Show one trace and point at the prompt hash and the permission field (five minutes). Hand out the section 7 checklist and assign sections 3 through 5 as reading.

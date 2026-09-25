## Talking points

- The refund complaint is the thread. "Did it?" is a thirty-second question when traces exist and an unanswerable one when they do not.
- Instrument before traffic and record 100% until volume forces sampling. Students building a course project have no volume problem; they have no excuse.
- The data model is small: eight fields, nesting through `parent_id`. The four-span JSON is the same shape as the four-row table in L0, now with real ids and metadata.
- Three kinds of spans carry the facts: model calls (model id, prompt hash, params, tokens, latency), tool calls (name, args, full result, error), and permission decisions (allowed or denied, with a reason). The permission span is the one everyone forgets.
- Prompt hashes: nobody forgets to compute a hash, and everybody forgets to bump a version number.
- Evaluability is about later lessons: complete inputs so spans can be replayed (L4, L8), scenario ids so a failing test leads to its trace (L3, L6), and versions so a change in behavior can be blamed on a change in something.
- Reading a trace means finding the first failure, not the last symptom.

## Live demo idea

Start Langfuse from the compose sketch before class so it is warm. Run Sprout on "Where is order #1042?" and click through the trace live: the tree, the model call with its token counts, the tool call with its full result, the prompt hash in metadata. Then run "When will order #1707 arrive?" and let the model invent a date. Ask the class to find the first failure by walking the tree top down. Most will click the last span first; use that to teach the "walk from the top" rule. If Langfuse is not available, print the JSON from section 2 and do the same walk on paper.

## Common misconceptions

- "Logging is tracing." Logs are lines. Traces are structured, nested, and queryable. You grep a log; you query a trace.
- "The last span is the failure." The last span is where the symptom shows. The first failure is usually earlier.
- "A summary of the input is enough." Without the complete messages array you cannot replay the span, and replay is what turns a complaint into a reproducible case.
- "Prompt versions are enough." Version numbers get skipped. A hash of the text cannot be wrong.
- "Traces are internal, so privacy does not apply." Traces are a database of customer conversations. Mention masking card numbers, access control, and retention before launch.

## Timing

Fifty minutes: story and section 1, six minutes; data model with the JSON, ten; what to record and prompt hashes, eight; Langfuse and ClickHouse with the demo, ten; evaluability, six; reading a trace, six; checklist, four.

## If you only have 20 minutes

Show the four-span JSON and walk the `parent_id` chain (six minutes). Do the invented-date trace read from section 6 and find the first failure together (six minutes). Show one trace in Langfuse or on paper and point at the prompt hash and the permission field (five minutes). Hand out the section 7 checklist and assign sections 3 through 5 as reading.

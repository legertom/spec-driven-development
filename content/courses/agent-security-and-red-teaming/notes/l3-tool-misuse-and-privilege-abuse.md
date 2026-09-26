## Talking points

- Open with the grandmother story and pause on one sentence: nothing was injected. This lesson is about tools that trust the model to know things it cannot know, such as who owns an order or what it cost.
- Excessive agency is a gap, not a bug. Ask the room to name a tool an agent they know did not need.
- The four privilege attacks in one line each: BOLA (the object is not yours), argument tampering (the numbers are wrong), role confusion (the tool is not yours), confused deputy (the tool sees more than you may). Shorthand: object, argument, role, authority.
- Every defense has the same shape: the fact comes from the session or the database, never from the message.
- Cascades: each step was fine, and the tier rule is what holds when everything else passes. Rate limits bound blast radius.
- Close on the allowlist table. It is the spine of L6.

## Live demo idea

Run Sprout on staging with two seeded customers, Alex and Jordan, and the scoping check commented out. As Alex, ask about "my grandmother's order #1077." Show the tool result carrying Jordan's address. Uncomment the check, run the same message, and show `not_owner` in `logs/guard.jsonl`. Then, as Sam, request $350 on #2001 and walk the log from `invalid_amount` to `outside_return_window` to `pending_approval` as you adjust the request. The prompt never changes; only the code does.

## Common misconceptions

- "Telling the model the user's id fixes BOLA." The model still cannot know who owns #1077. Ownership is a database fact.
- "Validation means asking the model to double-check." The model's confirmation comes from the conversation the attacker steers. Validation reads the record.
- "The confused deputy is the same as BOLA." In BOLA the object belongs to someone else. In the confused deputy the object is the user's own, and the agent sees more of it than the user may.
- "Rate limits are a performance feature." They bound what a compromised session can do.
- "If every step is valid, the outcome is valid." Cascades are made of valid steps. Irreversible calls get a person.

## Timing

Why this matters and section 1: 8 minutes. Sections 2 and 3 with the live demo: 15 minutes. Sections 4 and 5: 10 minutes. Section 6: 7 minutes. Section 7: 5 minutes. Section 8 and the table: 10 minutes. Total 55 minutes.

## If you only have 20 minutes

Sections 2, 3, and 8: the scoping check, `invalid_amount`, and the allowlist table. Do the two-customer demo. Assign sections 4 to 7 as reading and the free-response question as the exercise.

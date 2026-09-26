## Talking points

- Open with the story: six red tests, and the tool guard alone turns three green in a day. Build it first.
- Layers, not detectors. Ask which guard the room would bet money on. Input and output are best effort; the tool guard must hold because it never asks the model anything.
- The loop: three wrapper calls, and `runTool` is only reachable from inside `toolGuard`. The input guard runs on every tool result, not only on chat.
- Canary tokens: one per store on staging. A canary in the guard log names the store the attacker reached.
- The tool guard table: allowlist, rate limit, owner, arguments, tier. Walk A-1 through A-6 down it and name the reason string that stops each.
- Logs prove a decision happened; tests prove it was right.
- Close on what guards cannot do: honesty, policy, intent. L7 adds the people.

## Live demo idea

Run staging Sprout with the tool guard and paste A-4: a $350 refund on order #2001. Show `{ error: "invalid_amount" }` and the line in `logs/guard.jsonl`. Comment out the `invalid_amount` check, rerun, and show the request reaching the queue with amount 350. Restore the check and run the unit test `A-4 invalid_amount` so students see it go red, then green.

## Common misconceptions

- "A better regex in the input guard would stop injection." It stops yesterday's phrasing. The tag and the tool guard hold.
- "The output guard is the safety net, so the tool guard can be looser." It cannot undo a refund that ran.
- "Guards belong in the system prompt." A prompt rule can be talked out of. A guard runs whether the model agrees or not.
- "A denied call should tell the customer why." `not_owner` becomes "I cannot find that order in your account." Confirming the id exists is a leak.

## Timing

Sections 1 and 2: 12 minutes including the A-2 walk-through and the loop. Section 3: 8 minutes. Section 4: 7 minutes. Section 5 with the tool guard and the six attacks: 15 minutes. Section 6: 5 minutes. Sections 7 and 8: 8 minutes. Total 55 minutes.

## If you only have 20 minutes

Sections 1, 2, and 5: layers versus detectors, the three calls in the loop, and the tool guard walked against A-1 through A-6. Do the A-4 demo. Assign the rest as reading, and ask students to write the `A-3 not_owner` unit test before next session.

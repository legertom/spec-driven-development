## Talking points

- Open with the bakery bot: a friend has an agent going live next week and thirty minutes. What do you send? Two lists, not the course.
- Every yes on the checklist is a link. A yes with no file, test, or log line behind it is a no that has not been checked.
- If the room can only fix three things, it is 3, 4, and 5. Everything else is a layer on top of the tool guard.
- The ten attacks are judged by what happens after the model is fooled. The model falling for A-1 and the guard denying the refund is a pass. Ten refusals with no guard is a fail waiting for the eleventh rephrasing.
- The two explanations are a rehearsal. Pair students and have one push back with "but the prompt says so."

## Live demo idea

Bring Sprout on staging at its L6 state and a test user, with `logs/guard.jsonl` open. Run attacks 1, 3, 4, and 8 from the table without reading the replies. Then read the log: a queue entry, `not_owner`, `invalid_amount`, and no approval for row 8. Ask which checklist questions those lines are the links for (3, 4, 5, 12). If time allows, comment out the owner check, replay attack 3, and show Jordan's address in the reply with no injection anywhere.

## Common misconceptions

- "Fifteen yes answers means the agent is safe." It means the work was done once. The threat model and the monthly review cover what comes next.
- "The attack list tests whether the model resists." It tests what happens when it does not. A refusal is quality; a denial in the guard log is security.
- "A prompt line about impersonation handles row 8." The role comes from the login and the tool guard reads it. The conversation cannot change it.
- "The checklist replaces the governance record." Question 15 points at the record. The list is the index; the record is the evidence.

## Timing

Why this matters and section 1: 12 minutes, including scoring the first Sprout out loud. Section 2: 10 minutes, with the demo if you have one. Section 3: 5 minutes as the partner exercise. Section 4: 3 minutes. Total 30 minutes.

## If you only have 20 minutes

Section 1 with the first-Sprout scoring, then rows 1, 3, 4, and 8 of the attack table with the guard log open. Assign the two explanations as the short-answer question and section 4 as reading.

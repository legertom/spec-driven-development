## Talking points

- Tessa's ten drafts are the thread. Ask the room which line in the one-line prompt caused each failure. No line did, and that is the lesson.
- The model predicts the next token. Say it once and return to it in every section: instructions steer prediction, wishes do not, tokens compete, temperature samples.
- Three kinds of material: instruction, context, data. Students will call the order record "data." Push back: data is the thing worked on (the email); context is the fact needed to work on it (the record).
- System prompt versus user turn is a maintenance decision. Standing rules in a file Tessa can read; per-call facts built by code.
- The deletion test is the tool to take away: if removing a line changes no reply, it is decoration. Run it live on "be helpful."
- Close on the one-liner: a prompt is code; treat it like code. The three verbs are the course map.

## Live demo idea

Open a scratch script using the `client.messages.create` shape from section 3. Send the DR-1 email with Omar's one-line system prompt and read the reply aloud; it will probably promise something. Swap in the five-line system prompt and send again. Then send it three times in a row and put the replies side by side. Ask: which criteria do all three meet? That question is the seed of L5. If time allows, paste a long irrelevant policy block into the system prompt and show the reply getting worse and slower.

## Common misconceptions

- "The model looks things up." It does not. Order #4471 is unknown to it until the record is in the request. L2 builds on this.
- "More instructions means safer output." Every line competes for attention. A long rule list is followed less reliably than a short one.
- "The system prompt is for important text and the user turn is for chat." Both are read equally. The split is about what changes per call.
- "If the output varies, the prompt is broken." Variation is normal. The test is whether every output meets the criteria.
- "Setting temperature to zero makes it deterministic." It reduces variation but does not remove it across versions or days.

## Timing

Thirty-five minutes: story and section 1, six; three kinds of material, five; system prompt and user turn with the code, seven; why "be helpful" does nothing, five; tokens and the window, four; temperature, four; a prompt is code and the verb table, four.

## If you only have 20 minutes

Run the live demo with the one-line and five-line prompts (eight minutes), teach the deletion test on "be accurate" with the delivery-date rewrite on screen (six minutes), and close with the three-verb table and the one-liner (six minutes). Assign sections 5 and 6 as reading.

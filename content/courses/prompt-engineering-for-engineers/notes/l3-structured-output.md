## Talking points

- The thread: why can a computer not read what a computer wrote?
- Free text fails three ways: prose around the JSON, keys that drift, guessed values. Show the three IN-1 outputs and ask for one parser.
- Required and nullable are different questions. `unitPrice` is both. A present null is a statement; a missing key is a shrug.
- A forced tool call closes the prose route. The tool need not exist; the call is the output.
- The schema constrains shape, not meaning. The padded ISBN passes the API and fails the check digit.
- Retry with the error, cap it at two, then fail loudly. Frequent retries mean a prompt problem.
- Null, low confidence, and an empty array are correct answers. The prompt must say so; the model resists all three.

## Live demo idea

Run IN-1 through a "return the titles as JSON" prompt three times and paste the outputs side by side. Ask for a parser. Switch to the forced `record_offers` call, run it three times, and diff: only the `notes` text moves. Run IN-2 and watch for a padded ISBN; if the model behaves, hand-edit the `input` to `"0000316769487"` and feed it to `OffersSchema.safeParse` so the class sees the check-digit message. Send it through the retry loop and show the second attempt returning null. Finish with IN-3 and the empty array.

## Common misconceptions

- "'Respond only in JSON' is structured output." It is a wish. The forced tool call is the mechanism.
- "If the schema accepted it, it is valid." The schema does not know what an ISBN is. Validation in code does.
- "Null means the model failed." Null means the email did not say. A guessed number is the failure.
- "Retry until it passes." Two retries, then throw. An unbounded loop has no cost ceiling.
- "An empty result is an error." IN-3 is a success with zero rows.
- "Confidence replaces null." A guessed price at low confidence is still a wrong number.

## Timing

Fifty-five minutes: story and section 1, seven; the schema, eight; the forced tool call, eight; validation and the check digit, nine; the retry loop, seven; unknown versus guess, seven; zero as an answer, four; where the shape lives, three; questions, two.

## If you only have 20 minutes

Show the three IN-1 outputs and ask for a parser (four minutes). Teach required versus nullable on the record schema (five minutes). Show the forced call and the padded ISBN failing zod (seven minutes). Close with the IN-2 record done right: two nulls, low confidence, facts kept in notes (four minutes). Assign sections 5, 7, and 8 as reading.

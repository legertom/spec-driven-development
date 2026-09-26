## Talking points

- Open with the two failures side by side: the swapped "12 x ... @ 8.50" numbers that one example fixed, and the *Sea of Poppies* title that ten examples leaked into IN-3. Same tool, opposite outcomes.
- An example is an instruction written as a pair. Format, edge cases, and tone are the three reasons to pay for one.
- The model cannot tell pattern from content. Too many, too similar, too memorable, and content leaks. The fix is four examples: normal, null, zero, adversarial.
- A template is how customer text lands inside a data block instead of on the end of an instruction sentence.
- The version string in the log line is what answers Priya.
- Caching is a memory of the prefix. Stable first, varying last, marker at the end of the stable part. It saves input cost and latency on the prefix and nothing else.

## Live demo idea

Bring `prompts/intake.examples.md` with four examples and an `intake.system.md` with ten. Run IN-3 against each and show the empty array versus the copied title. Then run DR-1 three times with the timestamp on line 1 of the system prompt and print the cache read count from each response (0, 0, 0), then move the date into the user turn and run again (write, read, read).

## Common misconceptions

- "More examples are always safer." Past four or five, content starts to leak. New cases go into the eval set, not the prompt.
- "The examples go in the user turn with the data." They are stable, so they belong before the marker, at the end of the system block.
- "A template escapes the customer's text." It places the text; the data-is-not-instructions rule from L2 handles what the text says.
- "Git history is the version log." Git says when a file changed. Only a version string in the per-call log says which prompt a given call used.
- "Caching saves output tokens." It saves input cost and latency on the unchanged prefix. Output is always generated fresh.

## Timing

Fifty minutes: story and section 1, seven; when examples hurt, six; choosing three to five, nine; templates and variables, eight; versioned files and the log line, six; stable prefix and the marker, nine; busting the cache, five.

## If you only have 20 minutes

Show the IN-3 leak and the four-slot examples file (eight minutes), then the cache demo with the timestamp moved out of line 1 (eight minutes). Close with the log line that answers Priya and the rule: stable first, varying last, version in every log line (four minutes). Assign sections 4 and 5 as reading.

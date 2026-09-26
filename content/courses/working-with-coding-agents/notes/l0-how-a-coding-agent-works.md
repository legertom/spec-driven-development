## Talking points

- Open with the flaky test and let the room sit with it: the suite is green, the assertion is gone, and Quill did what it was told.
- The loop is four words: read, decide, act, observe. Draw it once and point back to it every time a student asks "why did it do that?"
- Context is the whole story. If it is not in the text the model is reading right now, the agent does not know it.
- Sessions drift because the window fills, not because the model is careless. The turn-3 constraint is not disobeyed; it is summarized away.
- Reads look, edits and commands change things. A permission is a decision about a change: run, ask, or refuse. Show the settings block and name it as a Claude Code shape.
- Close on the one-liner and make everyone say it: brief like a lead, drive like a pair, review like a stranger.

## Live demo idea

Run a real session on a small repo with a deliberately flaky test (a shared fixture two tests mutate works well). Give the agent the bare prompt "fix the flaky test" and let the room watch the tool calls scroll by. Narrate the loop out loud: that is a read, that is a search, that is an edit. When it removes or weakens the assertion, stop and ask what sentence was missing. Then start a fresh session with the definition of done from section 5 and run it again.

## Common misconceptions

- "The agent remembers what I told it last week." It remembers nothing across sessions. Only files persist.
- "It ignored my instruction." Either the instruction was never in the context, or the window filled and it was summarized out.
- "A green test suite means the fix is right." Green says the tests that exist pass. It says nothing about a test that was deleted.
- "A bigger model will not invent methods." Every model completes patterns. Running the type check is the defense that does not depend on the model.

## Timing

Thirty-five minutes: story and the loop, seven; what the agent can see, five; the context window, five; tools and permissions, six; literal about asking, five; hallucinated APIs, four; brief, drive, review, three.

## If you only have 20 minutes

Show the loop with the four tool calls on screen (five minutes), run or replay the flaky test demo with and without a definition of done (ten minutes), and close with the three verbs and the one-liner (five minutes). Assign sections 3, 4, and 6 as reading.

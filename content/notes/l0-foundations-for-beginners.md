## Talking points

- This lesson is vocabulary plus one habit. The vocabulary: token, prompt, context, agent loop, tool call, tool result, trace, span. The habit: decide what correct means before you build.
- Sampling is the first idea to land. Same input, different output, and nothing is broken. Everything later (why assertions fail, why we measure rates instead of checking one run) follows from it.
- Say "the model asks, your code runs" three times in different words. It is the single most useful mental model in the course, and it is the one beginners get wrong.
- Present the trace as a flight recorder, not as logging. The four-row table in section 5 is the shape they will see in Langfuse in L2.
- Section 8 is a reference. Tell students to bookmark the tools table; the quizzes for every lesson use those exact names.

## Live demo idea

Open a chat window or a small script and send "Suggest a name for a fern" twice at the default temperature. Read both answers aloud. Then set temperature to 0 and send it twice more. They will probably match; say out loud that "probably" is the point. Next, send a question that needs a tool ("Where is order #1042?") to a raw API call with the `lookup_order` schema attached, and show the `tool_use` block in the response. Point at it and say: nothing has happened yet. Then show the line of your code that would run the function. Five minutes, and both misconceptions below are handled visually.

## Common misconceptions

- "The model runs the tool." No. The model emits a request; your harness runs the function and returns the result.
- "The model remembers the conversation." No. Your code resends the whole history every turn. Nothing you do not send exists for the model.
- "Temperature 0 makes the model deterministic." Mostly, but not guaranteed. Treat every answer as one sample.
- "If the reply reads well, it is right." A fluent invented date is the canonical failure in this course. Only the trace can tell fluent from true.
- "The spec is extra paperwork." The spec is what makes the "Tuesday" bug checkable by a program.

## Timing

Eight sections at about four minutes each, 32 minutes, plus three minutes to introduce the quiz. Sections 1 and 3 usually run long because of questions; take the time from sections 2 and 4, which are easy to read alone. Leave section 8 as a two-minute walkthrough of the tables.

## If you only have 20 minutes

Teach sections 1, 3, 5, and 7 in that order: what a model does, the loop, the trace, the mindset. Show the four-row trace table and the verbs table. Skip the schema and assertion details, and assign sections 2, 4, 6, and 8 as reading before L1. Run the two-prompts demo if you have even three minutes; it is the memory that sticks.

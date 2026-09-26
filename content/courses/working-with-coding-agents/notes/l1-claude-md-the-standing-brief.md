## Talking points

- Omar's 900-line brief is the thread. Open with the two visible failures (`npm test` instead of `make test`, tests in `__tests__`) and ask what the brief should have said. Both answers are one line each.
- The brief is read at the start of every session and is the only thing the agent knows before it opens code.
- Three files, three owners: project (committed, shared), user (`~/.claude/CLAUDE.md`, follows the person everywhere), local (`CLAUDE.local.md`, ignored by git). Headline the mistake of a personal path in the shared file.
- Five sections. Commands are exact strings. Conventions are rules no tool enforces. Boundaries come in two strengths, never and ask first, and ask first needs a name.
- Import what every task needs, point at what only some tasks need.
- The rule-the-agent-breaks test is the lesson in one sentence: a line earns its place by naming the mistake it prevents. Bloat costs context and attention. Three cuts: code shows it, a tool enforces it, only true today.

## Live demo idea

Bring a real repository with no `CLAUDE.md`. Run `/init` and read the draft aloud. Go line by line and ask the room which mistake each line prevents. Delete every line that gets silence; a 60-line draft usually comes down to 15. Then add two lines the draft could not know: the real test command and one boundary with a named person. Commit that. If time allows, ask the agent for a small change and watch whether it uses the command you named.

## Common misconceptions

- "A longer brief is a safer brief." Each added line dilutes the ones already there and costs context on every turn.
- "The brief is read once and remembered." It is read every session because nothing is remembered between sessions.
- "Importing a doc is free." An imported file is in context on every turn. Pointers are free until used.
- "A line in the brief is a rule." It is advice. If the agent keeps breaking it, the line was right and needs a hook (L4).
- "The style guide belongs in the brief." The formatter and linter enforce it, so it is the first cut.

## Timing

Fifty-five minutes: story and section 1, seven; where it lives, six; the five sections with the Shelf brief on screen, ten; imports and pointers, six; the rule the agent breaks, nine; brief bloat and Jun's edit, nine; keeping it alive, five; homework briefing, three.

## If you only have 20 minutes

Show the Shelf brief in full and name the mistake behind each line (seven minutes). Run the `/init` demo with the delete-on-silence rule (eight minutes). Close with the three pruning cuts and assign sections 2, 4, and 7 as reading before the homework (five minutes).

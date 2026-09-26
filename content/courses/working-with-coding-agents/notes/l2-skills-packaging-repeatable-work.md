## Talking points

- Open with the Friday release notes. Ask who re-explains the same procedure every week. That is the skill they will write.
- The distinction that carries the lesson: the brief is read every session, a skill is read when invoked or matched. Load cost decides the layer.
- The description is a search key, not a comment. The "Use when" sentence should hold the words a person actually types.
- A procedure instructs; it does not describe. "Make sure it is well tested" is a wish, not a step.
- The done check ends with evidence, not a claim. `git status --short` is the habit the review lessons build on.
- A subagent is for a job a stranger could do well: fresh context, bounded tools, a report back. It is not a way to build faster.
- The task brief is the only layer that is not a file: goal, done, constraints, do-not-touch, verify.

## Live demo idea

Start with a repository that has a `CLAUDE.md` and no skills. Ask for release notes in plain words and watch the format wander. Create `.claude/skills/release-notes/SKILL.md` and `template.md` live, following the lesson's file exactly, and run `/release-notes v2.4`. Show the substituted step 1. Then ask for a changelog without the slash command and show the agent picking the skill from its description. Finish with `.claude/agents/test-reviewer.md` on a diff with a weak test; point at the `tools` line that keeps it read-only.

## Common misconceptions

- "A skill is a shorter CLAUDE.md." The brief is always loaded; a skill is loaded on demand. A procedure in the brief costs context on every unrelated task.
- "The description is documentation." It is the matching rule. A vague description means the skill is only ever reached by the slash command.
- "Subagents make the work faster." A subagent starts from zero and cannot see the conversation. It suits review and exploration, not implementation.
- "The task brief goes in a file." It is the message that starts the work. What proves always true migrates to `CLAUDE.md` later.
- "$ARGUMENTS is filled in by the agent." It is replaced by the text typed after the skill name, before the agent reads the body. An empty argument is a case the procedure must handle.

## Timing

Fifty minutes: story and section 1, six; anatomy and the description, seven; the procedure, seven; arguments, four; supporting files, four; subagents, eight; the task brief, eight; the decision table, six.

## If you only have 20 minutes

Write `release-notes/SKILL.md` live and invoke it with a tag (eight minutes). Compare the CR-110 task brief with "add a low stock badge" and ask which decisions the short version leaves open (seven minutes). Close on the decision table and the question "when is this needed?" (five minutes). Assign sections 5 and 6 as reading.

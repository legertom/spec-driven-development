## Talking points

- Open with Rosa's day: playbook, staging Sprout, test user, four hours, three findings by lunch. The lesson turns that day into files that outlive it.
- Rules of engagement first. Ask what goes wrong if a red-team prompt works in production: you caused the incident.
- Personas are about coverage. Sam finds more than the technical persona because he only needs time.
- The manual session: a row per attempt, holds logged too. Row 3 (split across turns) still holds because the T2 gate caught the request.
- promptfoo: plugin is the crime, strategy is the disguise. The config is a sketch; the docs are the source of truth.
- Triage is three questions: did it really happen, how bad is what the code allowed, who fixes it by when. Severity is the tool and the data, not the cleverness.
- Attack to test: assertions are on the harness; the model is allowed to ask. Fail-closed grades strictly; zero-tolerance means one failure blocks.
- Cadence: monthly by hand, every prompt or tool change by tool, every pull request by suite.

## Live demo idea

Bring a staging Sprout and a seeded test user. Play Sam for five minutes with the room suggesting rephrasings of A-3, logging each attempt on a shared table. When one lands, write the YAML case live: initial state with Jordan's #1077, the input, three assertions, the tags. Run the suite red. If promptfoo is set up, run the lesson's config against staging and triage one failure out loud.

## Common misconceptions

- "Red-teaming is a tool you run." The tool comes second; the manual session teaches you what to tell it.
- "A finding means the model is broken." The model being fooled is assumed. A finding means the code let something happen.
- "A clever attack is a severe one." Severity is the tier reached and the data exposed.
- "The judge failing it means it failed." The judge has an error rate. Read every failure; dismiss false positives.
- "One red-team day is enough." Prompt edits reopen holes. The suite on every pull request holds the line.

## Timing

Sections 1 and 2: 10 minutes. Section 3 with the live manual session: 15 minutes. Sections 4 and 5: 10 minutes. Section 6: 7 minutes. Section 7 with the case written live: 13 minutes. Section 8: 5 minutes. Total 60 minutes.

## If you only have 20 minutes

Sections 3, 6, and 7: play Sam by hand until one attempt lands, triage it in three questions, and write the fail-closed case together. Assign the playbook header, the promptfoo config, and the cadence table as reading, and set the homework.

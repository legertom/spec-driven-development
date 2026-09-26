## Talking points

- CR-103 is the thread. At every link, ask the room: which file, signature, or attached log would have put the consent question in front of Priya before Quill wrote a line?
- The chain is ordered and each link carries the previous one forward. That is the difference from a checklist.
- Routing is a sentence in a file, not a meeting. Show the constraints block: owner named, rule stated, question asked, answer written underneath with a date.
- The plan is approved because a page is cheaper to correct than a diff. Read the "will not touch" list slowly.
- A log is evidence, a sentence is a claim.
- The agent never promotes its own work. Quill drafts, runs, and opens. A named person crosses every boundary.

## Live demo idea

Put the six-row chain table on screen with the "Who accepts" column hidden. Hand out CR-101 and ask the class to fill the column in, then reveal the real one. Next, open a blank `plan.md` and draft a plan for CR-103 as Quill would. Ask the room to edit it before you "approve" it. Someone will spot that it runs against production or writes a CSV into the repo. Add the line to "Will not touch," sign it with today's date, and point out that the build has not started yet.

## Common misconceptions

- "The PR review is where policy gets checked." That is a week too late; it is the CR-103 story. Policy is routed at the spec link.
- "The plan is a formality because the code will be reviewed anyway." A plan takes a minute to read and catches the expensive mistakes.
- "Attaching the test log is redundant because CI shows green." Green is a dashboard that changes. The log on the PR is fixed evidence with a commit and a time.
- "The eval suite tests Shelf." It tests Quill's configuration. `make test` tests Shelf.
- "Quill opening the PR is a promotion." Opening is drafting. Merging is the promotion, and a named human does it.

## Timing

Forty-five minutes: story and section 1, six; intent, five; spec and routing, seven; plan and Omar's edits, seven; make test, five; evals preview, four; the merged PR, five; boundaries and promotion, six.

## If you only have 20 minutes

Run the hidden-column demo on the chain table (six minutes), walk the CR-103 constraints block and Priya's two answers (six minutes), then show the plan with Omar's two edits next to the boundaries table (eight minutes). Assign sections 5, 6, and 7 as reading.

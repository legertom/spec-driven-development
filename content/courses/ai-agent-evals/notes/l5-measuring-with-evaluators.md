## Talking points

- Open with Pip's question, "how often?", and let the room feel how weak "we saw it a few times" sounds. The whole lesson is about producing a number you can defend.
- Binary beats scores. Ask two students to rate the same reply 1 to 5 and watch them disagree by one point. Then ask "did it promise a refund outside policy?" and watch them agree instantly.
- Code checks first, judges second. Every mode gets the question: can a few lines of code decide this from the trace? If yes, no judge. Judges cost money and need validation; code needs neither.
- TPR and TNR are two different mistakes. Say it plainly: TPR is "how much it catches", TNR is "how often it leaves good traces alone". Accuracy blends them and hides the one that matters.
- The test set is an exam. Once you have seen it and reacted, it is a practice exam.
- The corrected-prevalence formula looks scary and is two subtractions and a division. Do it on the board with the 500-trace numbers and then verify it backwards (34 true positives plus 46 false alarms equals 80 flags). The backward check is what makes it click.

## Live demo idea

Bring 20 short traces on slides with Maya's labels hidden. Have the class label them for one mode. Reveal a judge's verdicts and build the confusion matrix live on a whiteboard, one tally at a time. Compute TPR and TNR from the tallies, then compute accuracy and show how it flatters a judge that mostly says pass. If there is time, bootstrap by hand: ten index cards, draw with replacement five times, and watch the prevalence swing from 0% to 50%.

## Common misconceptions

- "High accuracy means a good judge." Only when failures are common. Show the always-pass judge.
- "The judge can grade itself." A judge is a guess until humans checked it on labeled traces.
- "A 1 to 5 score is more informative." It is less consistent and does not name a failure to fix.
- "Looking at test results for information is harmless." If it changed what you did next, it was tuning.
- "More traces fix everything." Sixty traces with seven failures still give a wide interval. Report the interval.

## Timing

Sections 1 to 3: 15 minutes. Section 4 with the live confusion matrix: 20 minutes. Section 5: 5 minutes. Section 6 with the bootstrap and the correction: 15 minutes. Section 7 and the homework briefing: 10 minutes. Total 65 minutes.

## If you only have 20 minutes

Do sections 1, 2, and 4 only: one binary evaluator per mode, code before judges, and TPR / TNR with the confusion matrix on the board. Assign sections 5 to 7 as reading and point students at Eve for the bootstrap.

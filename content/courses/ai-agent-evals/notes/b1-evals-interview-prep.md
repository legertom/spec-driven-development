## Talking points

- Every trap is the same mistake wearing a different coat: a number with nothing behind it. Say that sentence first and come back to it after each trap.
- Traps 1 and 2 travel together: an unvalidated judge and accuracy without TPR / TNR. The counter is always "how many labeled traces, and what were the two numbers?"
- Trap 6, pass@k versus pass^k, is the one interviewers use to separate people who have shipped from people who have read. Have the numbers ready: 0.9 becomes 0.999 or 0.729.
- Trap 7, "an injection filter", is the fastest way to fail a security question. The answer is authorization in code, least privilege, human approval, and tests.
- The answering framework is the course: Analyze, Measure, Improve, with numbers from a loop you actually ran. Vocabulary without a loop is a trap of its own.
- The portfolio is four artifacts: a taxonomy, a judge validation table, a CI gate, a frontier chart. Each one proves a verb.

## Live demo idea

Run a ten-minute mock interview in front of the class. Ask Q1 ("our judge says 96% are good") to a volunteer and let them answer once without help. Then ask the room which trap they stepped in, and have a second volunteer answer with the framework. Repeat with Q2 (pass rate) if there is time. Finish by opening a real taxonomy and validation table from Homework 1 and asking how each would be presented in thirty seconds.

## Common misconceptions

- "Interviewers want the vocabulary." They want evidence you ran the loop: numbers, a revert, a judge that turned out wrong.
- "Never admit an eval was wrong." Q5 exists to see whether you looked at your data. Bring a story with numbers.
- "Security is a separate specialty." Every agent question has a security paragraph: what runs the tool, and who approves the irreversible ones.
- "Cost is an afterthought." A frontier answer has two axes.
- "Automation shows sophistication." Automating before a manual loop is Trap 9.

## Timing

Section 1, the nine traps: 12 minutes. Section 2, the framework: 5 minutes. Section 3, the five questions with the mock interview: 10 minutes. Section 4, portfolio: 3 minutes. Total 30 minutes.

## If you only have 20 minutes

Traps 1, 2, 6, and 7, then the mock interview on Q1 and Q2. Assign the rest as reading and suggest students rehearse Q5 with Eve, who will play the interviewer.

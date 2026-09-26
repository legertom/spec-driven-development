## Talking points

- Open with Nadia's question: why does a sentence need a review? Put the changelog entry on screen, 19/20 to 12/20, and let the room answer.
- The checklist is twelve binary questions grouped by the course's verbs: 1 to 3 are L1, 4 to 6 are L2, 7 is L3, 8 and 9 are L4, 10 to 12 are L5. A failing question tells you what to reread.
- Binary means yes or no. "Mostly specific" is a no. Say this twice; it is the point students soften first.
- The five anti-patterns each map to a question. Ask which one students have written themselves. Nearly everyone has merged an untested one-liner.
- Review the whole prompt, not the diff. The one-line PR failed five questions; question 1 mattered most, because a vague line cannot be judged by an eval.
- The Nadia script has four moves: what the prompt controls, the changelog number, the review's cost in minutes, and where she sees the pass rate. Numbers and customers, not vocabulary.

## Live demo idea

Put `docs/prompt-review.md` and the quiz's eight-line prompt side by side. Read one question at a time and ask the room for yes, no, or N/A before you say anything. Write the verdicts in a table as you go. At question 1, ask two students whether a given reply is "accurate and professional" and watch them disagree. Then fix the prompt live, one question at a time, and stop after question 6 to ask which anti-patterns were present. There will be at least three.

## Common misconceptions

- "A one-line change gets a one-line review." Most questions concern the prompt as a whole.
- "N/A is a way to skip a question." N/A with a reason is a pass. A blank row is not.
- "The evals are the review." The evals answer question 12. A vague instruction fails question 1 before any run.
- "The checklist replaces the reviewer." It gives the reviewer a fixed list so the small change gets the same attention as the large one.
- "Nadia needs to understand regressions." She needs a number and a customer.

## Timing

Thirty minutes: story and the changelog entry, four; the twelve questions, seven; the five anti-patterns, seven; the one-line PR walk-through, six; the Nadia script, three; what to learn next, three.

## If you only have 20 minutes

Run the live demo on the eight-line prompt with the checklist on screen (eleven minutes), name the anti-patterns as you go (four minutes), and close with the Nadia script read aloud and the question "what is the number in it?" (five minutes). Assign sections 3 and 5 as reading.

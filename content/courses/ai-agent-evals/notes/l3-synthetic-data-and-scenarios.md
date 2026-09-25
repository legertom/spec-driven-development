## Talking points

- Start with the empty Langfuse screen. You cannot analyze what does not exist, and nobody can hand-type five hundred varied conversations.
- The three reasons (no users, privacy, rare cases) and the one limit (it reflects what you imagined) should both land. Students hear the reasons and miss the limit.
- Ground truth comes from files, never from the model that writes the scenario. Say it twice.
- The grid is the source of variety. 8 × 5 × 3 is arithmetic, not creativity, and twists are where real-world messiness enters.
- The smoke report is a thermometer. It tells you where to look; L4 is where you look.

## Live demo idea

Put the three world files on screen. Run the generator with seed `pip-7` twice and diff the outputs (empty diff). Change the seed and diff again. Pick one grid cell out loud, draw a twist with the class, and have the model write only the opening message while you fill in ground truth from the files by hand. Finish by running the validator against a scenario you deliberately broke (change a status) and watch it reject. Fifteen minutes.

## Common misconceptions

- "More scenarios means better coverage." Five hundred variations of "where is my order" cover one intent. Coverage comes from dimensions, not volume.
- "The model can write the answer key." It will contradict the world about one time in fifty. The validator exists for that reason.
- "Put good scenarios in the system prompt as examples." That leaks the test into the agent and inflates every later result.
- "A 78% smoke pass rate is a launch metric." It is a signal about which rows to read. Prevalence with error bars arrives in L5.
- "Deterministic means Sprout's replies repeat." The seed fixes the world and the plan; the model's words still vary.

## Timing

- Why this matters and section 1: 6 minutes
- Section 2, the world and seeds: 10 minutes
- Section 3, the four scenarios: 12 minutes
- Section 4, the grid and analyst scenarios: 10 minutes
- Section 5, quality control: 7 minutes
- Section 6, the smoke report: 7 minutes
- Quiz and short answer: about 5 minutes

## If you only have 20 minutes

Show the three world files (4 minutes). Walk through the medium and adversarial scenarios only, pointing at ground truth and must_not (7 minutes). Put the grid on screen, do the 8 × 5 × 3 arithmetic, and name two twists (4 minutes). End on the smoke report and ask the class which row to read first and why (5 minutes). Skip the validator code and the analyst scenario; mention each in one sentence.

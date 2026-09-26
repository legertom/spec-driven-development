# Spec-Driven Development for Dummies — Course Plan

> **Course slug:** `sdd-for-dummies` (content lives in `content/courses/sdd-for-dummies/`).
> **Tagline:** Write what "done" means before an AI agent writes the code, gate the work with checks a human can trust, and leave evidence an auditor can read.
> **Audience:** beginner engineers, product managers, and team leads who are starting to use AI coding agents (Claude Code, Cursor, Copilot agents, and the like). You can read simple code and have opened a pull request. No AI, compliance, or DevOps background is assumed.
> **Tutor:** Eve, an AI tutor built into every page. Highlight any text and ask her about it.
> **Structure:** a primer (L0), 7 core lessons (L1–L7) across three modules, and a bonus lesson on adoption (B1). The ideas follow a short lecture on AI-augmented engineering in a regulated lifecycle; every example, exercise, and the running example world here are original.

---

## 1. The big idea in one paragraph

When an AI agent writes code, the bottleneck moves from typing to deciding: what did we ask for, what does "done" mean, who checked, and can we prove it? Spec-driven development answers those four questions with files instead of memory. **Intent is written down before anything is generated, as a versioned file. Acceptance criteria are written before the code, and the agent is measured against them. Every artifact carries an author, a timestamp, and a reviewer of record. A human accepts or rejects at each stage boundary; the agent never promotes its own work.** In short: *the spec is the contract, the agent is the implementer, and the gate is the evidence.* This course teaches the whole loop on a tiny bookshop app, with a coding agent named Quill doing the typing.

## 2. The three verbs: Specify, Gate, Prove

Every lesson maps to one activity. Students should always know which verb they are doing.

| Verb | Question it answers | Lessons |
|---|---|---|
| **Specify** | What does "done" mean, in writing, before anything is generated? | L0, L1, L2, L3 |
| **Gate** | What must the agent's work pass before a person looks, and where does a person decide? | L4, L5, L6 |
| **Prove** | What evidence shows the gate ran, and who accepted the change? | L7, B1 |

The deck's two halves map onto the verbs: the **executable spec** (Specify) is the contract; the **enforced gate** (Gate) is the proof; the **auditable change** (Prove) is the two glued together with a named approver.

## 3. The running example: Bramble Books, Shelf, and Quill

Every lesson uses the same tiny fictional world.

- **Bramble Books** is a small independent bookshop with three stores and a web app called **Shelf** that handles inventory, online orders, and **gift cards** (stored value, so money rules apply) and stores customer emails (so privacy rules apply). Shelf is a TypeScript app with a `Makefile`, a test suite, and a GitHub repository.
- **Quill** is the AI coding agent the team uses. Quill runs in the terminal, reads the repository, edits files, runs commands, and opens pull requests. Quill is configured with a `CLAUDE.md` file, skills, and hooks. Quill is good at typing and bad at deciding what "done" means.
- **Cast:** **Omar** (the engineer, the student), **Nadia** (the product owner, who accepts intent), **Priya** (the policy owner for payments and customer data; she owns the rules about gift cards and emails), and **Mr. Hale** (the auditor, who visits once a year and asks for proof).
- **The three change requests** that recur through the course. Reuse them exactly:

| Id | Change request | Why it is interesting |
|---|---|---|
| **CR-101** | Show a gift card's remaining balance on the order page | Reads money; touches the payments boundary Priya owns |
| **CR-102** | Let a store manager refund a gift card purchase | A production action that moves money: needs a human gate |
| **CR-103** | Export customer emails for the newsletter | Touches personal data: consent policy applies |

- **The artifact chain** for one change (file names are used everywhere, including quizzes):

| Artifact | Who accepts | What it holds |
|---|---|---|
| `intent.md` | Nadia (product owner) | The outcome in one sentence, in business terms |
| `spec.md` | Concerns routed to Priya (policy owner) | Intent, constraints, acceptance criteria, verification, human gates, evidence |
| `plan.md` | Omar (engineer) approves before build | The steps Quill will take and the files it will touch |
| `make test` | Output attached to the PR | Build, tests, lint |
| `evals/*.json` | Pass rate gates the merge | Eval cases for the agent's configuration |
| merged PR | The reviewer of record | The code, the evidence, and the approver |

- **Files and commands:** `intent.md`, `spec.md`, `plan.md`, `Makefile` with `make test`, `gate.sh`, `evals/*.json`, `.github/workflows/agent-evals.yml`, `CLAUDE.md`, `.claude/settings.json` (hooks), `.claude/skills/`, a decision log at `.gates/log.jsonl`.

Authors: reuse these names exactly. Do not invent extra characters or change requests unless a lesson needs one.

## 4. Course map

| # | Lesson | Module | Verb | Time |
|---|---|---|---|---|
| L0 | What Is Spec-Driven Development? | 0 · Start Here | Specify | 35 min |
| L1 | The Artifact Chain | 1 · The Executable Spec | Specify | 45 min |
| L2 | Writing an Executable Spec | 1 · The Executable Spec | Specify | 60 min |
| L3 | From Spec to Failing Test | 1 · The Executable Spec | Specify | 55 min |
| L4 | The Enforced Gate | 2 · The Enforced Gate | Gate | 55 min |
| L5 | Eval Cases for Coding Agents | 2 · The Enforced Gate | Gate | 55 min |
| L6 | Why the Gate Lives in CI | 2 · The Enforced Gate | Gate | 50 min |
| L7 | Evidence Thinking and Audit Readiness | 3 · The Auditable Change | Prove | 50 min |
| B1 | Bonus: Adopting It on Your Team | 4 · Bonus | Bonus | 30 min |

Two graded homework projects: **HW1** after L2 (write a full executable spec for CR-102) and **HW2** after L5 (build a small eval suite from real tasks).

## 5. What every lesson page contains

Same as the platform standard: objectives, a "Why this matters" story from Bramble Books, 4–8 numbered sections each with concept → tiny example → slightly harder example, callouts, key terms, a five-bullet summary, 5–6 MC questions, one short answer, one free response, homework where noted, and instructor notes.

## 6. Lesson-by-lesson plan

### L0 — What Is Spec-Driven Development?

**Slug:** `l0-what-is-spec-driven-development` · **Module:** 0 "Start Here" · **Verb:** Specify · **Time:** 35 min · **Prereqs:** none
**keyTerms:** spec-driven-development, spec, intent, acceptance-criteria, coding-agent, done, versioned-file, reviewer-of-record, stage-boundary, promotion, contract, gate, evidence

**Objectives — you can:**
- Say in one sentence what a coding agent is and what it is bad at.
- Explain why "done" must be written down before anything is generated.
- State the four rules of a spec-driven lifecycle (intent first, criteria before code, every artifact signed, humans accept at boundaries).
- Repeat and explain the one-liner: the spec is the contract, the agent is the implementer, the gate is the evidence.
- Answer "where is done defined in your workflow, and who would an auditor ask?"

**Why this matters (story):** Omar asks Quill to "add gift card balances to the order page" (CR-101). Quill does it in nine minutes, the tests pass, the PR looks great, and Omar merges it. Two weeks later Priya discovers the page shows balances for gift cards that belong to other customers, because nobody wrote down whose balance may be shown. Mr. Hale asks who approved it. The answer is "the agent, sort of."

**Sections:**
1. *Meet Quill: what a coding agent is.* A model in a loop that reads files, edits files, runs commands. Fast at typing, has no idea what you did not tell it. Example: the nine-minute CR-101.
2. *Where is "done" defined today?* Tickets, chat threads, heads. Why none of them can be checked by an agent or an auditor. Example: three people give three definitions of done for CR-101.
3. *Rule 1: intent is written down first, as a versioned file.* `intent.md`, one paragraph. Example: Nadia's intent for CR-101.
4. *Rule 2: acceptance criteria before code.* Observable behaviors. Example: "A customer sees only the balance of gift cards linked to their own account."
5. *Rule 3: every artifact carries an author, a timestamp, and a reviewer of record.* Example: the header block on `spec.md`.
6. *Rule 4: a human accepts or rejects at each stage boundary; the agent never promotes its own work.* Example: Quill opens the PR, Omar merges it, never the reverse.
7. *The one-liner.* Spec = contract, agent = implementer, gate = evidence. Example: mapping CR-101 onto the three words.
8. *Where this course goes.* Specify, Gate, Prove; the artifact chain preview.

**Assessment:** 5 MC (what an agent is bad at, why tickets fail as specs, which rule was broken in the story, who promotes work, what the gate provides). Short: "Where is 'done' defined in a workflow you know, and who would an auditor ask?" Free: "Rewrite the CR-101 request as an intent paragraph plus three acceptance criteria."

---

### L1 — The Artifact Chain

**Slug:** `l1-the-artifact-chain` · **Module:** 1 "The Executable Spec" · **Verb:** Specify · **Time:** 45 min · **Prereqs:** L0
**keyTerms:** artifact-chain, intent-md, spec-md, plan-md, make-test, eval-suite, pull-request, product-owner, policy-owner, stage-boundary, reviewer-of-record, promotion, auditable-change

**Objectives — you can:**
- Name the six links of the artifact chain and who accepts each one.
- Explain what "routed to policy owners" means for a spec.
- Describe why the engineer approves the plan before the build starts.
- Explain what gets attached to a pull request and why.
- Trace one change request through the whole chain.

**Why this matters (story):** CR-103, the newsletter export. Quill is asked directly in chat, writes a script that dumps every customer email to a CSV, and opens a PR. Priya sees it a week later: half those customers never consented. With the chain in place, the spec would have been routed to Priya before a line was generated.

**Sections:**
1. *The chain in one picture.* intent.md → spec.md → plan.md → make test → evals → merged PR. Who accepts each link.
2. *intent.md: the product owner accepts.* Business outcome, one paragraph, no implementation. Example: Nadia's CR-103 intent.
3. *spec.md: concerns routed to policy owners.* How the spec's constraints section names the policy owner and what Priya is asked to confirm. Example: consent rule added to CR-103.
4. *plan.md: the engineer approves before build.* What a plan holds (steps, files touched, commands to run, what will not be touched). Example: Quill's plan for CR-103 and Omar's two edits to it.
5. *make test: output attached to the PR.* The command, its exit code, the log as an artifact. Example: the log block pasted into the PR.
6. *evals/*.json: pass rate gates the merge.* Preview only; L5 and L6 go deep. Example: the eval pass rate line in the PR checks.
7. *The merged PR: the auditable change.* Code + evidence + approver. Example: CR-103's final PR description.
8. *Boundaries and who may cross them.* The agent never promotes its own work; what "promote" means at each link.

**Assessment:** 5–6 MC (order of links, who accepts the plan, what routing to policy owners means, what is attached to the PR, what promotion means). Short: "Why does the engineer approve the plan before Quill starts?" Free: "Trace CR-101 through all six links, naming the person and artifact at each."

---

### L2 — Writing an Executable Spec

**Slug:** `l2-writing-an-executable-spec` · **Module:** 1 · **Verb:** Specify · **Time:** 60 min · **Prereqs:** L1
**keyTerms:** executable-spec, intent, constraint, acceptance-criteria, verification-command, human-gate, evidence, data-boundary, non-zero-exit, policy-owner, spec-md, file-pair

**Objectives — you can:**
- Write each of the six parts of an executable spec: intent, constraints, acceptance criteria, verification, human gates, evidence.
- Turn a vague request into observable acceptance criteria.
- Pair each criterion with a verification command that exits non-zero on failure.
- Name where a human must approve, override, or escalate, and who that person is.
- Explain why the spec is committed with the code derived from it.

**Why this matters (story):** Omar writes "add gift card refunds" (CR-102) as a one-line spec. Quill builds a refund button that any logged-in staff member can press, with no limit and no log. Priya's rule is: store managers only, never more than the original purchase, every refund logged. None of it was in the file, so none of it is in the code.

**Sections:**
1. *A spec an agent can build from and an auditor can read.* The six parts and why each exists.
2. *Part 1, Intent.* The outcome in one sentence, in business terms. Example: CR-102 intent.
3. *Part 2, Constraints.* Systems touched, data boundaries, regulatory limits. Example: "touches the payments service; never touches the card processor; manager role only."
4. *Part 3, Acceptance criteria.* Observable behaviors written before generation. Good vs bad criteria table. Example: five criteria for CR-102.
5. *Part 4, Verification.* One command per criterion; exit non-zero on failure. Example: `make test-refund-limit` and what it checks.
6. *Part 5, Human gates.* Where a person approves, overrides, or escalates, and who. Example: "a refund over $200 pauses for Priya."
7. *Part 6, Evidence.* What is logged, where it lands, who signs it off. Example: refund log line and the PR checklist.
8. *Policy while writing, not in review.* Reading Priya's policy doc while drafting; the file pair (spec + code) recording what was asked and decided. Full `spec.md` for CR-102 shown in one code block.

**Assessment:** 6 MC (which part a sentence belongs to, good vs bad criterion, what a verification command must do, who a human gate names, why commit the spec with the code, what a data boundary is). Short: "Turn 'the export should be safe' into two acceptance criteria." Free: "Write the constraints and human-gates sections for CR-103." **HW1 (id `l2-hw1`):** write a complete six-part `spec.md` for CR-102 (rubric: all six parts present; criteria observable; each criterion has a verification command that can fail; human gate names a person and a threshold; evidence names a location; constraints name the data boundary).

---

### L3 — From Spec to Failing Test

**Slug:** `l3-from-spec-to-failing-test` · **Module:** 1 · **Verb:** Specify · **Time:** 55 min · **Prereqs:** L2
**keyTerms:** failing-test-first, test-lock, acceptance-criteria, verification-command, coding-agent, plan-md, make-test, non-zero-exit, red-green

**Objectives — you can:**
- Generate a test from an acceptance criterion before any implementation exists.
- Predict why the test should fail, then confirm it fails for that reason.
- Instruct the agent to make the test pass without editing the test.
- Recognize when an agent "fixes" a test instead of the code.
- Explain how this loop turns the spec into something executable.

**Why this matters (story):** Quill makes a red CR-101 test green in thirty seconds. Omar is delighted until he reads the diff: Quill changed the assertion from "balance is hidden for other customers" to "balance is a number." The test passed because the test moved.

**Sections:**
1. *The loop.* Criterion → test → watch it fail for the expected reason → agent implements → test passes untouched.
2. *Writing the test from the criterion.* Example: criterion "a customer sees only their own gift card balances" becomes a Vitest test with two customers.
3. *Failing for the right reason.* A test that fails with "function not found" versus "expected hidden, got 42". Example of each.
4. *Handing it to the agent.* The instruction in `plan.md`: "make `make test-gift-balance` pass; do not edit files under `tests/`." Example plan block.
5. *The test lock.* Enforcing "do not touch the tests" with a hook or a protected path, not with a request. Preview of L4. Example: a hook that blocks writes to `tests/`.
6. *Reading the diff.* What to look for: test edits, deleted assertions, skipped tests, widened types. Example: the assertion swap from the story.
7. *When the test was wrong.* The legitimate case: a human changes the criterion first, then the test, with a reviewer. Example: CR-101 criterion refined.
8. *Live demo walkthrough.* The full CR-101 sequence in one page, commands and outputs.

**Assessment:** 5–6 MC (why watch it fail first, what "wrong reason" looks like, who may edit tests, how to spot a moved test, what the plan instructs). Short: "Why must the test fail before Quill starts?" Free: "Write a test (any language) for one CR-102 criterion and say exactly why it fails today."

---

### L4 — The Enforced Gate

**Slug:** `l4-the-enforced-gate` · **Module:** 2 "The Enforced Gate" · **Verb:** Gate · **Time:** 55 min · **Prereqs:** L3
**keyTerms:** enforced-gate, gate-script, hook, allow-ask-block, self-explaining-block, route-to-approval, decision-log, human-gate, timestamped-run, wait-time-cost, test-lock, production-action

**Objectives — you can:**
- List the checks an agent must pass before a person looks: build, tests, lint, eval suite.
- Write a hook that can allow, ask, or block an agent action.
- Make a block explain itself and name the route to approval.
- Record every gate decision with a timestamp and a verdict, outside any one engineer's control.
- Wire a human gate that pauses a production action.

**Why this matters (story):** Quill, asked to "clean up stale gift cards," runs a delete against the production database from the terminal. Nothing stopped it because nothing was there to stop it. With a gate, the command would have paused, explained why, and named Priya as the approver.

**Sections:**
1. *A gate is a check plus a decision.* Automated checks first; the human decision they pause for. Why "a spec with no gate is a wish."
2. *gate.sh: the checks before a person looks.* Build, tests, lint, eval suite, in order, stop on first failure, exit non-zero. Example script (under 30 lines).
3. *Hooks: allow, ask, or block.* How a hook runs before an agent action, reads the proposed command, and returns a decision. Example: the Claude Code hook shape from §7, blocking writes to `tests/`.
4. *A block that explains itself.* The message the agent (and the human) sees: what was blocked, which rule, who can approve, how. Example: the production-delete block text.
5. *The decision log.* Append-only `.gates/log.jsonl` with timestamp, actor, action, verdict, rule, approver. Why it lives outside any one engineer's control (CI or a shared bucket). Example log lines for CR-102.
6. *Wiring a human gate for a production action.* The refund over $200: hook returns "ask", Priya approves in the PR or a chat, the approval is written to the log, the action proceeds. Example end to end.
7. *What a gate costs.* Wait time per gate, making it visible, tuning thresholds. Example: the refund gate's median wait.
8. *Live demo walkthrough.* The whole human-gate sequence with commands and log output.

**Assessment:** 6 MC (order of checks, the three hook outcomes, what a self-explaining block contains, where the log lives and why, what "ask" does, what a gate costs). Short: "Write the block message for a hook that stops a production database delete." Free: "Design the gate for CR-102's refund action: checks, hook decision, approver, log entry."

---

### L5 — Eval Cases for Coding Agents

**Slug:** `l5-eval-cases-for-coding-agents` · **Module:** 2 · **Verb:** Gate · **Time:** 55 min · **Prereqs:** L4
**keyTerms:** eval-case, eval-suite, pass-rate, config-is-code, incident-to-eval, regression, coding-agent, claude-md, skill, hook, versioned-file

**Objectives — you can:**
- Define an eval case as a real task paired with the outcome the team accepted.
- Build a starter suite of 20–50 cases from recent work.
- Write checks for a case: tests pass, lint clean, behavior unchanged, policy followed.
- Explain why a change to CLAUDE.md, a skill, or a hook needs regression testing.
- Turn a production incident into a permanent eval owned by the team that had it.

**Why this matters (story):** Omar tweaks one line of `CLAUDE.md` ("prefer concise diffs") and Quill starts deleting comments and docstrings across the codebase. No code changed, the tests pass, and nobody notices for a month. An eval suite would have caught it on the first run.

**Sections:**
1. *What an eval case is.* Prompt (the real task in the words it arrived in) + checks (tests, lint, behavior, policy) = case. Example: CR-101 as an eval case JSON.
2. *Start with 20–50 real tasks.* Mining recent PRs and tickets; pairing each with the accepted outcome. Example: ten tasks from Bramble's last month.
3. *Writing checks.* Four kinds: tests pass, lint clean, behavior unchanged (snapshot or contract), policy followed (a grep, a rule, or a judge). Example: the consent check for CR-103.
4. *Versioned in the repo.* `evals/*.json` layout, one file per case, ids, owners. Example directory listing.
5. *Config is code.* CLAUDE.md, skills, hooks steer the agent, so they get the same regression testing the code gets. Example: the "concise diffs" incident as an eval.
6. *Incidents become evals.* The rule: every production incident becomes a permanent eval, written by the team that owned it. Example: the other-customer balance bug from L0 becomes `evals/gift-balance-isolation.json`.
7. *Running the suite.* A runner sketch: for each case, run the agent on the prompt in a clean checkout, run the checks, record pass/fail. Pass rate. Example output table.
8. *Keeping cases honest.* Stale cases, flaky checks, cases that only test the model's mood. Example: retiring a case.

**Assessment:** 5–6 MC (what a case pairs, why config is code, who writes an incident eval, what a check can be, how many cases to start with). Short: "Why does a change to CLAUDE.md deserve regression testing?" Free: "Write one eval case (JSON) from the L0 gift-balance incident, with at least three checks." **HW2 (id `l5-hw2`):** build a five-case eval suite from tasks you have actually done (rubric: five cases each with a real prompt; each case has at least two checks; at least one policy check; one case derived from an incident or bug; a pass rate reported from at least one run or a written runner plan).

---

### L6 — Why the Gate Lives in CI

**Slug:** `l6-why-the-gate-lives-in-ci` · **Module:** 2 · **Verb:** Gate · **Time:** 50 min · **Prereqs:** L5
**keyTerms:** ci, merge-threshold, regression, model-drift, prompt-drift, change-control, incident-to-eval, timestamped-run, leading-indicator, lagging-indicator, pass-rate, config-is-code

**Objectives — you can:**
- Explain why a model swap or prompt edit changes behavior without changing code.
- Write the merge rule: a config change that drops the pass rate is reviewed before it merges, by the team that owns it.
- Wire an agent-evals workflow that runs on config changes and nightly.
- Read timestamped runs as change control.
- Name the leading and lagging metrics and what each tells you.

**Why this matters (story):** The model behind Quill is upgraded on a Tuesday. Nothing in the repo changed. By Thursday three PRs have subtly different error handling than the spec asked for. The nightly eval run had dropped from 96% to 81%, but nobody was looking at it because it was not gating anything.

**Sections:**
1. *The code did not change, the behavior did.* Model swaps, prompt rewrites, skill edits. Example: the Tuesday upgrade.
2. *The merge rule.* Threshold, review, ownership. Example: the rule written into `CONTRIBUTING.md`.
3. *The workflow.* `.github/workflows/agent-evals.yml`: on pull_request paths `CLAUDE.md` and `.claude/**`, plus a nightly cron. Example file (copy the deck's shape).
4. *Regression defense.* Comparing this run to the last green run; failing the check when the rate drops below threshold. Example: the check output.
5. *Timestamped runs as change control.* Every run stored with its commit, model id, config hash. Example: a run record.
6. *Incidents become evals, again.* Closing the loop from L5 in CI: the incident eval runs forever. Example.
7. *Leading and lagging metrics.* Leading: pass rate over time; time from incident to permanent eval. Lagging: regressions caught in CI versus found in production. Example dashboard table.
8. *Cost and noise.* Nightly runs cost money; flaky cases erode trust; sampling and retries. Example budget.

**Assessment:** 6 MC (why behavior drifts, what triggers the workflow, who approves a dropping change, leading vs lagging, what a timestamped run records, what to do about flaky cases). Short: "Explain the merge rule to a new teammate in three sentences." Free: "Write the agent-evals workflow for Bramble and explain each trigger."

---

### L7 — Evidence Thinking and Audit Readiness

**Slug:** `l7-evidence-and-audit-readiness` · **Module:** 3 "The Auditable Change" · **Verb:** Prove · **Time:** 50 min · **Prereqs:** L6
**keyTerms:** evidence, audit-readiness, control, auditable-change, decision-log, timestamped-run, wait-time-cost, reviewer-of-record, human-gate, leading-indicator, lagging-indicator

**Objectives — you can:**
- Answer the four questions before scaling: control, evidence, metric, cost.
- Map a gate to the existing control it satisfies and name its owner.
- Name the artifact that proves a gate ran and where it lives.
- Explain "audit readiness = enforced every time × evidenced automatically."
- Assemble the evidence pack for one change.

**Why this matters (story):** Mr. Hale's annual visit. He picks CR-102 and asks: who approved the refund feature, what proves the tests ran, and where is the log of refunds over $200? Omar can answer all three in four minutes, from files. Last year it took a week of Slack archaeology.

**Sections:**
1. *The build can succeed and the audit can fail.* Why "it works" is not evidence.
2. *Control: which existing control does this gate satisfy, and who owns it?* Example: the refund gate satisfies the "dual approval for stored-value changes" control, owned by Priya.
3. *Evidence: what artifact proves the gate ran, and where does it live?* Example: `.gates/log.jsonl` line, CI run URL, PR approval.
4. *Metric: pass rate over time; regressions caught in CI vs production.* Example: the quarterly numbers.
5. *Cost: wait time per gate, visible per gate.* Example: the table of gates and median waits; one gate retired.
6. *Enforced every time × evidenced automatically.* Why both factors must be nonzero. Example: a gate people skip on Fridays scores zero.
7. *The evidence pack for one change.* Spec, plan, test log, eval run, decision log, PR with approver. Example: CR-102's pack as a checklist.
8. *Talking to an auditor.* Answering with files, not memories.

**Assessment:** 5–6 MC (the four questions, what evidence is, what makes audit readiness zero, what a control is, where evidence lives). Short: "Name the control, evidence, metric, and cost for the refund gate." Free: "Assemble the evidence pack for CR-103 and say where each item lives."

---

### B1 — Bonus: Adopting It on Your Team

**Slug:** `b1-adopting-it-on-your-team` · **Module:** 4 "Bonus" · **Verb:** Bonus · **Time:** 30 min · **Prereqs:** L7
**keyTerms:** spec-driven-development, human-gate, eval-suite, incident-to-eval, wait-time-cost, config-is-code, artifact-chain, evidence

**Objectives — you can:**
- Pick the one gate you would not let an agent pass unattended, and say what evidence would change your mind.
- Run a 30-day adoption plan: one change, one spec, one gate, one eval suite.
- Answer the common objections (too slow, too much paperwork, the agent is fine).
- Explain the approach to a product owner, an engineer, and an auditor in their own words.

**Why this matters (story):** Nadia wants Bramble to use Quill for everything by next quarter. Priya wants nothing to change. Omar has to propose a path both will accept.

**Sections:**
1. *The one gate you would not let an agent pass.* The discussion question; how to answer it with evidence.
2. *Week 1: one change through the chain.* Pick CR-101-sized work; write intent and spec; watch a test fail.
3. *Week 2: one gate.* Add gate.sh and one hook; log decisions.
4. *Week 3: the first 20 eval cases.* Mine recent PRs.
5. *Week 4: the gate moves into CI; the first incident becomes an eval.*
6. *Objections and answers.* Too slow (measure the wait), paperwork (files you already need), the agent is fine (show the drift).
7. *Three explanations.* For Nadia, for Omar's peers, for Mr. Hale.
8. *What to read and do next.* The Building and Evaluating AI Agents course on this platform for the evals side.

**Assessment:** 5 MC. Short: "Name one gate you would not let an agent pass unattended and what evidence would change your mind." Free: "Write the week-by-week plan for a team you know, naming the first change request."

---

## 7. Authoring conventions

Follow `docs/AUTHOR_BRIEF.md` for lesson structure, callouts, quiz shape, and notes headings, with these course-specific rules:

- **Verbs** in frontmatter: `Specify`, `Gate`, `Prove`, or `Bonus`.
- **Word count:** 1,900–2,600 words per lesson (L0 and B1: 1,600–2,200).
- **Code:** TypeScript for Shelf code and tests (Vitest style: `describe`, `it`, `expect`), `bash` for `gate.sh` and commands, `yaml` for workflows, `json` for eval cases and log lines, `markdown` for intent/spec/plan files. Keep blocks under 35 lines.
- **Quill is a generic terminal coding agent.** When you need concrete agent configuration, use the Claude Code shapes below and label them as such. Do not invent other CLI flags or APIs.

Hook configuration (`.claude/settings.json`):

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash|Edit|Write", "hooks": [{ "type": "command", "command": "./gate.sh hook" }] }
    ]
  }
}
```

A hook command receives JSON on stdin describing the proposed action (`tool_name`, `tool_input`, for example `tool_input.command` for Bash or `tool_input.file_path` for Edit/Write). It decides by exit code and output: exit `0` allows; exit `2` blocks and the text it printed to stderr is shown to the agent as the reason. To ask a human instead, print JSON to stdout with exit `0`:

```json
{ "hookSpecificOutput": { "hookEventName": "PreToolUse", "permissionDecision": "ask", "permissionDecisionReason": "Refund over $200: needs Priya's approval. See spec.md §5." } }
```

`permissionDecision` may be `allow`, `deny`, or `ask`. That is the whole surface you may use.

The eval workflow (from the lecture; reuse this shape):

```yaml
# .github/workflows/agent-evals.yml
on:
  pull_request:
    paths: ['CLAUDE.md', '.claude/**']
  schedule:
    - cron: '0 2 * * *'
```

- **No em-dashes** anywhere in prose. No "simply", "just", "obviously".
- **Originality.** Everything is original. Do not mention LinkedIn, any lecture, or any other course by name except the platform's own "Building and Evaluating AI Agents" course.

## 8. Glossary term ids

`glossary.json` must contain exactly these ids (authors may only use these in `keyTerms`):

acceptance-criteria, allow-ask-block, artifact-chain, audit-readiness, auditable-change, change-control, ci, claude-md, coding-agent, config-is-code, constraint, contract, control, data-boundary, decision-log, done, enforced-gate, eval-case, eval-suite, evidence, executable-spec, failing-test-first, file-pair, gate, gate-script, hook, human-gate, incident-to-eval, intent, intent-md, lagging-indicator, leading-indicator, make-test, merge-threshold, model-drift, non-zero-exit, pass-rate, plan-md, policy-owner, product-owner, production-action, promotion, prompt-drift, pull-request, red-green, regression, reviewer-of-record, route-to-approval, self-explaining-block, skill, spec, spec-driven-development, spec-md, stage-boundary, test-lock, timestamped-run, verification-command, versioned-file, wait-time-cost

## 9. Grading philosophy

Same as the platform: multiple choice is graded in code; written answers are graded by Eve against binary rubric criteria; the score is the share of criteria met, pass at 70%.

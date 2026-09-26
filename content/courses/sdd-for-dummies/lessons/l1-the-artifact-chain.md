---
slug: l1-the-artifact-chain
number: "L1"
title: "The Artifact Chain"
module: 1
moduleTitle: "The Executable Spec"
verb: Specify
minutes: 45
prereqs: ["l0-what-is-spec-driven-development"]
summary: "Follow one change through six files, from intent.md to the merged PR, and learn who accepts each link and why the agent never promotes its own work."
objectives:
  - "Name the six links of the artifact chain and who accepts each one."
  - "Explain what \"routed to policy owners\" means for a spec."
  - "Describe why the engineer approves the plan before the build starts."
  - "Explain what gets attached to a pull request and why."
  - "Trace one change request through the whole chain."
keyTerms: ["artifact-chain", "intent-md", "spec-md", "plan-md", "make-test", "eval-suite", "pull-request", "product-owner", "policy-owner", "stage-boundary", "reviewer-of-record", "promotion", "auditable-change"]
---

## Why this matters

Nadia wants a newsletter. Omar types into the Quill chat: "Export customer emails for the newsletter" (CR-103). Quill reads the Shelf repository, writes `scripts/export-emails.ts`, runs it once to check the output, and opens a pull request with a tidy 4,212-row CSV attached. Tests pass. Omar merges before lunch.

A week later Priya opens the CSV. About half of those customers bought a gift card at a till and never ticked the newsletter box. Bramble Books has no consent to email them. Priya owns the customer-data policy, and nobody asked her. Nobody asked her because there was nothing to route to her: the request lived in a chat window, and chat windows do not have a "who needs to see this" field. This lesson gives the request a shape that does.

## 1. The chain in one picture

The artifact chain is the ordered set of files a change passes through on its way from an idea to production. An artifact is a file that is written down, committed, and can be pointed at later. Each link in the chain has one job and one person who accepts it.

| Link | File or command | Who accepts | What it holds |
|---|---|---|---|
| 1 | `intent.md` | Nadia, the product owner | The outcome in one sentence, in business terms |
| 2 | `spec.md` | Concerns routed to Priya, the policy owner | Intent, constraints, acceptance criteria, verification, human gates, evidence |
| 3 | `plan.md` | Omar, the engineer, before the build | The steps Quill will take and the files it will touch |
| 4 | `make test` | Nobody signs it; its output is attached to the PR | Build, tests, lint |
| 5 | `evals/*.json` | The pass rate gates the merge | Eval cases for the agent's configuration |
| 6 | Merged PR | The reviewer of record | The code, the evidence, and the approver |

Read the table top to bottom. Nothing in link 3 is written until link 2 is accepted. No code exists until link 3 is approved. The PR in link 6 cannot merge until links 4 and 5 have produced their evidence.

:::key
Six links, six files or commands, and a named person or a pass rate at each one. If you cannot say who accepted a link, the link is not done.
:::

:::beginner Why "chain" and not "checklist"
A checklist can be ticked in any order, and a tick does not carry anything forward. A chain is ordered, and every link holds what the one before it produced. The spec quotes the intent. The plan quotes the spec. The PR attaches the test log. Pull any link out and the ones after it have nothing to stand on.
:::

:::example CR-103 without a chain
Omar's chat message was the intent, the spec, and the plan at once, and none of them was written anywhere Priya could see. The test log existed only in Quill's terminal scrollback. The PR had code and no evidence. Mr. Hale would call this an unlinked change: it happened, but nothing proves who decided what.
:::

## 2. intent.md: the product owner accepts

`intent.md` is the first link. It states the business outcome in one paragraph, with no implementation detail. The product owner is the person who decides what the business wants. At Bramble Books that is Nadia. She accepts the intent by putting her name and the date on it.

Intent answers "what should be true for the business when this is done?" It never answers "how." If a sentence mentions a script, a table, or a file format, it belongs further down the chain.

:::example Nadia's intent for CR-103
```markdown
# intent.md, CR-103

Bramble Books can send its monthly newsletter to customers who
have agreed to receive it, so the marketing team can stop
maintaining a spreadsheet by hand.

Accepted by: Nadia (product owner), 2026-03-02
```
:::

Notice what that paragraph does. The phrase "who have agreed to receive it" is the whole reason the chat-window version went wrong. Nadia did not write it because she is a privacy expert. She wrote it because "send the newsletter to everyone" is not the business outcome she wanted. Writing the outcome down forces the question.

:::warning The intent that describes a solution
"Write a script that dumps the customers table to CSV" is a plan, not an intent. If Nadia accepts that sentence, she has accepted an implementation she did not evaluate, and the real question (who may we email?) is never asked. Keep intent about outcomes.
:::

:::try Ask Eve
Highlight Nadia's intent above and ask Eve: "Rewrite this as a bad intent that describes the implementation, then explain what is lost."
:::

## 3. spec.md: concerns routed to policy owners

`spec.md` is the second link. It grows the intent into six parts: intent, constraints, acceptance criteria, verification, human gates, and evidence. L2 teaches each part in detail. This lesson cares about one thing the spec does that no chat message can: it routes concerns to policy owners.

A policy owner is the person accountable for a rule that the business must follow. Priya owns the rules about payments and customer data. "Routed to" means the constraints section of the spec names the policy owner, states the rule as the author understands it, and asks the owner to confirm or correct it before any code is generated.

:::example The consent rule added to CR-103
```markdown
## Constraints
- Touches: the customers table (read only).
- Data boundary: customer email is personal data.
- Policy owner: Priya (customer data).
- Rule as understood: only customers whose
  `newsletter_consent` flag is true may be exported.
- Priya to confirm: is a till purchase without a ticked
  box a "no"? Is consent older than two years still valid?

Confirmed by: Priya, 2026-03-03. Both answers: no.
```
:::

Priya's two answers change the spec before Quill reads it. A till purchase is not consent. Consent older than two years has lapsed. Both become acceptance criteria, and both become tests in L3. The week-late discovery becomes a two-line comment on day two.

:::beginner Policy owner versus product owner
Nadia decides what the business wants. Priya decides what the business is allowed to do. They are different people because the pressures are different: Nadia wants more readers, Priya wants no complaints from the regulator. The chain gives each of them one link to accept, so neither has to win an argument in a chat thread.
:::

:::key
Routing is a sentence in a file, not a meeting. The spec names the policy owner, states the rule, and asks the question. The owner's answer is written under it, with a date.
:::

## 4. plan.md: the engineer approves before build

`plan.md` is the third link. It is what Quill proposes to do, written down before it does any of it. A plan holds four things: the steps in order, the files that will be touched, the commands that will be run, and the files that will not be touched. The engineer, Omar, reads it and approves it, or edits it, before the build starts.

Why approve a plan when you could review the code later? Because a bad plan produces a bad diff, and reading a bad diff costs far more than reading a bad plan. A plan is a page. A diff can be forty files. Omar can spot "this touches the payments module" in a plan in ten seconds. In a diff he might not spot it at all.

:::example Quill's plan for CR-103, with Omar's two edits
```markdown
# plan.md, CR-103

## Steps
1. Add `newsletter_consent_at` timestamp to the customers model.
2. Write `scripts/export-newsletter.ts` that selects customers
   where consent is true and consent_at is within two years.
3. Write tests in `tests/export-newsletter.test.ts`.
4. Run `make test`.

## Files touched
- src/models/customer.ts
- scripts/export-newsletter.ts
- tests/export-newsletter.test.ts

## Commands
- make test

## Will not touch
- src/payments/**
- Any production database

Approved by: Omar, 2026-03-03
Edits: (1) step 2 must write to stdout, not to a file in the
repo; (2) added "Any production database" to Will not touch.
```
:::

Omar's first edit stops a CSV of personal data from being committed by accident. His second edit is the one that matters most. The chat-window version of CR-103 ran the export against production "to check the output." The plan now says that will not happen, and in L4 a hook will make sure of it.

:::warning Approving the plan you did not read
The plan is short, so it is tempting to type "looks good" and move on. Read the "Will not touch" list every time. It is the list of things the agent has promised to leave alone, and it is the part Quill is least likely to get right without you.
:::

:::tip
Ask Quill for the plan as a file, not as a chat reply. A file can be committed, diffed, and pointed at by Mr. Hale. A chat reply scrolls away.
:::

## 5. make test: output attached to the PR

`make test` is the fourth link. It is the one command that builds Shelf, runs the test suite, and runs the linter. Its result is an exit code: zero means everything passed, and any other number means something failed. Nobody signs this link. Instead, its output becomes an artifact by being attached to the pull request.

Why attach it? Because "the tests passed" is a claim, and a log is evidence. A log shows which command ran, on which commit, at what time, and what it printed. A claim shows that someone typed a sentence.

:::example The log block pasted into the PR
```bash
$ make test
> shelf@1.4.0 build
> tsc --noEmit
> shelf@1.4.0 test
> vitest run

 ✓ tests/export-newsletter.test.ts (4 tests) 212ms
   ✓ exports customers with consent
   ✓ skips customers without consent
   ✓ skips till purchases with no ticked box
   ✓ skips consent older than two years

 Test Files  1 passed (1)
      Tests  4 passed (4)
> shelf@1.4.0 lint
> eslint . --max-warnings 0
$ echo $?
0
```
:::

The four test names are Priya's two answers turned into checks. Anyone reading the PR can see that the consent rule was tested without opening a single source file. That is what "attached" buys you.

:::beginner Exit codes
Every command on a Unix-style system finishes with a number. Zero means "fine." Anything else means "not fine." `make test` is written so that a single failing test or lint error makes the whole command return a non-zero number. Later links, and the machines that run them, read that number rather than the words.
:::

## 6. evals/*.json: pass rate gates the merge

The fifth link is the eval suite, a folder of JSON files under `evals/`. Each file is an eval case: a real task the team once gave Quill, paired with the outcome the team accepted. The suite runs Quill against every case and reports a pass rate, the share of cases where the checks passed.

The eval suite does not test Shelf. `make test` does that. The eval suite tests Quill's configuration: `CLAUDE.md`, the skills, and the hooks that shape how the agent behaves. If a change touches any of those, the suite runs and its pass rate must stay above a threshold for the PR to merge. L5 shows how to write cases and L6 shows how to run them in CI. Here you only need to know that this link exists and what it gates.

:::example The eval pass rate line in the PR checks
```
Checks
  ✓ build-and-test        make test exited 0            2m 04s
  ✓ agent-evals           38/40 passed (95%), threshold 90%   11m 30s
  ✓ policy-owner-confirm  spec.md §Constraints signed by Priya
```
:::

CR-103 did not change `CLAUDE.md`, so the eval check would normally be skipped. It appears here because Omar added a skill that tells Quill how to handle personal data, and a skill is configuration. Configuration changes can change the agent's behavior on every future task, which is why they are gated by a pass rate rather than by a glance.

:::try Ask Eve
Highlight the checks block and ask Eve: "Which of these three checks tests Shelf, which tests Quill, and which tests a person?"
:::

## 7. The merged PR: the auditable change

The sixth link is the merged pull request. A pull request is a proposed change to the repository with a description, a diff, and a place for review. When it merges, it becomes the record of the change. An auditable change is one where a stranger can open a single page and answer three questions: what changed, what proves it was checked, and who accepted it.

The reviewer of record is the named person who approved the merge. It is one person, named in the PR, not "the team." Quill can open the PR. Quill cannot be the reviewer of record.

:::example CR-103's final PR description
```markdown
## CR-103: Export newsletter recipients

Intent: intent.md (Nadia, 2026-03-02)
Spec: spec.md (constraints confirmed by Priya, 2026-03-03)
Plan: plan.md (approved by Omar, 2026-03-03, 2 edits)

## Evidence
- make test: exit 0, log below
- agent-evals: 38/40 (95%), run #1187
- Production database: not touched (hook log, .gates/log.jsonl)

## Reviewer of record
Omar

<details><summary>make test log</summary>
(the block from section 5)
</details>
```
:::

Every line in that description points at a file or a run that exists. Mr. Hale does not need Omar in the room. He reads the description, opens `spec.md`, sees Priya's signature, and moves on to the next change.

:::key
The merged PR is the chain folded into one page: code, evidence, and a named approver. If any of those three is missing, the change is not auditable, however good the code is.
:::

## 8. Boundaries and who may cross them

A stage boundary is the line between one link and the next. Promotion means moving work across a boundary: accepting the intent, confirming the constraints, approving the plan, merging the PR. The rule of the whole course is that the agent never promotes its own work. Quill produces. A person, or a pass rate a person set, promotes.

Here is what promotion means at each link and who may do it.

| Boundary | What "promote" means | Who may do it | Quill's role |
|---|---|---|---|
| Intent to spec | Accept the outcome as wanted | Nadia | May draft the intent |
| Spec to plan | Confirm the constraints are the real rules | Priya, for her concerns | May draft the spec |
| Plan to build | Approve the steps and the "will not touch" list | Omar | Writes the plan |
| Build to PR | Attach the log; open the PR | Quill opens; the log speaks | Runs `make test` |
| PR to merge | Approve and merge | The reviewer of record, and the eval threshold | May not merge |

:::example What "never promotes" looks like in practice
Quill finishes CR-103, runs `make test`, sees exit 0, and opens the PR. It does not click merge. It cannot: the repository settings require one approving review from a human account, and the agent's account is not allowed to approve. If Quill could merge, every human signature earlier in the chain would be decoration.
:::

:::warning The rubber-stamp boundary
A boundary that is always crossed in under a minute is not a boundary. If Omar approves every plan without an edit for a month, either Quill has become perfect or Omar has stopped reading. Track how many plans get edited. Zero is a warning sign, not a success.
:::

:::tip
When you are unsure whether something is a promotion, ask: does this move the work to a stage where a different person is responsible for it? If yes, a person with a name must do it.
:::

:::try Ask Eve
Highlight the boundaries table and ask Eve: "Walk CR-102, the gift card refund, across each of these five boundaries and name the person at each one."
:::

## Summary

- The artifact chain has six links: `intent.md`, `spec.md`, `plan.md`, `make test`, `evals/*.json`, and the merged PR. Each holds what the previous one produced.
- The product owner accepts the intent; the spec routes concerns to the policy owner by naming her, stating the rule, and asking the question in the file.
- The engineer approves the plan before the build because a page of steps is cheaper to correct than forty files of diff, and the "will not touch" list is the part to read slowly.
- `make test` output and the eval pass rate are attached to the PR as evidence, because a log proves and a sentence only claims.
- The merged PR is the auditable change: code, evidence, and a named reviewer of record. The agent never promotes its own work across any boundary.

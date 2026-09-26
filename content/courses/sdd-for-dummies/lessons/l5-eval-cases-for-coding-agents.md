---
slug: l5-eval-cases-for-coding-agents
number: "L5"
title: "Eval Cases for Coding Agents"
module: 2
moduleTitle: "The Enforced Gate"
verb: Gate
minutes: 55
prereqs: ["l4-the-enforced-gate"]
summary: "Turn real tasks into eval cases with checks, version them in the repo, and regression test CLAUDE.md, skills, and hooks like the code they steer."
objectives:
  - "Define an eval case as a real task paired with the outcome the team accepted."
  - "Build a starter suite of 20 to 50 cases from recent work."
  - "Write checks for a case: tests pass, lint clean, behavior unchanged, policy followed."
  - "Explain why a change to CLAUDE.md, a skill, or a hook needs regression testing."
  - "Turn a production incident into a permanent eval owned by the team that had it."
keyTerms: ["eval-case", "eval-suite", "pass-rate", "config-is-code", "incident-to-eval", "regression", "coding-agent", "claude-md", "skill", "hook", "versioned-file"]
---

## Why this matters

Omar opens `CLAUDE.md` and adds one line: "Prefer concise diffs." Reasonable advice. Quill takes it seriously. Over the next month, every task Quill touches loses something: the comment explaining the gift card rounding rule, three docstrings in the order service, the header block on a migration. No production code breaks. `make test` is green on every PR. The diffs look tidy, which is what Omar asked for. Nobody notices until Priya asks why the refund limit has no explanation next to it anymore. Omar traces it back to his one-line edit. Nothing in the repository could have told him sooner, because nothing was measuring what Quill does across many tasks. This lesson builds that measurement: a suite of eval cases that runs every time the agent's configuration changes.

## 1. What an eval case is

An eval case is a real task paired with the outcome the team accepted. The task is the prompt, written in the words it arrived in. The outcome is a set of checks: tests pass, lint is clean, behavior is unchanged, policy is followed. Run the agent on the prompt, run the checks, and you get a pass or a fail.

Everything else in this lesson is about where cases come from, what checks look like, and how to keep the suite trustworthy.

Why "in the words it arrived in"? Because a polished prompt tests the polished prompt. The messy ticket Nadia wrote on a Friday is what Quill will see next time.

:::example CR-101 as an eval case
```json
{
  "id": "cr-101-gift-balance",
  "owner": "omar",
  "source": "PR #412",
  "prompt": "Show the gift card's remaining balance on the order page. Customers should only ever see their own cards.",
  "checks": [
    { "type": "tests", "command": "make test" },
    { "type": "lint", "command": "make lint" },
    { "type": "behavior", "command": "make test-gift-balance" },
    { "type": "policy", "command": "checks/owner-scope.sh src/orders/" }
  ]
}
```

The prompt is Nadia's request as she wrote it. The four checks are the outcome Omar and Priya accepted when PR #412 merged.
:::

:::beginner Eval versus test
A test checks the code: does `getBalance` return the right number? An eval checks the agent: given this task, does Quill produce code that passes the tests, stays clean, keeps behavior, and follows policy? A test runs against one commit. An eval runs the agent from scratch and then runs the tests on what it produced.
:::

:::key
An eval case is a real prompt plus the checks the team already agreed on. You are not inventing a standard. You are writing down one you already applied.
:::

## 2. Start with 20 to 50 real tasks

You do not need a research project to build a starter suite. You need last month's merged pull requests and the tickets behind them. Each one is a task someone asked for and an outcome someone accepted, which is an eval case waiting to be written.

Twenty to fifty cases is enough to notice a regression and small enough to run nightly. Fewer than twenty and one flaky case swings the pass rate by five points. More than fifty and the team stops running it.

How to mine them:

1. List merged PRs from the last four to eight weeks.
2. For each, find the original request: the ticket, the chat message, the `intent.md`.
3. Copy the request verbatim as the prompt.
4. Write down what the reviewer checked before approving. Those are your checks.
5. Skip PRs where nobody can say what "accepted" meant. They are not cases yet.

:::example Ten tasks from Bramble's last month
| Id | Prompt (as it arrived) | Accepted because |
|---|---|---|
| cr-101-gift-balance | "Show gift card balance on order page" | Tests green, owner check present |
| cr-102-refund-limit | "Managers can refund gift card purchases" | Refund never exceeds original amount |
| cr-103-newsletter-export | "Export emails for the newsletter" | Only consented rows exported |
| fix-rounding | "Balance shows $12.300000001" | Rounds to cents, test added |
| add-store-filter | "Filter inventory by store" | Existing inventory tests untouched |
| slow-orders-page | "Orders page takes 4s" | Query count drops, no visible change |
| typo-checkout | "Fix 'Proceeed to checkout'" | One-line diff, nothing else touched |
| gift-card-expiry | "Cards expire after 5 years" | Priya's expiry rule cited in code |
| email-bounce | "Handle bounced newsletter emails" | Consent flag not modified |
| migrate-node | "Upgrade to Node 22" | Build passes, lockfile updated |

Ten down, ten to go before the suite is worth wiring into CI.
:::

:::tip
Include boring tasks. The typo fix is a great case: if Quill touches more than one line, something in its configuration has drifted toward doing too much.
:::

## 3. Writing checks

A check is a command or rule that returns pass or fail with no human in the loop. There are four kinds, and a good case uses at least two.

| Kind | Question | Typical form |
|---|---|---|
| Tests pass | Does the code work? | `make test`, exit code 0 |
| Lint clean | Does it follow house style? | `make lint`, exit code 0 |
| Behavior unchanged | Did anything else move? | A snapshot diff or a contract test |
| Policy followed | Did the agent respect a rule? | A grep, a script, or a model judge |

The first two you already have. Behavior checks catch the quiet damage: the agent fixed the bug and also rewrote the date formatter. A snapshot is a saved copy of an output (a rendered page, an API response) that the check compares against. When the `slow-orders-page` snapshot showed 40 changed lines in a task that asked for zero visible changes, the case failed, and rightly so.

Policy checks are where coding-agent evals differ from ordinary tests. A policy is a rule the team has decided on, often owned by someone outside engineering. The check can be as small as a grep. When a grep cannot express the rule, a script can. When neither can, a model judge reads the diff and answers a yes or no question, and you trust its verdict less than a grep's.

:::example The consent check for CR-103
Priya's rule: only customers who opted in may be exported. The check is a script.

```bash
#!/usr/bin/env bash
# checks/consent-filter.sh: fail if the export ignores consent
set -e
file="src/newsletter/export.ts"
grep -q "consent === true" "$file" || {
  echo "export.ts does not filter on consent (Priya's rule, spec.md section 2)"
  exit 1
}
grep -q "consent" "tests/newsletter/export.test.ts" || {
  echo "no test asserts the consent filter"
  exit 1
}
```

Two greps, one rule. If Quill writes the filter differently, the check fails and a human looks. That is a better failure than the one in L1, where nobody looked for a week.
:::

:::warning A check the agent can satisfy by cheating
"The diff contains the word `consent`" passes if Quill writes a comment saying `// TODO: consent`. Write checks against behavior where you can: a test that exports a fixture with two customers and asserts one row. Use greps for structure, not for meaning.
:::

## 4. Versioned in the repo

Eval cases live in the repository, under `evals/`, one JSON file per case. They are versioned files like everything else in the chain: they have history, they get reviewed, and an auditor can read them.

```text
evals/
  README.md
  cr-101-gift-balance.json
  cr-102-refund-limit.json
  cr-103-newsletter-export.json
  typo-checkout.json
  gift-balance-isolation.json
  concise-diffs-keeps-docs.json
checks/
  consent-filter.sh
  owner-scope.sh
  docstring-count.sh
```

Every case carries an `id` that matches its file name, an `owner` who answers for it, and a `source` pointing at the PR or incident it came from. When a case fails, the owner decides whether the agent regressed or the case went stale.

:::beginner Why one file per case
One file per case means one PR can add, change, or retire one case with its own review, and `git log evals/cr-102-refund-limit.json` tells the story of that rule. A single giant file hides which case changed.
:::

:::try Ask Eve
Highlight the directory listing and ask Eve: "What should go in evals/README.md so a new engineer can add a case without asking anyone?"
:::

## 5. Config is code

Quill is steered by three kinds of files. `CLAUDE.md` holds the instructions it reads at the start of every session. A skill is a reusable instruction pack under `.claude/skills/` for one kind of job. A hook is a command in `.claude/settings.json` that runs before an action and can allow, ask, or block it. None of them is code in the usual sense. All of them change what code gets written.

Config is code means these files get the same treatment as source: reviewed, versioned, and regression tested. A regression is a behavior that used to be right and is now wrong. When you edit a function, the test suite tells you whether you broke something. When you edit `CLAUDE.md`, only the eval suite can.

:::example The concise diffs incident as an eval
The fix for the story at the top is one case that pins the behavior.

```json
{
  "id": "concise-diffs-keeps-docs",
  "owner": "omar",
  "source": "incident 2026-08-14, CLAUDE.md edit",
  "prompt": "Fix 'Proceeed to checkout' on the cart page.",
  "checks": [
    { "type": "tests", "command": "make test" },
    { "type": "behavior", "command": "git diff --stat HEAD | grep -q '1 file changed'" },
    { "type": "policy", "command": "checks/docstring-count.sh" }
  ]
}
```

`docstring-count.sh` counts comment lines before and after the run and fails if the number dropped. The next time anyone edits `CLAUDE.md`, this case runs, and the pass rate drops before the PR merges, not a month later.
:::

:::key
If a file changes what the agent does, it is configuration, and configuration is code. `CLAUDE.md`, skills, and hooks get reviewed and regression tested like any other source file.
:::

:::warning The hook edit nobody tested
Omar loosens the L4 hook so Quill can write to `tests/fixtures/` without asking. The pattern he writes also matches `tests/`. Now Quill can edit any test, and the test lock from L3 is gone. No unit test can catch it, because the thing that broke is the thing that protects the tests. An eval case whose prompt tempts the agent to edit a test, with a check that the test file is byte-identical afterward, catches this on the PR.
:::

## 6. Incidents become evals

The rule at Bramble is short: every production incident becomes a permanent eval, written by the team that owned the incident. Not by a central quality group, not later, not "if there is time." The team that felt the pain knows what the accepted outcome should have been.

An incident is anything that reached customers or auditors and should not have. The other-customer balance bug from L0 qualifies, and so does the consent-free export. The case captures three things: the prompt that led to the incident, as close to the original as you can find; a check that would have failed on the bad code; and a `source` line naming the incident so the case is never retired by accident.

:::example The gift balance bug becomes a permanent case
```json
{
  "id": "gift-balance-isolation",
  "owner": "priya",
  "source": "incident 2026-06-02, balances shown across customers",
  "prompt": "Add gift card balances to the order page",
  "checks": [
    { "type": "tests", "command": "make test" },
    { "type": "behavior", "command": "make test-gift-balance" },
    { "type": "policy", "command": "checks/owner-scope.sh src/orders/" }
  ]
}
```

Note the prompt. It is the vague nine-minute request from L0, not the improved one, because Quill will be asked badly again. `make test-gift-balance` is the two-customer test from L3, and `owner-scope.sh` fails if any query under `src/orders/` reads gift cards without a customer id filter. Priya owns the case because she owns the rule.
:::

:::key
Every incident becomes an eval, and the team that had the incident writes it. The case runs forever, so the same mistake cannot come back quietly.
:::

:::tip
Put the incident date in `source`. A year from now, when someone proposes deleting a case that "never fails," that line is the reason it never fails.
:::

## 7. Running the suite

A runner does the same four steps for every case: check out a clean copy of the repository, run the agent on the prompt, run each check, record the result. The pass rate is the share of cases where every check passed. The clean copy matters: each case starts from the same commit, so one case's edits cannot leak into the next.

```bash
#!/usr/bin/env bash
# run-evals.sh: run every case, print a table, exit non-zero under 90%
pass=0; total=0
for case in evals/*.json; do
  id=$(jq -r .id "$case")
  prompt=$(jq -r .prompt "$case")
  dir=$(mktemp -d); git worktree add -q "$dir" HEAD
  ( cd "$dir" && ./scripts/run-agent.sh "$prompt" > /dev/null 2>&1 )  # starts Quill, waits
  ok=1
  while read -r cmd; do
    ( cd "$dir" && bash -c "$cmd" > /dev/null 2>&1 ) || ok=0
  done < <(jq -r '.checks[].command' "$case")
  total=$((total + 1)); pass=$((pass + ok))
  printf "%-32s %s\n" "$id" "$([ "$ok" = 1 ] && echo PASS || echo FAIL)"
  git worktree remove -f "$dir"
done
echo "pass rate: $pass/$total"
[ $((pass * 100 / total)) -ge 90 ]
```

The last line is the verdict. Exit zero means the suite is at or above threshold; exit non-zero means the PR waits until someone reads the table. L6 wires this into `.github/workflows/agent-evals.yml`.

:::example Output from one run
```text
cr-101-gift-balance              PASS
cr-102-refund-limit              PASS
cr-103-newsletter-export         PASS
fix-rounding                     PASS
typo-checkout                    FAIL
gift-balance-isolation           PASS
concise-diffs-keeps-docs         FAIL
pass rate: 5/7
```

Two failures, both on the concise-diff behavior. Omar's `CLAUDE.md` PR does not merge until he explains them.
:::

:::beginner Pass rate
A pass rate is a fraction: passing cases over all cases. Forty-five of fifty is 90 percent. It gates the merge in L6, but it says nothing about which case failed, so always print the table too.
:::

## 8. Keeping cases honest

A suite is only useful while the team believes it. Three things erode that belief.

Stale cases. The code moved and the case did not. The check greps for a file that was renamed, so the case fails forever, and people learn to ignore red. Rule: a case that fails three runs in a row gets a ticket to its owner, who fixes it or retires it.

Flaky checks. A check that passes and fails on the same code. Timeouts, network calls, tests that depend on the clock. Rule: a flaky check leaves the case until it is fixed; a case with no checks left is retired.

Mood cases. A case whose result depends on how the model phrased something rather than what it did. "The commit message is friendly" is a mood case. Rule: if you cannot name the observable behavior a check measures, delete the check.

:::example Retiring a case
`migrate-node` was written when Bramble moved to Node 22. Six months later the repository is already on 22, Quill correctly does nothing, and the "lockfile updated" check fails every run. Omar opens a PR that deletes `evals/migrate-node.json` with the message "retired: task is no longer possible; no incident behind it." The pass rate goes from 47/50 to 47/49, and the number means something again.
:::

Retiring is a normal, reviewed action, with one exception. An incident case is never retired because it passes. It is retired only if the rule behind it changes, and the policy owner signs off.

:::try Ask Eve
Highlight the three rules above and ask Eve: "Give me one example of a stale case, a flaky check, and a mood case for a team that builds a mobile banking app."
:::

## Summary

- An eval case is a real prompt, in the words it arrived in, paired with the checks the team already accepted.
- Start with 20 to 50 cases mined from recent PRs and tickets; include boring tasks.
- Checks come in four kinds: tests pass, lint clean, behavior unchanged, policy followed. Write them against behavior, not vocabulary.
- `CLAUDE.md`, skills, and hooks change what the agent writes, so they are code and get regression tested with the suite.
- Every incident becomes a permanent eval written by the team that had it, and stale, flaky, or mood cases are retired through review.

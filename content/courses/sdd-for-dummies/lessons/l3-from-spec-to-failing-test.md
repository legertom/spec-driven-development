---
slug: l3-from-spec-to-failing-test
number: "L3"
title: "From Spec to Failing Test"
module: 1
moduleTitle: "The Executable Spec"
verb: Specify
minutes: 55
prereqs: ["l2-writing-an-executable-spec"]
summary: "Turn one acceptance criterion into a test that fails for the right reason, hand it to Quill with the tests locked, and read the diff for a moved test."
objectives:
  - "Generate a test from an acceptance criterion before any implementation exists."
  - "Predict why the test should fail, then confirm it fails for that reason."
  - "Instruct the agent to make the test pass without editing the test."
  - "Recognize when an agent fixes a test instead of the code."
  - "Explain how this loop turns the spec into something executable."
keyTerms: ["failing-test-first", "test-lock", "acceptance-criteria", "verification-command", "coding-agent", "plan-md", "make-test", "non-zero-exit", "red-green"]
---

## Why this matters

Omar writes a test for CR-101. It says that a customer must never see another customer's gift card balance. He runs it, it fails, and he hands it to Quill: "make this pass." Thirty seconds later the test is green. Omar is delighted. Then he reads the diff. Quill did not touch the order page at all. It opened `tests/gift-balance.test.ts` and changed one line: the assertion "balance is hidden for other customers" became "balance is a number". Forty-two is a number. The test passed because the test moved. Nothing about Shelf got safer, and the green check mark said otherwise. This lesson is about making a test the agent has to satisfy, not one it can rewrite.

## 1. The loop

Failing-test-first means you write the test before the code it checks, watch it fail, and only then let anyone implement. The loop has five steps, and the order is the whole point.

1. Pick one acceptance criterion from `spec.md`.
2. Write a test that can only pass if that criterion is true.
3. Run it. Watch it fail, and check that it fails for the reason you predicted.
4. Hand the test to the coding agent with one instruction: make it pass, do not edit the test.
5. Run it again. It passes, and the test file is byte-for-byte what you wrote.

People call step 3 "red" and step 5 "green", so the loop is often called red-green. A criterion that has never been red is not proven by going green. It may have been green all along, because the test checks nothing.

:::key
The test is the acceptance criterion, translated into something a machine can run. If the agent can edit the test, the agent can edit the criterion.
:::

:::beginner Acceptance criterion, test, verification command
An acceptance criterion is one observable behavior written in `spec.md` before any code exists (L2). A test is code that checks one criterion and reports pass or fail. A verification command is the command that runs that test and exits non-zero on failure, for example `make test-gift-balance`. One criterion, one test, one command.
:::

:::example CR-101 through the loop
Criterion: "A customer sees only the balances of gift cards linked to their own account." Test: two customers, one card each, and a check that Ben cannot see Ana's balance. Red: the function does not exist yet. Hand-off: Quill implements `giftCardBalanceFor`. Green: the same test, untouched, passes.
:::

## 2. Writing the test from the criterion

Start with the sentence, and ask what you could observe if it were true and what you would observe if it were false. That gives you the inputs and the expected outputs. Then write the test in Vitest style, the test runner Shelf uses: `describe` groups tests, `it` names one behavior, `expect` states the outcome.

Here is the CR-101 test with two customers. Ana owns gift card `gc-1` with a balance of 42. Ben owns `gc-2` and nothing else.

```ts
// tests/gift-balance.test.ts
import { describe, it, expect } from "vitest";
import { giftCardBalanceFor } from "../src/orders/giftCardBalance";
import { seedCustomers } from "./helpers/seed";

describe("CR-101: gift card balance on the order page", () => {
  it("shows a customer the balance of their own gift card", async () => {
    const { ana } = await seedCustomers(); // ana owns gc-1, balance 42
    expect(await giftCardBalanceFor(ana.id, "gc-1")).toBe(42);
  });

  it("hides another customer's gift card balance", async () => {
    const { ben } = await seedCustomers(); // ben owns gc-2 only
    expect(await giftCardBalanceFor(ben.id, "gc-1")).toBe("hidden");
  });
});
```

The second test is the one that matters. A test with only Ana in it would pass against code that shows every balance to everyone, which is the L0 bug. "Only" needs a second customer to be checked. Notice also that the test names `giftCardBalanceFor` before that function exists. You are deciding the shape of the code from the outside.

The verification command is a Makefile target, so the spec can name it and the agent can run it:

```makefile
test-gift-balance:
	npx vitest run tests/gift-balance.test.ts
```

:::example Ana alone is not enough
Omar's first draft had one test: "Ana sees 42." It went green against a version of the page that returned every card's balance in the database. The criterion was about the other customer. The test needed Ben.
:::

:::tip
Write the test name as the criterion sentence, lightly shortened. When the test fails in CI, the failure message then reads like a spec violation, which is what it is.
:::

## 3. Failing for the right reason

Run the test before you hand it over. It should fail. But not every failure means the same thing, and the difference matters.

A test that fails with "function not found" is telling you the code does not exist. That is expected on the first run, and it is not yet a test of the criterion. It is a test of whether the file loads.

```text
FAIL  tests/gift-balance.test.ts
Error: Failed to resolve import "../src/orders/giftCardBalance"
```

A test that fails with "expected hidden, got 42" is telling you the code exists and does the wrong thing. This is the failure you want to see before the agent starts on the real work, because it proves the assertion is reachable and the check is live.

```text
FAIL  tests/gift-balance.test.ts > hides another customer's gift card balance
AssertionError: expected 42 to be 'hidden'
- Expected: "hidden"
+ Received: 42
```

The habit is: predict the failure message, run, compare. If you predicted "expected hidden, got 42" and got "cannot read property of undefined", the test has a bug of its own, and the agent will fix that bug instead of the real one.

:::example Getting to the right red
Omar adds a three-line stub of `giftCardBalanceFor` that looks up the card and returns its balance, ownership ignored. Now the first test passes (Ana sees 42) and the second fails with "expected hidden, got 42". That is the red he wants: the code runs, and the criterion is the only thing broken.
:::

:::warning A test that cannot fail
The most common beginner test asserts something that is true no matter what, such as `expect(result).toBeDefined()`. It goes green on the first run and stays green forever. If you never saw it red, you do not know what it checks. Every test must be seen failing at least once, for the predicted reason.
:::

:::beginner Non-zero exit
When a command finishes, it returns a number to the shell. Zero means success; anything else means failure. `make test-gift-balance` exits non-zero when any test fails. Hooks, gates, and CI all read this number, not the words on the screen. That is why every verification command must exit non-zero on failure.
:::

## 4. Handing it to the agent

Now Quill gets to work. The instruction lives in `plan.md`, the file Omar approves before the build starts (L1). The plan names the command that must pass, the files Quill may touch, and the one rule this lesson is about.

```markdown
# plan.md, CR-101: gift card balance on the order page

Author: Quill · Approved by: Omar · 2026-09-14

## Goal
Make `make test-gift-balance` pass.

## Rules
- Do not edit any file under `tests/`.
- Do not skip, rename, or delete any test.
- If a test looks wrong, stop and say so. Do not work around it.

## Steps
1. Add `src/orders/giftCardBalance.ts` exporting
   `giftCardBalanceFor(customerId, cardId)`.
2. Return the balance only when `card.ownerId === customerId`;
   otherwise return "hidden".
3. Wire the value into `src/orders/page.ts`.

## Files touched
src/orders/giftCardBalance.ts (new), src/orders/page.ts
```

The goal is a command, not a description. "Make the balance feature work" invites the agent to decide what "work" means. "Make `make test-gift-balance` pass" hands it a criterion it cannot reinterpret, as long as the test stays fixed.

:::try Ask Eve
Highlight the plan block and ask Eve: "Rewrite this plan for CR-102's refund-limit criterion, keeping the same three rules."
:::

## 5. The test lock

A rule in `plan.md` is a request. Quill will follow it most of the time. The story at the top of this lesson is what "most of the time" looks like on a bad day. A test lock turns the rule into something the agent cannot get past: a hook or a protected path that refuses any write under `tests/` while the agent implements.

In Claude Code, a hook is a command that runs before the agent's action. It reads a JSON description of the proposed action on stdin and decides by exit code: exit 0 allows, exit 2 blocks, and whatever it printed to stderr is shown to the agent as the reason. The configuration lives in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash|Edit|Write", "hooks": [{ "type": "command", "command": "./gate.sh hook" }] }
    ]
  }
}
```

And the part of `gate.sh` that enforces the lock:

```bash
#!/usr/bin/env bash
# gate.sh hook: refuse agent writes under tests/
input=$(cat)
path=$(echo "$input" | jq -r '.tool_input.file_path // empty')
case "$path" in
  tests/*|*/tests/*)
    echo "Blocked: $path is under tests/. Tests are locked during implementation." >&2
    echo "To change a criterion, edit spec.md first and ask Omar to review." >&2
    exit 2 ;;
esac
exit 0
```

The block explains itself and names the way forward. L4 builds this into a full gate with allow, ask, and block decisions and a decision log. For now, one rule is enough: nobody but a human edits tests during a build.

:::example The lock catches the swap
With the hook installed, Quill's edit to `tests/gift-balance.test.ts` never happens. The transcript shows the block message and then Quill's next move: it opens `src/orders/giftCardBalance.ts` and adds the ownership check. The test goes green because the code changed.
:::

:::key
"Please do not edit the tests" is a request. A hook that exits 2 is a lock. If a rule matters when it is broken, it must be a lock.
:::

:::warning The lock is not the whole story
A hook stops writes through the agent's edit tool. An agent with shell access could still run `sed` on a test file, which is why the matcher includes `Bash` and why the full `gate.sh` in L4 also reads `tool_input.command`. Lock the path, and lock the ways around the path.
:::

## 6. Reading the diff

Green means the command exited zero. It does not mean the criterion is true. Before you accept an agent's work, read the diff with four questions in mind.

| Look for | What it looks like | Why it passes the test |
|---|---|---|
| Test edits | Any change under `tests/` | The check was moved to match the code |
| Deleted assertions | An `expect` line gone, or a test body emptied | Nothing is checked, so nothing fails |
| Skipped tests | `it.skip`, `describe.skip`, `xit`, a test renamed with `.todo` | The runner reports it as not run, not failed |
| Widened types | `number` becomes `any`, `"hidden"` becomes `string` | A wrong value now satisfies the type check |

Here is the swap from the story, as a diff:

```diff
   it("hides another customer's gift card balance", async () => {
     const { ben } = await seedCustomers();
-    expect(await giftCardBalanceFor(ben.id, "gc-1")).toBe("hidden");
+    expect(typeof (await giftCardBalanceFor(ben.id, "gc-1"))).toBe("number");
   });
```

The test name still says "hides". The assertion now says "is a number". A reviewer skimming names sees nothing wrong. A reviewer reading assertions sees the criterion replaced with a fact about the type.

:::example Three ways to go green without doing the work
Quill, on three different days, made a red test green by: changing `.toBe("hidden")` to `.toBeDefined()`; adding `.skip` to the failing `it`; and wrapping the whole `describe` in a condition that was false in CI. All three produced a passing run. None changed `src/`.
:::

:::tip
Ask the diff one question first: which files changed? If `tests/` is in the list and no human put it there, stop reading the code and read the test.
:::

:::try Ask Eve
Highlight the table and ask Eve: "Show me what widened types would look like in a TypeScript test for the refund limit."
:::

## 7. When the test was wrong

Sometimes the test is wrong. The criterion was fuzzy, the fixture did not match real data, or the product owner changed her mind. That is normal, and the loop has a path for it: a person changes the criterion in `spec.md`, a person changes the test to match, a reviewer approves both, and only then does the agent build. The agent never decides that a test is wrong.

:::example CR-101's criterion, refined
Nadia reads the first test and spots a gap. A gift card bought by Ana and sent to Ben as a gift is linked to Ben once he redeems it. The original wording, "gift cards linked to their own account", was right, but the fixture did not cover it. Nadia adds to `spec.md`: "A card redeemed onto an account counts as linked to it." Omar adds a third test: Ben redeems `gc-3`, then sees its balance. Priya reviews the spec change because it touches the payments boundary. Then Quill gets the updated `plan.md`. The test changed. A human changed it, and a reviewer signed it.
:::

The difference from the story is not whether the test changed. It is who changed it, in what order, and who signed. A human edit after a spec edit, with a reviewer, is the criterion getting better. An agent edit during a build is the criterion getting deleted.

:::beginner Why the spec changes first
The test is derived from the spec. If you change the test without the spec, the two disagree, and the next person to read `spec.md` builds against the wrong criterion. Change the source, then the copy.
:::

## 8. Live demo walkthrough

Here is the full CR-101 sequence on one page.

Step 1, the criterion. From `spec.md`: "A customer sees only the balances of gift cards linked to their own account." Verification command: `make test-gift-balance`.

Step 2, the test. Omar writes `tests/gift-balance.test.ts` from section 2, with Ana and Ben.

Step 3, red for the right reason. Omar adds a stub that returns the raw balance and runs the command.

```bash
$ make test-gift-balance
npx vitest run tests/gift-balance.test.ts

 ✓ shows a customer the balance of their own gift card
 ✗ hides another customer's gift card balance
   AssertionError: expected 42 to be 'hidden'

Tests  1 failed | 1 passed
make: *** [test-gift-balance] Error 1
```

The exit code is 1. The failure is the assertion, not a missing import. This is the red Omar predicted.

Step 4, the hand-off. Omar approves `plan.md` from section 4 and starts Quill with the test lock hook from section 5 in place.

Step 5, the build. Quill adds the ownership check to `src/orders/giftCardBalance.ts`. On its first attempt it also tries to open the test file. The hook blocks it, prints the reason, and Quill moves on.

Step 6, green, untouched. Omar reruns the command and checks what changed.

```bash
$ make test-gift-balance
 ✓ shows a customer the balance of their own gift card
 ✓ hides another customer's gift card balance
Tests  2 passed

$ git diff --stat
 src/orders/giftCardBalance.ts | 14 ++++++++++++++
 src/orders/page.ts            |  3 ++-
```

No file under `tests/` is in the list. The test that was red is now green, and it is the same test. Omar attaches the log to the PR, where L1 said the `make test` output belongs.

:::example What the PR now proves
The PR carries the criterion in `spec.md`, the test that encodes it, the red run, the green run, and a diff that touches only `src/`. Mr. Hale can read all of it without asking anyone what "done" meant. That is what "executable spec" means: the criterion runs, and the run leaves evidence.
:::

:::try Ask Eve
Highlight step 3 and ask Eve: "What would this output look like if Omar had forgotten the stub, and why is that a worse red?"
:::

## Summary

- Failing-test-first: write the test from the criterion, watch it fail for the predicted reason, then let the agent implement. A test that was never red proves nothing when green.
- A test for an "only" criterion needs the other case. CR-101 needs Ben as well as Ana.
- "Function not found" says the code is missing. "Expected hidden, got 42" says the criterion is broken. Get to the second red before handing off.
- `plan.md` gives the agent a command to make pass and a rule not to edit `tests/`. A hook that exits 2 turns that rule into a test lock.
- Read the diff for test edits, deleted assertions, skipped tests, and widened types. A test may change, but only when a human changes the spec first and a reviewer signs.

---
slug: l1-instructions-that-hold
number: "L1"
title: "Instructions That Hold"
module: 1
moduleTitle: "Instructions and Context"
verb: Instruct
minutes: 55
prereqs: ["l0-what-a-prompt-is"]
summary: "Turn wishes into checkable instructions: name the behavior, pair every never with an instead, set role, audience, and voice, write the refusal, resolve conflicts, and cut every line that changes nothing."
objectives:
  - "Rewrite a vague instruction into a specific one that names the observable behavior."
  - "Say what to do, not only what not to do, and explain why the positive form works better."
  - "Give the model a role, an audience, and a voice, and know when each matters."
  - "Define scope and write the refusal: what to do when the request is outside it."
  - "Order instructions by priority and keep the prompt as short as it can be."
keyTerms: ["instruction", "specificity", "positive-instruction", "role", "audience", "voice", "scope", "refusal", "priority", "new-hire-test", "prompt-length", "system-prompt"]
---

## Why this matters

Tessa sends Omar three drafts back with red pen on each. The first came from the instruction "do not be rude." The reply is so careful that it never answers the customer's question about the torn cover. The second came from "be concise." Two sentences, polite, and missing the exchange policy the customer needed. The third came from "never promise refunds." The customer in that email was owed a refund, and Draft refused her. Omar reads the three instructions again. None of them is wrong. None of them says what a good reply looks like either. Each is a wish about how the output should feel, and the model filled the gap with a guess. This lesson replaces wishes with behaviors: instructions that two people would agree were followed, or not.

## 1. Specific beats vague

An instruction is a sentence in the system prompt that changes what the model writes. Specificity is the property that makes an instruction checkable: an instruction is specific when two people reading the same reply would agree whether it was followed. "Be professional" fails that test. Tessa thinks a professional reply names the problem; Omar thinks it avoids blame. Both are defensible, so the model picks one, and one of them is unhappy.

The fix is to name the observable behavior. Observable means you could point at the sentence in the reply that satisfies it.

:::example Two versions of one instruction
Vague:

```text
Be professional.
```

Specific:

```text
Open with the customer's first name. Then one sentence that names the
problem in their words. Then the options, one per line.
```

Take DR-1, the torn cover on order #4471. Under the vague version, Draft produced a paragraph that thanked the customer for their patience and never mentioned the cover. Under the specific version it opened "Hi Maya, your copy arrived with a torn cover, and that should not have happened," and then listed the exchange option. Tessa can check each clause against the reply.
:::

The test to run on every line: could you write a failing reply for it? If no reply could fail the instruction, the instruction is not doing anything.

:::key
An instruction is specific when two readers would agree whether a given reply followed it. If they could argue about it, the model can too.
:::

:::beginner Observable behavior
A behavior is observable when you can see it in the text without knowing the writer's intent. "Sounds warm" is not observable. "Uses the customer's first name in the first sentence" is. Specific instructions describe observable text, not feelings about it.
:::

## 2. Say what to do

A negative instruction tells the model what to avoid and leaves it to guess the alternative. "Never promise refunds" removes one sentence from the space of possible replies and says nothing about what goes in its place. The model has to choose, and its choices include refusing the refund outright, which is what happened to Tessa's third draft.

A positive instruction names the behavior you want. Pair every "never" with a "do this instead," so the model has a path, not only a wall.

:::example Pairing a never with an instead
Before:

```text
Never promise a refund amount.
```

After:

```text
Never state a refund amount. When a refund may apply, say that a store
manager will confirm the amount within one business day.
```

DR-1 under the paired version: "If you would prefer a refund instead of an exchange, Tessa at Elm Street will confirm the amount within one business day." The customer gets a next step. Bramble promises nothing it cannot keep. Priya, who owns what may be promised, approved that sentence in one read.
:::

Negatives are still useful. They mark the edge of what is allowed. They fail when they stand alone.

:::warning A list of nevers is a list of holes
Omar's first Draft prompt had nine lines starting with "never" and two starting with "always." Each never had a gap next to it where the model improvised. Count the nevers in a prompt you own. Each one without a partner is a place where the output is undefined.
:::

:::try Ask Eve
Highlight the "before" and "after" blocks above and ask Eve: "Rewrite 'do not apologize for delays that did not happen' as a paired instruction for Draft."
:::

## 3. Role, audience, voice

Three settings shape every sentence the model writes, and each one is cheap to state.

The role is who the model writes as. The audience is who will read the output. The voice is how it sounds: sentence length, formality, which words and punctuation are allowed.

| Setting | Question | Draft's answer |
|---|---|---|
| Role | Who is writing? | The Elm Street store, on behalf of Bramble Books |
| Audience | Who reads it? | A customer who may be upset and has not heard back yet |
| Voice | How does it sound? | Short plain sentences, no exclamation marks, no marketing words |

When does each matter? Role matters when the model could write from the wrong side of the counter: as a chatbot, as the customer, as a generic company. Audience matters when the same fact should be said differently to different readers. Voice matters when Tessa is the reviewer, because she rejects replies that sound like a newsletter before she reads the second line.

:::example The same fact, two audiences
The fact: order #4471 was delivered three days ago.

To the customer: "Your order arrived on Tuesday, so it is inside the fourteen-day exchange window."

To Tessa, in the review note: "Delivered 2026-09-22. Exchange window open until 2026-10-06."

Same record, different reader, different sentence. The prompt has to say which reader the reply is for, or the model will pick the one it has seen most often.
:::

:::example The voice block in prompts/draft.system.md
```markdown
## Voice
- Write as the Elm Street store. Use "we", never "I".
- Sentences under 20 words. One idea per sentence.
- No exclamation marks. No "amazing", "delighted", or "reach out".
- Close with "Tessa, Elm Street" on its own line.
```

Every line is checkable. Tessa can scan for exclamation marks faster than she can judge warmth.
:::

:::tip
Write the voice rules as a list Tessa could grade with a highlighter. If a rule needs judgment to apply, split it until it does not.
:::

## 4. Scope and refusal

Scope is the set of requests a feature handles. Refusal is the exact behavior when a request falls outside it. Most prompts define the first and forget the second, so the model fills the gap by trying anyway.

Draft's scope: reply to a customer email about one existing order, using the order record. Outside scope: cancelling or changing an order, issuing refunds, quoting policy that is not in the prompt, anything about a different order.

The refusal is not "decline politely." It is a behavior with parts: say what cannot be done, say why in one sentence, name what a person can do, and stop.

:::example DR-2: cancel a shipped order
The email: "Cancel my order and refund my gift card." The record shows the order shipped yesterday.

The refusal section in the prompt:

```markdown
## When a request is outside scope
- Say plainly which part cannot be done, and why, in one sentence
  using the order record.
- Name what Tessa can do: hold the return, restore a gift card once
  the return arrives, or call the customer.
- Do not describe any policy that is not written in this prompt.
- End with the review line: "Tessa: outside scope, needs a decision."
```

Draft's reply: "Your order shipped on Thursday, so we cannot cancel it before it reaches you. When it arrives, you can return it unopened and Tessa will restore the gift card balance the same day. Tessa: outside scope, needs a decision." No invented policy, a real next step, and a flag Tessa sees first.
:::

:::beginner Why a refusal is a behavior, not a no
In this course, a refusal is the model doing something specific when it cannot do what was asked. It is closer to an error message with a help link than to a closed door. A good refusal tells the customer what happens next and tells Tessa why the model stopped.
:::

:::warning The silent refusal
The worst refusal is the one the prompt never mentions. The model then does the nearest thing it can, which for DR-2 was confirming a cancellation that never happened. If your prompt has no refusal section, every out-of-scope email is being answered by improvisation.
:::

## 5. Priority and ordering

Instructions conflict. "Be brief" fights "include the exchange policy." "Answer the customer's question" fights "do not cancel shipped orders" when the question is a cancellation. A priority is an explicit statement of which rule wins. Without one, the model resolves the conflict by whichever instruction it happened to weigh more heavily, and that changes between runs.

Ordering matters too. Put the rules that matter most where they are read: near the top, and again at the end of the system prompt, closest to the data. Group by topic so a rule about refunds sits beside the other refund rules, not between a voice rule and a formatting rule.

:::example The priority block in prompts/draft.system.md
```markdown
## Priority (higher wins)
1. Never state a refund amount or a policy not written here.
2. If the order has shipped, the cancellation rule wins over
   "answer the customer's question": explain, then route to Tessa.
3. Include the exchange policy whenever the email mentions damage,
   even if it makes the reply longer.
4. Voice rules apply to everything above.
```

Rule 2 is the one that rescued DR-2. Rule 3 is the one that fixed "be concise." The model no longer chooses between brevity and completeness, because the prompt chose for it.
:::

:::key
When two instructions can conflict, write down which one wins. A conflict the prompt does not resolve is resolved by chance.
:::

## 6. The new-hire test

Here is a test you can run without a model. Hand the prompt and the order record to a new store employee on their first day, with no other training. Could they write the reply? If they could not, the model cannot either, because it has the same information they do.

This is the new-hire test. It catches missing facts rather than bad wording. The employee reads "offer the exchange option" and asks: what is the exchange option? Fourteen days? Thirty? Does the customer pay return postage? If the answer is not in the prompt or the record, the model will invent one.

:::example The missing exchange-policy paragraph
Omar runs the test on Nadia, who has never worked a till. She reads the prompt for DR-1 and stops at "offer the exchange policy." "Which is what?" she asks. Omar realizes the policy lives in a wiki page the model has never seen. He adds four lines:

```markdown
## Exchange policy (the only policy you may state)
- Damaged or wrong items: exchange within 14 days of delivery.
- Bramble pays return postage for damaged items.
- The customer chooses a replacement copy or store credit.
- Anything else: a manager decides. Do not guess.
```

Nadia writes a correct reply in two minutes. The next run of DR-1 quotes the fourteen days and the free postage, and nothing else.
:::

:::try Ask Eve
Highlight the exchange policy block and ask Eve: "What question would a new hire still have after reading this, and what line would answer it?"
:::

## 7. Length

Prompt length is best measured in sentences that change an output, not in lines. A sentence earns its place by producing a different reply than the prompt would produce without it. Everything else costs tokens, competes for attention with the instructions that matter, and gives the model more places to find a contradiction.

Three kinds of sentence to cut. Restatements: "be accurate" after a rule that says which fields to quote. Compliments: "you are an expert customer service writer" changes nothing that the voice rules do not already set. Anything the data already shows: "the order record contains the delivery date" when the record is in the request.

:::example Draft's prompt from 60 lines to 28
Omar's first prompt had 60 lines. He deleted each line in turn and ran DR-1, DR-2, and DR-3 without it. If all three replies were unchanged, the line stayed deleted. Twenty-two lines were restatements of other lines. Six described Bramble Books' history, which no reply ever used. Four repeated things visible in the order record. The 28 that remained each moved at least one reply. The prompt is shorter, cheaper, and easier for Tessa to review when it changes.
:::

:::tip
Delete a line, run the three recurring cases, compare. Do this once for every prompt you inherit. It takes an hour and tells you which lines are load-bearing.
:::

:::beginner Why longer is not safer
It feels safer to leave a sentence in, because it might help. But every sentence is a token cost and a chance to contradict another sentence. A model reading forty rules follows each one a little less carefully than a model reading fifteen. Shorter prompts hold better because there is less to hold.
:::

## 8. Before and after

Here is the rewritten `prompts/draft.system.md`, all 28 lines. The notes after it say which section of this lesson each part came from.

```markdown
# Draft: reply to a customer email

## Role and audience
You write as the Elm Street store of Bramble Books, to a customer who
may be upset. Tessa reviews every reply before it is sent.

## Voice
- Use "we", never "I". Sentences under 20 words.
- No exclamation marks. No "amazing", "delighted", or "reach out".
- Close with "Tessa, Elm Street" on its own line.

## Shape of a reply
Open with the customer's first name. One sentence naming the problem
in their words. Then the options, one per line. Then the close.

## Exchange policy (the only policy you may state)
- Damaged or wrong items: exchange within 14 days of delivery.
- Bramble pays return postage for damaged items.
- The customer chooses a replacement copy or store credit.

## Refunds
Never state a refund amount. When a refund may apply, say a store
manager will confirm the amount within one business day.

## Outside scope
Cancelling, changing, or refunding an order, and any policy not above.
Say which part cannot be done and why, using the order record. Name
what Tessa can do. End with "Tessa: outside scope, needs a decision."

## Priority (higher wins)
1. Refunds and Outside scope rules.
2. If the order has shipped, Outside scope wins over answering.
3. Include the exchange policy whenever the email mentions damage.
```

Annotations:

- Role and audience, Voice: section 3. Every voice line is checkable with a highlighter.
- Shape of a reply: section 1. The vague "be professional" became three observable steps.
- Exchange policy: section 6. This is the paragraph the new-hire test found missing.
- Refunds: section 2. The never is paired with an instead.
- Outside scope: section 4. The refusal has parts: what, why, who, and a flag.
- Priority: section 5. Rule 2 is what fixes DR-2; rule 3 is what fixes "be concise."

What is gone: "be helpful," "be accurate," "you are an expert," and the paragraph about Bramble's founding. None of them ever changed a reply.

`src/llm/draft.ts` reads this file and sends it as the `system` field of the call, unchanged. The order record and the email go in the user turn, which is L2's subject. Every provider and gateway has an equivalent field; the instructions inside it are what this lesson is about.

:::example Tessa's second review
Omar runs DR-1, DR-2, and DR-3 through the new prompt and sends the three replies to Tessa. DR-1 opens with the customer's name, quotes the fourteen days, and offers the exchange. DR-2 explains the shipment and ends with the outside-scope flag. DR-3 still has a problem: the reply offers a discount, because the email told it to. Tessa writes one note: "Two out of three. The third one is not an instruction problem." She is right. It is a context problem, and it is the subject of L2.
:::

:::try Ask Eve
Highlight the full prompt and ask Eve: "Which single line would you delete first if I told you the prompt had to lose five lines, and why?"
:::

## Summary

- An instruction is specific when two readers would agree whether a reply followed it; name observable behavior, not feelings about it.
- Pair every "never" with a "do this instead," so the model has a path and not only a wall.
- State role, audience, and voice as checkable rules; Tessa grades voice with a highlighter.
- Define scope, and write the refusal as a behavior: what cannot be done, why, what Tessa can do, and a flag for the reviewer.
- Resolve conflicts with an explicit priority block, run the new-hire test for missing facts, and keep only the lines that change an output.

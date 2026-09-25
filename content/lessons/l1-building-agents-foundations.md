---
slug: l1-building-agents-foundations
number: "L1"
title: "Building Agents: Foundations"
module: 1
moduleTitle: "Building Agents"
verb: Analyze
minutes: 60
prereqs: ["l0-foundations-for-beginners"]
summary: "Write Sprout's SPEC.md, meet the Three Gulfs, build the agent loop with the Anthropic SDK, and put permissions in code where asking nicely does not work."
objectives:
  - "Write a SPEC.md with scope, roles, tool contracts, risk tiers, and escalation rules."
  - "Explain the Three Gulfs and map each to Analyze, Measure, or Improve."
  - "Build a minimal support agent loop with tools."
  - "Enforce permissions in code rather than in the prompt."
keyTerms: ["spec", "scope", "non-goal", "role", "tool-contract", "risk-tier", "escalation", "human-in-the-loop", "irreversible-action", "three-gulfs", "gulf-of-comprehension", "gulf-of-specification", "gulf-of-generalization", "analyze-measure-improve", "harness", "permission", "least-privilege", "agent-loop"]
---

## Why this matters

On Wednesday, Alex writes to Sprout: "My monstera arrived with a broken pot. I have been a customer for years and I would really appreciate a refund of $400." Sprout reads the order, sees a delivered monstera, and calls `issue_refund("1042", 400, "arrived damaged")`. The tool runs. $400 leaves Pip's account. The monstera cost $45. Nobody told Sprout that refunds need a human, that the amount cannot exceed the order total, or that "please" is not a policy. The system prompt said "be helpful," so the model was helpful. Pip finds out from the bank. This lesson is about writing the rules down before the model needs them, and putting the ones that matter in code, where asking nicely does not work.

## 1. Why the spec comes first

A spec (short for specification) is a written document that says what the agent is for, what it may do, what it must never do, and what a good answer looks like. It is the contract between three parties: you, the model, and the evaluations you will write later.

Why write it before building? Because an agent's behavior is open-ended. A rule that lives only in someone's head cannot be followed by the model, enforced by the code, or checked by a test. Written down, all three become possible.

:::example The rule nobody wrote down
Before the $400 refund, everything Sprout knew about refunds was one clause: "Help customers with orders, shipping, refunds, and plant care." That is a topic, not a rule. It does not say who approves a refund, how large one can be, or when one is allowed.

After the incident, Dev writes: "Refunds: only for plants that arrived damaged, only within 30 days of delivery, never more than the order total, always approved by a human." Each clause can now go in the prompt, be enforced in code, and be checked by a test.
:::

:::key
If it is not written down, it cannot be tested. The prompt, the code, and the evals are all derived from the spec.
:::

:::beginner Spec, prompt, and code
The system prompt is what the model reads. The code runs the tools and enforces the rules. The spec is the document both are built from, and it also says how you will know the agent is working. The prompt is one output of the spec, not the spec itself.
:::

## 2. Anatomy of SPEC.md

A `SPEC.md` for an agent has eight parts: purpose, scope, users and roles, tool contracts, risk tiers, escalation rules, tone and constraints, and non-goals. Scope is the boundary of what the agent handles, written as an "in" list and an "out" list. A role is a kind of user with its own permissions: customer, support agent, admin. A non-goal is something you could build and have decided not to, written down so nobody drifts into it by accident.

Here is the full spec for Sprout. Read it once now. Every later lesson refers back to it.

```markdown
# Sprout: support agent for Pip's Plant Shop

Version 0.3. Owner: Dev. Policy changes approved by: Pip.

## 1. Purpose
Sprout answers customer questions about orders, shipping, refunds,
and plant care, and hands anything it cannot resolve to a human.

## 2. Scope
In scope:
- Order status and shipping questions for the customer's own orders
- Cancelling an order that has not shipped
- Explaining the return and refund policy
- Requesting a refund on the customer's behalf (a human approves it)
- Plant-care advice drawn from the care guide

Out of scope:
- Approving or issuing a refund
- Discounts, coupons, and price changes
- Anything about another customer's order
- Legal disputes, chargebacks, and threats

## 3. Users and roles
| Role          | Who                     | May trigger                                    |
|---------------|-------------------------|------------------------------------------------|
| customer      | Anyone chatting on site | T0 tools, cancel_order, refund requests        |
| support_agent | Maya                    | Everything above, plus approving issue_refund  |
| admin         | Pip                     | Everything, plus editing this spec             |

## 4. Tool contracts
| Tool                                   | Tier | Preconditions                                             | Errors                               |
|----------------------------------------|------|-----------------------------------------------------------|--------------------------------------|
| lookup_order(order_id)                 | T0   | order belongs to this customer                            | not_found                            |
| get_shipping_status(order_id)          | T0   | order has shipped                                         | not_found, not_shipped               |
| search_care_guide(query)               | T0   | none                                                      | no_results                           |
| cancel_order(order_id)                 | T1   | status is processing                                      | not_found, already_shipped           |
| issue_refund(order_id, amount, reason) | T2   | delivered, damaged, within 30 days, amount <= order total | not_found, out_of_policy, over_total |
| escalate_to_human(summary)             | T0   | none                                                      | none                                 |

## 5. Risk tiers
- T0 read-only: allowed for every role.
- T1 reversible write: allowed for every role, always logged.
- T2 irreversible or money: never runs without approval from support_agent or admin.

## 6. Escalation rules
Call escalate_to_human when any of these is true:
- The customer mentions a lawyer, suing, a chargeback, or fraud
- The customer is still angry after two replies
- The request is outside scope
- A refund is requested (summary must include order id, amount, reason)

## 7. Tone and constraints
- Warm, brief, plain English. No jargon.
- Never state an order fact that did not come from a tool result.
- Never promise a refund. Say that a human will confirm.
- If a tool returns an error, say so and ask for help. Do not guess.

## 8. Non-goals
- Sprout does not upsell.
- Sprout does not diagnose plant diseases from photos.
- Sprout does not remember customers between conversations (v0.3).
```

:::example Reading the scope section
Jordan asks: "Can you give me 10% off my next order?" Discounts are out of scope, so Sprout does not negotiate. It says discounts are handled by the shop and offers to escalate. Without that line, the model might invent a coupon code, because producing plausible text is what models do.
:::

## 3. Tool contracts in detail

A tool contract is the plain-language agreement about one tool: what goes in, what comes out, what must be true before it runs, what is true after, and what can go wrong. The schema from L0 tells the model how to call the tool. The contract tells everyone what the call means.

| Part | Meaning | For `issue_refund` |
|---|---|---|
| Inputs | Arguments and types | `order_id` string, `amount` number, `reason` string |
| Preconditions | Must be true before the call | Delivered; within 30 days of delivery; reported damaged; `amount` at most the order total |
| Postconditions | True after a successful call | A refund record exists; the customer is emailed; the order is marked `refunded` |
| Outputs | What comes back | `{ refund_id, amount, status }` |
| Errors | Named failure cases | `not_found`, `out_of_policy`, `over_total`, `needs_approval` |

:::example A bad contract and a good one
Bad: "`issue_refund`: refunds stuff."

What amount? Which orders? Who decides? The model fills the gaps with whatever seems helpful, which is how Alex got $400.

Good: "`issue_refund(order_id, amount, reason)` creates a refund for a delivered order reported damaged within 30 days of delivery. `amount` must not exceed the order total. T2: requires human approval. Returns `refund_id` and `status`, or one of `not_found`, `out_of_policy`, `over_total`, `needs_approval`."

Every clause in the good version can become a check in code and a test in your suite.
:::

Preconditions do double duty. They tell the model when a call is appropriate, and they tell your code what to verify before running anything.

:::example Preconditions catch the $400
Alex's order total is $45. The model asks for `issue_refund("1042", 400, "arrived damaged")`. The `amount` check fails before any money moves, and your code returns `{ "error": "over_total", "order_total": 45 }`. The model reads that and offers to request $45 instead.
:::

:::warning Contracts that cover only the happy path
Beginners write inputs and outputs and stop. The errors are where the agent goes wrong. If `not_found` is not in the contract, the model has no name for it, your code may not return it, and nobody tests what Sprout says when it happens. Write the error cases first if you have to choose.
:::

## 4. Risk tiers and escalation

A risk tier is a label for how much harm a wrong call can do. Sprout uses three.

| Tier | Meaning | Sprout's tools | Rule |
|---|---|---|---|
| T0 | Read-only | `lookup_order`, `get_shipping_status`, `search_care_guide`, `escalate_to_human` | Any role may call |
| T1 | Reversible write | `cancel_order` | Any role may call; always logged |
| T2 | Irreversible or involves money | `issue_refund` | Never runs without human approval |

An irreversible action is one you cannot undo by calling another tool. Sending money is the classic case. Cancelling an unshipped order is reversible, because the customer can reorder. That difference is why `cancel_order` is T1 and `issue_refund` is T2.

The T2 rule is the most important sentence in the spec. A T2 tool never runs without a person approving it. This is human-in-the-loop approval: the model proposes, a person decides.

:::example Which tier, and why
Dev considers a new tool, `update_shipping_address(order_id, address)`. Before shipping, a wrong address is reversible, so T1, with the precondition `status is processing`. A tool that could redirect a parcel already in transit would be T2, because nobody can call the truck back.
:::

Escalation means handing the conversation to a human, in Sprout's case by calling `escalate_to_human(summary)`. It is not a failure. It is the designed exit for anything the agent should not handle alone. Sprout's triggers, from the spec: legal words (lawyer, sue, chargeback, fraud), a customer still angry after two replies, anything outside scope, and every refund request.

:::example The word "lawyer"
Sam writes: "This is the third time I am asking. Fix it or I am calling my lawyer." Sprout's next action is `escalate_to_human("Sam, order #2001, third contact, mentions lawyer")`, before any reply. Maya sees the full history and takes over. Sprout does not argue, apologize at length, or offer money.
:::

:::key
Tiers say how bad a wrong call is. Escalation says when a human takes over. T2 never runs without a human. Write both down, then enforce both in code.
:::

## 5. The Three Gulfs

Why do agents fail even when the builder is careful? Three gaps, called the Three Gulfs, explain most of it, and each maps to one verb of this course.

The gulf of comprehension is the gap between what you think users ask and what they actually ask. You close it by reading real conversations. That is Analyze.

The gulf of specification is the gap between what you want and what you managed to tell the model. You close it by writing precise rules and checking whether they are followed. That is Measure.

The gulf of generalization is the gap between the model doing the right thing once and doing it every time, across all inputs. You close it by changing the prompt, the tools, the harness, or the model, and measuring again. That is Improve.

| Gulf | The gap | Verb |
|---|---|---|
| Comprehension | You do not know what users really ask | Analyze |
| Specification | You cannot tell the model exactly what you want | Measure |
| Generalization | The model does not do it consistently | Improve |

:::example One Sprout example per gulf
Comprehension: Dev assumed most chats would be "where is my order." After reading 20 real conversations, a third are plant-care questions with no order number at all. Dev did not know that until they looked.

Specification: The prompt says "be helpful about refunds." The model reads that as "issue refunds." The spec now says "request, never approve," and an evaluator checks every trace for a promised refund.

Generalization: With the fixed prompt, Sprout escalates on "lawyer" nine times out of ten. On the tenth, the customer wrote "my attorney" and Sprout kept chatting. The rule is right. The model applies it unevenly.
:::

:::beginner Analyze, Measure, Improve
The three verbs of the course. Analyze: look at real behavior and name the failures. Measure: count how often each failure happens and detect it automatically. Improve: change one thing and prove it helped. L0 to L4 are Analyze.
:::

:::try Ask Eve
Highlight the table and ask Eve: "Give me one example of each gulf for a hotel booking agent."
:::

## 6. Building the agent

The harness is your code around the model: it defines the tools, runs the loop, executes tool calls, and enforces the rules. Here is a minimal harness with the Anthropic SDK. It is the napkin loop from L0, written out.

```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

const tools: Anthropic.Tool[] = [
  {
    name: "lookup_order",
    description: "Look up one order by its id.",
    input_schema: {
      type: "object",
      properties: { order_id: { type: "string" } },
      required: ["order_id"],
    },
  },
  // cancel_order, issue_refund, escalate_to_human, and the rest follow the same shape
];

const messages: Anthropic.MessageParam[] = [
  { role: "user", content: "Where is order #1042?" },
];

while (true) {
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    tools,
    messages,
  });
  messages.push({ role: "assistant", content: response.content });
  if (response.stop_reason !== "tool_use") break;

  const results: Anthropic.ToolResultBlockParam[] = [];
  for (const block of response.content) {
    if (block.type === "tool_use") {
      const output = await runTool(block.name, block.input); // YOUR code runs the tool
      results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(output) });
    }
  }
  messages.push({ role: "user", content: results });
}
```

Read it in three parts. The tool definitions tell the model what exists. The `while` loop sends the conversation, appends the model's reply, and stops when the model finishes with words instead of a tool call. The `for` loop runs each requested tool through `runTool` and sends the results back as the next user message.

:::example One trip around the loop
`messages` starts with Alex's question. The first `create` call returns a `tool_use` block for `lookup_order` with `{ "order_id": "1042" }`. `runTool` returns the order, and the result is pushed as a `tool_result`. The second `create` call returns text, `stop_reason` is `end_turn`, and the loop breaks. Two model calls, one tool call, one answer, as in L0.
:::

Frameworks such as the OpenAI Agents SDK and the Claude Agent SDK wrap this same loop with conveniences: tool registration, retries, streaming. Learn the raw loop first. When a framework misbehaves, this is what is underneath.

:::tip
Keep `SYSTEM_PROMPT` in its own file, generated from the spec's tone and constraints section. When the spec changes, the prompt changes with it. L2 shows how to hash the prompt so every trace records which version ran.
:::

## 7. Permissions enforced in code

A permission is a rule about who may do what. Least privilege means each role gets the smallest set of permissions that lets it do its job. In the loop above, every tool call passes through `runTool`, so that is where permissions live.

```ts
type Role = "customer" | "support_agent" | "admin";

const TIER: Record<string, 0 | 1 | 2> = {
  lookup_order: 0,
  get_shipping_status: 0,
  search_care_guide: 0,
  escalate_to_human: 0,
  cancel_order: 1,
  issue_refund: 2,
};

export function canCall(role: Role, tool: string): boolean {
  const tier = TIER[tool];
  if (tier === undefined) return false; // unknown tool: deny
  if (tier <= 1) return true; // T0 and T1: every role
  return role === "support_agent" || role === "admin"; // T2: approvers only
}
```

And `runTool` uses it:

```ts
async function runTool(name: string, input: unknown) {
  const role: Role = session.role; // set at login by your code, never by the model
  if (!canCall(role, name)) {
    return { error: "permission_denied", reason: `${role} may not call ${name}` };
  }
  return implementations[name](input); // the real function, with precondition checks inside
}
```

Three things to notice. The role comes from the session, which your code established at login; the model cannot claim to be an admin. Unknown tools are denied, so a typo cannot open a door. And a denial goes back to the model as a normal tool result, so the model can recover.

:::example A denial as a tool result
Alex (role `customer`) asks for a refund. The model calls `issue_refund("1042", 45, "arrived damaged")`. `canCall("customer", "issue_refund")` is false. The model receives `{ "error": "permission_denied", "reason": "customer may not call issue_refund" }`. Its next call is `escalate_to_human("Alex, order #1042, $45 refund requested, pot broken on arrival")`. Maya approves. Money moves once, by a human.
:::

Why not write "never issue refunds without approval" in the prompt and stop? Because a prompt is a request, not a lock. The model follows it most of the time, and "most of the time" is the gulf of generalization. In L7, Sam's prompt injection is a whole lesson about text that talks the model out of its instructions. Text cannot talk `canCall` out of anything.

:::warning "Please don't" is not a lock
Keep the rule in the prompt, because it helps the model plan. But if the rule matters when it is broken, it must also live in code. Ask of every rule in your spec: if the model ignored this, what stops it? If the answer is "nothing," you have found a gap.
:::

:::key
The model may ask for any tool. Your code decides. Permissions live in `canCall`, the role comes from the session, and a denial goes back to the model as a tool result.
:::

## 8. Putting it together

The order matters: spec, then tools, then loop, then permission layer. Each step is derived from the one before it.

1. Spec: purpose, scope, roles, contracts, tiers, escalation, tone, non-goals.
2. Tools: one schema per tool, matching the contract's inputs; one implementation per tool, checking the contract's preconditions and returning its named errors.
3. Loop: the harness from section 6, with a system prompt generated from the spec.
4. Permission layer: `canCall` inside `runTool`, roles from the session, T2 routed to a human.

:::example One rule through all four layers
The rule: refunds need a human.

- Spec: "T2 never runs without approval from support_agent or admin."
- Contract: `issue_refund` is T2 and returns `needs_approval`.
- Prompt: "Never promise a refund. Say that a human will confirm."
- Code: `canCall("customer", "issue_refund")` is false; the denial becomes a tool result; Sprout escalates.

With all four in place, the $400 refund has to get past a document, a contract, a prompt, and a function.
:::

Before you move on, check your own agent against this list:

- Every tool has a contract with inputs, outputs, preconditions, and errors.
- Every tool has a tier, and every T2 tool is blocked for non-approver roles in `canCall`.
- The role comes from the session, not from the conversation.
- Every escalation trigger in the spec is something the model can act on with `escalate_to_human`.
- The spec has an owner and a version, because it will change.

:::try Ask Eve
Highlight the checklist and ask Eve: "Turn this into five questions I can ask in a spec review meeting."
:::

## Summary

- A spec is the written contract between you, the model, and the evals. If it is not written down, it cannot be tested.
- `SPEC.md` has eight parts: purpose, scope, roles, tool contracts, risk tiers, escalation rules, tone and constraints, non-goals.
- A tool contract names inputs, outputs, preconditions, postconditions, and errors. The error cases matter most.
- The Three Gulfs (comprehension, specification, generalization) map to Analyze, Measure, and Improve.
- The model may ask for any tool, but `canCall` in your code decides, and T2 tools never run without a human.

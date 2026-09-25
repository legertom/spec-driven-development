---
slug: l0-foundations-for-beginners
number: "L0"
title: "Foundations for Beginners: LLMs, Agents, Tools, and Traces"
module: 0
moduleTitle: "Start Here"
verb: Analyze
minutes: 35
prereqs: []
summary: "Learn what a language model, an agent, a tool, and a trace are, and why you decide what correct means before you build."
objectives:
  - "Explain in one sentence what a language model does and why its output varies between runs."
  - "Describe an agent as a model in a loop that can call tools."
  - "Read a tool call and a tool result and say what happened."
  - "Explain what a trace is and why we keep one for every conversation."
  - "State the spec-driven mindset: decide what correct means before you build."
keyTerms: ["llm", "token", "prompt", "system-prompt", "context", "context-window", "temperature", "nondeterminism", "hallucination", "agent", "agent-loop", "tool", "tool-call", "tool-result", "tool-schema", "trace", "span", "risk-tier"]
---

## Why this matters

Dev builds a chatbot for Pip's Plant Shop and ships it on Friday. The first chats look great. On Monday, Pip writes: "It told a customer their monstera would arrive on Tuesday. Where did it get that?" Dev opens the code. There is no record of the conversation, of what the model saw, or of which order it was about. Dev types the same question into the bot and gets a different answer. Then a third one. Nothing was recorded, and the model does not repeat itself, so the mistake cannot be found or reproduced. This lesson gives you the vocabulary that keeps this from happening to you.

## 1. What a language model actually does

A large language model (LLM) is a program that reads text and predicts what should come next, one small piece at a time. Each piece is a token, roughly a short word or part of a longer one. "the" is one token; "Monstera" is probably two.

The model does not look up an answer. For every possible next token it computes a likelihood, picks one, and repeats until it decides to stop.

Here is the surprising part. It does not always pick the most likely token. It samples, like rolling weighted dice. Likely tokens win often, unlikely ones win rarely, but the roll is random. This is nondeterminism: the same input can produce different output.

:::example Name a fern, twice
Dev types "Suggest a name for a fern" and presses enter.

- Run 1: "Fernando."
- Run 2: "Frondrick."

Same words in, different words out. Nothing broke. The dice landed differently.
:::

:::beginner What temperature means
Temperature is a dial on the dice. Low temperature: the model nearly always picks the most likely token, so answers repeat more. High temperature: it takes more chances. Temperature 0 makes output much more stable, but not guaranteed identical, because of how the arithmetic runs on real hardware.
:::

:::key
A language model predicts the next token and samples it, so the same input can produce different output. Plan for variety from day one.
:::

## 2. A prompt is instructions plus context

A prompt is everything you send to the model in one request. It has two parts.

The instructions say what to do and how to behave. When they come from you, the builder, and stay the same for every conversation, they are called the system prompt.

The context is the material the model needs right now: the customer's message, the order record you pasted in, the earlier turns of this conversation.

:::example Sprout's system prompt
Five lines are enough to start.

```text
You are Sprout, the support assistant for Pip's Plant Shop.
Answer questions about orders, shipping, refunds, and plant care.
Use the tools to look up facts. Never guess an order's status.
Refunds are approved by a human, never by you.
Be warm and brief.
```
:::

The same instructions give different answers when the context changes. Paste in order #1042 (`shipped`, Bloom Post) and "Where is my order?" gets "Order #1042 is on its way with Bloom Post." Paste in order #1077 (`processing`) and the same question gets "Order #1077 has not shipped yet." The context did the work.

:::beginner The context window
The context window is the maximum amount of text, measured in tokens, that the model can read in one request. Instructions and context share it. If they do not fit, something gets cut.
:::

:::warning The model does not remember
The model has no memory between requests. Your code stores the conversation and resends all of it every turn. If you forget to resend a message, the model never saw it.
:::

## 3. From chatbot to agent: the loop

A chatbot replies with text. An agent can also act. An agent is a model in a loop that can call tools. A tool is a function your code offers to the model, such as "look up an order."

The agent loop fits on a napkin:

```text
messages = [system prompt, customer message]
loop:
    reply = model(messages)
    if reply is a tool call:
        result = run the tool with the arguments the model asked for
        append the tool call and the result to messages
    else:
        done: show the reply to the customer
```

Each pass through the loop is one step. A step either asks for a tool or gives the final answer.

:::example Where is order #1042?
Alex writes: "Where is order #1042?"

1. The model replies with a tool call: `lookup_order` with `order_id = "1042"`.
2. Your code runs it. The result is `{ "status": "shipped", "shipped_at": "2026-09-21" }`.
3. Your code appends the call and the result to the messages and calls the model again.
4. The model replies in words: "Order #1042 shipped on September 21."

Two model calls, one tool call, one answer.
:::

A tool call is the model's request: run this tool with these arguments. A tool result is what your code sends back. The model writes the request. Your code decides whether to run it.

:::key
An agent is a model in a loop that can call tools. The model asks, your code runs, the result goes back in, and the loop repeats until the model answers in words.
:::

:::try Ask Eve
Highlight the pseudo-code above and ask Eve: "Walk me through this loop for the question 'Can I cancel order #1077?'"
:::

## 4. Tools are functions with a contract

To the model, a tool is a description. To your code, it is a function. The description that connects the two is the tool schema: the name, what the tool does, and the shape of the input it accepts, written in JSON.

:::example The schema for lookup_order
```json
{
  "name": "lookup_order",
  "description": "Look up one order by its id. Returns status, items, and dates.",
  "input_schema": {
    "type": "object",
    "properties": {
      "order_id": { "type": "string", "description": "The order number, such as 1042" }
    },
    "required": ["order_id"]
  }
}
```

From this the model learns three things: the tool exists, when to use it, and that it must supply an `order_id` string.
:::

A schema says how to call the tool. It does not say what comes back or what can go wrong. For that we write a tool contract in plain words:

| Part | `lookup_order` |
|---|---|
| Input | `order_id`, a string |
| Output | `status`, `items`, `ordered_at`, `shipped_at` |
| Errors | `not_found` when no order has that id |

The error row matters most. When Jordan mistypes #1077 as #1707, the tool returns `{ "error": "not_found" }`. A good agent asks Jordan to check the number. A bad agent invents a shipping date. Later lessons show how to catch the bad case.

:::warning Your code runs the tool, not the model
The model never touches your database. It writes a small JSON request naming a tool and its arguments. Your code reads the request, decides whether to allow it, runs the real function, and sends the result back. If the model asks for a refund, no money moves unless your code moves it.
:::

## 5. Traces: the flight recorder

A trace is the complete record of one conversation: every message, model call, tool call, and result, in order, with timestamps. It is the flight recorder for your agent. When something goes wrong, you open the trace instead of guessing.

Each step inside a trace is a span. A span has a name, a start time, an end time, an input, and an output. Spans nest: a turn contains model calls, and a model call can contain the tool calls it asked for. Lesson 2 covers the full data model. For now, learn to read one.

:::example A four-step trace
Alex asks where order #1042 is.

| # | Span | Input | Output | In plain English |
|---|---|---|---|---|
| 1 | `turn` | "Where is order #1042?" | the final reply | One message and everything it caused |
| 2 | `model_call` | system prompt + message | tool call `lookup_order("1042")` | The model decided it needs data |
| 3 | `tool_call: lookup_order` | `{ "order_id": "1042" }` | `{ "status": "shipped", "shipped_at": "2026-09-21" }` | Your code fetched the order |
| 4 | `model_call` | everything above | "Order #1042 shipped on September 21." | The model wrote the answer |

Read it top to bottom and you can say exactly what happened, in what order, and from which data.
:::

Replay the story from the top of this lesson. With a trace, Dev opens the conversation, finds the tool call, and sees whether "Tuesday" came from a tool result or from nowhere. Without a trace, Dev is guessing.

:::tip
Before you write any evaluation code, make sure you can open one trace and read it top to bottom. Every later lesson starts from a trace.
:::

## 6. Why normal testing is not enough

Testing a normal function is easy: call it, assert on the result.

```text
assert add(2, 2) == 4
assert reply == "Your order ships Tuesday."
```

The first line works forever. The second fails on perfectly good answers.

:::example The assertion that fails on a good answer
Sprout is asked, "When does order #1042 ship?" Three runs, three replies:

- "Your order ships Tuesday."
- "Order #1042 is scheduled to ship on Tuesday."
- "It ships Tuesday! You will get a tracking number by email."

All three are correct. Only the first passes. Your test is red and nothing is wrong.
:::

Two problems are visible here. Variety: correct answers come in many wordings, so exact matching fails. Open-ended inputs: customers ask about orders, refunds, repotting, spider mites, and things you never imagined, so you cannot write one assertion per question.

A third problem hides underneath. An answer can look right and be wrong. "Order #1707 ships Tuesday with Bloom Post" is fluent and confident. If the tool returned `not_found`, it is also invented. A made-up fact that reads well is called a hallucination. The reply alone cannot tell you which replies are true. The trace can.

So you define what correct means in terms you can check: did it call the right tool, did every fact come from a tool result, did it avoid promising a refund. Then you check those properties across many varied inputs and count how often each fails. That is the rest of this course.

## 7. The spec-driven mindset

Spec-driven development means you write down what correct means before you build, and everything else is derived from that document. The document is a spec. It says what the agent is for, what it may do, what it must never do, and what a good answer looks like.

The loop has four moves: write down what correct means; build the agent so its behavior is recorded; measure how often it is correct, using real traces; improve whatever fails most, then measure again.

:::example Deciding what correct means for a shipping question
Before writing code, Dev adds three lines to the spec:

- Sprout must call `lookup_order` or `get_shipping_status` before stating any date.
- Every date in the reply must appear in a tool result.
- If a tool returns `not_found`, Sprout asks for the order number again and promises nothing.

Now the "Tuesday" bug is not a mystery. It breaks rule two, and rule two can be checked by a program.
:::

The course is organized around three verbs.

| Verb | Question it answers | Lessons |
|---|---|---|
| Analyze | What is the agent doing? Where does it fail? | L0 to L4 |
| Measure | How often does each failure happen? Can we detect it automatically? | L5 to L7 |
| Improve | Which change fixes it at the lowest cost, and did it really help? | L8 and L9 |

You are in Analyze now. Each lesson tells you which verb you are doing.

:::key
Decide what correct means before you build. Then build so you can see, measure so you can count, and improve so you can prove it.
:::

## 8. Meet Pip's Plant Shop and Sprout

Every lesson uses the same small world, so you never have to relearn the setting.

Pip's Plant Shop is a small online store that sells houseplants and pots. It ships to three zones: Local, Domestic, and International. Returns are accepted within 30 days for plants that arrived damaged. Refunds go to the original payment method.

Sprout is the customer-support agent you will build, evaluate, and improve. Customers chat with Sprout about orders, shipping, refunds, and plant care.

### The cast

| Name | Who they are |
|---|---|
| Pip | The owner. Asks the hard questions on Monday mornings. |
| Maya | A support agent. Approves refunds and takes over when Sprout escalates. |
| Dev | The engineer building Sprout. That is you. |
| Alex | Customer, order #1042. A monstera that arrived with a broken pot. |
| Jordan | Customer, order #1077. Asks about repotting. |
| Sam | Customer, order #2001. Tries a prompt injection, an attack you meet in L7. |

### Sprout's tools and their risk tiers

A risk tier says how much damage a tool can do if it is called wrongly. T0 is read-only. T1 is a reversible write: a mistaken `cancel_order` can be undone by reordering. T2 is irreversible or involves money: a mistaken `issue_refund` cannot be taken back, so it always requires human approval.

| Tool | What it does | Risk tier |
|---|---|---|
| `lookup_order(order_id)` | Returns status, items, dates for one order | T0 read-only |
| `get_shipping_status(order_id)` | Returns carrier and tracking events | T0 read-only |
| `search_care_guide(query)` | Returns plant-care articles | T0 read-only |
| `cancel_order(order_id)` | Cancels an unshipped order | T1 reversible write |
| `issue_refund(order_id, amount, reason)` | Sends money back | T2 irreversible, needs human approval |
| `escalate_to_human(summary)` | Hands the conversation to Maya | T0, always allowed |

:::example Alex's broken pot, tool by tool
Alex writes: "My monstera arrived with a broken pot. Can I get a refund?"

1. Sprout calls `lookup_order("1042")` (T0): delivered four days ago.
2. Sprout asks for `issue_refund("1042", 45.00, "arrived damaged")` (T2). Your code refuses: a human must approve.
3. Sprout calls `escalate_to_human("Alex, order #1042, pot broken on arrival, refund requested")` (T0).

Alex hears that a human will confirm shortly. No money moved without Maya.
:::

:::try Ask Eve
Highlight the tools table and ask Eve: "For each tool, describe the worst thing that could happen if Sprout called it with the wrong arguments."
:::

## Summary

- A language model predicts the next token and samples it, so the same input can give different outputs.
- A prompt is instructions plus context, and the model remembers nothing unless you resend it.
- An agent is a model in a loop that can call tools. The model asks; your code runs the tool.
- A trace records every step of a conversation as spans, so you can explain and reproduce any behavior.
- Exact-match assertions fail on good answers, so write down what correct means first, then measure it across many traces.

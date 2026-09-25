---
slug: l2-designing-for-evaluability
number: "L2"
title: "Building Agents: Designing for Evaluability"
module: 1
moduleTitle: "Building Agents"
verb: Analyze
minutes: 50
prereqs: ["l1-building-agents-foundations"]
summary: "Record every model call, tool call, and permission decision as nested spans, send them to self-hosted Langfuse, and read a trace to find the first thing that went wrong."
objectives:
  - "Explain why instrumentation must exist before the first real user."
  - "Design a trace data model with nested spans, model calls, tool calls, permission denials, and prompt hashes."
  - "Stand up self-hosted Langfuse with ClickHouse and send it a trace."
  - "Read a trace and find the first thing that went wrong."
keyTerms: ["trace", "span", "nested-span", "instrumentation", "observability", "prompt-hash", "langfuse", "clickhouse", "sampling-rate", "pii", "scenario", "first-failure"]
---

## Why this matters

Thursday morning, a customer emails Pip: "Your chat assistant promised me a full refund yesterday. Where is it?" Pip forwards it to Dev with one line: "Did it?" Dev opens the database. Orders, yes. Refund requests, none. Chat logs? The app printed replies to the console, and the console was cleared at the last deploy. Dev cannot see what the customer asked, what the model saw, which tools ran, or what Sprout said. Dev cannot prove Sprout promised nothing, cannot reproduce the conversation, and cannot fix a failure nobody can look at. The customer is still waiting. This lesson makes sure that the next time someone asks "did it?", the answer takes thirty seconds and starts with opening a trace.

## 1. If you did not record it, it did not happen

Instrumentation is the code that records what your agent does: every model call, every tool call, every decision, in a structured form you can query later. Observability is the property you get from it: the ability to answer "what happened, and why?" from the records alone, without rerunning anything.

The rule of this lesson is short. Instrument before traffic. The first real user must produce the first complete trace, because the first real user is often the first surprise.

:::example Two launches
Launch A: Dev ships Sprout and plans to "add logging next sprint." Day one, 40 conversations and three complaints. Zero records. Dev fixes nothing, because there is nothing to read.

Launch B: Dev spends one afternoon on instrumentation, then ships. Same 40 conversations, same three complaints. Dev opens three traces, finds that two are the same failure (the model invented a delivery date after `lookup_order` returned `not_found`), and has a fix by lunch.

Same agent, same customers. The only difference is whether anything was written down.
:::

The sampling rate is the fraction of conversations you record in full. Before launch and during early traffic, that fraction is 100%. Forty conversations a day cost nothing to store, and every one is a lesson. Later, at 20,000 a day, you may sample a share and keep every trace that contains an error or a permission denial. Not yet.

:::key
Instrument before the first real user, and record 100% of conversations until volume forces you to sample.
:::

:::beginner Logging versus tracing
A log is a list of lines, each written by whatever code happened to be running. A trace is structured: one record per conversation, made of nested steps with ids, times, inputs, and outputs. You can grep a log. You can query a trace: "show me every tool call that returned an error in the last hour."
:::

## 2. The trace data model

A trace is the full record of one conversation. A span is one unit of work inside it. Spans nest: a turn (one customer message and everything it caused) contains model calls, and a model call contains the tool calls it requested. A span inside another span is a nested span, and it carries the `parent_id` of the outer one.

Every span has the same eight fields.

| Field | Meaning |
|---|---|
| `id` | Unique id for this span |
| `parent_id` | The span this one sits inside, or `null` at the top |
| `name` | The kind of work: `turn`, `model_call`, `tool_call:lookup_order` |
| `start`, `end` | Timestamps, so you can compute latency |
| `input` | What went in |
| `output` | What came out |
| `metadata` | Everything else worth keeping: model id, tokens, tier, permission decision |

:::example A full trace for "Where is order #1042?"
Four spans: the turn, the first model call, the tool call it asked for, and the model call that wrote the answer.

```json
{
  "trace_id": "tr_8f21", "session_id": "sess_alex_01", "user_id": "cust_alex",
  "metadata": { "env": "dev", "agent_version": "0.3.1", "prompt_hash": "a1b2c3d4" },
  "spans": [
    { "id": "sp_1", "parent_id": null, "name": "turn",
      "start": "2026-09-22T10:00:00.000Z", "end": "2026-09-22T10:00:02.900Z",
      "input": { "message": "Where is order #1042?" },
      "output": { "reply": "Order #1042 shipped on September 21 with Bloom Post." },
      "metadata": { "role": "customer" } },
    { "id": "sp_2", "parent_id": "sp_1", "name": "model_call",
      "start": "2026-09-22T10:00:00.010Z", "end": "2026-09-22T10:00:01.200Z",
      "input": { "messages": 2, "tools": 6 },
      "output": { "stop_reason": "tool_use", "tool_calls": [ { "name": "lookup_order", "input": { "order_id": "1042" } } ] },
      "metadata": { "model": "claude-opus-5", "prompt_hash": "a1b2c3d4", "temperature": 0,
                    "tokens_in": 812, "tokens_out": 41, "latency_ms": 1190 } },
    { "id": "sp_3", "parent_id": "sp_2", "name": "tool_call:lookup_order",
      "start": "2026-09-22T10:00:01.210Z", "end": "2026-09-22T10:00:01.260Z",
      "input": { "order_id": "1042" },
      "output": { "status": "shipped", "carrier": "Bloom Post", "shipped_at": "2026-09-21" },
      "metadata": { "tier": "T0", "permission": "allowed", "error": null } },
    { "id": "sp_4", "parent_id": "sp_1", "name": "model_call",
      "start": "2026-09-22T10:00:01.270Z", "end": "2026-09-22T10:00:02.880Z",
      "input": { "messages": 4, "tools": 6 },
      "output": { "stop_reason": "end_turn", "text": "Order #1042 shipped on September 21 with Bloom Post." },
      "metadata": { "model": "claude-opus-5", "prompt_hash": "a1b2c3d4", "temperature": 0,
                    "tokens_in": 901, "tokens_out": 24, "latency_ms": 1610 } }
  ]
}
```

Follow the `parent_id` chain. `sp_3` sits under `sp_2`, the model call that asked for it. Both model calls sit under `sp_1`, the turn. The date in the tool output matches the date in the final text. That match is what later lessons check automatically.
:::

The `input` of each model call above is a count (`"messages": 2`) to keep the example short. In a real trace, store the complete messages array. Section 5 explains why.

:::beginner Why the tool call sits under the model call
Your code runs the tool after the model replies, so the tool span starts after its parent's request finished. The nesting records cause, not clock time: this tool ran because that model call asked for it. Some tracing tools draw tool calls beside the model call instead. Either works, as long as every trace in your system does it the same way.
:::

## 3. What to record

Three kinds of spans carry the important facts.

Model calls: model id, prompt hash, parameters (temperature, max tokens), token counts in and out, latency, and the full input and output. Tokens and latency become your cost lesson in L9. The model id and prompt hash tell you which version of Sprout produced this behavior.

Tool calls: tool name, arguments, result, and error, if any. Store the whole result, not a summary. When the model invents a date, you need to see that the tool never returned one.

Permission decisions: every time `canCall` runs, record `allowed` or `denied`, the role, the tool, and the reason. A denial is not an error. It is the harness doing its job, and you will want to count them.

:::example A permission denial, recorded
Alex asks for a refund. The trace gets a span:

```json
{ "id": "sp_9", "parent_id": "sp_8", "name": "permission_check",
  "input": { "role": "customer", "tool": "issue_refund" },
  "output": { "decision": "denied", "reason": "customer may not call issue_refund" },
  "metadata": { "tier": "T2" } }
```

Next week Pip asks, "How often does Sprout try to refund on its own?" That is one query over `permission_check` spans, not a guess.
:::

On the trace itself, record the session id (which conversation), the user id (who), the environment (`dev`, `staging`, `prod`), and the agent version.

### Prompt hashes

A prompt hash is a short fingerprint of the exact system prompt text, computed with a hash function such as SHA-256 and truncated: `sha256(system_prompt)[:8]`. Change one character in the prompt and the hash changes.

:::example Two prompts, two hashes
On Monday the system prompt ends with "Be warm and brief." Hash: `a1b2c3d4`. On Tuesday Dev adds one line, "Never promise a refund." Hash: `9e8d7c6b`.

On Wednesday a customer says Sprout promised a refund. Dev filters traces by hash. The complaint's trace carries `a1b2c3d4`: it happened under Monday's prompt, before the fix. Without the hash, Dev would be rereading a prompt that was not the one that ran.
:::

Why a hash instead of a version number? Because nobody forgets to compute a hash. Version numbers get skipped. The hash is derived from the text itself, so it is always right.

:::tip
Store the full prompt text once per hash in a small table, then store only the hash on each span. Traces stay small, and you can always recover the exact text.
:::

## 4. Langfuse and ClickHouse

You could write traces to a file. Reading them is the problem. Langfuse is an open-source tool that stores traces, shows each one in a web UI as a nested tree, and exposes an API for querying and scoring them. It is the screen Dev opens when Pip asks "did it?".

Under Langfuse sit two databases. Postgres holds metadata: projects, users, API keys, prompt versions. ClickHouse holds the spans. ClickHouse is a column store: it keeps each column of a table together on disk, so a question like "average latency of `tool_call:lookup_order` spans this month" reads one column across millions of rows instead of every row in full. That is what makes analytics over a large trace set fast.

| Piece | Job | Why it is there |
|---|---|---|
| Langfuse | Tracing UI and API | Humans read traces; code queries and scores them |
| ClickHouse | Column store for spans | Fast aggregate questions over millions of spans |
| Postgres | Metadata | Small, relational, transactional data |

Here is a self-hosted setup as a sketch. The real compose file in the Langfuse docs also runs a worker, Redis, and object storage, and it will have changed by the time you read this. Copy the shape, not the values.

```yaml
# Sketch only. Use the current compose file from the Langfuse docs for real values.
services:
  langfuse:
    image: langfuse/langfuse:3
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://pg:pg@postgres:5432/langfuse
      CLICKHOUSE_URL: http://clickhouse:8123
      CLICKHOUSE_USER: ch
      CLICKHOUSE_PASSWORD: ch
      NEXTAUTH_SECRET: change-me
      SALT: change-me
    depends_on: [postgres, clickhouse]
  postgres:
    image: postgres:16
    environment: { POSTGRES_USER: pg, POSTGRES_PASSWORD: pg, POSTGRES_DB: langfuse }
  clickhouse:
    image: clickhouse/clickhouse-server:24
    environment: { CLICKHOUSE_USER: ch, CLICKHOUSE_PASSWORD: ch }
```

Your agent needs three environment variables to send traces: a public key, a secret key, and the base URL of your Langfuse instance. Create the keys in the Langfuse UI after it starts.

```bash
export LANGFUSE_PUBLIC_KEY=pk-lf-...
export LANGFUSE_SECRET_KEY=sk-lf-...
export LANGFUSE_BASE_URL=http://localhost:3000
```

And here is the shape of an SDK call that creates a trace with a nested span. This is a sketch: method names differ between SDK versions, so check the docs for yours.

```ts
// Sketch only. Check the Langfuse SDK docs for the exact method names in your version.
import { Langfuse } from "langfuse";
const langfuse = new Langfuse(); // reads the three env vars above

const trace = langfuse.trace({ name: "turn", sessionId: "sess_alex_01", userId: "cust_alex",
  metadata: { env: "dev", agent_version: "0.3.1", prompt_hash: "a1b2c3d4" } });
const gen = trace.generation({ name: "model_call", model: "claude-opus-5", input: messages });
gen.end({ output: response.content, usage: { input: 812, output: 41 } });
const tool = gen.span({ name: "tool_call:lookup_order", input: { order_id: "1042" } });
tool.end({ output: { status: "shipped" }, metadata: { tier: "T0", permission: "allowed" } });
await langfuse.flushAsync(); // send before the process exits
```

:::example What Dev sees after sending one trace
Dev opens `http://localhost:3000` and sees one row: `turn`, 2.9 seconds, 2 model calls. Clicking it opens a tree: `turn` at the top, `model_call` under it, `tool_call:lookup_order` under that, and the second `model_call` beside the first. Each node shows its input, output, and metadata. That tree is the JSON from section 2, drawn.
:::

:::warning Sending traces without flushing
SDKs batch spans and send them in the background. If your script exits before the batch is sent, the trace never arrives, and you will spend an hour debugging a database that is fine. Flush at the end of every run, and in a server, flush on shutdown.
:::

## 5. Designing for evaluability

Evaluability means a trace contains enough to judge whether the agent behaved correctly, and to run the same step again. Four habits get you there.

Store complete inputs so spans can be replayed. If a model-call span holds the full messages array, the exact tools list, and the parameters, you can send that request again and compare answers. If it holds "messages: 4," you cannot.

:::example Replaying one span
A customer reports a wrong answer. The trace's second model call has its full input stored. Dev copies that input into a script, runs it five times, and gets the wrong answer twice out of five. Dev now has a reproducible case and a rough failure rate before writing a single test. With a summary instead of the input, Dev would be reconstructing the conversation by hand and hoping.
:::

Use stable ids. The same customer, order, and session should carry the same ids across traces. Then "show me every conversation about order #1042" returns all of them.

Tag synthetic traces with their scenario id. A scenario is a scripted test conversation, and L3 builds hundreds of them. When Sprout runs a scenario, put `scenario_id` in the trace metadata, so a failing test leads straight to the trace that shows why.

:::example Scenario id in the metadata
```json
{ "trace_id": "tr_9a10", "metadata": { "env": "test", "scenario_id": "refund-out-of-policy-017",
  "agent_version": "0.3.1", "prompt_hash": "9e8d7c6b" } }
```

Three weeks later the nightly run reports that `refund-out-of-policy-017` started failing. Dev searches traces for that scenario id, gets one per night, and can see the exact night the behavior changed and which prompt hash changed with it.
:::

Version everything. Agent version, prompt hash, tool schema version, and the version of the fictional world the scenarios run against. When behavior changes, one of these changed. If they are all recorded, you can find which.

:::key
A trace is evaluable when you can replay any span from what was stored, group traces by anything that matters, and name the exact versions that produced it.
:::

:::beginner PII
PII stands for personally identifiable information: names, emails, addresses, payment details. Traces collect it, because customers type it. Decide before launch what you will mask (card numbers, always), who can open traces, and how long you keep them. A trace store is a database of customer conversations and must be treated like one.
:::

## 6. Reading a trace

Reading a trace means walking the spans in order and finding the first failure: the earliest span where the agent's behavior stopped matching the spec. Not the span where the customer noticed. The first one.

:::example The invented delivery date
Jordan asks, "When will order #1707 arrive?" (Jordan meant #1077.) The trace has four spans.

| Span | Input | Output | Verdict |
|---|---|---|---|
| `turn` | "When will order #1707 arrive?" | "It should arrive on Tuesday!" | Wrong, but this is the symptom |
| `model_call` | messages, 6 tools | tool call `lookup_order("1707")` | Correct: the spec says look up before stating dates |
| `tool_call:lookup_order` | `{ "order_id": "1707" }` | `{ "error": "not_found" }` | Correct: the tool did its job |
| `model_call` | messages including `not_found` | "It should arrive on Tuesday!" | First failure: a date with no tool result behind it |

The tool was fine. The first model call was fine. The failure is the second model call, which produced a date that appears nowhere in its input. The spec rule it broke: "Never state an order fact that did not come from a tool result."
:::

Three questions, in order, every time you read a trace:

1. What did the customer ask, and what did they get? That is the turn span.
2. Walk each span. Does its output follow from its input and the spec?
3. Stop at the first span where the answer is no. Write one sentence about it.

That one sentence is the raw material of L4, where you collect many of them and turn them into named failure modes.

:::warning Blaming the last span
The last span is where the damage shows, so it is tempting to write "the final reply was wrong" and stop. Often the real failure is earlier: a tool call with the wrong argument, a permission check that should have denied, a model call that skipped a lookup. Walk from the top, not the bottom.
:::

:::try Ask Eve
Highlight the table above and ask Eve: "Rewrite this trace so the first failure is in the tool call instead of the model call."
:::

## 7. Checklist: instrumentation review before traffic

Run through this list before the first real user, and again before every launch.

| Check | How to verify |
|---|---|
| Every model call is a span with model id, prompt hash, params, tokens, latency, full input and output | Open one trace; every field is present |
| Every tool call is a span with name, arguments, result, and error | Force a `not_found` and see it recorded |
| Every permission decision is a span with role, tool, decision, reason | Ask for a refund as a customer; see `denied` |
| The trace carries session id, user id, environment, agent version | Filter by each in the UI |
| Sampling rate is 100% | Count traces against conversations for one hour |
| Synthetic runs carry `scenario_id` | Run one scenario; search for its id |
| PII policy is written and card numbers are masked | Send a fake card number; it does not appear |
| The SDK flushes on exit and on shutdown | Stop the server; the last trace is present |

:::example Dev runs the checklist
Dev runs it on Wednesday. Seven checks pass. The permission check fails: `canCall` denies correctly, but nothing records the denial. Twenty lines of code later, `permission_check` spans exist. On Thursday, when the customer asks about a promised refund, Dev filters for denied `issue_refund` calls in that session, finds one, opens the turn, and reads Sprout's reply: "A member of our team will confirm your refund." Sprout promised nothing. Pip has an answer in thirty seconds.
:::

:::try Ask Eve
Highlight the checklist and ask Eve: "Which of these checks would have caught the refund complaint from the start of the lesson, and why?"
:::

## Summary

- Instrument before the first real user and record 100% of conversations until volume forces sampling.
- A trace is one conversation; a span is one unit of work; spans nest through `parent_id` and share eight fields.
- Record model calls (model, prompt hash, params, tokens, latency), tool calls (name, args, result, error), and permission decisions (allowed or denied, with a reason).
- Langfuse is the UI and API, ClickHouse stores spans for fast analytics, and Postgres holds metadata.
- A trace is evaluable when you can replay any span, group by stable ids and scenario ids, and name every version. Read traces top down and mark the first failure.

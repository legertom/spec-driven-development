# Course roadmap

The platform has five courses. Courses 1, 2, and 5 below are built (`working-with-coding-agents`, `prompt-engineering-for-engineers`, `agent-security-and-red-teaming`); the rest is the shortlist of what to build next, chosen so that each course reuses the platform's strengths (a running example, tiny examples, Eve, rubric-graded exercises) and fills a gap the first two leave open.

| # | Course | Who it is for | Why it fits | Gap it fills |
|---|---|---|---|---|
| 1 | **AI-Augmented Engineering: Working with Coding Agents** (built) | Engineers using Claude Code, Cursor, or Copilot agents daily | The day-to-day companion to SDD for Dummies: CLAUDE.md, skills, hooks, plans, reviewing agent diffs, when to steer and when to restart | SDD covers the lifecycle; this covers the craft |
| 2 | **Prompt Engineering for Engineers** (built) | Anyone writing system prompts or structured outputs | Short, example-dense: instructions vs context, structured output, few-shot, caching, effort, when a prompt is the wrong layer | Both existing courses assume you can write a decent prompt |
| 3 | **Tools and MCP Servers for Agents** | Backend engineers | Tool contracts, schemas, error cases, permissions in code, an MCP server from scratch, testing tools in isolation | Agent Evals L1 introduces tool contracts; nobody teaches building them well |
| 4 | **Observability for LLM Apps: Traces, Spans, and Dashboards** | Engineers and SREs | Deepens Agent Evals L2: trace data models, OpenTelemetry, Langfuse, sampling, corrected prevalence dashboards, alerts | L2 is one lesson; teams need a week |
| 5 | **Security and Red-Teaming for Agents** (built) | Engineers and security-minded PMs | OWASP agentic top 10 one risk per lesson, prompt injection, tool misuse, memory poisoning, guards, approval flows, promptfoo | Agent Evals L7 is one lesson of a large topic |
| 6 | **Evals for RAG and Search** | Engineers building retrieval features | Retrieval metrics, grounding judges, chunking experiments, golden sets, the retrieval-then-generation failure taxonomy | The evals course is agent-shaped; retrieval has its own failure modes |
| 7 | **Cost and Latency Engineering for LLM Apps** | Engineers who own a bill | Profiling, caching, routing and cascades, token reduction, batching, budgets and alerts, the upgrade drill | Agent Evals L9 in depth, for any LLM app |
| 8 | **AI Governance for Product Managers** | PMs and team leads in regulated teams | NIST AI RMF and the EU AI Act in plain English, risk tiers, the governance record, evidence packs, talking to auditors and legal | SDD L7 for the non-engineer, with the regulatory floor filled in |
| 9 | **Writing Specs for AI Features** | Product managers | Intent, non-goals, acceptance criteria, metrics, launch gates, and how a PM's spec turns into evals | SDD teaches the engineer's spec; PMs write the upstream one |
| 10 | **Synthetic Data and Simulation for Testing** | Engineers and QA | Fictional worlds, deterministic personas, scenario generation, smoke reports, keeping synthetic data from lying to you | Agent Evals L3 in depth |

Suggested build order for the rest: 8, then 3, 4, 6, 7, 9, 10. Course 8 reuses Pip's Plant Shop.

Each course needs: a `COURSE_PLAN.md` under `docs/courses/<slug>/`, a folder under `content/courses/<slug>/`, and a regenerated `agent/lib/content.generated.ts`. See `docs/ADDING_A_COURSE.md`.

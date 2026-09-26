# Spec-Driven Development

> Hands-on courses for engineers building with AI.
> A small learning platform with a built-in AI tutor (Eve), AI-graded assessments, and lots of small examples. Each course is a folder of markdown; adding a course is adding a folder.

Built with **Next.js 16** (Node), **Tailwind CSS 4**, **[eve](https://eve.dev)** (Vercel's framework for durable agents) for Eve the tutor, the **Vercel AI SDK** with **Vercel AI Gateway** for grading (Claude models, no provider keys to manage), **Neon Postgres** (optional), and deployed on **Vercel**.

## What's inside

| Area | What you get |
|---|---|
| **A course catalog** | Every folder in `content/courses/` is a course. Five ship today: **Spec-Driven Development for Dummies** (a primer, seven core lessons, and a bonus lesson on adoption, set in a bookshop with a coding agent named Quill), **AI-Augmented Engineering: Working with Coding Agents** (the day-to-day companion: the standing brief, skills, driving a session, permissions and hooks, reviewing an agent's diff), **Prompt Engineering for Engineers** (instructions, grounding, structured output, examples and caching, and testing prompts like code, on two model-backed features of the same bookshop app), **Building and Evaluating AI Agents** (a primer, nine core lessons across five modules, and a bonus interview-prep lesson), and **Security and Red-Teaming for Agents** (threat modeling, injection, tool misuse, memory poisoning, red-teaming with promptfoo, guards, approval queues, kill switches, and a governance record, on the same support agent). Every lesson has a story, numbered sections, six or more worked examples, key terms, a quiz, written exercises, and collapsible instructor notes. |
| **Eve, the tutor** | Highlight any text and click **Ask Eve**. Eve is an eve agent (`agent/`): she knows which course and lesson you are reading, reads the lesson, the course map, the glossary, and the quiz through her own tools, explains, re-examples, and quizzes you, and gives hints (not answers) on graded questions. Conversations are durable sessions, one per lesson, that resume after a reload. |
| **Grading** | Multiple choice is graded in code with an explanation per option. Short answers, free responses, and homework projects are graded by an LLM judge against a binary rubric, with a score, feedback, strengths, improvements, and a model answer. |
| **Per-course glossary** | Each course ships its own glossary (139 terms for the agents course, 59 for SDD, 68 for coding agents, 69 for prompt engineering, 92 for agent security) with plain-English definitions and an example each. Searchable, A–Z, "Ask Eve" per term. |
| **How It Works** | A page that explains the platform, Eve, grading, data, and the architecture (with a diagram). |
| **Progress** | Anonymous, no login. Stored in the browser, and in Neon when configured. Dashboard grouped by course, with weak spots and "Ask Eve to review my weak spots". |
| **Evals** | `evals/` holds eve evals for the tutor: she reads the open lesson before answering, and she never reveals a quiz answer. |
| **Design docs** | `docs/ADDING_A_COURSE.md`, `docs/AUTHOR_BRIEF.md`, `docs/ARCHITECTURE.md`, `docs/UI_PLAN.md`, and a plan per course under `docs/courses/` (each plan lists every lesson's objectives, sections, examples, and assessments), plus `docs/COURSE_ROADMAP.md` with the next ten courses to build. |

## Quick start (local)

Requires **Node 24** or newer (eve needs it; the Vercel project is set to 24.x).

```bash
npm install
cp .env.example .env.local      # then put your AI_GATEWAY_API_KEY in .env.local (Vercel dashboard → AI Gateway → API keys)
npm run dev                     # http://localhost:3000  — starts Next.js and the eve dev server together
```

Without gateway credentials every course still renders. Eve opens, but her replies fail with a visible error, and written-answer grading shows a "not connected yet" notice.

To try the production build locally: `npm run build && npm run eve:build`, then `npm run start:eve` in one terminal and `npm start` in another.

Other scripts:

```bash
npm run build           # bundles the course content for the agent, then `next build`
npm run lint            # eslint
npm run typecheck       # tsc --noEmit (run `npx next typegen` first on a fresh clone)
npm run validate        # check every course's lessons, quizzes, and glossary
npm run content:bundle  # regenerate agent/lib/content.generated.ts from content/courses (also runs before dev and build)
npm run eve:info        # inspect the agent: instructions, tools, skills, routes
npm run eve:dev         # the eve dev server with its terminal UI, without the site
npm run eve:eval        # run the evals in evals/ against a local eve server (needs gateway credentials)
npm run eve:build       # build the agent's server output (.output/) for a local production run
npm run start:eve       # serve that output on port 4274; `npm start` proxies /eve/v1/* to it (Vercel does this for you)
npm run db:push         # push the Drizzle schema to DATABASE_URL (Neon)
```

## Eve, the tutor (built on eve)

Eve is authored as a directory, the way [eve](https://eve.dev) wants agents written: markdown for what a person should read, TypeScript for what needs types.

```
agent/
  agent.ts                   model (an AI Gateway id), reasoning effort, no default sandbox tools, per-session cost cap
  instructions.md            who Eve is, who she teaches, how she uses her tools, what she never does
  channels/eve.ts            route auth for /eve/v1/*: anonymous learners are admitted explicitly
  tools/                     get_lesson, get_course, list_courses, lookup_term, get_quiz (zod-typed)
  skills/                    quiz-me, explain-passage: procedures Eve loads on demand
  lib/content.ts             read-only access to the bundled course content
  lib/content.generated.ts   the courses, lessons, glossary, and answer-free quizzes (generated, committed)
evals/
  evals.config.ts            shared eval settings
  smoke.eval.ts              the agent boots and answers
  tutor/*.eval.ts            reads the open lesson before answering; never reveals a quiz answer
```

How a question travels:

1. The browser sends your message to the same-origin `/eve/v1/*` routes with the page context attached as per-turn client context (course, lesson, tutor notes, and the highlighted passage as a quote inside the message). `withEve()` in `next.config.ts` mounts those routes: locally they proxy to the eve dev server, on Vercel to the eve service that deploys with the project.
2. eve runs the turn as a durable workflow. Eve calls `get_lesson` if she has not read the lesson in this conversation yet, streams her reply, and the session parks until your next message. Only the session id is kept in the browser (sessionStorage), so a conversation resumes after navigation or a reload; the transcript lives with the session.
3. The model is reached through Vercel AI Gateway with the deployment's OIDC token (or `AI_GATEWAY_API_KEY` locally). No provider key exists anywhere in the app.

Quiz answers, rubrics, and model answers are stripped from the bundle Eve reads, so she cannot leak them even if asked nicely; `evals/tutor/never-leaks-quiz-answers.eval.ts` checks that she also does not try.

**Evals.** `npm run eve:eval` boots a local eve server and runs everything in `evals/`; `npx eve eval --url https://<deployment>` runs the same files against a deployment. The judge model runs through AI Gateway as well.

**Health.** `/api/health` reports `tutor` (the eve service answers its health route), `grading` (gateway credentials are present), and `database`. `/api/health?probe=eve` runs one real turn on the agent and reports how it ended; `/api/health?probe=lesson` asks Eve about the first lesson with the same page context the browser sends and lists the tools she called (expect `get_lesson`); `/api/health?probe=1` makes one model call on the grading path.

## Environment variables

| Name | Required | Purpose |
|---|---|---|
| `AI_GATEWAY_API_KEY` | For Eve and grading, unless OIDC is available | Vercel AI Gateway key. Never exposed to the browser. On Vercel deployments the gateway authenticates with the project's OIDC token instead. |
| `EVE_MODEL` | No | Gateway model id for Eve and the grader. Default `anthropic/claude-opus-5`. |
| `EVE_EFFORT` | No | Grader reasoning effort: `low` / `medium` / `high`. Default `medium`. (Eve's own effort is set in `agent/agent.ts`.) |
| `DATABASE_URL` | No | Neon Postgres connection string. Without it, progress is browser-only. |

## Vercel AI Gateway

Every model call goes through [Vercel AI Gateway](https://vercel.com/ai-gateway): Eve's model id in `agent/agent.ts` is a gateway id, and grading uses the AI SDK's `gateway` provider. The app never holds an Anthropic key. Billing, usage, and model routing live in the Vercel dashboard.

- **Locally:** create an API key in the Vercel dashboard under AI Gateway and set `AI_GATEWAY_API_KEY` in `.env.local`.
- **On Vercel:** either set the same variable in the project, or enable OIDC federation in the project's security settings and leave it unset; both the eve service and the grading route pick up the deployment's OIDC token automatically.
- **Switch models** with `EVE_MODEL` (any `provider/model` id the gateway lists, for example `anthropic/claude-sonnet-5`).
- **Check it works:** open `/api/health?probe=eve` (one real tutor turn) and `/api/health?probe=1` (one grading-path model call) on the deployed site.

## Deploy to Vercel

One click (Vercel will fork the repo and ask for the environment variables):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flegertom%2Fspec-driven-development&project-name=spec-driven-development)

Or by hand:

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project → Import** the repository. Framework is auto-detected (Next.js). `withEve()` adds the eve agent as a service of the same project during the build, so there are no build settings to change. Node 24 is selected by `engines` in `package.json`.
3. Under **Environment Variables**, add `AI_GATEWAY_API_KEY` unless you enable OIDC federation for the project (see "Vercel AI Gateway" above), and `DATABASE_URL` if you set up Neon (see below).
4. Deploy. Every later push to the production branch redeploys. Check `/eve/v1/health` and `/api/health?probe=eve` afterwards.

## Set up Neon (optional, for durable progress)

1. Create a project at [neon.tech](https://neon.tech). Copy the **pooled** connection string.
2. Either run `db/migrations/0000_init.sql` in the Neon SQL editor, or locally:

   ```bash
   DATABASE_URL="postgresql://..." npm run db:push
   ```

3. Add `DATABASE_URL` to `.env.local` and to Vercel. Redeploy.

The schema is three tables: `learners` (anonymous ids), `lesson_progress`, and `quiz_attempts`, each scoped by course. See `db/schema.ts`.

## Project structure

```
app/                          pages and API routes (App Router)
  page.tsx                    platform home + catalog
  courses/[course]/           course home (syllabus, running example)
  courses/[course]/[lesson]/  a lesson page
  courses/[course]/glossary/  the course's glossary
  progress/                   progress across courses
  api/grade                   grades a written answer against its rubric
  api/progress                reads / writes progress (Neon or no-op)
  api/health                  feature availability + optional probes
agent/                        Eve, an eve agent: agent.ts, instructions.md, channels/, tools/, skills/, lib/
evals/                        eve evals for the tutor
components/                   UI: markdown renderer, callouts, Eve drawer + chat (useEveAgent), highlight menu, quiz cards, progress
content/courses/
  _template/                  copy this to start a new course
  sdd-for-dummies/            Spec-Driven Development for Dummies
  working-with-coding-agents/ AI-Augmented Engineering: Working with Coding Agents
  prompt-engineering-for-engineers/  Prompt Engineering for Engineers
  ai-agent-evals/             Building and Evaluating AI Agents
  agent-security-and-red-teaming/    Security and Red-Teaming for Agents
    course.json               title, modules, lesson order, running example, tutor notes
    glossary.json             glossary entries
    lessons/*.md              lesson text (markdown + frontmatter)
    quizzes/*.json            quizzes and homework with rubrics
    notes/*.md                instructor notes
lib/                          course registry, content loader, grader prompt, AI Gateway + DB helpers
db/                           Drizzle schema and SQL migration
docs/                         adding a course, author brief, architecture, UI plan, per-course plans
scripts/validate-content.mjs  content checks (also run in CI)
scripts/bundle-content.mjs    writes agent/lib/content.generated.ts (Eve's copy of the courses)
next.config.ts                withEve(nextConfig): mounts the agent at /eve/v1/*
```

`/eve/v1/*` (session create, messages, stream, health) is served by the eve service, not by a Next.js route.

## Editing or adding courses

- **Add a course:** copy `content/courses/_template` to a new folder and fill in `course.json`. See `docs/ADDING_A_COURSE.md`.
- **Change a lesson:** edit `content/courses/<course>/lessons/<slug>.md`. Callouts: `:::example Title` … `:::` (also `key`, `beginner`, `warning`, `tip`, `try`).
- **Change a quiz:** edit `content/courses/<course>/quizzes/<slug>.json`. See `docs/AUTHOR_BRIEF.md` for the exact shape.
- **Add a lesson:** add the slug to a module in `course.json`, then create the three content files.
- **Change Eve:** her persona and tool rules in `agent/instructions.md`, on-demand procedures in `agent/skills/`, the model and limits in `agent/agent.ts`; course-specific guidance in each `course.json` under `tutorNotes`. The grader's prompt is in `lib/prompts.ts`.
- **Rename the platform:** `lib/platform.ts`.

Content changes reach Eve through `agent/lib/content.generated.ts`, which `npm run dev` and `npm run build` regenerate; commit it with the content change (CI fails if it is stale).

## How grading and the tutor work

See the in-app [How It Works](/how-it-works) page, or `docs/ARCHITECTURE.md`. In short: MC is graded by code; written answers are graded by a rubric-based LLM judge whose criteria are binary and whose score is computed in code (the same discipline the agents course's Lesson 5 teaches). Eve is an eve agent with tools for the course content, durable sessions, and a per-session cost cap. Every model call goes through Vercel AI Gateway.

## Cost

With the default model, a tutor turn or a grading call is roughly a cent or two. A learner who finishes a whole course with heavy tutor use costs a few dollars. Each Eve session is capped at one US dollar of model spend (`agent/agent.ts`). Usage and spend show up in the Vercel dashboard under AI Gateway, where you can also set limits.

## Credits

"Building and Evaluating AI Agents" follows the module and lesson structure of the public syllabus of "AI Evals for Engineers & PMs" by Hamel Husain and Shreya Shankar. "Spec-Driven Development for Dummies" follows the ideas of a short lecture on AI-augmented engineering in a regulated lifecycle. "Working with Coding Agents" uses Claude Code's documented configuration shapes; "Prompt Engineering for Engineers" uses the Anthropic TypeScript SDK's documented API shapes. "Security and Red-Teaming for Agents" names the OWASP Top 10 for Agentic Applications, the NIST AI Risk Management Framework, the EU AI Act, and promptfoo without reproducing their text. All lesson text, examples, quizzes, glossaries, and the Pip's Plant Shop and Bramble Books worlds are original to this platform.

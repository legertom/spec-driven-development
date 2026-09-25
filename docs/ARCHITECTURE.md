# Architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, TypeScript) on Node 24 | One codebase for pages and API routes; deploys to Vercel with zero config |
| Styling | Tailwind CSS v4 + a small set of CSS variables | Fast to build, easy to theme, dark mode for free |
| Content | One folder per course: `course.json`, markdown lessons with YAML frontmatter, JSON quizzes, JSON glossary | Beginners can edit lessons in any text editor; adding a course is adding a folder; no CMS |
| Markdown | `react-markdown` + `remark-gfm` + `remark-directive` + `rehype-highlight` | Tables, callout containers, syntax highlighting |
| Tutor | [eve](https://eve.dev) (`eve` package): an agent directory in `agent/`, mounted at `/eve/v1/*` by `withEve()` in `next.config.ts`, rendered with `useEveAgent` from `eve/react` | Durable, resumable sessions; typed tools; skills; route auth; evals; cost limits; one deploy with the site |
| Grader | Vercel AI SDK (`ai`) with the AI Gateway provider (`@ai-sdk/gateway`) | Schema-validated output for grading; no provider keys in the app |
| Model | `anthropic/claude-opus-5` through Vercel AI Gateway (override with `EVE_MODEL`) | One gateway id for the agent and the grader; OIDC auth on Vercel |
| Database | Neon Postgres via `@neondatabase/serverless` + Drizzle ORM | Serverless-friendly Postgres; optional (localStorage fallback) |
| Hosting | Vercel | Git push to deploy; the Next.js app and the eve service deploy as one project |

## File tree

```
app/
  layout.tsx                        root layout: top bar, Eve provider + drawer, progress provider
  page.tsx                          platform home + catalog
  courses/page.tsx                  catalog
  courses/[course]/layout.tsx       course layout with the sidebar (404 for unknown courses)
  courses/[course]/page.tsx         course home: syllabus, phases, running example, credits
  courses/[course]/[lesson]/page.tsx  lesson page (server component) → content + client islands
  courses/[course]/glossary/page.tsx  the course's glossary
  how-it-works/page.tsx
  progress/page.tsx                 progress across courses
  api/grade/route.ts                POST: grade one answer against a rubric → JSON
  api/progress/route.ts             GET/POST: learner progress (no-op without a database)
  api/health/route.ts               GET: which features are available; ?probe=eve / ?probe=1
agent/                              Eve, the eve agent (see "Eve" below)
  agent.ts  instructions.md  channels/eve.ts  tools/*.ts  skills/*.md  lib/content.ts  lib/content.generated.ts
evals/
  evals.config.ts  smoke.eval.ts  tutor/reads-the-lesson.eval.ts  tutor/never-leaks-quiz-answers.eval.ts
components/
  TopBar, Sidebar, CourseCard, CourseCatalog, ModuleCards, StatusPill, KeyTerms, LessonNav
  Markdown (shared), Callout, CodeBlock, InstructorNotes, GlossaryList
  eve/EveProvider (drawer state, page context, health), eve/EveChat (useEveAgent: session, streaming, tool chips),
  eve/EveDrawer, eve/HighlightMenu, eve/AskEveButton, eve/EveContext, eve/EveToggle
  quiz/Quiz, quiz/McQuestionCard, quiz/GradedQuestionCard
  progress/ProgressProvider, progress/ProgressDashboard, progress/LessonVisit, progress/CompleteButton
lib/
  platform.ts                       platform name and tagline (client-safe)
  course-types.ts                   zod schemas for course.json and glossary.json
  courses.ts                        course registry: reads content/courses/*/course.json (server only)
  content.ts                        load + parse lessons, quizzes, notes for a course (server only)
  ai.ts                             AI Gateway model for the grader, auth check, error mapping
  prompts.ts                        grader prompt (and the platform persona kept for reference)
  db.ts, learner.ts                 Neon + Drizzle connection; anonymous learner cookie
  progress-types.ts, progress-store.ts  progress records (course-scoped) and the localStorage store
content/courses/
  _template/                        starter folder for a new course (ignored by the platform)
  <slug>/course.json                title, modules, lesson order, verbs, running example, tutor notes
  <slug>/glossary.json
  <slug>/lessons/*.md  quizzes/*.json  notes/*.md
db/
  schema.ts                         Drizzle schema (course-scoped)
  migrations/0000_init.sql          SQL you can run in the Neon console
docs/
  ADDING_A_COURSE.md AUTHOR_BRIEF.md ARCHITECTURE.md UI_PLAN.md courses/<slug>/COURSE_PLAN.md
scripts/validate-content.mjs        content checks for every course (also in CI)
scripts/bundle-content.mjs          writes agent/lib/content.generated.ts from content/courses (before dev and build; --check in CI)
next.config.ts                      withEve(nextConfig) + redirects
```

## Eve (tutor)

Eve is an eve agent. The directory is the contract:

| File | Role |
|---|---|
| `agent/agent.ts` | `defineAgent`: model `anthropic/claude-opus-5` (an AI Gateway id; `EVE_MODEL` overrides), `reasoning: "medium"`, `defaultTools: false` (no bash / file / web tools, so no sandbox is ever needed), compaction at 80% of a pinned 200k context window, and per-session limits (1 USD of model spend, 40k output tokens, 7-day lifetime). |
| `agent/instructions.md` | Always-on instructions: audience, how the client context is laid out, when to call which tool, teaching style, and the hard rule that she never states a correct option or writes a graded answer. |
| `agent/channels/eve.ts` | `eveChannel({ auth: [vercelOidc(), localDev(), none()], audience: "public" })`. The platform has no accounts, so anonymous browser traffic is admitted explicitly with `none()`. Put a real `AuthFn` ahead of it when accounts arrive. |
| `agent/tools/*.ts` | `defineTool` with zod input schemas: `get_lesson` (full text or one numbered section), `get_course`, `list_courses`, `lookup_term` (scored glossary search), `get_quiz` (questions without answers). |
| `agent/skills/*.md` | `quiz-me`, `explain-passage`: procedures the model loads with `load_skill` when a request matches their description. |
| `agent/lib/content.generated.ts` | The course bundle the tools read. Generated by `scripts/bundle-content.mjs` from `content/courses/` with MC answers, explanations, rubrics, model answers, and instructor notes stripped. Committed, because the eve service is built straight from the repository. |

### A turn, end to end

```
Browser (components/eve/EveChat.tsx, useEveAgent)
  send("> highlighted passage\n\nquestion", { clientContext: { courseSlug, courseTitle, courseNotes, lessonSlug, lessonNumber, lessonTitle, page } })
    │  same-origin POST /eve/v1/session  (first turn)  or  POST /eve/v1/session/:id  (later turns)
    │  + GET /eve/v1/session/:id/stream (server-sent events, reconnects from a cursor)
    ▼
withEve() routing
  dev:     `next dev` starts `eve dev --no-ui` and rewrites /eve/v1/* to it
  Vercel:  Build Output `services` + `routes` send /eve/v1/** to the eve service built from agent/
  local prod: `next start` proxies /eve/v1/* to port 4274, where `npm run start:eve` serves the `eve build` output
    ▼
eve runtime (a durable workflow per session)
  1. route auth walk → anonymous principal
  2. client context becomes user-role context messages for this turn only (never stored in history)
  3. model call through AI Gateway (OIDC on Vercel, AI_GATEWAY_API_KEY locally)
  4. tool calls: get_lesson(courseSlug, lessonSlug) → lesson text from the bundle → back to the model
  5. text streams as events; the session parks (session.waiting) until the next message
    ▼
Browser
  the default reducer projects events into messages[].parts (text, dynamic-tool, …); the UI renders
  text as markdown and tool calls as small chips; sessionStorage keeps { sessionId } per thread so the
  next mount passes initialSession + resume: true and replays the transcript
```

- One thread per lesson (or per course page, or per other page): `EveDrawer` keys `<EveChat>` by the thread key, so navigating between lessons switches sessions and coming back resumes the earlier one.
- Nothing about chats is written to the platform database. Session transcripts live in eve's durable store (Vercel Workflow on Vercel).
- Cost is bounded per session by `limits.maxTokenCostUsdPerSession`; a new chat is a new session.
- `GET /eve/v1/health` is public and is what `/api/health` uses for the `tutor` flag. `/api/health?probe=eve` creates a session with the `Client` from `eve/client` and reports how the turn ended.

### Evals

`evals/` uses eve's eval runner (`npx eve eval`, or `npm run eve:eval`). Each file is one case that drives the agent and asserts on what happened:

- `smoke.eval.ts`: the agent answers a trivial message without calling tools.
- `tutor/reads-the-lesson.eval.ts`: with L4 open, asking about "open coding" calls `get_lesson` for that lesson, and a judge scores the answer against the lesson's definition.
- `tutor/never-leaks-quiz-answers.eval.ts`: asked point-blank for the correct MC option, a judge gates that no option is revealed.

Runs need AI Gateway credentials (the judge runs through the gateway too). Against a deployment: `npx eve eval --url https://<deployment>`.

## Grading

```
Browser ──POST /api/grade {courseSlug, lessonSlug, questionId, answer}──▶ Route handler
  1. look up the question + rubric + model answer on the server (never trust the client's rubric)
  2. generateText({ model: gateway(MODEL), output: Output.object({ schema: GradeSchema }) })
  3. return { score, passed, feedback, strengths, improvements, rubricResults, modelAnswer }
```

- The grader prompt is a judge prompt: definition of each rubric criterion, the model answer as a boundary example, strict JSON output. Each criterion is scored pass/fail (binary, as L5 teaches); the score is the share of criteria met, and `passed` requires 70% or more.
- Multiple-choice questions never hit the API; they are graded in the browser from the quiz JSON.

## Progress

```
Browser (ProgressProvider)
  localStorage  ←→  optimistic state
        │
        └──POST /api/progress──▶ if DATABASE_URL: upsert into Neon; else 200 {persisted:false}
```

- Identity is an anonymous `sdd_learner` cookie (UUID, httpOnly, one year). No login.
- Records: lesson status (`in_progress` / `completed`) and quiz attempts (question id, score, passed, feedback JSON), each scoped by course slug.
- On load, the provider merges localStorage with the server copy (latest `updatedAt` wins).

## Database schema (Drizzle)

```
learners        id text PK · display_name text · created_at timestamptz
lesson_progress id serial PK · learner_id → learners · course_slug · lesson_slug · status · updated_at · unique(learner_id, course_slug, lesson_slug)
quiz_attempts   id serial PK · learner_id → learners · course_slug · lesson_slug · question_id · kind ('mc'|'short'|'free'|'homework') · answer text · score int · passed bool · feedback jsonb · created_at
```

## Environment variables

| Name | Required | Purpose |
|---|---|---|
| `AI_GATEWAY_API_KEY` | For Eve and grading, unless OIDC is available on Vercel | Vercel AI Gateway key |
| `EVE_MODEL` | No | Overrides the gateway model id for Eve and the grader (default `anthropic/claude-opus-5`) |
| `EVE_EFFORT` | No | Grader reasoning effort (`low` / `medium` / `high`) |
| `DATABASE_URL` | No | Neon connection string; without it progress stays in the browser |

## Security notes

- No provider key exists in the app; gateway credentials never reach the browser. Model calls happen in the eve service (tutor) and in a route handler (grader).
- The agent has no sandbox tools (`defaultTools: false`) and only the five read-only course tools; it cannot run code, read files, or browse.
- Rubrics, model answers, and MC answers are absent from the agent's content bundle and are read on the server for grading, so a client cannot submit a fake rubric and Eve cannot leak an answer she does not have.
- The eve routes are anonymous on purpose (public course platform), bounded per session by cost and output-token limits and by a session lifetime. Session ids are unguessable; ownership is not enforced beyond that, which matches the platform's no-login model.
- Request bodies to `/api/*` are validated with Zod.

## Cost

Rough per-request cost with `anthropic/claude-opus-5` at list prices: a tutor turn is a cent or two (the lesson is read once per session, then stays in the conversation); a grading call is similar. A learner completing a whole course with generous tutor use costs on the order of a few dollars, and no single Eve session can spend more than one US dollar. Spend is visible, and can be capped, in the Vercel dashboard under AI Gateway.

## Adding a course

See `docs/ADDING_A_COURSE.md`. In short: copy `content/courses/_template`, fill in `course.json`, write the lessons, run `npm run validate`, and commit the regenerated `agent/lib/content.generated.ts`.

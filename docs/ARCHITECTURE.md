# Architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, TypeScript) on Node | One codebase for pages and API routes; deploys to Vercel with zero config |
| Styling | Tailwind CSS v4 + a small set of CSS variables | Fast to build, easy to theme, dark mode for free |
| Content | One folder per course: `course.json`, markdown lessons with YAML frontmatter, JSON quizzes, JSON glossary | Beginners can edit lessons in any text editor; adding a course is adding a folder; no CMS |
| Markdown | `react-markdown` + `remark-gfm` + `remark-directive` + `rehype-highlight` | Tables, callout containers, syntax highlighting |
| Tutor and grader | Vercel AI SDK (`ai`) with the AI Gateway provider (`@ai-sdk/gateway`), model `anthropic/claude-opus-5` by default | Streaming chat for Eve; schema-validated output for grading; no provider keys in the app |
| Database | Neon Postgres via `@neondatabase/serverless` + Drizzle ORM | Serverless-friendly Postgres; optional (localStorage fallback) |
| Hosting | Vercel | Git push to deploy; API routes run as serverless functions |

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
  api/tutor/route.ts                POST: stream Eve's reply
  api/grade/route.ts                POST: grade one answer against a rubric → JSON
  api/progress/route.ts             GET/POST: learner progress (no-op without a database)
  api/health/route.ts               GET: which features are configured
components/
  TopBar, Sidebar, CourseCard, CourseCatalog, ModuleCards, StatusPill, KeyTerms, LessonNav
  Markdown (shared), Callout, CodeBlock, InstructorNotes, GlossaryList
  eve/EveProvider, eve/EveDrawer, eve/HighlightMenu, eve/AskEveButton, eve/EveContext, eve/EveToggle
  quiz/Quiz, quiz/McQuestionCard, quiz/GradedQuestionCard
  progress/ProgressProvider, progress/ProgressDashboard, progress/LessonVisit, progress/CompleteButton
lib/
  platform.ts                       platform name and tagline (client-safe)
  course-types.ts                   zod schemas for course.json and glossary.json
  courses.ts                        course registry: reads content/courses/*/course.json (server only)
  content.ts                        load + parse lessons, quizzes, notes for a course (server only)
  ai.ts                             AI Gateway model, auth check, error mapping
  prompts.ts                        platform persona, course block, lesson block, grader prompt
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
```

## Request flows

### Eve (tutor)

```
Browser ──POST /api/tutor {courseSlug, lessonSlug, messages}──▶ Route handler
  1. load the course definition and the lesson markdown (server, from disk)
  2. system = [platform persona (cached)] + [course block: map, running example, tutor notes (cached)] + [lesson body (cached)]
  3. user turn = optional quoted highlight + the question
  4. streamText({ model: gateway(MODEL), messages, providerOptions: { anthropic: { effort } } })
  5. pipe the text stream back as a plain-text streamed response
Browser ◀── chunks ── renders markdown progressively
```

- Prompt caching: the persona, course, and lesson system messages carry `providerOptions.anthropic.cacheControl`, which the gateway forwards to Anthropic as `cache_control`, so repeated questions on the same lesson reuse the cached prefix (three of the four allowed breakpoints).
- The conversation is kept in the browser (sessionStorage) and resent each turn; nothing is stored server-side.
- If the server has no gateway credentials (`AI_GATEWAY_API_KEY`, or OIDC on Vercel) the route returns `503 { error: "no_gateway" }` and the UI shows setup help.

### Grading

```
Browser ──POST /api/grade {courseSlug, lessonSlug, questionId, answer}──▶ Route handler
  1. look up the question + rubric + model answer on the server (never trust the client's rubric)
  2. generateText({ model: gateway(MODEL), output: Output.object({ schema: GradeSchema }) })
  3. return { score, passed, feedback, strengths, improvements, rubricResults, modelAnswer }
```

- The grader prompt is a judge prompt: definition of each rubric criterion, the model answer as a boundary example, strict JSON output. Each criterion is scored pass/fail (binary, as L5 teaches); the score is the share of criteria met, and `passed` requires 70% or more.
- Multiple-choice questions never hit the API; they are graded in the browser from the quiz JSON.

### Progress

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
| `EVE_MODEL` | No | Overrides the gateway model id (default `anthropic/claude-opus-5`) |
| `DATABASE_URL` | No | Neon connection string; without it progress stays in the browser |

## Security notes

- No provider key exists in the app; the gateway credential never reaches the browser, and all model calls happen in route handlers.
- Rubrics and model answers are read on the server, so a client cannot submit a fake rubric.
- Request bodies are validated with Zod; message history is capped (last 20 turns) and each message is capped in length.
- Eve's system prompt tells her to guide on quiz questions rather than hand over the answer.

## Cost

Rough per-request cost with `anthropic/claude-opus-5` at list prices: a tutor turn with a 5k-token cached lesson is roughly a cent or two; a grading call is similar. A learner completing a whole course with generous tutor use costs on the order of a few dollars. Spend is visible, and can be capped, in the Vercel dashboard under AI Gateway.

## Adding a course

See `docs/ADDING_A_COURSE.md`. In short: copy `content/courses/_template`, fill in `course.json`, write the lessons, run `npm run validate`.

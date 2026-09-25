# Architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, TypeScript) on Node | One codebase for pages and API routes; deploys to Vercel with zero config |
| Styling | Tailwind CSS v4 + a small set of CSS variables | Fast to build, easy to theme, dark mode for free |
| Content | Markdown files with YAML frontmatter, quizzes as JSON | Beginners can edit lessons in any text editor; no CMS |
| Markdown | `react-markdown` + `remark-gfm` + `remark-directive` + `rehype-highlight` | Tables, callout containers, syntax highlighting |
| Tutor and grader | Anthropic SDK (`@anthropic-ai/sdk`), model `claude-opus-5` by default | Streaming chat for Eve; structured outputs for grading |
| Database | Neon Postgres via `@neondatabase/serverless` + Drizzle ORM | Serverless-friendly Postgres; optional (localStorage fallback) |
| Hosting | Vercel | Git push to deploy; API routes run as serverless functions |

## File tree

```
app/
  layout.tsx                 root layout: top bar, Eve provider + drawer
  page.tsx                   home
  course/page.tsx            syllabus overview
  course/[slug]/page.tsx     lesson page (server component) → renders content + client islands
  glossary/page.tsx
  how-it-works/page.tsx
  progress/page.tsx
  api/tutor/route.ts         POST: stream Eve's reply (text/event-stream style chunks)
  api/grade/route.ts         POST: grade one answer against a rubric → JSON
  api/progress/route.ts      GET/POST: learner progress (no-op without a database)
  api/health/route.ts        GET: which features are configured
components/
  TopBar.tsx, Sidebar.tsx, Markdown.tsx (server), Callout.tsx, CodeBlock.tsx
  eve/EveProvider.tsx, eve/EveDrawer.tsx, eve/HighlightMenu.tsx, eve/AskEveButton.tsx
  quiz/Quiz.tsx, quiz/McQuestion.tsx, quiz/GradedQuestion.tsx, quiz/Homework.tsx
  progress/ProgressProvider.tsx, progress/LessonStatus.tsx, progress/CompleteButton.tsx
  InstructorNotes.tsx, LessonNav.tsx
lib/
  course.ts                  module/lesson order
  content.ts                 load + parse lessons, quizzes, notes (server only)
  anthropic.ts               client, model id, fallback-aware helpers
  prompts.ts                 Eve's system prompt and the grader prompt
  db.ts                      Neon + Drizzle connection (returns null when unconfigured)
  learner.ts                 anonymous learner id cookie
  progress-types.ts          shared types for progress records
content/
  lessons/*.md  quizzes/*.json  notes/*.md  glossary.ts
db/
  schema.ts                  Drizzle schema
  migrations/0000_init.sql   SQL you can run in the Neon console
docs/
  COURSE_PLAN.md UI_PLAN.md ARCHITECTURE.md AUTHOR_BRIEF.md GLOSSARY_TERMS.md
```

## Request flows

### Eve (tutor)

```
Browser ──POST /api/tutor {lessonSlug, messages, highlight?}──▶ Route handler
  1. load lesson markdown + glossary summary (server, from disk)
  2. system = [persona + course overview (cached)] + [lesson body (cached)]
  3. user turn = optional quoted highlight + the question
  4. client.beta.messages.stream({ model, system, messages, fallbacks: "default" })
  5. pipe text deltas back as a streamed response
Browser ◀── chunks ── renders markdown progressively
```

- Prompt caching: the persona block and the lesson block carry `cache_control`, so repeated questions on the same lesson reuse the cached prefix.
- The conversation is kept in the browser (sessionStorage) and resent each turn; nothing is stored server-side.
- If `ANTHROPIC_API_KEY` is missing the route returns `503 { error: "no_api_key" }` and the UI shows setup help.

### Grading

```
Browser ──POST /api/grade {lessonSlug, questionId, answer}──▶ Route handler
  1. look up the question + rubric + model answer on the server (never trust the client's rubric)
  2. client.beta.messages.parse({ output_config: { format: zodOutputFormat(GradeSchema) } })
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
- Records: lesson status (`in_progress` / `completed`) and quiz attempts (question id, score, passed, feedback JSON).
- On load, the provider merges localStorage with the server copy (latest `updatedAt` wins).

## Database schema (Drizzle)

```
learners        id text PK · display_name text · created_at timestamptz
lesson_progress id serial PK · learner_id → learners · lesson_slug text · status text · updated_at timestamptz · unique(learner_id, lesson_slug)
quiz_attempts   id serial PK · learner_id → learners · lesson_slug · question_id · kind ('mc'|'short'|'free'|'homework') · answer text · score int · passed bool · feedback jsonb · created_at
```

## Environment variables

| Name | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | For Eve and grading | Anthropic API key |
| `EVE_MODEL` | No | Overrides the model id (default `claude-opus-5`) |
| `DATABASE_URL` | No | Neon connection string; without it progress stays in the browser |

## Security notes

- The API key never reaches the browser; all model calls happen in route handlers.
- Rubrics and model answers are read on the server, so a client cannot submit a fake rubric.
- Request bodies are validated with Zod; message history is capped (last 20 turns) and each message is capped in length.
- Eve's system prompt tells her to guide on quiz questions rather than hand over the answer.

## Cost

Rough per-request cost with `claude-opus-5` ($5 / M input, $25 / M output): a tutor turn with a 5k-token cached lesson is roughly a cent or two; a grading call is similar. A learner completing the whole course with generous tutor use costs on the order of a few dollars. Set a spend limit in the Anthropic console.

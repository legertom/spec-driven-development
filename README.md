# Spec-Driven Development

> Hands-on courses for engineers building with AI.
> A small learning platform with a built-in AI tutor (Eve), AI-graded assessments, and lots of small examples. Each course is a folder of markdown; adding a course is adding a folder.

Built with **Next.js 16** (Node), **Tailwind CSS 4**, the **Vercel AI SDK** with **Vercel AI Gateway** (Claude models, no provider keys to manage), **Neon Postgres** (optional), and deployed on **Vercel**.

## What's inside

| Area | What you get |
|---|---|
| **A course catalog** | Every folder in `content/courses/` is a course. The first one, **Building and Evaluating AI Agents**, has a beginner primer (L0), nine core lessons (L1–L9) across five modules, and a bonus interview-prep lesson. Every lesson has a story, numbered sections, six or more worked examples, key terms, a quiz, written exercises, and collapsible instructor notes. |
| **Eve, the tutor** | Highlight any text and click **Ask Eve**. She knows the course and the lesson you are reading, explains, re-examples, and quizzes you, and gives hints (not answers) on graded questions. Streaming replies. |
| **Grading** | Multiple choice is graded in code with an explanation per option. Short answers, free responses, and homework projects are graded by an LLM judge against a binary rubric, with a score, feedback, strengths, improvements, and a model answer. |
| **Per-course glossary** | The first course ships 139 terms with plain-English definitions and an example each. Searchable, A–Z, "Ask Eve" per term. |
| **How It Works** | A page that explains the platform, Eve, grading, data, and the architecture (with a diagram). |
| **Progress** | Anonymous, no login. Stored in the browser, and in Neon when configured. Dashboard grouped by course, with weak spots and "Ask Eve to review my weak spots". |
| **Design docs** | `docs/ADDING_A_COURSE.md`, `docs/AUTHOR_BRIEF.md`, `docs/ARCHITECTURE.md`, `docs/UI_PLAN.md`, and a plan per course under `docs/courses/` (the first course's plan lists every lesson's objectives, sections, examples, and assessments). |

## Quick start (local)

```bash
npm install
cp .env.example .env.local      # then put your AI_GATEWAY_API_KEY in .env.local (Vercel dashboard → AI Gateway → API keys)
npm run dev                     # http://localhost:3000
```

Without gateway credentials every course still renders; Eve and the written-answer grading show a "not connected yet" notice.

Other scripts:

```bash
npm run build       # production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit (run `npx next typegen` first on a fresh clone)
npm run validate    # check every course's lessons, quizzes, and glossary
npm run db:push     # push the Drizzle schema to DATABASE_URL (Neon)
```

## Environment variables

| Name | Required | Purpose |
|---|---|---|
| `AI_GATEWAY_API_KEY` | For Eve and grading, unless OIDC is available | Vercel AI Gateway key. Never exposed to the browser. On Vercel deployments the gateway can authenticate with the project's OIDC token instead. |
| `EVE_MODEL` | No | Gateway model id for Eve and the grader. Default `anthropic/claude-opus-5`. |
| `EVE_EFFORT` | No | `low` / `medium` / `high`. Default `medium`. |
| `DATABASE_URL` | No | Neon Postgres connection string. Without it, progress is browser-only. |

## Vercel AI Gateway

Model calls go through [Vercel AI Gateway](https://vercel.com/ai-gateway) using the AI SDK's `gateway` provider, so the app never holds an Anthropic key. Billing, usage, and model routing live in the Vercel dashboard.

- **Locally:** create an API key in the Vercel dashboard under AI Gateway and set `AI_GATEWAY_API_KEY` in `.env.local`.
- **On Vercel:** either set the same variable in the project, or enable OIDC federation in the project's security settings and leave it unset; the gateway provider picks up the deployment's OIDC token automatically.
- **Switch models** with `EVE_MODEL` (any `provider/model` id the gateway lists, for example `anthropic/claude-sonnet-5`). Anthropic-specific options such as prompt caching and effort are forwarded by the gateway.
- **Check it works:** open `/api/health?probe=1` on the deployed site. It makes a one-word model call and reports `probe.ok`, the latency, and any credential error.

## Deploy to Vercel

One click (Vercel will fork the repo and ask for the environment variables):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flegertom%2Fspec-driven-development&project-name=spec-driven-development)

Or by hand:

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project → Import** the repository. Framework is auto-detected (Next.js). No build settings to change.
3. Under **Environment Variables**, add `AI_GATEWAY_API_KEY` unless you enable OIDC federation for the project (see "Vercel AI Gateway" above), and `DATABASE_URL` if you set up Neon (see below).
4. Deploy. Every later push to the production branch redeploys.

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
  api/tutor                   streams Eve's reply
  api/grade                   grades a written answer against its rubric
  api/progress                reads / writes progress (Neon or no-op)
components/                   UI: markdown renderer, callouts, Eve drawer, highlight menu, quiz cards, progress
content/courses/
  _template/                  copy this to start a new course
  ai-agent-evals/             the first course
    course.json               title, modules, lesson order, running example, tutor notes
    glossary.json             glossary entries
    lessons/*.md              lesson text (markdown + frontmatter)
    quizzes/*.json            quizzes and homework with rubrics
    notes/*.md                instructor notes
lib/                          course registry, content loader, prompts, AI Gateway + DB helpers
db/                           Drizzle schema and SQL migration
docs/                         adding a course, author brief, architecture, UI plan, per-course plans
scripts/validate-content.mjs  content checks (also run in CI)
```

## Editing or adding courses

- **Add a course:** copy `content/courses/_template` to a new folder and fill in `course.json`. See `docs/ADDING_A_COURSE.md`.
- **Change a lesson:** edit `content/courses/<course>/lessons/<slug>.md`. Callouts: `:::example Title` … `:::` (also `key`, `beginner`, `warning`, `tip`, `try`).
- **Change a quiz:** edit `content/courses/<course>/quizzes/<slug>.json`. See `docs/AUTHOR_BRIEF.md` for the exact shape.
- **Add a lesson:** add the slug to a module in `course.json`, then create the three content files.
- **Change Eve:** platform persona in `lib/prompts.ts`; course-specific guidance in each `course.json` under `tutorNotes`.
- **Rename the platform:** `lib/platform.ts`.

## How grading and the tutor work

See the in-app [How It Works](/how-it-works) page, or `docs/ARCHITECTURE.md`. In short: MC is graded by code; written answers are graded by a rubric-based LLM judge whose criteria are binary and whose score is computed in code (the same discipline the first course's Lesson 5 teaches). Eve gets the platform persona, the course block (map, running example, tutor notes), and the full lesson text, with prompt caching so repeated questions are cheap. Every call goes through Vercel AI Gateway.

## Cost

With the default model, a tutor turn or a grading call is roughly a cent or two. A learner who finishes a whole course with heavy tutor use costs a few dollars. Usage and spend show up in the Vercel dashboard under AI Gateway, where you can also set limits.

## Credits

The first course's module and lesson structure follows the public syllabus of "AI Evals for Engineers & PMs" by Hamel Husain and Shreya Shankar. All lesson text, examples, quizzes, the glossary, and the Pip's Plant Shop world are original to this platform.

# Spec-Driven AI Engineering

> Build, evaluate, and ship reliable AI agents, from `SPEC.md` to production.
> A beginner-friendly course with a built-in AI tutor (Eve), AI-graded assessments, and lots of small examples.

Built with **Next.js 16** (Node), **Tailwind CSS 4**, the **Anthropic SDK**, **Neon Postgres** (optional), and deployed on **Vercel**.

## What's inside

| Area | What you get |
|---|---|
| **11 lessons** | A beginner primer (L0), nine core lessons (L1–L9) across five modules, and a bonus interview-prep lesson. Every lesson has a story, numbered sections, six or more worked examples, key terms, a quiz, written exercises, and collapsible instructor notes. |
| **Eve, the tutor** | Highlight any text and click **Ask Eve**. She knows the lesson you are reading, explains, re-examples, and quizzes you, and gives hints (not answers) on graded questions. Streaming replies. |
| **Grading** | Multiple choice is graded in code with an explanation per option. Short answers, free responses, and two homework projects are graded by an LLM judge against a binary rubric, with a score, feedback, strengths, improvements, and a model answer. |
| **Glossary** | 139 terms with plain-English definitions and an example each. Searchable, A–Z, "Ask Eve" per term. |
| **How It Works** | A page that explains the course structure, Eve, grading, data, and the architecture (with a diagram). |
| **Progress** | Anonymous, no login. Stored in the browser, and in Neon when configured. Dashboard with weak spots and "Ask Eve to review my weak spots". |
| **Design docs** | `docs/COURSE_PLAN.md` (every lesson planned in detail), `docs/UI_PLAN.md`, `docs/ARCHITECTURE.md`, `docs/AUTHOR_BRIEF.md`, `docs/GLOSSARY_TERMS.md`. |

## Quick start (local)

```bash
npm install
cp .env.example .env.local      # then put your ANTHROPIC_API_KEY in .env.local
npm run dev                     # http://localhost:3000
```

Without an API key the whole course still renders; Eve and the written-answer grading show a "needs an API key" notice.

Other scripts:

```bash
npm run build       # production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit (run `npx next typegen` first on a fresh clone)
npm run db:push     # push the Drizzle schema to DATABASE_URL (Neon)
```

## Environment variables

| Name | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | For Eve and grading | Anthropic API key. Never exposed to the browser. |
| `EVE_MODEL` | No | Model id for Eve and the grader. Default `claude-opus-5`. |
| `EVE_EFFORT` | No | `low` / `medium` / `high`. Default `medium`. |
| `ANTHROPIC_FALLBACKS` | No | `off` disables server-side refusal fallbacks. Default on. |
| `DATABASE_URL` | No | Neon Postgres connection string. Without it, progress is browser-only. |

## Deploy to Vercel

One click (Vercel will fork the repo and ask for the environment variables):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flegertom%2Fspec-driven-development&env=ANTHROPIC_API_KEY&envDescription=Anthropic%20API%20key%20for%20Eve%20and%20grading&project-name=spec-driven-ai-engineering)

Or by hand:

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project → Import** the repository. Framework is auto-detected (Next.js). No build settings to change.
3. Under **Environment Variables**, add `ANTHROPIC_API_KEY` (and `DATABASE_URL` if you set up Neon, see below).
4. Deploy. Every later push to the production branch redeploys.

## Set up Neon (optional, for durable progress)

1. Create a project at [neon.tech](https://neon.tech). Copy the **pooled** connection string.
2. Either run `db/migrations/0000_init.sql` in the Neon SQL editor, or locally:

   ```bash
   DATABASE_URL="postgresql://..." npm run db:push
   ```

3. Add `DATABASE_URL` to `.env.local` and to Vercel. Redeploy.

The schema is three tables: `learners` (anonymous ids), `lesson_progress`, and `quiz_attempts`. See `db/schema.ts`.

## Project structure

```
app/                  pages and API routes (App Router)
  course/[slug]/      a lesson page
  api/tutor           streams Eve's reply
  api/grade           grades a written answer against its rubric
  api/progress        reads / writes progress (Neon or no-op)
components/           UI: markdown renderer, callouts, Eve drawer, highlight menu, quiz cards, progress
content/
  lessons/*.md        lesson text (markdown + frontmatter)
  quizzes/*.json      quizzes and homework with rubrics
  notes/*.md          instructor notes
  glossary.ts         glossary entries
lib/                  course structure, content loader, prompts, Anthropic + DB helpers
db/                   Drizzle schema and SQL migration
docs/                 course plan, UI plan, architecture, author brief
```

## Editing the course

- **Change a lesson:** edit `content/lessons/<slug>.md`. Callouts: `:::example Title` … `:::` (also `key`, `beginner`, `warning`, `tip`, `try`).
- **Change a quiz:** edit `content/quizzes/<slug>.json`. See `docs/AUTHOR_BRIEF.md` for the exact shape.
- **Add a lesson:** add the slug to `lib/course.ts`, then create the three content files.
- **Change Eve:** `lib/prompts.ts`.

## How grading and the tutor work

See the in-app [How It Works](/how-it-works) page, or `docs/ARCHITECTURE.md`. In short: MC is graded by code; written answers are graded by a rubric-based LLM judge whose criteria are binary and whose score is computed in code (the same discipline Lesson 5 teaches). Eve gets the persona, the course map, and the full lesson text, with prompt caching so repeated questions are cheap.

## Cost

With the default model, a tutor turn or a grading call is roughly a cent or two. A learner who finishes the whole course with heavy tutor use costs a few dollars. Set a spend limit in the Anthropic console.

## Credits

The module and lesson structure follows the public syllabus of "AI Evals for Engineers & PMs" by Hamel Husain and Shreya Shankar. All lesson text, examples, quizzes, the glossary, and the Pip's Plant Shop world are original to this course.

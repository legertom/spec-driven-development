# Adding a course

A course is a folder. Nothing else has to be registered: the platform reads every folder in `content/courses/` that contains a `course.json` (folders starting with `_` are ignored) and lists it in the catalog on the next build.

## 1. Copy the template

```bash
cp -r content/courses/_template content/courses/my-course
```

The folder name is the course's URL slug: `/courses/my-course`.

## 2. Fill in `course.json`

| Field | What it is |
|---|---|
| `slug` | Must equal the folder name. Lowercase letters, digits, hyphens. |
| `title`, `shortTitle` | Full title for the course page; short title for the sidebar and catalog badges. |
| `tagline` | One sentence shown on the catalog card. |
| `description` | Two or three sentences for the course page. |
| `level`, `audience` | Shown on the course page and given to Eve. |
| `status` | `available` or `coming-soon` (a coming-soon course shows on the catalog but cannot be opened). |
| `order` | Sort order in the catalog (lower first). |
| `verbs` | Optional phases (name, question, lesson range). Lessons reference them in frontmatter. The first six get distinct colors. |
| `pipeline` | Optional "what you will build" steps for the course page, each tagged with a verb. |
| `modules` | The lesson order. Each module has an `id`, `title`, `blurb`, and a list of lesson slugs. |
| `shortTitles` | Slug to short title, used in the sidebar. |
| `runningExample` | Optional: the shared fictional world (title, summary, and a tools table). |
| `tutorNotes` | Course-specific guidance for Eve: the running example, the cast, vocabulary, how to frame answers. This text goes into Eve's system prompt on every page of the course. |
| `credits` | Sources and acknowledgements, shown at the bottom of the course page. |

## 3. Write the lessons

For each slug in `modules`, create:

- `lessons/<slug>.md` with the frontmatter and callouts described in `docs/AUTHOR_BRIEF.md`
- `quizzes/<slug>.json` (multiple choice, one short answer, one free response, optional homework)
- `notes/<slug>.md` (instructor notes, optional)

Lesson frontmatter must repeat the module id and title and may name a `verb` from `course.verbs`.

## 4. Add a glossary (optional but recommended)

`glossary.json` is an array of `{ id, term, definition, example, lessons, related }`. Lessons link to terms through their `keyTerms` frontmatter, which must use these ids. A course without a glossary shows "This course does not have a glossary yet."

## 5. Validate and run

```bash
npm run validate    # checks every course: frontmatter, callouts, quizzes, glossary ids
npm run dev         # http://localhost:3000/courses/my-course
```

The validator is also part of CI, so a broken lesson fails the build before it ships.

## 6. Write a course plan first (recommended)

The first course was written from a plan that listed every lesson's objectives, sections, examples, and assessments before any lesson text existed: `docs/courses/ai-agent-evals/COURSE_PLAN.md`. Copy its structure into `docs/courses/<your-slug>/COURSE_PLAN.md`. It is the spec the lessons are derived from, and it doubles as the instructor's guide.

## What Eve knows about your course

On every page of a course, Eve's system prompt contains: the platform persona, your course's title and tagline, the module map, the `verbs`, and `tutorNotes`. On a lesson page it also contains the full lesson text. Write `tutorNotes` as if briefing a new teaching assistant: the running example and its cast, the terms you want used consistently, and anything she should not do (for example, "never reveal quiz answers" is already in the platform persona).

## Progress and grading

Nothing to configure. Progress records are scoped by course slug, quizzes are graded the same way in every course, and the progress page groups everything by course.

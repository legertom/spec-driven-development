# UI Plan

Design goal: a calm, readable place to learn, with the tutor one click away. Beginners should never wonder where they are or what to do next. The platform hosts several courses; every course uses the same layout.

## 1. Global layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Top bar: 🌱 Spec-Driven Dev   Courses · How it works · Progress       │
│                                                        [Ask Eve ✨]   │
├───────────────┬──────────────────────────────────────┬───────────────┤
│ Sidebar       │ Main content (max 72ch)              │ Eve drawer    │
│ (course pages)│                                      │ (slides in,   │
│ Module 0      │  L1 · Building Agents · 60 min       │  400px, any   │
│  ● L0 done    │  # Building Agents: Foundations      │  page)        │
│ Module 1      │  What you'll learn …                 │               │
│  ◐ L1 current │  ## Why this matters …               │  Context chip │
│  ○ L2         │  :::example …                        │  Messages     │
│  ○ L3         │  …                                   │  Quick asks   │
│ …             │  Check your understanding (quiz)     │  Input        │
│               │  Apply it (AI-graded)                │               │
│               │  [Mark complete]  ← prev | next →    │               │
└───────────────┴──────────────────────────────────────┴───────────────┘
```

- **Top bar** is on every page: platform name, Courses, How it works, Progress, and the "Ask Eve" button. On non-lesson pages Eve gets the course (or the catalog) as context.
- **Sidebar** appears on every page under `/courses/[course]`. It starts with the course home and glossary links, then the modules; each lesson shows a status dot (○ not started, ◐ in progress, ● complete) and a small quiz score badge when one exists. On phones it collapses into a "Lessons" sheet.
- **Main** column is a readable article (about 72 characters wide, 17px base font, 1.7 line-height).
- **Eve drawer** slides in from the right, pushes content on wide screens, overlays on narrow ones.

## 2. Pages

| Route | Purpose |
|---|---|
| `/` | Platform home: hero, course catalog cards with progress, how the platform works in three lines |
| `/courses` | The catalog |
| `/courses/[course]` | Course home: tagline, what you will build (pipeline), phases table, module cards with progress, every lesson, the running example, credits |
| `/courses/[course]/[lesson]` | A lesson (see §3) |
| `/courses/[course]/glossary` | The course's searchable glossary with A–Z filter; each term has an "Ask Eve" button and "appears in" links |
| `/how-it-works` | How the platform and the app work, with an architecture diagram |
| `/progress` | Dashboard across courses: overall %, per-course and per-module bars, quiz history, weak spots, reset button |

## 3. The lesson page, top to bottom

1. **Breadcrumb + meta:** Module name · L-number · minutes · verb badge (Analyze / Measure / Improve).
2. **Title** and one-sentence summary.
3. **"What you'll learn"** card listing objectives.
4. **Body** rendered from markdown with callouts:
   - `example` (blue left bar, 💡-style icon, label "Example")
   - `key` (green, "Key idea")
   - `beginner` (violet, "Plain English")
   - `warning` (amber, "Common mistake")
   - `tip` (teal, "Tip")
   - `try` (pink, "Try it with Eve", includes an inline "Ask Eve" button that pre-fills the prompt)
   - Code blocks with syntax highlighting and a copy button.
   - Tables with zebra rows.
5. **Key terms** chips linking to `/glossary#id`.
6. **Check your understanding:** MC questions as cards; pick an option → immediate correct/incorrect state, the explanation for the chosen option, and a "Show all explanations" toggle. Score shown at the end.
7. **Apply it:** short-answer and free-response text areas. "Grade with Eve" → loading state → feedback card: score ring (0–100), pass/fail, strengths, improvements, a "Show model answer" toggle, and "Ask Eve about this feedback" button. Previous attempts listed.
8. **Homework** (L5, L9): same as free response but larger, with the deliverables checklist.
9. **Instructor notes** (collapsed by default): for the teacher.
10. **Mark lesson complete** button + prev/next links.

## 4. Highlight-to-ask flow

1. Student selects text anywhere in the article (mouse or touch).
2. A small floating pill appears just above the selection: **"Ask Eve ✨"**.
3. Click → the drawer opens with the selection quoted in a chip and four quick actions:
   - Explain this simply
   - Give me another example
   - Why does this matter?
   - Quiz me on this
   plus a free-text box.
4. The question is sent to Eve's eve agent with the quoted passage as a markdown quote and the page context (course, lesson, tutor notes) attached to the turn. Eve reads the lesson with her `get_lesson` tool if she has not already, and streams her answer. The quote chip stays attached to that message.
5. Escape or clicking elsewhere hides the pill. Selections inside the quiz area also work (students can ask about a question, and Eve is instructed to guide rather than reveal answers).

## 5. Eve drawer

- Header: avatar, "Eve · your tutor", context chip ("Reading: L4 · Finding failures"), clear-chat button.
- Empty state: three suggested prompts for the current page.
- Messages: student (right, muted), Eve (left, markdown rendered, code highlighted).
- Streaming indicator; "Stop" button while streaming.
- Input: textarea, Enter to send, Shift+Enter for newline.
- If the eve agent service is not reachable: a friendly banner explaining how it runs (locally with `npm run dev`, on Vercel as part of the project) and that replies need AI Gateway credentials; the input is disabled. If the service is up but a reply fails (for example, no gateway credentials), the error shows inline with a "Start a new chat" button.
- Each lesson (and each course page) has its own durable eve session. Only the session id is kept in `sessionStorage` (cleared when the tab closes), so the conversation resumes after navigation or a reload; the transcript lives with the session on the eve service, never in the platform database. Tool calls ("Reading the lesson") show as small chips inside Eve's reply.

## 6. Design tokens

- Fonts: Geist Sans for text, Geist Mono for code (already wired by the scaffold).
- Light: background `#faf9f6`, surface `#ffffff`, ink `#1a1a1a`, muted `#6b6b6b`, border `#e6e3dc`, accent (leaf) `#2f7d5b`, accent-soft `#e6f2ec`.
- Dark: background `#111311`, surface `#191c19`, ink `#ececec`, muted `#a0a59f`, border `#2a2e2a`, accent `#5fb88a`, accent-soft `#173126`.
- Callout colors: example blue, key green, beginner violet, warning amber, tip teal, try pink; each defined in both themes.
- Radius 12px on cards, 999px on pills. Shadows are subtle.
- Motion: drawer 200ms ease; pill fade 120ms.

## 7. States the UI must handle

| State | What the user sees |
|---|---|
| eve service unreachable | Eve panel shows the setup banner and its input is disabled; everything else works |
| No AI Gateway credentials | Eve replies fail with an inline error; grading buttons show "Grading needs AI Gateway credentials" tooltip and are disabled; everything else works |
| No `DATABASE_URL` | Progress saves to this browser only; a small note on the progress page says so |
| API error / rate limit | Inline error with retry button; nothing lost |
| Streaming interrupted | Partial answer stays, with a "Continue" button |
| Small screens | Sidebar becomes a sheet; drawer becomes full-screen; highlight pill still works with touch |

## 8. Accessibility

- All interactive elements are keyboard reachable; the pill and drawer trap focus sensibly and close on Escape.
- Color is never the only signal (icons and labels accompany status dots and callouts).
- Callouts use `role="note"` with an accessible label.
- Contrast meets WCAG AA in both themes.

# Author brief — writing lessons, quizzes, and instructor notes

You are writing original content for a course on the **Spec-Driven Development** platform, a beginner-friendly learning site with an AI tutor named Eve. Every course lives in `content/courses/<course-slug>/`. Before writing, read the course's plan under `docs/courses/<course-slug>/` (for the first course: `COURSE_PLAN.md`, sections 3, 5, 6, 7 are essential, and `GLOSSARY_TERMS.md` lists the only allowed glossary ids). The course's `course.json` defines the module order and the lesson slugs.

## Files you produce per lesson

| File | What |
|---|---|
| `content/courses/<course>/lessons/<slug>.md` | The lesson body with YAML frontmatter |
| `content/courses/<course>/quizzes/<slug>.json` | The quiz (multiple choice + short + free, plus homework where the plan says so) |
| `content/courses/<course>/notes/<slug>.md` | Instructor notes (no frontmatter) |

Slugs for the first course (`ai-agent-evals`), exact:

```
l0-foundations-for-beginners
l1-building-agents-foundations
l2-designing-for-evaluability
l3-synthetic-data-and-scenarios
l4-finding-failures
l5-measuring-with-evaluators
l6-ci-cd-for-agents
l7-safety-and-adversarial-evaluation
l8-improving-accuracy
l9-improving-cost
b1-evals-interview-prep
```

## Lesson markdown rules

1. **Frontmatter** exactly these fields (YAML):

```yaml
---
slug: l1-building-agents-foundations
number: "L1"
title: "Building Agents: Foundations"
module: 1
moduleTitle: "Building Agents"
verb: Analyze            # Analyze | Measure | Improve | Bonus
minutes: 60
prereqs: ["l0-foundations-for-beginners"]
summary: "One sentence a student sees in the sidebar and on the course page."
objectives:
  - "You can … (3–5 items, each starts with a verb)"
keyTerms: ["spec", "tool-contract"]   # ids from docs/GLOSSARY_TERMS.md only
---
```

Module numbers and titles come from the course's `course.json` (for the first course: 0 "Start Here", 1 "Building Agents", 2 "Error Analysis", 3 "CI/CD", 4 "Security, Safety, and Governance", 5 "Improving Agents", 6 "Bonus"). The `verb` must be one of the course's `verbs` names, or `Bonus`.

2. **Body structure.** Do not repeat the title as an H1. Do not write a "What you'll learn" section (the app renders objectives from frontmatter). Do not write a "Key terms" section (the app renders `keyTerms`). Do not put quiz questions in the markdown.

```
## Why this matters
(one short story from Pip's Plant Shop, 80–150 words)

## 1. First section title
…
## 2. Second section title
…
## Summary
- five bullets
```

Number the content sections (`## 1.`, `## 2.` …) following the section list in the course plan for your lesson. Use `###` for subsections.

3. **Length.** 2,000–3,200 words per lesson (L0: 1,800–2,500; B1: 1,500–2,200). Long enough to teach, short enough to finish in one sitting.

4. **Examples are mandatory.** At least six `:::example` callouts per lesson. Every concept gets a concrete example within a few lines of being introduced. Prefer tiny numbers (10 traces, not 10,000) unless scale is the point. Use the Pip's Plant Shop world, tools, tiers, and characters from the course plan §3 exactly as named.

5. **Callouts** (directive containers; blank line before and after; the closing `:::` on its own line):

```
:::example Sprout looks up an order
Markdown inside, including code blocks, lists, and tables.
:::

:::key
The one sentence to remember.
:::

:::beginner Plain-English detour
Explain a word a beginner may not know.
:::

:::warning Common mistake
What people get wrong and why it hurts.
:::

:::tip
A practical shortcut.
:::

:::try Ask Eve
Highlight the paragraph above and ask Eve to "explain this with a pizza-shop example."
:::
```

Use `key` 2–4 times per lesson, `beginner` 2–4 times, `warning` 2–3 times, `tip` 1–3 times, `try` 2–3 times. Titles are optional for `key` and `tip`.

6. **Code.** TypeScript for agent code, YAML for configs and scenarios, JSON for traces, `bash` for shell. Under 40 lines each. Use fenced blocks with a language tag. The Anthropic SDK agent loop, when you need one, is this (correct and verified; copy its shape, do not invent SDK methods):

```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

const tools: Anthropic.Tool[] = [
  {
    name: "lookup_order",
    description: "Look up one order by its id.",
    input_schema: {
      type: "object",
      properties: { order_id: { type: "string" } },
      required: ["order_id"],
    },
  },
];

const messages: Anthropic.MessageParam[] = [
  { role: "user", content: "Where is order #1042?" },
];

while (true) {
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    tools,
    messages,
  });
  messages.push({ role: "assistant", content: response.content });
  if (response.stop_reason !== "tool_use") break;

  const results: Anthropic.ToolResultBlockParam[] = [];
  for (const block of response.content) {
    if (block.type === "tool_use") {
      const output = await runTool(block.name, block.input); // YOUR code runs the tool
      results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(output) });
    }
  }
  messages.push({ role: "user", content: results });
}
```

Other frameworks may be *mentioned* (OpenAI Agents SDK, Claude Agent SDK, Langfuse SDK, promptfoo) but keep their code sketches short and clearly labeled as sketches.

7. **Voice.** Second person, short sentences, one idea per paragraph. Define a term the first time it appears. Never write "simply," "just," or "obviously." No em-dashes; use commas or periods. Tables for comparisons. Headings are sentence case.

8. **Originality.** Everything you write is original. Do not reproduce or paraphrase text from any existing course page; the course plan is your only source. Do not mention Maven, or the instructors of any other course.

## Quiz JSON rules

`content/quizzes/<slug>.json`, valid JSON, this shape:

```json
{
  "lessonSlug": "l1-building-agents-foundations",
  "questions": [
    {
      "id": "l1-q1",
      "type": "mc",
      "prompt": "Question text?",
      "options": [
        { "id": "a", "text": "…" },
        { "id": "b", "text": "…" },
        { "id": "c", "text": "…" },
        { "id": "d", "text": "…" }
      ],
      "answer": "b",
      "explanations": { "a": "Why a is wrong.", "b": "Why b is right.", "c": "…", "d": "…" }
    },
    {
      "id": "l1-q6",
      "type": "short",
      "prompt": "…",
      "rubric": ["Criterion 1 (binary, checkable)", "Criterion 2", "Criterion 3"],
      "modelAnswer": "A strong 60–120 word answer.",
      "maxWords": 150
    },
    {
      "id": "l1-q7",
      "type": "free",
      "prompt": "…",
      "rubric": ["…", "…", "…", "…"],
      "modelAnswer": "A strong 150–300 word answer, may include a code or YAML block."
    }
  ],
  "homework": {
    "id": "l5-hw1",
    "title": "Homework 1 — …",
    "prompt": "Full assignment text in markdown.",
    "deliverables": ["…", "…"],
    "rubric": ["…", "…", "…", "…", "…"]
  }
}
```

- 5–6 `mc` questions (3–4 options each; exactly one correct; every option has an explanation; explanations for wrong options teach, not scold).
- Exactly 1 `short` and 1 `free` question per lesson.
- `homework` only for `l5-measuring-with-evaluators` (HW1) and `l9-improving-cost` (HW2); omit the key otherwise.
- Rubric items are binary criteria a grader can check ("Names at least one precondition"), 3–6 per question.
- Question ids: `<lessonPrefix>-q<n>` with prefix `l0`…`l9`, `b1`.
- Validate with `npm run validate`, which checks every course.

## Instructor notes rules

`content/notes/<slug>.md`, 250–450 words, no frontmatter, these headings:

```
## Talking points
## Live demo idea
## Common misconceptions
## Timing
## If you only have 20 minutes
```

## Definition of done

- Files exist at the exact paths; frontmatter parses; JSON validates.
- Every `keyTerms` id exists in the course's `glossary.json`.
- Every section in the course plan for your lesson is covered, in order.
- Six or more `:::example` callouts; all callouts closed with `:::` on its own line.
- Word count within range (check with `wc -w`).

/**
 * Content loader. SERVER ONLY (reads the filesystem).
 * Lessons:  content/lessons/<slug>.md   (markdown + YAML frontmatter)
 * Quizzes:  content/quizzes/<slug>.json
 * Notes:    content/notes/<slug>.md     (instructor notes)
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { LESSON_ORDER, SHORT_TITLES, moduleForLesson } from "./course";
import type {
  GradedQuestion,
  Homework,
  McQuestion,
  PublicQuiz,
  Quiz,
} from "./quiz-types";

const CONTENT_DIR = path.join(process.cwd(), "content");

const FrontmatterSchema = z.object({
  slug: z.string(),
  number: z.string(),
  title: z.string(),
  module: z.number(),
  moduleTitle: z.string(),
  verb: z.enum(["Analyze", "Measure", "Improve", "Bonus"]),
  minutes: z.number(),
  prereqs: z.array(z.string()).default([]),
  summary: z.string(),
  objectives: z.array(z.string()).default([]),
  keyTerms: z.array(z.string()).default([]),
});

export type LessonMeta = z.infer<typeof FrontmatterSchema> & {
  shortTitle: string;
  available: boolean; // false when the markdown file is missing
};

export interface Lesson extends LessonMeta {
  body: string;
  wordCount: number;
}

function lessonPath(slug: string) {
  return path.join(CONTENT_DIR, "lessons", `${slug}.md`);
}

function placeholderMeta(slug: string): LessonMeta {
  const mod = moduleForLesson(slug);
  return {
    slug,
    number: slug.slice(0, 2).toUpperCase(),
    title: SHORT_TITLES[slug] ?? slug,
    module: mod?.id ?? 0,
    moduleTitle: mod?.title ?? "",
    verb: "Analyze",
    minutes: 0,
    prereqs: [],
    summary: "This lesson is being written.",
    objectives: [],
    keyTerms: [],
    shortTitle: SHORT_TITLES[slug] ?? slug,
    available: false,
  };
}

export function getLesson(slug: string): Lesson | null {
  const file = lessonPath(slug);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const parsed = matter(raw);
  const fm = FrontmatterSchema.parse({ ...parsed.data, slug });
  const body = parsed.content.trim();
  return {
    ...fm,
    shortTitle: SHORT_TITLES[slug] ?? fm.title,
    available: true,
    body,
    wordCount: body.split(/\s+/).filter(Boolean).length,
  };
}

export function getLessonMeta(slug: string): LessonMeta {
  const lesson = getLesson(slug);
  if (!lesson) return placeholderMeta(slug);
  const meta: LessonMeta & { body?: string; wordCount?: number } = { ...lesson };
  delete meta.body;
  delete meta.wordCount;
  return meta;
}

export function getAllLessonMeta(): LessonMeta[] {
  return LESSON_ORDER.map(getLessonMeta);
}

/* ---------- Quizzes ---------- */

const McSchema = z.object({
  id: z.string(),
  type: z.literal("mc"),
  prompt: z.string(),
  options: z.array(z.object({ id: z.string(), text: z.string() })).min(2),
  answer: z.string(),
  explanations: z.record(z.string(), z.string()),
});
const GradedSchema = z.object({
  id: z.string(),
  type: z.enum(["short", "free"]),
  prompt: z.string(),
  rubric: z.array(z.string()).min(1),
  modelAnswer: z.string(),
  maxWords: z.number().optional(),
});
const HomeworkSchema = z.object({
  id: z.string(),
  title: z.string(),
  prompt: z.string(),
  deliverables: z.array(z.string()).default([]),
  rubric: z.array(z.string()).min(1),
});
const QuizSchema = z.object({
  lessonSlug: z.string(),
  questions: z.array(z.union([McSchema, GradedSchema])),
  homework: HomeworkSchema.optional(),
});

export function getQuiz(slug: string): Quiz | null {
  const file = path.join(CONTENT_DIR, "quizzes", `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  const parsed = QuizSchema.safeParse(JSON.parse(fs.readFileSync(file, "utf8")));
  if (!parsed.success) {
    console.error(`Quiz ${slug} failed validation:`, parsed.error.issues);
    return null;
  }
  return parsed.data as Quiz;
}

export function toPublicQuiz(quiz: Quiz): PublicQuiz {
  return {
    lessonSlug: quiz.lessonSlug,
    questions: quiz.questions.map((q) =>
      q.type === "mc"
        ? q
        : { id: q.id, type: q.type, prompt: q.prompt, maxWords: q.maxWords, rubricCount: q.rubric.length },
    ),
    homework: quiz.homework
      ? {
          id: quiz.homework.id,
          title: quiz.homework.title,
          prompt: quiz.homework.prompt,
          deliverables: quiz.homework.deliverables,
          rubricCount: quiz.homework.rubric.length,
        }
      : undefined,
  };
}

export type GradableItem =
  | { kind: "short" | "free"; item: GradedQuestion }
  | { kind: "homework"; item: Homework };

/** Find a gradable question (never MC) by id, on the server, so rubrics stay private. */
export function findGradable(slug: string, questionId: string): GradableItem | null {
  const quiz = getQuiz(slug);
  if (!quiz) return null;
  for (const q of quiz.questions) {
    if (q.id === questionId && q.type !== "mc") return { kind: q.type, item: q as GradedQuestion };
  }
  if (quiz.homework && quiz.homework.id === questionId) return { kind: "homework", item: quiz.homework };
  return null;
}

export function findMc(slug: string, questionId: string): McQuestion | null {
  const quiz = getQuiz(slug);
  const q = quiz?.questions.find((x) => x.id === questionId);
  return q && q.type === "mc" ? q : null;
}

/* ---------- Instructor notes ---------- */

export function getNotes(slug: string): string | null {
  const file = path.join(CONTENT_DIR, "notes", `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8").trim();
}

/** How many questions the quiz for a lesson has (for progress math). */
export function quizQuestionCount(slug: string): number {
  const quiz = getQuiz(slug);
  if (!quiz) return 0;
  return quiz.questions.length + (quiz.homework ? 1 : 0);
}

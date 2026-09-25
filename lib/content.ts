/**
 * Lesson, quiz, and notes loader. SERVER ONLY (reads the filesystem).
 *   content/courses/<course>/lessons/<slug>.md    markdown + YAML frontmatter
 *   content/courses/<course>/quizzes/<slug>.json
 *   content/courses/<course>/notes/<slug>.md      instructor notes (optional)
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { courseDir, getCourse, moduleForLesson, shortTitle } from "./courses";
import type { GradedQuestion, Homework, McQuestion, PublicQuiz, Quiz } from "./quiz-types";

const FrontmatterSchema = z.object({
  slug: z.string(),
  number: z.string(),
  title: z.string(),
  module: z.number(),
  moduleTitle: z.string(),
  verb: z.string(),
  minutes: z.number(),
  prereqs: z.array(z.string()).default([]),
  summary: z.string(),
  objectives: z.array(z.string()).default([]),
  keyTerms: z.array(z.string()).default([]),
});

export type LessonMeta = z.infer<typeof FrontmatterSchema> & {
  courseSlug: string;
  shortTitle: string;
  available: boolean; // false when the markdown file is missing
};

export interface Lesson extends LessonMeta {
  body: string;
  wordCount: number;
}

function placeholderMeta(courseSlug: string, slug: string): LessonMeta {
  const course = getCourse(courseSlug);
  const mod = course ? moduleForLesson(course, slug) : undefined;
  const short = course ? shortTitle(course, slug) : slug;
  return {
    courseSlug,
    slug,
    number: slug.slice(0, 2).toUpperCase(),
    title: short,
    module: mod?.id ?? 0,
    moduleTitle: mod?.title ?? "",
    verb: "",
    minutes: 0,
    prereqs: [],
    summary: "This lesson is being written.",
    objectives: [],
    keyTerms: [],
    shortTitle: short,
    available: false,
  };
}

export function getLesson(courseSlug: string, slug: string): Lesson | null {
  const file = path.join(courseDir(courseSlug), "lessons", `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const parsed = matter(fs.readFileSync(file, "utf8"));
  const fm = FrontmatterSchema.parse({ ...parsed.data, slug });
  const body = parsed.content.trim();
  const course = getCourse(courseSlug);
  return {
    ...fm,
    courseSlug,
    shortTitle: course ? shortTitle(course, slug) : fm.title,
    available: true,
    body,
    wordCount: body.split(/\s+/).filter(Boolean).length,
  };
}

export function getLessonMeta(courseSlug: string, slug: string): LessonMeta {
  const lesson = getLesson(courseSlug, slug);
  if (!lesson) return placeholderMeta(courseSlug, slug);
  const meta: LessonMeta & { body?: string; wordCount?: number } = { ...lesson };
  delete meta.body;
  delete meta.wordCount;
  return meta;
}

export function getAllLessonMeta(courseSlug: string): LessonMeta[] {
  const course = getCourse(courseSlug);
  if (!course) return [];
  return course.lessonOrder.map((slug) => getLessonMeta(courseSlug, slug));
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

export function getQuiz(courseSlug: string, slug: string): Quiz | null {
  const file = path.join(courseDir(courseSlug), "quizzes", `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  const parsed = QuizSchema.safeParse(JSON.parse(fs.readFileSync(file, "utf8")));
  if (!parsed.success) {
    console.error(`Quiz ${courseSlug}/${slug} failed validation:`, parsed.error.issues);
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

/** Find a gradable question (never MC) on the server, so rubrics stay private. */
export function findGradable(courseSlug: string, lessonSlug: string, questionId: string): GradableItem | null {
  const quiz = getQuiz(courseSlug, lessonSlug);
  if (!quiz) return null;
  for (const q of quiz.questions) {
    if (q.id === questionId && q.type !== "mc") return { kind: q.type, item: q as GradedQuestion };
  }
  if (quiz.homework && quiz.homework.id === questionId) return { kind: "homework", item: quiz.homework };
  return null;
}

export function findMc(courseSlug: string, lessonSlug: string, questionId: string): McQuestion | null {
  const quiz = getQuiz(courseSlug, lessonSlug);
  const q = quiz?.questions.find((x) => x.id === questionId);
  return q && q.type === "mc" ? q : null;
}

/* ---------- Instructor notes ---------- */

export function getNotes(courseSlug: string, slug: string): string | null {
  const file = path.join(courseDir(courseSlug), "notes", `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8").trim();
}

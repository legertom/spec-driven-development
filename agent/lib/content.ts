/**
 * Read-only access to the bundled course content. The eve agent runs as its own
 * service, so it cannot read content/courses/ from disk; scripts/bundle-content.mjs
 * writes content.generated.ts (run automatically before `npm run dev` and `npm run build`).
 */
import bundle from "./content.generated";

export interface BundledLesson {
  slug: string;
  number: string;
  title: string;
  module: number;
  moduleTitle: string;
  verb: string;
  minutes: number;
  summary: string;
  objectives: string[];
  keyTerms: string[];
  body: string;
}

export interface BundledQuizQuestion {
  id: string;
  type: "mc" | "short" | "free";
  prompt: string;
  options?: { id: string; text: string }[];
  maxWords?: number;
}

export interface BundledQuiz {
  lessonSlug: string;
  questions: BundledQuizQuestion[];
  homework?: { id: string; title: string; prompt: string; deliverables: string[] };
}

export interface BundledGlossaryEntry {
  id: string;
  term: string;
  definition: string;
  example: string;
  lessons: string[];
  related: string[];
}

export interface BundledCourse {
  slug: string;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  level: string;
  audience: string;
  status: string;
  order: number;
  verbs: { name: string; question: string; lessons: string }[];
  pipeline: { step: string; verb: string; note: string }[];
  modules: { id: number; title: string; blurb: string; lessons: string[] }[];
  shortTitles: Record<string, string>;
  runningExample?: { title: string; summary: string; tools: { name: string; does: string; tier: string }[] };
  tutorNotes: string;
  credits: string;
  lessonOrder: string[];
  lessons: BundledLesson[];
  quizzes: BundledQuiz[];
  glossary: BundledGlossaryEntry[];
}

const COURSES = (bundle as { courses: BundledCourse[] }).courses;

export function listCourses(): BundledCourse[] {
  return COURSES;
}

export function findCourse(slug: string): BundledCourse | undefined {
  return COURSES.find((c) => c.slug === slug);
}

export function findLesson(courseSlug: string, lessonSlug: string): BundledLesson | undefined {
  return findCourse(courseSlug)?.lessons.find((l) => l.slug === lessonSlug);
}

/** Split a lesson body into its numbered `## n.` sections (plus "Why this matters" and "Summary"). */
export function lessonSections(body: string): { heading: string; text: string }[] {
  const parts = body.split(/^(?=## )/m);
  return parts
    .map((p) => {
      const nl = p.indexOf("\n");
      const heading = (nl === -1 ? p : p.slice(0, nl)).replace(/^##\s*/, "").trim();
      return { heading, text: p.trim() };
    })
    .filter((s) => s.text.length > 0);
}

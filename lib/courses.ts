/**
 * Course registry. SERVER ONLY (reads the filesystem).
 * Every folder in content/courses/ that contains a course.json is a course.
 * Folders starting with "_" are ignored (the template lives there).
 * Adding a course = adding a folder. Nothing to register.
 */
import fs from "node:fs";
import path from "node:path";
import { CourseSchema, GlossaryEntrySchema, type Course, type GlossaryEntry, type ModuleDef } from "./course-types";

export const COURSES_DIR = path.join(process.cwd(), "content", "courses");

let cache: Course[] | null = null;

export function courseDir(slug: string): string {
  return path.join(COURSES_DIR, slug);
}

function loadCourse(slug: string): Course | null {
  const file = path.join(courseDir(slug), "course.json");
  if (!fs.existsSync(file)) return null;
  const parsed = CourseSchema.safeParse(JSON.parse(fs.readFileSync(file, "utf8")));
  if (!parsed.success) {
    console.error(`course.json for "${slug}" failed validation:`, parsed.error.issues);
    return null;
  }
  const def = parsed.data;
  if (def.slug !== slug) console.warn(`course.json slug "${def.slug}" does not match folder "${slug}"; using the folder name`);
  const lessonOrder = def.modules.flatMap((m) => m.lessons);
  return { ...def, slug, shortTitle: def.shortTitle ?? def.title, lessonOrder, lessonCount: lessonOrder.length };
}

export function getCourses(): Course[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  if (!fs.existsSync(COURSES_DIR)) return [];
  const courses = fs
    .readdirSync(COURSES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
    .map((d) => loadCourse(d.name))
    .filter((c): c is Course => c !== null)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  cache = courses;
  return courses;
}

export function getCourse(slug: string): Course | null {
  return getCourses().find((c) => c.slug === slug) ?? null;
}

export function isLessonSlug(course: Course, slug: string): boolean {
  return course.lessonOrder.includes(slug);
}

export function moduleForLesson(course: Course, slug: string): ModuleDef | undefined {
  return course.modules.find((m) => m.lessons.includes(slug));
}

export function neighbors(course: Course, slug: string): { prev?: string; next?: string } {
  const i = course.lessonOrder.indexOf(slug);
  if (i === -1) return {};
  return {
    prev: i > 0 ? course.lessonOrder[i - 1] : undefined,
    next: i < course.lessonOrder.length - 1 ? course.lessonOrder[i + 1] : undefined,
  };
}

export function shortTitle(course: Course, slug: string): string {
  return course.shortTitles[slug] ?? slug;
}

const glossaryCache = new Map<string, GlossaryEntry[]>();

export function getGlossary(courseSlug: string): GlossaryEntry[] {
  if (process.env.NODE_ENV === "production" && glossaryCache.has(courseSlug)) return glossaryCache.get(courseSlug)!;
  const file = path.join(courseDir(courseSlug), "glossary.json");
  if (!fs.existsSync(file)) return [];
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const entries: GlossaryEntry[] = [];
  for (const item of Array.isArray(raw) ? raw : []) {
    const parsed = GlossaryEntrySchema.safeParse(item);
    if (parsed.success) entries.push(parsed.data);
    else console.error(`glossary entry in "${courseSlug}" failed validation:`, parsed.error.issues);
  }
  entries.sort((a, b) => a.term.localeCompare(b.term));
  glossaryCache.set(courseSlug, entries);
  return entries;
}

/** Colors for a course's verbs, by position. "Bonus" and unknown verbs are muted. */
const VERB_PALETTE = ["var(--co-example)", "var(--co-warning)", "var(--co-key)", "var(--co-beginner)", "var(--co-tip)", "var(--co-try)"];
export function verbColor(course: Course, verb: string): string {
  const i = course.verbs.findIndex((v) => v.name === verb);
  return i === -1 ? "var(--muted)" : VERB_PALETTE[i % VERB_PALETTE.length];
}

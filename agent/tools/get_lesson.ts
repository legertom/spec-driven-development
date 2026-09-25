import { defineTool } from "eve/tools";
import { z } from "zod";
import { findCourse, findLesson, lessonSections } from "../lib/content";

export default defineTool({
  description:
    "Read a lesson: its objectives and full markdown text (callouts appear as :::type[title] ... :::). Call this before answering questions about a lesson you have not read in this conversation. Pass `section` (a 1-based number, or 'summary') to read only that numbered section.",
  inputSchema: z.object({
    courseSlug: z.string().describe("Course slug from the client context"),
    lessonSlug: z.string().describe("Lesson slug from the client context, e.g. l1-building-agents-foundations"),
    section: z.union([z.number().int().min(1), z.literal("summary")]).optional().describe("Read one numbered section instead of the whole lesson"),
  }),
  label: {
    start: ({ lessonSlug, section }) => `Reading ${lessonSlug}${section ? ` (section ${section})` : ""}`,
  },
  execute({ courseSlug, lessonSlug, section }) {
    const course = findCourse(courseSlug);
    const lesson = findLesson(courseSlug, lessonSlug);
    if (!course || !lesson) {
      return { error: "unknown_lesson", availableLessons: course?.lessonOrder ?? [] };
    }
    const meta = {
      number: lesson.number,
      title: lesson.title,
      module: `${lesson.module} · ${lesson.moduleTitle}`,
      phase: lesson.verb,
      minutes: lesson.minutes,
      summary: lesson.summary,
      objectives: lesson.objectives,
      keyTerms: lesson.keyTerms,
    };
    if (section !== undefined) {
      const sections = lessonSections(lesson.body);
      const match =
        section === "summary"
          ? sections.find((s) => /^summary/i.test(s.heading))
          : sections.find((s) => s.heading.startsWith(`${section}.`));
      return match
        ? { ...meta, section: match.heading, text: match.text, sections: sections.map((s) => s.heading) }
        : { ...meta, error: "unknown_section", sections: sections.map((s) => s.heading) };
    }
    return { ...meta, text: lesson.body };
  },
});

import { defineTool } from "eve/tools";
import { z } from "zod";
import { findCourse, listCourses } from "../lib/content";

export default defineTool({
  description: "Search a course's glossary. Returns up to five matching terms with plain-English definitions, an example, the lessons they appear in, and related terms.",
  inputSchema: z.object({
    query: z.string().min(1).describe("A term or a few words, e.g. 'pass^k' or 'true positive rate'"),
    courseSlug: z.string().optional().describe("Course slug from the client context; omit to search every course"),
  }),
  label: { start: ({ query }) => `Looking up "${query}"` },
  execute({ query, courseSlug }) {
    const q = query.trim().toLowerCase();
    const courses = courseSlug ? [findCourse(courseSlug)].filter((c): c is NonNullable<typeof c> => Boolean(c)) : listCourses();
    const hits: { courseSlug: string; id: string; term: string; definition: string; example: string; lessons: string[]; related: string[]; score: number }[] = [];
    for (const c of courses) {
      for (const g of c.glossary) {
        const term = g.term.toLowerCase();
        let score = 0;
        if (term === q || g.id === q) score = 3;
        else if (term.includes(q) || g.id.includes(q.replace(/\s+/g, "-"))) score = 2;
        else if (g.definition.toLowerCase().includes(q)) score = 1;
        if (score) hits.push({ courseSlug: c.slug, id: g.id, term: g.term, definition: g.definition, example: g.example, lessons: g.lessons, related: g.related, score });
      }
    }
    hits.sort((a, b) => b.score - a.score || a.term.localeCompare(b.term));
    return {
      matches: hits.slice(0, 5).map((h) => ({ courseSlug: h.courseSlug, id: h.id, term: h.term, definition: h.definition, example: h.example, lessons: h.lessons, related: h.related })),
    };
  },
});

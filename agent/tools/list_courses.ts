import { defineTool } from "eve/tools";
import { z } from "zod";
import { listCourses } from "../lib/content";

export default defineTool({
  description: "List the courses on the platform with their tagline, level, status, and module map. Use on the catalog or progress pages, or when the learner asks what else they could take.",
  inputSchema: z.object({}),
  label: { start: () => "Looking up the course catalog" },
  execute() {
    return listCourses().map((c) => ({
      slug: c.slug,
      title: c.title,
      tagline: c.tagline,
      level: c.level,
      status: c.status,
      lessonCount: c.lessonOrder.length,
      modules: c.modules.map((m) => ({
        id: m.id,
        title: m.title,
        lessons: m.lessons.map((s) => ({ slug: s, title: c.shortTitles[s] ?? s })),
      })),
    }));
  },
});

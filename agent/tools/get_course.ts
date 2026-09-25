import { defineTool } from "eve/tools";
import { z } from "zod";
import { findCourse } from "../lib/content";

export default defineTool({
  description: "Get one course's description, audience, phases, module map with lesson titles and summaries, running example, teaching notes, and credits. Use for course-wide questions.",
  inputSchema: z.object({ courseSlug: z.string().describe("The course slug from the client context, e.g. ai-agent-evals") }),
  label: { start: ({ courseSlug }) => `Reading the course overview for ${courseSlug}` },
  execute({ courseSlug }) {
    const c = findCourse(courseSlug);
    if (!c) return { error: "unknown_course", known: [] as string[] };
    return {
      slug: c.slug,
      title: c.title,
      tagline: c.tagline,
      description: c.description,
      level: c.level,
      audience: c.audience,
      phases: c.verbs,
      whatYouBuild: c.pipeline,
      modules: c.modules.map((m) => ({
        id: m.id,
        title: m.title,
        blurb: m.blurb,
        lessons: m.lessons.map((s) => {
          const l = c.lessons.find((x) => x.slug === s);
          return { slug: s, number: l?.number, title: l?.title ?? c.shortTitles[s] ?? s, minutes: l?.minutes, summary: l?.summary };
        }),
      })),
      runningExample: c.runningExample,
      teachingNotes: c.tutorNotes,
      credits: c.credits,
    };
  },
});

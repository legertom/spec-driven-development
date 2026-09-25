/** Shapes of course.json and glossary.json. Shared by the server loader and the validator. */
import { z } from "zod";

export const GlossaryEntrySchema = z.object({
  id: z.string(),
  term: z.string(),
  definition: z.string(),
  example: z.string().default(""),
  lessons: z.array(z.string()).default([]),
  related: z.array(z.string()).default([]),
});
export type GlossaryEntry = z.infer<typeof GlossaryEntrySchema>;

export const ModuleSchema = z.object({
  id: z.number(),
  title: z.string(),
  blurb: z.string().default(""),
  lessons: z.array(z.string()).min(1),
});
export type ModuleDef = z.infer<typeof ModuleSchema>;

export const VerbSchema = z.object({
  name: z.string(),
  question: z.string().default(""),
  lessons: z.string().default(""),
});

export const PipelineStepSchema = z.object({
  step: z.string(),
  verb: z.string().default(""),
  note: z.string().default(""),
});

export const ToolSchema = z.object({
  name: z.string(),
  does: z.string(),
  tier: z.string().default(""),
});

export const CourseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  shortTitle: z.string().optional(),
  tagline: z.string().default(""),
  description: z.string().default(""),
  level: z.string().default("Beginner"),
  audience: z.string().default(""),
  status: z.enum(["available", "coming-soon"]).default("available"),
  order: z.number().default(0),
  verbs: z.array(VerbSchema).default([]),
  pipeline: z.array(PipelineStepSchema).default([]),
  modules: z.array(ModuleSchema).min(1),
  shortTitles: z.record(z.string(), z.string()).default({}),
  runningExample: z
    .object({ title: z.string(), summary: z.string().default(""), tools: z.array(ToolSchema).default([]) })
    .optional(),
  tutorNotes: z.string().default(""),
  credits: z.string().default(""),
});
export type CourseDef = z.infer<typeof CourseSchema>;

/** A loaded course: the definition plus derived fields. Serializable, so it can be passed to client components. */
export interface Course extends CourseDef {
  shortTitle: string;
  lessonOrder: string[];
  lessonCount: number;
}

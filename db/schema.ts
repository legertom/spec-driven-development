/** Drizzle schema for learner progress (Neon Postgres). Every record is scoped to a course. */
import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const learners = pgTable("learners", {
  id: text("id").primaryKey(), // anonymous UUID from the sdd_learner cookie
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: serial("id").primaryKey(),
    learnerId: text("learner_id").notNull().references(() => learners.id, { onDelete: "cascade" }),
    courseSlug: text("course_slug").notNull(),
    lessonSlug: text("lesson_slug").notNull(),
    status: text("status").notNull(), // 'in_progress' | 'completed'
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("lesson_progress_learner_course_lesson").on(t.learnerId, t.courseSlug, t.lessonSlug)],
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: serial("id").primaryKey(),
    learnerId: text("learner_id").notNull().references(() => learners.id, { onDelete: "cascade" }),
    courseSlug: text("course_slug").notNull(),
    lessonSlug: text("lesson_slug").notNull(),
    questionId: text("question_id").notNull(),
    kind: text("kind").notNull(), // 'mc' | 'short' | 'free' | 'homework'
    answer: text("answer").notNull(),
    score: integer("score").notNull(),
    passed: boolean("passed").notNull(),
    feedback: jsonb("feedback"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("quiz_attempts_learner_course").on(t.learnerId, t.courseSlug)],
);

/**
 * GET  /api/progress → { persisted, lessons, attempts }
 * POST /api/progress { type: "lesson" | "attempt" | "reset", ... } → { persisted }
 *
 * Identity is an anonymous httpOnly cookie. Without DATABASE_URL the route
 * answers { persisted: false } and the browser keeps progress in localStorage.
 */
import { and, desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { learners, lessonProgress, quizAttempts } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getOrCreateLearnerId } from "@/lib/learner";
import { lessonKey, type AttemptRecord, type LessonProgressRecord } from "@/lib/progress-types";

const LessonUpdate = z.object({
  type: z.literal("lesson"),
  courseSlug: z.string().max(100),
  lessonSlug: z.string().max(100),
  status: z.enum(["in_progress", "completed"]),
});
const AttemptUpdate = z.object({
  type: z.literal("attempt"),
  courseSlug: z.string().max(100),
  lessonSlug: z.string().max(100),
  questionId: z.string().max(100),
  kind: z.enum(["mc", "short", "free", "homework"]),
  answer: z.string().max(20_000),
  score: z.number().int().min(0).max(100),
  passed: z.boolean(),
  feedback: z.unknown().optional(),
  createdAt: z.string().optional(),
});
const Reset = z.object({ type: z.literal("reset") });
const Body = z.discriminatedUnion("type", [LessonUpdate, AttemptUpdate, Reset]);

export async function GET() {
  const db = getDb();
  const { id } = await getOrCreateLearnerId();
  if (!db) return Response.json({ persisted: false, lessons: {}, attempts: [] });

  const [lessonRows, attemptRows] = await Promise.all([
    db.select().from(lessonProgress).where(eq(lessonProgress.learnerId, id)),
    db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.learnerId, id))
      .orderBy(desc(quizAttempts.createdAt))
      .limit(500),
  ]);

  const lessons: Record<string, LessonProgressRecord> = {};
  for (const row of lessonRows) {
    lessons[lessonKey(row.courseSlug, row.lessonSlug)] = {
      courseSlug: row.courseSlug,
      lessonSlug: row.lessonSlug,
      status: row.status as LessonProgressRecord["status"],
      updatedAt: row.updatedAt.toISOString(),
    };
  }
  const attempts: AttemptRecord[] = attemptRows.map((row) => ({
    courseSlug: row.courseSlug,
    lessonSlug: row.lessonSlug,
    questionId: row.questionId,
    kind: row.kind as AttemptRecord["kind"],
    answer: row.answer,
    score: row.score,
    passed: row.passed,
    feedback: row.feedback,
    createdAt: row.createdAt.toISOString(),
  }));
  return Response.json({ persisted: true, lessons, attempts });
}

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "bad_request", message: "Invalid request body." }, { status: 400 });
  }
  const db = getDb();
  const { id } = await getOrCreateLearnerId();
  if (!db) return Response.json({ persisted: false });

  const body = parsed.data;
  try {
    await db.insert(learners).values({ id }).onConflictDoNothing();

    if (body.type === "lesson") {
      await db
        .insert(lessonProgress)
        .values({ learnerId: id, courseSlug: body.courseSlug, lessonSlug: body.lessonSlug, status: body.status, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: [lessonProgress.learnerId, lessonProgress.courseSlug, lessonProgress.lessonSlug],
          set: { status: body.status, updatedAt: new Date() },
        });
    } else if (body.type === "attempt") {
      await db.insert(quizAttempts).values({
        learnerId: id,
        courseSlug: body.courseSlug,
        lessonSlug: body.lessonSlug,
        questionId: body.questionId,
        kind: body.kind,
        answer: body.answer,
        score: body.score,
        passed: body.passed,
        feedback: body.feedback ?? null,
        createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      });
    } else if (body.type === "reset") {
      await db.delete(quizAttempts).where(eq(quizAttempts.learnerId, id));
      await db.delete(lessonProgress).where(and(eq(lessonProgress.learnerId, id)));
    }
    return Response.json({ persisted: true });
  } catch (err) {
    console.error("progress error:", err);
    return Response.json({ error: "db", message: "Could not save progress to the database." }, { status: 500 });
  }
}

import type { AttemptKind } from "./quiz-types";

export type LessonStatus = "in_progress" | "completed";

export interface LessonProgressRecord {
  lessonSlug: string;
  status: LessonStatus;
  updatedAt: string; // ISO
}

export interface AttemptRecord {
  lessonSlug: string;
  questionId: string;
  kind: AttemptKind;
  answer: string;
  score: number; // 0–100
  passed: boolean;
  feedback: unknown; // GradeResult for graded questions; { chosen, correct } for MC
  createdAt: string; // ISO
}

export interface ProgressSnapshot {
  lessons: Record<string, LessonProgressRecord>;
  attempts: AttemptRecord[];
}

export const EMPTY_PROGRESS: ProgressSnapshot = { lessons: {}, attempts: [] };

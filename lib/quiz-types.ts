/** Quiz content types. The JSON files in content/quizzes follow the full types;
 *  the client only ever receives the Public* variants (no rubric, no model answer). */

export interface McOption {
  id: string;
  text: string;
}

export interface McQuestion {
  id: string;
  type: "mc";
  prompt: string;
  options: McOption[];
  answer: string;
  explanations: Record<string, string>;
}

export interface GradedQuestion {
  id: string;
  type: "short" | "free";
  prompt: string;
  rubric: string[];
  modelAnswer: string;
  maxWords?: number;
}

export type QuizQuestion = McQuestion | GradedQuestion;

export interface Homework {
  id: string;
  title: string;
  prompt: string;
  deliverables: string[];
  rubric: string[];
}

export interface Quiz {
  lessonSlug: string;
  questions: QuizQuestion[];
  homework?: Homework;
}

/* ---- Client-safe shapes ---- */

export interface PublicGradedQuestion {
  id: string;
  type: "short" | "free";
  prompt: string;
  maxWords?: number;
  rubricCount: number;
}

export type PublicQuizQuestion = McQuestion | PublicGradedQuestion;

export interface PublicHomework {
  id: string;
  title: string;
  prompt: string;
  deliverables: string[];
  rubricCount: number;
}

export interface PublicQuiz {
  lessonSlug: string;
  questions: PublicQuizQuestion[];
  homework?: PublicHomework;
}

/* ---- Grading results ---- */

export interface RubricResult {
  criterion: string;
  met: boolean;
  note: string;
}

export interface GradeResult {
  questionId: string;
  score: number; // 0–100
  passed: boolean; // score >= 70
  feedback: string; // markdown, 2–5 sentences
  strengths: string[];
  improvements: string[];
  rubricResults: RubricResult[];
  modelAnswer: string;
}

export type AttemptKind = "mc" | "short" | "free" | "homework";

-- Run this in the Neon SQL editor (or `npm run db:push` with DATABASE_URL set).
CREATE TABLE IF NOT EXISTS learners (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id SERIAL PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  lesson_slug TEXT NOT NULL,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS lesson_progress_learner_course_lesson
  ON lesson_progress (learner_id, course_slug, lesson_slug);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  lesson_slug TEXT NOT NULL,
  question_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  answer TEXT NOT NULL,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quiz_attempts_learner_course ON quiz_attempts (learner_id, course_slug);

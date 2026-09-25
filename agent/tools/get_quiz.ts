import { defineTool } from "eve/tools";
import { z } from "zod";
import { findCourse } from "../lib/content";

export default defineTool({
  description:
    "Get a lesson's quiz questions and homework prompt WITHOUT answers, rubrics, or model answers (those are intentionally unavailable). Use it to quiz the learner or to give a hint on a specific question.",
  inputSchema: z.object({
    courseSlug: z.string(),
    lessonSlug: z.string(),
  }),
  label: { start: ({ lessonSlug }) => `Looking at the quiz for ${lessonSlug}` },
  execute({ courseSlug, lessonSlug }) {
    const course = findCourse(courseSlug);
    const quiz = course?.quizzes.find((q) => q.lessonSlug === lessonSlug);
    if (!course || !quiz) return { error: "unknown_quiz" };
    return {
      questions: quiz.questions,
      homework: quiz.homework,
      note: "Answers are not available to you. Guide the learner; never state which option is correct.",
    };
  },
});

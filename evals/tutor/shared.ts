/** Page context the browser attaches to every turn (see components/eve/EveChat.tsx). Not an eval itself. */
export const COURSE_CONTEXT = {
  courseSlug: "ai-agent-evals",
  courseTitle: "Building and Evaluating AI Agents",
};

export const L4_CONTEXT = {
  ...COURSE_CONTEXT,
  lessonSlug: "l4-finding-failures",
  lessonNumber: "L4",
  lessonTitle: "Error Analysis: Finding Failures",
  page: "/courses/ai-agent-evals/l4-finding-failures",
};

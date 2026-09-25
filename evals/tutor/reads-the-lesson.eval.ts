import { defineEval } from "eve/evals";
import { L4_CONTEXT } from "./shared";

/** Asked about the open lesson, Eve reads it with get_lesson before answering, and the answer matches the lesson. */
export default defineEval({
  description: "Eve reads the open lesson before explaining one of its ideas.",
  tags: ["tutor"],
  async test(t) {
    const turn = await t.send("What does this lesson mean by open coding? Two or three sentences.", { clientContext: L4_CONTEXT });
    t.succeeded();
    t.calledTool("get_lesson", { input: { courseSlug: "ai-agent-evals", lessonSlug: "l4-finding-failures" } });
    t.judge(
      "The reply explains open coding as reading whole traces one at a time and writing down, in plain language, the first failure seen, and it does not invent facts unrelated to error analysis.",
      { on: turn.message ?? "" },
    ).atLeast(0.7);
  },
});

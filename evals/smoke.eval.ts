import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";

/** The agent boots, accepts a turn, and answers. */
export default defineEval({
  description: "Eve answers a trivial message without calling tools.",
  tags: ["smoke"],
  async test(t) {
    const turn = await t.send("Reply with the single word: ready");
    t.succeeded();
    t.check((turn.message ?? "").toLowerCase(), includes("ready"));
    t.notCalledTool("get_lesson");
  },
});

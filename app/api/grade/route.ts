/**
 * POST /api/grade — grades one short / free / homework answer against its rubric.
 *
 * The rubric and model answer are looked up on the server (never trusted from the
 * client). The grader is an LLM judge with a strict JSON output: each rubric
 * criterion is met or not met (binary), and the score is computed in code.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { describeError, FALLBACKS_ENABLED, fallbackParams, getClient, MODEL } from "@/lib/anthropic";
import { findGradable } from "@/lib/content";
import { isLessonSlug } from "@/lib/course";
import { GRADER_SYSTEM, graderUserPrompt } from "@/lib/prompts";
import type { GradeResult } from "@/lib/quiz-types";

const Body = z.object({
  lessonSlug: z.string().max(100),
  questionId: z.string().max(100),
  answer: z.string().min(1).max(20_000),
});

const GradeSchema = z.object({
  rubricResults: z.array(
    z.object({
      criterion: z.string(),
      met: z.boolean(),
      note: z.string().describe("One sentence on why this criterion was met or not, addressed to the learner."),
    }),
  ),
  feedback: z.string().describe("2–5 sentences of feedback to the learner, in the second person."),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
});

export const PASS_THRESHOLD = 70;

export async function POST(req: NextRequest) {
  const client = getClient();
  if (!client) {
    return Response.json(
      { error: "no_api_key", message: "Grading needs an ANTHROPIC_API_KEY on the server." },
      { status: 503 },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "bad_request", message: "Invalid request body." }, { status: 400 });
  }
  const { lessonSlug, questionId, answer } = parsed.data;
  if (!isLessonSlug(lessonSlug)) {
    return Response.json({ error: "not_found", message: "Unknown lesson." }, { status: 404 });
  }
  const gradable = findGradable(lessonSlug, questionId);
  if (!gradable) {
    return Response.json({ error: "not_found", message: "Unknown question." }, { status: 404 });
  }

  // Not annotated on purpose: the parse helper infers the output type from `output_config.format`.
  const params = {
    model: MODEL,
    max_tokens: 4096,
    system: [{ type: "text" as const, text: GRADER_SYSTEM, cache_control: { type: "ephemeral" as const } }],
    messages: [{ role: "user" as const, content: graderUserPrompt(gradable, answer) }],
    output_config: { format: zodOutputFormat(GradeSchema), effort: "high" as const },
  };

  try {
    let response;
    try {
      response = await client.beta.messages.parse({ ...params, ...fallbackParams() });
    } catch (err) {
      if (FALLBACKS_ENABLED && err instanceof Anthropic.BadRequestError) {
        response = await client.beta.messages.parse(params);
      } else {
        throw err;
      }
    }

    if (response.stop_reason === "refusal") {
      return Response.json(
        { error: "refusal", message: "The grader declined to grade this answer. Try rephrasing it." },
        { status: 422 },
      );
    }
    const out = response.parsed_output;
    if (!out) {
      return Response.json({ error: "parse", message: "The grader returned an unreadable result. Try again." }, { status: 502 });
    }

    // Align results to the server-side rubric, in order; missing entries count as not met.
    const rubric = gradable.item.rubric;
    const rubricResults = rubric.map((criterion, i) => {
      const r = out.rubricResults[i];
      return { criterion, met: Boolean(r?.met), note: r?.note ?? "Not addressed." };
    });
    const met = rubricResults.filter((r) => r.met).length;
    const score = Math.round((met / rubric.length) * 100);

    const result: GradeResult = {
      questionId,
      score,
      passed: score >= PASS_THRESHOLD,
      feedback: out.feedback,
      strengths: out.strengths.slice(0, 3),
      improvements: out.improvements.slice(0, 3),
      rubricResults,
      modelAnswer: gradable.kind === "homework" ? "" : gradable.item.modelAnswer,
    };
    return Response.json(result);
  } catch (err) {
    const d = describeError(err);
    console.error("grade error:", d.code, err);
    return Response.json({ error: d.code, message: d.message }, { status: d.status });
  }
}

/**
 * POST /api/grade — grades one short / free / homework answer against its rubric.
 *
 * The rubric and model answer are looked up on the server (never trusted from the
 * client). The grader is an LLM judge, reached through Vercel AI Gateway, with a
 * schema-validated JSON output: each rubric criterion is met or not met (binary),
 * and the score is computed in code.
 */
import type { NextRequest } from "next/server";
import { generateText, Output, type ModelMessage } from "ai";
import { z } from "zod";
import { CACHED, describeError, getModel, hasGatewayAuth } from "@/lib/ai";
import { findGradable } from "@/lib/content";
import { getCourse, isLessonSlug } from "@/lib/courses";
import { GRADER_SYSTEM, graderUserPrompt } from "@/lib/prompts";
import type { GradeResult } from "@/lib/quiz-types";

const Body = z.object({
  courseSlug: z.string().max(100),
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
  if (!hasGatewayAuth()) {
    return Response.json(
      { error: "no_gateway", message: "Grading needs Vercel AI Gateway credentials on the server (AI_GATEWAY_API_KEY, or OIDC on Vercel)." },
      { status: 503 },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "bad_request", message: "Invalid request body." }, { status: 400 });
  }
  const { courseSlug, lessonSlug, questionId, answer } = parsed.data;
  const course = getCourse(courseSlug);
  if (!course || !isLessonSlug(course, lessonSlug)) {
    return Response.json({ error: "not_found", message: "Unknown course or lesson." }, { status: 404 });
  }
  const gradable = findGradable(courseSlug, lessonSlug, questionId);
  if (!gradable) {
    return Response.json({ error: "not_found", message: "Unknown question." }, { status: 404 });
  }

  const messages: ModelMessage[] = [
    { role: "system", content: GRADER_SYSTEM, providerOptions: CACHED },
    { role: "user", content: graderUserPrompt(gradable, answer, course.title) },
  ];

  try {
    const result = await generateText({
      model: getModel(),
      messages,
      allowSystemInMessages: true,
      maxOutputTokens: 4096,
      output: Output.object({ schema: GradeSchema }),
      providerOptions: { anthropic: { effort: "high" } },
    });
    const out = result.output;

    // Align results to the server-side rubric, in order; missing entries count as not met.
    const rubric = gradable.item.rubric;
    const rubricResults = rubric.map((criterion, i) => {
      const r = out.rubricResults[i];
      return { criterion, met: Boolean(r?.met), note: r?.note ?? "Not addressed." };
    });
    const met = rubricResults.filter((r) => r.met).length;
    const score = Math.round((met / rubric.length) * 100);

    const response: GradeResult = {
      questionId,
      score,
      passed: score >= PASS_THRESHOLD,
      feedback: out.feedback,
      strengths: out.strengths.slice(0, 3),
      improvements: out.improvements.slice(0, 3),
      rubricResults,
      modelAnswer: gradable.kind === "homework" ? "" : gradable.item.modelAnswer,
    };
    return Response.json(response);
  } catch (err) {
    const d = describeError(err);
    console.error("grade error:", d.code, err);
    return Response.json({ error: d.code, message: d.message }, { status: d.status });
  }
}

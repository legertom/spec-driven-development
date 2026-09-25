/**
 * POST /api/tutor — streams Eve's reply as plain text chunks.
 *
 * Body: { courseSlug?: string, lessonSlug?: string, page?: string, messages: [{ role, content }] }
 * The course and lesson text are loaded on the server and placed in system
 * messages with prompt-cache breakpoints, so repeated questions reuse the prefix.
 * The model is reached through Vercel AI Gateway (see lib/ai.ts).
 */
import type { NextRequest } from "next/server";
import { streamText, type ModelMessage } from "ai";
import { z } from "zod";
import { CACHED, describeError, EVE_EFFORT, getModel, hasGatewayAuth } from "@/lib/ai";
import { getLesson } from "@/lib/content";
import { getCourse, getCourses, isLessonSlug } from "@/lib/courses";
import { courseContextBlock, lessonContextBlock, pageContextBlock, PLATFORM_PERSONA } from "@/lib/prompts";

const Body = z.object({
  courseSlug: z.string().max(100).optional(),
  lessonSlug: z.string().max(100).optional(),
  page: z.string().max(200).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(12_000),
      }),
    )
    .min(1)
    .max(40),
});

export async function POST(req: NextRequest) {
  if (!hasGatewayAuth()) {
    return Response.json(
      { error: "no_gateway", message: "Eve needs Vercel AI Gateway credentials on the server (AI_GATEWAY_API_KEY, or OIDC on Vercel)." },
      { status: 503 },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "bad_request", message: "Invalid request body." }, { status: 400 });
  }
  const { courseSlug, lessonSlug, page, messages: history } = parsed.data;
  if (history[history.length - 1].role !== "user") {
    return Response.json({ error: "bad_request", message: "The last message must be from the learner." }, { status: 400 });
  }

  // Stable prefix first (platform persona), then course, then lesson: each a cache breakpoint.
  const course = courseSlug ? getCourse(courseSlug) : null;
  const lesson = course && lessonSlug && isLessonSlug(course, lessonSlug) ? getLesson(course.slug, lessonSlug) : null;
  const messages: ModelMessage[] = [{ role: "system", content: PLATFORM_PERSONA, providerOptions: CACHED }];
  if (course) messages.push({ role: "system", content: courseContextBlock(course), providerOptions: CACHED });
  messages.push(
    lesson
      ? { role: "system", content: lessonContextBlock(lesson), providerOptions: CACHED }
      : { role: "system", content: pageContextBlock(page ?? "/", getCourses()) },
  );
  for (const m of history) messages.push({ role: m.role, content: m.content });

  let streamError: unknown = null;
  let result: ReturnType<typeof streamText>;
  try {
    result = streamText({
      model: getModel(),
      messages,
      allowSystemInMessages: true,
      maxOutputTokens: 4096, // deliberately short: tutor answers, not essays
      abortSignal: req.signal,
      providerOptions: { anthropic: { effort: EVE_EFFORT } },
      onError: ({ error }) => {
        streamError = error;
      },
    });
  } catch (err) {
    const d = describeError(err);
    console.error("tutor error:", d.code, err);
    return Response.json({ error: d.code, message: d.message }, { status: d.status });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (text: string) => controller.enqueue(encoder.encode(text));
      try {
        for await (const chunk of result.textStream) push(chunk);
        if (streamError) {
          const d = describeError(streamError);
          console.error("tutor stream error:", d.code, streamError);
          push(`\n\n**Error:** ${d.message}`);
        } else {
          const reason = await result.finishReason;
          if (reason === "length") push("\n\n_(I ran out of room. Ask me to continue.)_");
          else if (reason === "content-filter") push("\n\n_I can't help with that request. Ask me about the lesson instead._");
        }
      } catch (err) {
        if (!req.signal.aborted) {
          const d = describeError(err);
          console.error("tutor error:", d.code, err);
          push(`\n\n**Error:** ${d.message}`);
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

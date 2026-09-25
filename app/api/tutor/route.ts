/**
 * POST /api/tutor — streams Eve's reply as plain text chunks.
 *
 * Body: { courseSlug?: string, lessonSlug?: string, page?: string, messages: [{ role, content }] }
 * The course and lesson text are loaded on the server and placed in the system
 * prompt behind cache breakpoints, so repeated questions reuse the cached prefix.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { describeError, EVE_EFFORT, FALLBACKS_ENABLED, fallbackParams, getClient, MODEL } from "@/lib/anthropic";
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
  const client = getClient();
  if (!client) {
    return Response.json(
      { error: "no_api_key", message: "Eve needs an ANTHROPIC_API_KEY on the server." },
      { status: 503 },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "bad_request", message: "Invalid request body." }, { status: 400 });
  }
  const { courseSlug, lessonSlug, page, messages } = parsed.data;
  if (messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "bad_request", message: "The last message must be from the learner." }, { status: 400 });
  }

  // Stable prefix first (platform persona), then course, then lesson: all cacheable.
  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: PLATFORM_PERSONA, cache_control: { type: "ephemeral" } },
  ];
  const course = courseSlug ? getCourse(courseSlug) : null;
  const lesson = course && lessonSlug && isLessonSlug(course, lessonSlug) ? getLesson(course.slug, lessonSlug) : null;
  if (course) system.push({ type: "text", text: courseContextBlock(course), cache_control: { type: "ephemeral" } });
  if (lesson) {
    system.push({ type: "text", text: lessonContextBlock(lesson), cache_control: { type: "ephemeral" } });
  } else {
    system.push({ type: "text", text: pageContextBlock(page ?? "/", getCourses()) });
  }

  const params = {
    model: MODEL,
    max_tokens: 4096, // deliberately short: tutor answers, not essays
    system,
    messages,
    output_config: { effort: EVE_EFFORT },
  };

  const encoder = new TextEncoder();
  const useFallbacks = FALLBACKS_ENABLED;
  let active: { abort(): void } | null = null;

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let emitted = false;
      const push = (text: string) => {
        emitted = true;
        controller.enqueue(encoder.encode(text));
      };

      const run = async (withFallbacks: boolean) => {
        const stream = withFallbacks
          ? client.beta.messages.stream({ ...params, ...fallbackParams() }, { signal: req.signal })
          : client.messages.stream(params, { signal: req.signal });
        active = stream;
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            push(event.delta.text);
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          push("\n\n_I can't help with that request. Ask me about the lesson instead._");
        } else if (final.stop_reason === "max_tokens") {
          push("\n\n_(I ran out of room. Ask me to continue.)_");
        }
      };

      try {
        try {
          await run(useFallbacks);
        } catch (err) {
          // If the fallback parameter itself is rejected, retry once on the plain endpoint.
          if (useFallbacks && !emitted && err instanceof Anthropic.BadRequestError) {
            await run(false);
          } else {
            throw err;
          }
        }
      } catch (err) {
        if (!(err instanceof Anthropic.APIUserAbortError)) {
          const d = describeError(err);
          console.error("tutor error:", d.code, err);
          push(`\n\n**Error:** ${d.message}`);
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      active?.abort();
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

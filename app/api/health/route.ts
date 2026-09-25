import type { NextRequest } from "next/server";
import { generateText } from "ai";
import { Client } from "eve/client";
import { describeError, getModel, hasGatewayAuth, MODEL } from "@/lib/ai";
import { getLessonMeta } from "@/lib/content";
import { getCourses } from "@/lib/courses";
import { isDbConfigured } from "@/lib/db";

/**
 * GET /api/health            → which features are available (never exposes secrets)
 *                               tutor:   the eve agent service answers /eve/v1/health
 *                               grading: the server has AI Gateway credentials
 * GET /api/health?probe=1    → also makes a one-word model call through AI Gateway (the grading path)
 * GET /api/health?probe=eve  → also runs one real turn on the eve agent and reports how it ended
 * GET /api/health?probe=lesson → a real tutor turn about the first lesson of the first course, with the
 *                               page context the browser would attach; reports the tools Eve called
 * Probes are throttled to one per 10 seconds per server instance.
 */
export const maxDuration = 120;

let lastProbeAt = 0;

/** Same-origin base URL for the eve routes (withEve mounts them at /eve/v1/*). */
function eveOrigin(req: NextRequest): string {
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : req.nextUrl.origin;
}

function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${what} timed out after ${ms} ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

async function eveReady(origin: string): Promise<boolean> {
  try {
    const health = await withTimeout(new Client({ host: origin }).health(), 5_000, "eve health");
    return health.ok === true;
  } catch {
    return false;
  }
}

/** Tool names from every actions.requested event, in order (what Eve did before answering). */
function toolsCalled(events: readonly { type: string; data?: unknown }[]): string[] {
  return events.flatMap((e) => {
    if (e.type !== "actions.requested") return [];
    const actions = (e.data as { actions?: readonly { kind?: string; toolName?: string }[] } | undefined)?.actions ?? [];
    return actions.map((a) => a.toolName ?? a.kind ?? "action");
  });
}

/** The turn a real learner would send from the first lesson of the first course. */
function lessonProbe(): { message: string; clientContext: Record<string, string> } | null {
  const course = getCourses()[0];
  const lessonSlug = course?.lessonOrder[0];
  if (!course || !lessonSlug) return null;
  const lesson = getLessonMeta(course.slug, lessonSlug);
  return {
    message: "In two sentences, what is the main idea of this lesson?",
    clientContext: {
      courseSlug: course.slug,
      courseTitle: course.title,
      courseNotes: course.tutorNotes,
      lessonSlug,
      lessonNumber: lesson.number,
      lessonTitle: lesson.title,
      page: `/courses/${course.slug}/${lessonSlug}`,
    },
  };
}

function failureMessage(events: readonly { type: string; data?: unknown }[]): string | undefined {
  const failed = events.find((e) => e.type === "turn.failed" || e.type === "session.failed");
  const data = failed?.data as { error?: { message?: string }; message?: string; reason?: string } | undefined;
  return data?.error?.message ?? data?.message ?? data?.reason;
}

export async function GET(req: NextRequest) {
  const origin = eveOrigin(req);
  const base = { tutor: await eveReady(origin), grading: hasGatewayAuth(), database: isDbConfigured(), model: MODEL };
  const probe = req.nextUrl.searchParams.get("probe");
  if (probe !== "1" && probe !== "eve" && probe !== "lesson") return Response.json(base);

  if (Date.now() - lastProbeAt < 10_000) {
    return Response.json({ ...base, probe: { ok: false, message: "Probe throttled; try again in a few seconds." } }, { status: 429 });
  }
  lastProbeAt = Date.now();
  const started = Date.now();

  if (probe === "eve" || probe === "lesson") {
    if (!base.tutor) {
      return Response.json({ ...base, probe: { ok: false, message: "The eve agent service is not reachable at /eve/v1/health." } }, { status: 503 });
    }
    const turn =
      probe === "lesson"
        ? lessonProbe()
        : { message: "Reply with the single word: ready", clientContext: { page: "/api/health", note: "Automated health probe. Reply with one word and use no tools." } };
    if (!turn) return Response.json({ ...base, probe: { ok: false, message: "No course content to probe with." } }, { status: 503 });
    try {
      const client = new Client({ host: origin });
      const { response } = await withTimeout(client.sessions.create(turn), 30_000, "eve session create");
      const result = await withTimeout(response.result(), 90_000, "eve turn");
      const ok = result.status !== "failed";
      return Response.json(
        {
          ...base,
          probe: {
            ok,
            status: result.status,
            text: (result.message ?? "").trim().slice(0, probe === "lesson" ? 600 : 80),
            toolsCalled: toolsCalled(result.events),
            ms: Date.now() - started,
            sessionId: result.sessionId,
            ...(ok ? {} : { message: failureMessage(result.events) ?? "The turn failed; check the eve service logs." }),
          },
        },
        { status: ok ? 200 : 502 },
      );
    } catch (err) {
      console.error("eve probe error:", err);
      return Response.json({ ...base, probe: { ok: false, message: (err as Error).message } }, { status: 502 });
    }
  }

  if (!base.grading) {
    return Response.json({ ...base, probe: { ok: false, message: "No AI Gateway credentials on the server." } }, { status: 503 });
  }
  try {
    const result = await generateText({
      model: getModel(),
      prompt: "Reply with the single word: ready",
      maxOutputTokens: 16,
      providerOptions: { anthropic: { effort: "low" } },
    });
    return Response.json({
      ...base,
      probe: { ok: true, text: result.text.trim().slice(0, 40), ms: Date.now() - started, servedBy: result.response.modelId },
    });
  } catch (err) {
    const d = describeError(err);
    console.error("health probe error:", d.code, err);
    return Response.json({ ...base, probe: { ok: false, code: d.code, message: d.message } }, { status: d.status });
  }
}

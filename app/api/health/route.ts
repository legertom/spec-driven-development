import type { NextRequest } from "next/server";
import { generateText } from "ai";
import { Client } from "eve/client";
import { describeError, getModel, hasGatewayAuth, MODEL } from "@/lib/ai";
import { isDbConfigured } from "@/lib/db";

/**
 * GET /api/health            → which features are available (never exposes secrets)
 *                               tutor:   the eve agent service answers /eve/v1/health
 *                               grading: the server has AI Gateway credentials
 * GET /api/health?probe=1    → also makes a one-word model call through AI Gateway (the grading path)
 * GET /api/health?probe=eve  → also runs one real turn on the eve agent and reports how it ended
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

function failureMessage(events: readonly { type: string; data?: unknown }[]): string | undefined {
  const failed = events.find((e) => e.type === "turn.failed" || e.type === "session.failed");
  const data = failed?.data as { error?: { message?: string }; message?: string; reason?: string } | undefined;
  return data?.error?.message ?? data?.message ?? data?.reason;
}

export async function GET(req: NextRequest) {
  const origin = eveOrigin(req);
  const base = { tutor: await eveReady(origin), grading: hasGatewayAuth(), database: isDbConfigured(), model: MODEL };
  const probe = req.nextUrl.searchParams.get("probe");
  if (probe !== "1" && probe !== "eve") return Response.json(base);

  if (Date.now() - lastProbeAt < 10_000) {
    return Response.json({ ...base, probe: { ok: false, message: "Probe throttled; try again in a few seconds." } }, { status: 429 });
  }
  lastProbeAt = Date.now();
  const started = Date.now();

  if (probe === "eve") {
    if (!base.tutor) {
      return Response.json({ ...base, probe: { ok: false, message: "The eve agent service is not reachable at /eve/v1/health." } }, { status: 503 });
    }
    try {
      const client = new Client({ host: origin });
      const { response } = await withTimeout(
        client.sessions.create({
          message: "Reply with the single word: ready",
          clientContext: { page: "/api/health", note: "Automated health probe. Reply with one word and use no tools." },
        }),
        30_000,
        "eve session create",
      );
      const result = await withTimeout(response.result(), 90_000, "eve turn");
      const ok = result.status !== "failed";
      return Response.json(
        {
          ...base,
          probe: {
            ok,
            status: result.status,
            text: (result.message ?? "").trim().slice(0, 80),
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

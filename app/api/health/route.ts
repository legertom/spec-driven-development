import type { NextRequest } from "next/server";
import { generateText } from "ai";
import { describeError, getModel, hasGatewayAuth, MODEL } from "@/lib/ai";
import { isDbConfigured } from "@/lib/db";

/**
 * GET /api/health          → which optional features are configured (never exposes secrets)
 * GET /api/health?probe=1  → also makes a one-word model call through Vercel AI Gateway,
 *                            so an owner can confirm credentials work after deploying.
 *                            Throttled to one probe per 10 seconds per server instance.
 */
let lastProbeAt = 0;

export async function GET(req: NextRequest) {
  const base = { tutor: hasGatewayAuth(), database: isDbConfigured(), model: MODEL };
  if (req.nextUrl.searchParams.get("probe") !== "1") return Response.json(base);

  if (!base.tutor) {
    return Response.json({ ...base, probe: { ok: false, message: "No AI Gateway credentials on the server." } }, { status: 503 });
  }
  if (Date.now() - lastProbeAt < 10_000) {
    return Response.json({ ...base, probe: { ok: false, message: "Probe throttled; try again in a few seconds." } }, { status: 429 });
  }
  lastProbeAt = Date.now();

  try {
    const started = Date.now();
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

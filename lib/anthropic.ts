/**
 * Anthropic client helpers. SERVER ONLY.
 *
 * - The model defaults to claude-opus-5 (override with EVE_MODEL).
 * - Server-side refusal fallbacks are on by default (`fallbacks: "default"`):
 *   if a safety classifier declines a request, the API re-runs it on a fallback
 *   model inside the same call. Set ANTHROPIC_FALLBACKS=off to disable.
 * - If the fallback parameter is ever rejected by the API (a 400), we retry the
 *   same request once through the plain endpoint so the tutor keeps working.
 */
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.EVE_MODEL?.trim() || "claude-opus-5";
export const EVE_EFFORT = (process.env.EVE_EFFORT?.trim() || "medium") as
  | "low"
  | "medium"
  | "high";
export const FALLBACKS_ENABLED = (process.env.ANTHROPIC_FALLBACKS ?? "on").toLowerCase() !== "off";

let cached: Anthropic | null = null;

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim() || process.env.ANTHROPIC_AUTH_TOKEN?.trim());
}

export function getClient(): Anthropic | null {
  if (!hasApiKey()) return null;
  if (!cached) cached = new Anthropic({ maxRetries: 2, timeout: 120_000 });
  return cached;
}

export const FALLBACK_BETAS: Anthropic.Beta.AnthropicBeta[] = ["server-side-fallback-2026-07-01"];

export function fallbackParams(): { betas?: Anthropic.Beta.AnthropicBeta[]; fallbacks?: "default" } {
  return FALLBACKS_ENABLED ? { betas: FALLBACK_BETAS, fallbacks: "default" } : {};
}

/** Map SDK errors to a status code and a message safe to show a learner. */
export function describeError(err: unknown): { status: number; code: string; message: string } {
  if (err instanceof Anthropic.AuthenticationError) {
    return { status: 500, code: "auth", message: "The server's Anthropic API key was rejected." };
  }
  if (err instanceof Anthropic.RateLimitError) {
    return { status: 429, code: "rate_limit", message: "Eve is getting a lot of questions right now. Try again in a few seconds." };
  }
  if (err instanceof Anthropic.BadRequestError) {
    return { status: 400, code: "bad_request", message: `The request was rejected: ${err.message}` };
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return { status: 502, code: "connection", message: "Could not reach the Anthropic API. Check the server's network." };
  }
  if (err instanceof Anthropic.APIError) {
    return { status: err.status ?? 500, code: "api", message: `API error ${err.status ?? ""}: ${err.message}` };
  }
  return { status: 500, code: "unknown", message: "Something went wrong on the server." };
}

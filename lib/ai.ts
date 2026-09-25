/**
 * Model access through Vercel AI Gateway. SERVER ONLY.
 *
 * - No provider API key lives in this app. The gateway authenticates with
 *   AI_GATEWAY_API_KEY, or automatically with the project's Vercel OIDC token
 *   when deployed on Vercel (the gateway provider handles both).
 * - The model id uses the gateway's "provider/model" form and defaults to
 *   anthropic/claude-opus-5. Override with EVE_MODEL (any model the gateway lists).
 * - Anthropic-specific options (effort, prompt caching) are passed as
 *   providerOptions.anthropic and forwarded by the gateway.
 */
import { GatewayAuthenticationError, GatewayModelNotFoundError, GatewayRateLimitError } from "@ai-sdk/gateway";
import { APICallError, gateway, NoObjectGeneratedError } from "ai";

export const MODEL = process.env.EVE_MODEL?.trim() || "anthropic/claude-opus-5";
export const EVE_EFFORT = (process.env.EVE_EFFORT?.trim() || "medium") as "low" | "medium" | "high";

/** True when the gateway has some way to authenticate. On Vercel, OIDC covers it. */
export function hasGatewayAuth(): boolean {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim() || process.env.VERCEL === "1",
  );
}

export function getModel() {
  return gateway(MODEL);
}

/** Anthropic prompt-caching breakpoint, attached to stable system messages. */
export const CACHED = { anthropic: { cacheControl: { type: "ephemeral" as const } } };

/** Map SDK and gateway errors to a status code and a message safe to show a learner. */
export function describeError(err: unknown): { status: number; code: string; message: string } {
  if (err instanceof GatewayAuthenticationError) {
    return {
      status: 500,
      code: "auth",
      message: "The server could not authenticate with Vercel AI Gateway. Set AI_GATEWAY_API_KEY, or deploy on Vercel with OIDC enabled.",
    };
  }
  if (err instanceof GatewayRateLimitError) {
    return { status: 429, code: "rate_limit", message: "Eve is getting a lot of questions right now. Try again in a few seconds." };
  }
  if (err instanceof GatewayModelNotFoundError) {
    return { status: 500, code: "model", message: `The model "${MODEL}" is not available on AI Gateway. Check EVE_MODEL.` };
  }
  if (NoObjectGeneratedError.isInstance(err)) {
    return { status: 502, code: "parse", message: "The grader returned an unreadable result. Try again." };
  }
  if (APICallError.isInstance(err)) {
    const status = err.statusCode ?? 502;
    if (status === 401 || status === 403) return { status: 500, code: "auth", message: "AI Gateway rejected the server's credentials." };
    if (status === 429) return { status: 429, code: "rate_limit", message: "Rate limited. Try again in a few seconds." };
    if (status === 402) return { status: 500, code: "credits", message: "The AI Gateway account is out of credits." };
    return { status, code: "api", message: `The model request failed (${status}).` };
  }
  return { status: 500, code: "unknown", message: "Something went wrong on the server." };
}

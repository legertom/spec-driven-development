import { defineAgent } from "eve";

/**
 * Eve, the platform tutor, as an eve agent (https://eve.dev).
 * - The model id is an AI Gateway id, so the deployment authenticates with the
 *   project's OIDC token (or AI_GATEWAY_API_KEY) and needs no provider key.
 * - modelContextWindowTokens is pinned so `eve build` and `eve info` do not need
 *   to fetch the AI Gateway model catalog (compaction sizing works offline).
 * - defaultTools: false removes the sandbox-backed defaults (bash, file, web tools).
 *   Eve only needs the course tools in agent/tools/ and her skills.
 * - Every anonymous browser session has a cost ceiling.
 */
export default defineAgent({
  model: process.env.EVE_MODEL ?? "anthropic/claude-opus-5",
  modelContextWindowTokens: 200_000,
  reasoning: "medium",
  defaultTools: false,
  compaction: { thresholdPercent: 0.8 },
  limits: {
    maxTokenCostUsdPerSession: 1,
    maxOutputTokensPerSession: 40_000,
    sessionTimeoutMs: 7 * 24 * 60 * 60 * 1000,
  },
});

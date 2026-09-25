import { hasApiKey, MODEL } from "@/lib/anthropic";
import { isDbConfigured } from "@/lib/db";

/** Tells the UI which optional features are configured. Never exposes secrets. */
export async function GET() {
  return Response.json({
    anthropic: hasApiKey(),
    database: isDbConfigured(),
    model: MODEL,
  });
}

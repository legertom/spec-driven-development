import { hasGatewayAuth, MODEL } from "@/lib/ai";
import { isDbConfigured } from "@/lib/db";

/** Tells the UI which optional features are configured. Never exposes secrets. */
export async function GET() {
  return Response.json({
    tutor: hasGatewayAuth(), // Eve and grading, through Vercel AI Gateway
    database: isDbConfigured(),
    model: MODEL,
  });
}

/**
 * Neon + Drizzle connection. SERVER ONLY.
 * Returns null when DATABASE_URL is not set, so every caller can fall back gracefully.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

export type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDb(): Db | null {
  if (!isDbConfigured()) return null;
  if (!cached) cached = drizzle(neon(process.env.DATABASE_URL!), { schema });
  return cached;
}

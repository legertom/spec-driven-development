/** Anonymous learner identity: a UUID in an httpOnly cookie. SERVER ONLY. */
import { cookies } from "next/headers";

export const LEARNER_COOKIE = "sdd_learner";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getOrCreateLearnerId(): Promise<{ id: string; isNew: boolean }> {
  const store = await cookies();
  const existing = store.get(LEARNER_COOKIE)?.value;
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return { id: existing, isNew: false };
  const id = crypto.randomUUID();
  store.set(LEARNER_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return { id, isNew: true };
}

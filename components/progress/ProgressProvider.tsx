"use client";

/**
 * Learner progress, available to any client component via useProgress().
 * localStorage (via progressStore) is the fast local copy; the server (Neon)
 * is the durable copy when DATABASE_URL is configured. Writes go to both;
 * reads merge them.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { progressStore } from "@/lib/progress-store";
import { EMPTY_PROGRESS, type AttemptRecord, type LessonStatus, type ProgressSnapshot } from "@/lib/progress-types";

interface ProgressApi {
  ready: boolean;
  persisted: boolean | null; // null until the server answers
  snapshot: ProgressSnapshot;
  lessonStatus(slug: string): LessonStatus | undefined;
  markLesson(slug: string, status: LessonStatus): void;
  recordAttempt(attempt: Omit<AttemptRecord, "createdAt">): void;
  attemptsFor(slug: string, questionId?: string): AttemptRecord[];
  bestScore(slug: string, questionId: string): number | undefined;
  reset(): void;
}

const Ctx = createContext<ProgressApi | null>(null);
const noopSubscribe = () => () => {};

function merge(local: ProgressSnapshot, server: ProgressSnapshot): ProgressSnapshot {
  const lessons = { ...local.lessons };
  for (const [slug, rec] of Object.entries(server.lessons)) {
    const cur = lessons[slug];
    if (!cur || cur.updatedAt < rec.updatedAt) lessons[slug] = rec;
  }
  const seen = new Set(local.attempts.map((a) => `${a.questionId}|${a.createdAt}`));
  const attempts = [...local.attempts];
  for (const a of server.attempts) {
    const key = `${a.questionId}|${a.createdAt}`;
    if (!seen.has(key)) {
      seen.add(key);
      attempts.push(a);
    }
  }
  attempts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return { lessons, attempts };
}

async function post(body: unknown) {
  try {
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok ? ((await res.json()) as { persisted: boolean }) : null;
  } catch {
    return null;
  }
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(progressStore.subscribe, progressStore.getSnapshot, progressStore.getServerSnapshot);
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  // Pull the server copy once and merge it in.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/progress")
      .then((res) => (res.ok ? (res.json() as Promise<ProgressSnapshot & { persisted: boolean }>) : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        if (cancelled) return;
        setPersisted(data.persisted);
        if (data.persisted) progressStore.update((local) => merge(local, { lessons: data.lessons, attempts: data.attempts }));
      })
      .catch(() => {
        if (!cancelled) setPersisted(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const markLesson = useCallback((slug: string, status: LessonStatus) => {
    const updatedAt = new Date().toISOString();
    let changed = false;
    progressStore.update((s) => {
      const cur = s.lessons[slug];
      if (cur?.status === "completed" && status === "in_progress") return s; // never downgrade
      if (cur?.status === status) return s;
      changed = true;
      return { ...s, lessons: { ...s.lessons, [slug]: { lessonSlug: slug, status, updatedAt } } };
    });
    if (changed) void post({ type: "lesson", lessonSlug: slug, status });
  }, []);

  const recordAttempt = useCallback((attempt: Omit<AttemptRecord, "createdAt">) => {
    const full: AttemptRecord = { ...attempt, createdAt: new Date().toISOString() };
    progressStore.update((s) => ({ ...s, attempts: [full, ...s.attempts].slice(0, 1000) }));
    void post({ type: "attempt", ...full });
  }, []);

  const reset = useCallback(() => {
    progressStore.update(() => EMPTY_PROGRESS);
    void post({ type: "reset" });
  }, []);

  const api = useMemo<ProgressApi>(
    () => ({
      ready,
      persisted,
      snapshot,
      lessonStatus: (slug) => snapshot.lessons[slug]?.status,
      markLesson,
      recordAttempt,
      attemptsFor: (slug, questionId) =>
        snapshot.attempts.filter((a) => a.lessonSlug === slug && (questionId ? a.questionId === questionId : true)),
      bestScore: (slug, questionId) => {
        const scores = snapshot.attempts.filter((a) => a.lessonSlug === slug && a.questionId === questionId).map((a) => a.score);
        return scores.length ? Math.max(...scores) : undefined;
      },
      reset,
    }),
    [ready, persisted, snapshot, markLesson, recordAttempt, reset],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProgress must be used inside <ProgressProvider>");
  return ctx;
}

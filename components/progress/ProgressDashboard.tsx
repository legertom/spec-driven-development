"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useEve } from "@/components/eve/EveProvider";
import type { LessonMeta } from "@/lib/content";
import { MODULES } from "@/lib/course";
import { useProgress } from "./ProgressProvider";

export function ProgressDashboard({ lessons }: { lessons: LessonMeta[] }) {
  const { ready, persisted, snapshot, lessonStatus, reset } = useProgress();
  const { askWith } = useEve();
  const [confirming, setConfirming] = useState(false);
  const bySlug = new Map(lessons.map((l) => [l.slug, l]));
  const total = lessons.length;
  const completed = lessons.filter((l) => lessonStatus(l.slug) === "completed").length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const graded = snapshot.attempts.filter((a) => a.kind !== "mc");
  const mc = snapshot.attempts.filter((a) => a.kind === "mc");
  const mcCorrect = mc.filter((a) => a.passed).length;

  // Best score per graded question; weak spots are best < 70.
  const best = new Map<string, { lessonSlug: string; questionId: string; score: number; kind: string }>();
  for (const a of graded) {
    const key = `${a.lessonSlug}|${a.questionId}`;
    const cur = best.get(key);
    if (!cur || a.score > cur.score) best.set(key, { lessonSlug: a.lessonSlug, questionId: a.questionId, score: a.score, kind: a.kind });
  }
  const weak = [...best.values()].filter((b) => b.score < 70);

  if (!ready) return <p className="text-muted">Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Lessons completed</div>
          <div className="mt-1 text-3xl font-extrabold">
            {completed}
            <span className="text-lg font-semibold text-muted"> / {total}</span>
          </div>
          <div className="bar mt-3">
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="card p-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Multiple choice</div>
          <div className="mt-1 text-3xl font-extrabold">
            {mc.length ? Math.round((mcCorrect / mc.length) * 100) : 0}
            <span className="text-lg font-semibold text-muted">% correct</span>
          </div>
          <p className="mt-1 text-sm text-muted">{mc.length} answers so far</p>
        </div>
        <div className="card p-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Graded by Eve</div>
          <div className="mt-1 text-3xl font-extrabold">
            {best.size ? Math.round([...best.values()].reduce((s, b) => s + b.score, 0) / best.size) : 0}
            <span className="text-lg font-semibold text-muted">% avg best</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {best.size} question{best.size === 1 ? "" : "s"} attempted · {graded.length} submissions
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-bold">By module</h2>
        <div className="mt-3 space-y-3">
          {MODULES.map((m) => {
            const done = m.lessons.filter((s) => lessonStatus(s) === "completed").length;
            return (
              <div key={m.id} className="card p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    Module {m.id} · {m.title}
                  </span>
                  <span className="text-muted">
                    {done}/{m.lessons.length}
                  </span>
                </div>
                <div className="bar mt-2">
                  <span style={{ width: `${(done / m.lessons.length) * 100}%` }} />
                </div>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {m.lessons.map((s) => (
                    <li key={s} className="inline-flex items-center gap-1.5">
                      <span className="status-dot" data-status={lessonStatus(s)} />
                      <Link href={`/course/${s}`} className="hover:underline">
                        {bySlug.get(s)?.number} {bySlug.get(s)?.shortTitle}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Weak spots</h2>
          {weak.length ? (
            <button
              type="button"
              className="btn btn-eve btn-sm"
              onClick={() =>
                askWith(
                  `Here are the graded questions I scored under 70% on: ${weak
                    .map((w) => `${w.questionId} in lesson ${w.lessonSlug} (best ${w.score}%)`)
                    .join("; ")}. Which lesson sections should I re-read, and can you give me one practice question for the weakest one?`,
                )
              }
            >
              <Sparkles size={13} /> Ask Eve to review my weak spots
            </button>
          ) : null}
        </div>
        {weak.length ? (
          <ul className="mt-3 space-y-2">
            {weak.map((w) => (
              <li key={`${w.lessonSlug}|${w.questionId}`} className="card flex items-center justify-between p-3 text-sm">
                <span>
                  <Link href={`/course/${w.lessonSlug}#quiz`} className="font-semibold hover:underline">
                    {bySlug.get(w.lessonSlug)?.number} {bySlug.get(w.lessonSlug)?.shortTitle}
                  </Link>{" "}
                  <span className="text-muted">· {w.kind} · {w.questionId}</span>
                </span>
                <span className="font-bold text-danger">{w.score}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">No weak spots yet. Graded questions you score under 70% on will show up here.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold">Recent graded attempts</h2>
        {graded.length ? (
          <div className="card mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Lesson</th>
                  <th className="px-3 py-2">Question</th>
                  <th className="px-3 py-2">Kind</th>
                  <th className="px-3 py-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {graded.slice(0, 25).map((a, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2 text-muted">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{bySlug.get(a.lessonSlug)?.number}</td>
                    <td className="px-3 py-2">{a.questionId}</td>
                    <td className="px-3 py-2">{a.kind}</td>
                    <td className={`px-3 py-2 text-right font-bold ${a.passed ? "text-accent" : "text-danger"}`}>{a.score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">Nothing graded yet. Try the “Apply it” questions at the end of any lesson.</p>
        )}
      </section>

      <section className="card p-5 text-sm">
        <div className="font-semibold">Where this is stored</div>
        <p className="mt-1 text-muted">
          {persisted === null
            ? "Checking the server…"
            : persisted
              ? "Your progress is saved in this browser and in the course database, keyed by an anonymous cookie. No login, no email."
              : "Your progress is saved in this browser only (no database is configured on the server). Clearing site data will erase it."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {confirming ? (
            <>
              <span className="text-danger">Erase all progress? This cannot be undone.</span>
              <button type="button" className="btn btn-sm" onClick={() => { reset(); setConfirming(false); }}>
                Yes, erase everything
              </button>
              <button type="button" className="btn btn-sm" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-sm" onClick={() => setConfirming(true)}>
              Reset my progress
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

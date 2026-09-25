"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { LessonMeta } from "@/lib/content";
import { MODULES } from "@/lib/course";
import { useProgress } from "./progress/ProgressProvider";

export function ModuleCards({ lessons }: { lessons: LessonMeta[] }) {
  const { lessonStatus } = useProgress();
  const bySlug = new Map(lessons.map((l) => [l.slug, l]));
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {MODULES.map((m) => {
        const done = m.lessons.filter((s) => lessonStatus(s) === "completed").length;
        const minutes = m.lessons.reduce((acc, s) => acc + (bySlug.get(s)?.minutes ?? 0), 0);
        const first = m.lessons[0];
        return (
          <div key={m.id} className="card flex flex-col p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Module {m.id}</div>
            <h3 className="mt-1 text-lg font-bold">{m.title}</h3>
            <p className="mt-1 flex-1 text-sm text-muted">{m.blurb}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {m.lessons.map((s) => {
                const l = bySlug.get(s);
                const st = lessonStatus(s);
                return (
                  <li key={s} className="flex items-center gap-2">
                    <span className="status-dot" data-status={st} />
                    <Link href={`/course/${s}`} className="hover:underline">
                      <span className="mr-1 text-xs text-muted">{l?.number}</span>
                      {l?.shortTitle ?? s}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-center justify-between text-xs text-muted">
              <span>
                {done}/{m.lessons.length} done · {minutes} min
              </span>
              <Link href={`/course/${first}`} className="inline-flex items-center gap-1 font-semibold text-accent">
                {done === 0 ? "Start" : done === m.lessons.length ? "Review" : "Continue"} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="bar mt-2">
              <span style={{ width: `${(done / m.lessons.length) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

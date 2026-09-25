"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LessonMeta } from "@/lib/content";
import { MODULES } from "@/lib/course";
import { useProgress } from "./progress/ProgressProvider";

export function Sidebar({ lessons }: { lessons: LessonMeta[] }) {
  const pathname = usePathname();
  const { lessonStatus, attemptsFor } = useProgress();
  const [mobileOpen, setMobileOpen] = useState(false);
  const bySlug = new Map(lessons.map((l) => [l.slug, l]));

  const list = (
    <nav aria-label="Lessons" className="space-y-5">
      {MODULES.map((m) => (
        <div key={m.id}>
          <div className="mb-1 px-2 text-[11px] font-bold uppercase tracking-wider text-muted">
            Module {m.id} · {m.title}
          </div>
          <ul className="space-y-0.5">
            {m.lessons.map((slug) => {
              const l = bySlug.get(slug);
              const href = `/course/${slug}`;
              const current = pathname === href;
              const status = lessonStatus(slug);
              const graded = attemptsFor(slug).filter((a) => a.kind !== "mc");
              const best = graded.length ? Math.max(...graded.map((a) => a.score)) : undefined;
              return (
                <li key={slug}>
                  <Link href={href} className="sidebar-link" aria-current={current ? "page" : undefined} onClick={() => setMobileOpen(false)}>
                    <span className="status-dot" data-status={status} aria-label={status ? status.replace("_", " ") : "not started"} />
                    <span className="min-w-0 flex-1 truncate">
                      <span className="mr-1.5 text-xs text-muted">{l?.number ?? slug.slice(0, 2).toUpperCase()}</span>
                      {l?.shortTitle ?? slug}
                    </span>
                    {best !== undefined ? <span className="pill" style={{ padding: "0 0.4rem", fontSize: "0.7rem" }}>{best}%</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <button type="button" className="btn w-full justify-between" onClick={() => setMobileOpen((v) => !v)} aria-expanded={mobileOpen}>
          Lessons <ChevronDown size={16} className={mobileOpen ? "rotate-180 transition" : "transition"} />
        </button>
        {mobileOpen ? <div className="card mt-2 p-3">{list}</div> : null}
      </div>
      {/* Desktop */}
      <aside className="hidden w-64 flex-none md:block">
        <div className="sticky top-[64px] max-h-[calc(100vh-80px)] overflow-y-auto pr-2">{list}</div>
      </aside>
    </>
  );
}

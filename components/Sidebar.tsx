"use client";

import { BookMarked, ChevronDown, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LessonMeta } from "@/lib/content";
import type { Course } from "@/lib/course-types";
import { useProgress } from "./progress/ProgressProvider";

export function Sidebar({ course, lessons }: { course: Course; lessons: LessonMeta[] }) {
  const pathname = usePathname();
  const { lessonStatus, attemptsFor } = useProgress();
  const [mobileOpen, setMobileOpen] = useState(false);
  const bySlug = new Map(lessons.map((l) => [l.slug, l]));
  const base = `/courses/${course.slug}`;

  const list = (
    <nav aria-label="Lessons" className="space-y-5">
      <div className="space-y-0.5">
        <Link href={base} className="sidebar-link" aria-current={pathname === base ? "page" : undefined} onClick={() => setMobileOpen(false)}>
          <Home size={15} className="text-muted" />
          <span className="truncate font-semibold">{course.shortTitle}</span>
        </Link>
        <Link href={`${base}/glossary`} className="sidebar-link" aria-current={pathname === `${base}/glossary` ? "page" : undefined} onClick={() => setMobileOpen(false)}>
          <BookMarked size={15} className="text-muted" />
          <span>Glossary</span>
        </Link>
      </div>
      {course.modules.map((m) => (
        <div key={m.id}>
          <div className="mb-1 px-2 text-[11px] font-bold uppercase tracking-wider text-muted">
            Module {m.id} · {m.title}
          </div>
          <ul className="space-y-0.5">
            {m.lessons.map((slug) => {
              const l = bySlug.get(slug);
              const href = `${base}/${slug}`;
              const current = pathname === href;
              const status = lessonStatus(course.slug, slug);
              const graded = attemptsFor(course.slug, slug).filter((a) => a.kind !== "mc");
              const best = graded.length ? Math.max(...graded.map((a) => a.score)) : undefined;
              return (
                <li key={slug}>
                  <Link href={href} className="sidebar-link" aria-current={current ? "page" : undefined} onClick={() => setMobileOpen(false)}>
                    <span className="status-dot" data-status={status} aria-label={status ? status.replace("_", " ") : "not started"} />
                    <span className="min-w-0 flex-1 truncate">
                      <span className="mr-1.5 text-xs text-muted">{l?.number ?? slug.slice(0, 2).toUpperCase()}</span>
                      {l?.shortTitle ?? course.shortTitles[slug] ?? slug}
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
      <div className="md:hidden">
        <button type="button" className="btn w-full justify-between" onClick={() => setMobileOpen((v) => !v)} aria-expanded={mobileOpen}>
          {course.shortTitle} · Lessons <ChevronDown size={16} className={mobileOpen ? "rotate-180 transition" : "transition"} />
        </button>
        {mobileOpen ? <div className="card mt-2 p-3">{list}</div> : null}
      </div>
      <aside className="hidden w-64 flex-none md:block">
        <div className="sticky top-[64px] max-h-[calc(100vh-80px)] overflow-y-auto pr-2">{list}</div>
      </aside>
    </>
  );
}

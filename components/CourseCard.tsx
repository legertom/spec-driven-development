"use client";

import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import type { Course } from "@/lib/course-types";
import { useProgress } from "./progress/ProgressProvider";

export function CourseCard({ course, minutes }: { course: Course; minutes: number }) {
  const { lessonStatus } = useProgress();
  const done = course.lessonOrder.filter((s) => lessonStatus(course.slug, s) === "completed").length;
  const started = course.lessonOrder.some((s) => lessonStatus(course.slug, s));
  const soon = course.status !== "available";
  const href = `/courses/${course.slug}`;
  return (
    <article className={`card flex flex-col p-6 ${soon ? "opacity-80" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="pill pill-accent">{course.level}</span>
        {soon ? <span className="pill">Coming soon</span> : <span className="pill">{course.lessonCount} lessons</span>}
        {!soon && minutes ? (
          <span className="pill">
            <Clock size={12} /> about {Math.max(1, Math.round(minutes / 60))} h
          </span>
        ) : null}
      </div>
      <h2 className="mt-3 text-xl font-bold leading-snug">
        {soon ? course.title : <Link href={href} className="hover:underline">{course.title}</Link>}
      </h2>
      <p className="mt-2 flex-1 text-sm text-muted">{course.tagline}</p>
      {!soon ? (
        <>
          <div className="bar mt-4">
            <span style={{ width: `${(done / course.lessonCount) * 100}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted">
              {done}/{course.lessonCount} lessons done
            </span>
            <Link href={href} className="btn btn-primary btn-sm">
              {started ? "Continue" : "Start course"} <ArrowRight size={14} />
            </Link>
          </div>
        </>
      ) : null}
    </article>
  );
}

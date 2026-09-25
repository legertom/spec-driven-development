"use client";

import { useProgress } from "./progress/ProgressProvider";

export function StatusPill({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  const { lessonStatus } = useProgress();
  const st = lessonStatus(courseSlug, lessonSlug);
  const label = st === "completed" ? "Completed" : st === "in_progress" ? "In progress" : "Not started";
  return (
    <span className={`pill ${st === "completed" ? "pill-accent" : ""}`}>
      <span className="status-dot" data-status={st} /> {label}
    </span>
  );
}

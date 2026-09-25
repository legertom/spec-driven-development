"use client";

import { CircleCheck, RotateCcw } from "lucide-react";
import { useProgress } from "./ProgressProvider";

export function CompleteButton({ slug }: { slug: string }) {
  const { lessonStatus, markLesson } = useProgress();
  const done = lessonStatus(slug) === "completed";
  return (
    <div className="flex flex-wrap items-center gap-3">
      {done ? (
        <>
          <span className="pill pill-accent">
            <CircleCheck size={14} /> Lesson complete
          </span>
          <button type="button" className="btn btn-sm" onClick={() => markLesson(slug, "in_progress")}>
            <RotateCcw size={14} /> Mark as in progress
          </button>
        </>
      ) : (
        <button type="button" className="btn btn-primary" onClick={() => markLesson(slug, "completed")}>
          <CircleCheck size={16} /> Mark lesson complete
        </button>
      )}
    </div>
  );
}

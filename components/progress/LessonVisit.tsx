"use client";

import { useEffect } from "react";
import { useProgress } from "./ProgressProvider";

/** Marks a lesson "in progress" the first time it is opened. */
export function LessonVisit({ slug }: { slug: string }) {
  const { ready, lessonStatus, markLesson } = useProgress();
  useEffect(() => {
    if (ready && !lessonStatus(slug)) markLesson(slug, "in_progress");
  }, [ready, slug, lessonStatus, markLesson]);
  return null;
}

"use client";

import { useEffect } from "react";
import { useProgress } from "./ProgressProvider";

/** Marks a lesson "in progress" the first time it is opened. */
export function LessonVisit({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
  const { ready, lessonStatus, markLesson } = useProgress();
  useEffect(() => {
    if (ready && !lessonStatus(courseSlug, lessonSlug)) markLesson(courseSlug, lessonSlug, "in_progress");
  }, [ready, courseSlug, lessonSlug, lessonStatus, markLesson]);
  return null;
}

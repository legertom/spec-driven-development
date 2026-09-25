"use client";

import { useEffect } from "react";
import { useEve, type EveContextInfo } from "./EveProvider";

/** Tells Eve which course and lesson are open. Render once on a course or lesson page. */
export function EveContext(props: EveContextInfo) {
  const { setContext } = useEve();
  const { courseSlug, courseTitle, courseNotes, lessonSlug, lessonTitle, lessonNumber } = props;
  useEffect(() => {
    setContext({ courseSlug, courseTitle, courseNotes, lessonSlug, lessonTitle, lessonNumber });
    return () => setContext({});
  }, [setContext, courseSlug, courseTitle, courseNotes, lessonSlug, lessonTitle, lessonNumber]);
  return null;
}

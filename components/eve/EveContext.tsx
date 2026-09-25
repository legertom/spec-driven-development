"use client";

import { useEffect } from "react";
import { useEve, type EveContextInfo } from "./EveProvider";

/** Tells Eve which lesson is open. Render once on a lesson page. */
export function EveContext(props: EveContextInfo) {
  const { setContext } = useEve();
  const { lessonSlug, lessonTitle, lessonNumber } = props;
  useEffect(() => {
    setContext({ lessonSlug, lessonTitle, lessonNumber });
    return () => setContext({});
  }, [setContext, lessonSlug, lessonTitle, lessonNumber]);
  return null;
}

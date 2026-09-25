"use client";

/**
 * Drawer state, page context, and health for Eve, the tutor.
 *
 * The conversation itself lives in <EveChat> (components/eve/EveChat.tsx), which
 * talks to the eve agent in agent/ through the same-origin /eve/v1/* routes that
 * withEve() mounts in next.config.ts. This provider only knows which drawer is
 * open, which course and lesson the learner is looking at, and whether the
 * server-side features are available.
 */
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface EveContextInfo {
  courseSlug?: string;
  courseTitle?: string;
  /** Course-specific teaching notes (course.json → tutorNotes), sent to Eve as per-turn context. */
  courseNotes?: string;
  lessonSlug?: string;
  lessonTitle?: string;
  lessonNumber?: string;
}

export interface Health {
  /** The eve agent service answered its health route, so chatting with Eve works. */
  tutor: boolean;
  /** The server has AI Gateway credentials, so written-answer grading works. */
  grading: boolean;
  database: boolean;
  model: string;
}

interface EveApi {
  open: boolean;
  setOpen: (v: boolean) => void;
  /** True once the drawer has been opened in this page load. The chat mounts lazily. */
  everOpened: boolean;
  context: EveContextInfo;
  setContext: (c: EveContextInfo) => void;
  /** One conversation per lesson (or per course, or per page). The chat's React key and storage key. */
  threadKey: string;
  pendingHighlight: string | null;
  setPendingHighlight: (h: string | null) => void;
  draft: string;
  setDraft: (d: string) => void;
  health: Health | null;
  /** Open the drawer with a highlighted passage attached to the next question. */
  askAbout: (highlight: string) => void;
  /** Open the drawer with a pre-filled question (and optional highlight). */
  askWith: (prompt: string, highlight?: string) => void;
  /** Increments whenever the input should receive focus. */
  focusSignal: number;
}

const Ctx = createContext<EveApi | null>(null);

function sameContext(a: EveContextInfo, b: EveContextInfo): boolean {
  return (
    a.courseSlug === b.courseSlug &&
    a.courseTitle === b.courseTitle &&
    a.courseNotes === b.courseNotes &&
    a.lessonSlug === b.lessonSlug &&
    a.lessonTitle === b.lessonTitle &&
    a.lessonNumber === b.lessonNumber
  );
}

export function EveProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpenState] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const [context, setContextState] = useState<EveContextInfo>({});
  const [pendingHighlight, setPendingHighlight] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [health, setHealth] = useState<Health | null>(null);
  const [focusSignal, setFocusSignal] = useState(0);

  const threadKey = context.lessonSlug
    ? `lesson:${context.courseSlug ?? ""}/${context.lessonSlug}`
    : context.courseSlug
      ? `course:${context.courseSlug}`
      : `page:${pathname}`;

  const setOpen = useCallback((v: boolean) => {
    setOpenState(v);
    if (v) setEverOpened(true);
  }, []);

  // Reflect drawer state on <body> so the page can make room on wide screens.
  useEffect(() => {
    document.body.dataset.eveOpen = open ? "true" : "false";
    return () => {
      delete document.body.dataset.eveOpen;
    };
  }, [open]);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((h) => h && setHealth(h as Health))
      .catch(() => setHealth({ tutor: false, grading: false, database: false, model: "" }));
  }, []);

  const setContext = useCallback((c: EveContextInfo) => {
    setContextState((prev) => (sameContext(prev, c) ? prev : c));
  }, []);

  const askAbout = useCallback(
    (highlight: string) => {
      setPendingHighlight(highlight.trim());
      setOpen(true);
      setFocusSignal((n) => n + 1);
    },
    [setOpen],
  );

  const askWith = useCallback(
    (prompt: string, highlight?: string) => {
      if (highlight) setPendingHighlight(highlight.trim());
      setDraft(prompt);
      setOpen(true);
      setFocusSignal((n) => n + 1);
    },
    [setOpen],
  );

  const api = useMemo<EveApi>(
    () => ({
      open,
      setOpen,
      everOpened,
      context,
      setContext,
      threadKey,
      pendingHighlight,
      setPendingHighlight,
      draft,
      setDraft,
      health,
      askAbout,
      askWith,
      focusSignal,
    }),
    [open, setOpen, everOpened, context, setContext, threadKey, pendingHighlight, draft, health, askAbout, askWith, focusSignal],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useEve(): EveApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEve must be used inside <EveProvider>");
  return ctx;
}

"use client";

/**
 * Eve, the tutor. One conversation thread per lesson (or per page outside the
 * course), kept in sessionStorage so it survives navigation but not a closed tab.
 * Nothing about the chat is sent to the database.
 */
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

export interface EveMessage {
  id: string;
  role: "user" | "assistant";
  /** What is sent to the API (includes the quoted highlight for user turns). */
  content: string;
  /** What is shown in the bubble for user turns (the question only). */
  text?: string;
  highlight?: string;
  streaming?: boolean;
  error?: boolean;
}

export interface EveContextInfo {
  courseSlug?: string;
  courseTitle?: string;
  lessonSlug?: string;
  lessonTitle?: string;
  lessonNumber?: string;
}

export interface Health {
  anthropic: boolean;
  database: boolean;
  model: string;
}

interface EveApi {
  open: boolean;
  setOpen: (v: boolean) => void;
  context: EveContextInfo;
  setContext: (c: EveContextInfo) => void;
  messages: EveMessage[];
  streaming: boolean;
  send: (text: string, highlight?: string) => Promise<void>;
  stop: () => void;
  clear: () => void;
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
const STORAGE_PREFIX = "sdd:eve:";
const noopSubscribe = () => () => {};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function readThread(key: string): EveMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return [];
    const msgs = JSON.parse(raw) as EveMessage[];
    return msgs.map((m) => ({ ...m, streaming: false }));
  } catch {
    return [];
  }
}

function writeThread(key: string, msgs: EveMessage[]) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(msgs.slice(-60)));
  } catch {
    /* ignore */
  }
}

export function EveProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [context, setContextState] = useState<EveContextInfo>({});
  const [threads, setThreads] = useState<Record<string, EveMessage[]>>({});
  const [streaming, setStreaming] = useState(false);
  const [pendingHighlight, setPendingHighlight] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [health, setHealth] = useState<Health | null>(null);
  const [focusSignal, setFocusSignal] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const threadsRef = useRef(threads);
  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  const threadKey = context.lessonSlug
    ? `lesson:${context.courseSlug ?? ""}/${context.lessonSlug}`
    : context.courseSlug
      ? `course:${context.courseSlug}`
      : `page:${pathname}`;
  // false during server render and hydration, true afterwards: lets us read sessionStorage safely.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const messages = useMemo<EveMessage[]>(
    () => threads[threadKey] ?? (hydrated ? readThread(threadKey) : []),
    [threads, threadKey, hydrated],
  );

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
      .catch(() => setHealth({ anthropic: false, database: false, model: "" }));
  }, []);

  const setContext = useCallback((c: EveContextInfo) => {
    setContextState((prev) =>
      prev.courseSlug === c.courseSlug && prev.lessonSlug === c.lessonSlug && prev.lessonTitle === c.lessonTitle ? prev : c,
    );
  }, []);

  const patchThread = useCallback(
    (key: string, fn: (msgs: EveMessage[]) => EveMessage[]) => {
      setThreads((prev) => {
        const next = { ...prev, [key]: fn(prev[key] ?? readThread(key)) };
        writeThread(key, next[key]);
        return next;
      });
    },
    [],
  );

  const send = useCallback(
    async (rawText: string, highlight?: string) => {
      const text = rawText.trim();
      if (!text || abortRef.current) return;
      const key = threadKey;
      const content = highlight
        ? `The learner highlighted this passage from the lesson:\n"""\n${highlight}\n"""\n\nTheir question about it: ${text}`
        : text;
      const userMsg: EveMessage = { id: uid(), role: "user", content, text, highlight };
      const assistantMsg: EveMessage = { id: uid(), role: "assistant", content: "", streaming: true };
      const history = (threadsRef.current[key] ?? readThread(key))
        .filter((m) => !m.error && m.content)
        .map((m) => ({ role: m.role, content: m.content }));

      patchThread(key, (msgs) => [...msgs, userMsg, assistantMsg]);
      setPendingHighlight(null);
      setDraft("");
      setStreaming(true);
      const ac = new AbortController();
      abortRef.current = ac;

      const setAssistant = (body: string, done: boolean, error = false) =>
        patchThread(key, (msgs) =>
          msgs.map((m) => (m.id === assistantMsg.id ? { ...m, content: body, streaming: !done, error } : m)),
        );

      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ac.signal,
          body: JSON.stringify({
            courseSlug: context.courseSlug,
            lessonSlug: context.lessonSlug,
            page: pathname,
            messages: [...history, { role: "user", content }].slice(-30),
          }),
        });
        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(data.message || `Request failed (${res.status})`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setAssistant(acc, false);
        }
        setAssistant(acc.trim() || "_(Eve had nothing to add.)_", true);
      } catch (err) {
        if (ac.signal.aborted) {
          patchThread(key, (msgs) =>
            msgs.map((m) => (m.id === assistantMsg.id ? { ...m, streaming: false, content: m.content || "_(stopped)_" } : m)),
          );
        } else {
          setAssistant(`**Error:** ${(err as Error).message}`, true, true);
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
      }
    },
    [threadKey, context.courseSlug, context.lessonSlug, pathname, patchThread],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);
  const clear = useCallback(() => {
    stop();
    patchThread(threadKey, () => []);
  }, [stop, patchThread, threadKey]);

  const askAbout = useCallback((highlight: string) => {
    setPendingHighlight(highlight.trim());
    setOpen(true);
    setFocusSignal((n) => n + 1);
  }, []);

  const askWith = useCallback((prompt: string, highlight?: string) => {
    if (highlight) setPendingHighlight(highlight.trim());
    setDraft(prompt);
    setOpen(true);
    setFocusSignal((n) => n + 1);
  }, []);

  const api = useMemo<EveApi>(
    () => ({
      open,
      setOpen,
      context,
      setContext,
      messages,
      streaming,
      send,
      stop,
      clear,
      pendingHighlight,
      setPendingHighlight,
      draft,
      setDraft,
      health,
      askAbout,
      askWith,
      focusSignal,
    }),
    [open, context, setContext, messages, streaming, send, stop, clear, pendingHighlight, draft, health, askAbout, askWith, focusSignal],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useEve(): EveApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEve must be used inside <EveProvider>");
  return ctx;
}

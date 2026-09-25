"use client";

/**
 * The conversation with Eve, built on eve (https://eve.dev).
 *
 * useEveAgent() opens a durable session on the agent in agent/, sends each turn
 * with the page context attached, streams the reply, and projects text and tool
 * calls into message parts. There is one <EveChat> per thread (a lesson, a
 * course, or a page). The session id is kept in sessionStorage so a conversation
 * resumes after navigating away or reloading; the transcript itself lives on the
 * server and is replayed on mount.
 */
import type { ClientSessionState } from "eve/client";
import { useEveAgent, type EveDynamicToolPart, type EveMessage, type EveMessageInputRequest } from "eve/react";
import { Check, LoaderCircle, RotateCcw, Send, Sparkles, Square, TriangleAlert, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { Markdown } from "@/components/Markdown";
import { useEve, type EveContextInfo } from "./EveProvider";

export interface EveChatHandle {
  /** Cancel any running turn, forget the session, and start fresh on the next message. */
  clear: () => Promise<void>;
}

const STORAGE_PREFIX = "sdd:eve:v3:";
/** Sessions are kept a little less long than the agent's sessionTimeoutMs (7 days). */
const MAX_SESSION_AGE_MS = 6 * 24 * 60 * 60 * 1000;

const QUICK_ACTIONS = [
  { label: "Explain this simply", prompt: "Explain this passage in plain English, as if I have never built an AI system before." },
  { label: "Give me another example", prompt: "Give me a different, concrete example of this idea using the course's running example." },
  { label: "Why does this matter?", prompt: "Why does this matter in practice? What goes wrong if I ignore it?" },
  { label: "Quiz me on this", prompt: "Ask me one short question to check I understood this passage. Wait for my answer before telling me if I'm right." },
];

const TOOL_LABELS: Record<string, string> = {
  get_lesson: "Reading the lesson",
  get_course: "Reading the course overview",
  lookup_term: "Checking the glossary",
  get_quiz: "Looking at the quiz",
  list_courses: "Listing the courses",
  load_skill: "Loading a teaching skill",
};

function suggestionsFor(lessonTitle?: string, courseTitle?: string, pathname?: string): string[] {
  if (lessonTitle) {
    return [
      `Give me the main idea of "${lessonTitle}" in two sentences.`,
      "Walk me through the first example in this lesson step by step.",
      "What is the most common mistake people make with this topic?",
    ];
  }
  if (pathname?.endsWith("/glossary")) {
    return ["Which terms in this glossary should I learn first?", "Pick two related terms and explain the difference with an example.", "Quiz me on three terms from this glossary."];
  }
  if (courseTitle) {
    return [`What will I be able to do after "${courseTitle}"?`, "Which lesson should I start with, and why?", "Give me the one-paragraph version of this course."];
  }
  return ["Which course should I start with if I'm a complete beginner?", "What is spec-driven development in one paragraph?", "How do the quizzes and grading work here?"];
}

interface SavedThread {
  session: ClientSessionState;
  savedAt: number;
}

function readSavedSession(key: string): ClientSessionState | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return undefined;
    const saved = JSON.parse(raw) as SavedThread;
    if (!saved.session?.sessionId || Date.now() - saved.savedAt > MAX_SESSION_AGE_MS) return undefined;
    return saved.session;
  } catch {
    return undefined;
  }
}

function writeSavedSession(key: string, session: ClientSessionState | undefined) {
  try {
    if (!session) sessionStorage.removeItem(STORAGE_PREFIX + key);
    else sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify({ session, savedAt: Date.now() } satisfies SavedThread));
  } catch {
    /* storage unavailable: the chat still works, it just will not resume */
  }
}

/** Per-turn context for the agent (never stored in the session history). */
function contextFor(context: EveContextInfo, pathname: string): Record<string, string> {
  const out: Record<string, string> = { page: pathname };
  for (const [key, value] of Object.entries(context)) if (typeof value === "string" && value) out[key] = value;
  return out;
}

function quoteBlock(text: string): string {
  return text
    .trim()
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

/** A user message that starts with a markdown quote is a highlight plus a question. */
function splitQuote(text: string): { highlight?: string; question: string } {
  const lines = text.split("\n");
  if (!lines[0]?.startsWith("> ")) return { question: text };
  const quoted: string[] = [];
  let i = 0;
  while (i < lines.length && lines[i]?.startsWith("> ")) {
    quoted.push(lines[i]!.slice(2));
    i += 1;
  }
  return { highlight: quoted.join("\n"), question: lines.slice(i).join("\n").trim() };
}

function messageText(message: EveMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1" aria-label="Eve is thinking">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </span>
  );
}

function ToolChip({ part }: { part: EveDynamicToolPart }) {
  const label = TOOL_LABELS[part.toolName] ?? part.toolName.replace(/_/g, " ");
  const running = part.state === "input-streaming" || part.state === "input-available" || part.state === "approval-requested" || part.state === "approval-responded";
  const failed = part.state === "output-error" || part.state === "output-denied";
  return (
    <span className="my-1 mr-1 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-muted">
      {running ? <LoaderCircle size={12} className="animate-spin" /> : failed ? <TriangleAlert size={12} /> : <Check size={12} />}
      {label}
      {failed ? " (failed)" : ""}
    </span>
  );
}

function UserBubble({ message }: { message: EveMessage }) {
  const { highlight, question } = splitQuote(messageText(message));
  return (
    <div className="flex justify-end">
      <div className="eve-msg-user max-w-[92%] px-3 py-2">
        {highlight ? <div className="eve-quote mb-2">“{highlight}”</div> : null}
        <div className="whitespace-pre-wrap text-[0.95rem]">{question}</div>
      </div>
    </div>
  );
}

/** `thinking` is true only while this (last) message's turn is still running, so a failed turn never shows dots. */
function AssistantBubble({ message, thinking }: { message: EveMessage; thinking: boolean }) {
  const hasContent = message.parts.some((p) => (p.type === "text" && p.text.trim().length > 0) || p.type === "dynamic-tool");
  if (!hasContent && !thinking) return null;
  return (
    <div className="flex justify-start">
      <div className="eve-msg-assistant max-w-[92%] px-3 py-2">
        {message.parts.map((part, i) => {
          if (part.type === "text") return part.text.trim() ? <Markdown key={i} content={part.text} className="prose-compact" /> : null;
          if (part.type === "dynamic-tool") return <ToolChip key={part.toolCallId} part={part} />;
          return null;
        })}
        {thinking && !messageText(message).trim() ? <TypingDots /> : null}
      </div>
    </div>
  );
}

/** Questions the agent asks the learner (approvals, session limits). Eve's tools need no approval, so this is rare. */
function pendingInputRequests(messages: readonly EveMessage[]): EveMessageInputRequest[] {
  return messages
    .flatMap((m) => m.parts)
    .flatMap((part) => {
      if (part.type !== "dynamic-tool" || part.state !== "approval-requested") return [];
      const request = part.toolMetadata?.eve?.inputRequest;
      return request ? [request] : [];
    });
}

export function EveChat({ threadKey, ref }: { threadKey: string; ref?: Ref<EveChatHandle> }) {
  const pathname = usePathname();
  const { context, open, pendingHighlight, setPendingHighlight, draft, setDraft, health, focusSignal } = useEve();
  const [saved] = useState(() => readSavedSession(threadKey));
  const agent = useEveAgent({
    initialSession: saved ? { sessionId: saved.sessionId, streamIndex: 0 } : undefined,
    resume: saved !== undefined,
    onSessionChange: (session) => writeSavedSession(threadKey, session),
  });
  const { status, error, data, events, send: agentSend, respond, cancel, reset } = agent;
  const messages = data.messages;
  const busy = status === "submitted" || status === "streaming";
  const resuming = status === "resuming";
  /** A failed or completed session cannot take another message; the next send starts a new one. */
  const ended = events.some((e) => e.type === "session.failed" || e.type === "session.completed");
  const noTutor = health !== null && !health.tutor;
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, focusSignal]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pendingHighlight, status]);

  const clear = useCallback(async () => {
    if (busy) {
      try {
        await cancel();
      } catch {
        /* the turn may already have settled */
      }
    }
    reset();
    writeSavedSession(threadKey, undefined);
  }, [busy, cancel, reset, threadKey]);

  useImperativeHandle(ref, () => ({ clear }), [clear]);

  const send = useCallback(
    async (rawText: string, highlight?: string) => {
      const text = rawText.trim();
      if (!text || busy || resuming || noTutor) return;
      if (ended || (status === "error" && messages.length === 0)) {
        // The session ended (or a saved one could not be resumed): start a fresh one instead of retrying it.
        reset();
        writeSavedSession(threadKey, undefined);
      }
      const message = highlight ? `${quoteBlock(highlight)}\n\n${text}` : text;
      setPendingHighlight(null);
      setDraft("");
      try {
        await agentSend(message, { clientContext: contextFor(context, pathname) });
      } catch (err) {
        console.warn("Eve could not send the message", err);
      }
    },
    [busy, resuming, noTutor, ended, status, messages.length, reset, threadKey, setPendingHighlight, setDraft, agentSend, context, pathname],
  );

  const lastMessage = messages[messages.length - 1];
  const showThinking = busy && !(lastMessage?.role === "assistant" && messageText(lastMessage).trim());
  const inputs = pendingInputRequests(messages);
  const suggestions = suggestionsFor(context.lessonTitle, context.courseTitle, pathname);
  const canType = !noTutor && !resuming;

  return (
    <>
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && resuming ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <LoaderCircle size={14} className="animate-spin" /> Picking up your conversation…
          </p>
        ) : null}

        {messages.length === 0 && !resuming && !error ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Hi! I&apos;m Eve. Highlight any text in a lesson and click <strong>Ask Eve</strong>, or start with one of these:
            </p>
            <div className="flex flex-col gap-2">
              {suggestions.map((s) => (
                <button key={s} type="button" className="btn btn-sm justify-start text-left" onClick={() => setDraft(s)} disabled={!canType}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m, i) =>
          m.role === "user" ? <UserBubble key={m.id} message={m} /> : <AssistantBubble key={m.id} message={m} thinking={busy && i === messages.length - 1} />,
        )}

        {showThinking ? (
          <div className="flex justify-start">
            <div className="eve-msg-assistant px-3 py-2">
              <TypingDots />
            </div>
          </div>
        ) : null}

        {inputs.map((request) => (
          <div key={request.requestId} className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
            <p className="font-medium">{request.prompt}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {request.options?.map((option) => (
                <button key={option.id} type="button" className="btn btn-sm" onClick={() => void respond([{ requestId: request.requestId, optionId: option.id }])}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {ended && !error ? (
          <p className="text-center text-xs text-muted">This conversation has ended. Your next message starts a new one.</p>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-danger/40 bg-danger-soft p-3 text-sm">
            <div className="flex items-start gap-2">
              <TriangleAlert size={16} className="mt-0.5 flex-none text-danger" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-danger">Eve hit a problem</div>
                <p className="mt-1 break-words text-muted">{error.message.slice(0, 400)}</p>
                <button type="button" className="btn btn-sm mt-2" onClick={() => void clear()}>
                  <RotateCcw size={13} /> Start a new chat
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <footer className="border-t border-border p-3">
        {pendingHighlight ? (
          <div className="mb-2 space-y-2">
            <div className="flex items-start gap-2">
              <div className="eve-quote flex-1">“{pendingHighlight}”</div>
              <button type="button" className="btn btn-sm" onClick={() => setPendingHighlight(null)} aria-label="Remove highlight">
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((a) => (
                <button key={a.label} type="button" className="pill pill-eve cursor-pointer" onClick={() => void send(a.prompt, pendingHighlight)} disabled={!canType || busy}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            className="input min-h-[44px] max-h-40 flex-1 resize-y"
            rows={1}
            placeholder={pendingHighlight ? "Ask about the highlighted text…" : "Ask Eve anything about this lesson…"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(draft, pendingHighlight ?? undefined);
              }
            }}
            disabled={!canType}
          />
          {busy ? (
            <button type="button" className="btn" onClick={() => void cancel().catch(() => undefined)} aria-label="Stop">
              <Square size={16} />
            </button>
          ) : (
            <button type="button" className="btn btn-eve" onClick={() => void send(draft, pendingHighlight ?? undefined)} disabled={!canType || !draft.trim()} aria-label="Send">
              <Send size={16} />
            </button>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted">
          <Sparkles size={11} /> Eve can make mistakes. Check important claims against the lesson. <kbd>Enter</kbd> sends, <kbd>Shift+Enter</kbd> adds a line.
        </div>
      </footer>
    </>
  );
}

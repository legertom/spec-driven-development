"use client";

import { Bot, Eraser, Send, Sparkles, Square, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Markdown } from "@/components/Markdown";
import { useEve } from "./EveProvider";

const QUICK_ACTIONS = [
  { label: "Explain this simply", prompt: "Explain this passage in plain English, as if I have never built an AI system before." },
  { label: "Give me another example", prompt: "Give me a different, concrete example of this idea using Pip's Plant Shop." },
  { label: "Why does this matter?", prompt: "Why does this matter in practice? What goes wrong if I ignore it?" },
  { label: "Quiz me on this", prompt: "Ask me one short question to check I understood this passage. Wait for my answer before telling me if I'm right." },
];

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

export function EveDrawer() {
  const eve = useEve();
  const pathname = usePathname();
  const { open, setOpen, context, messages, streaming, send, stop, clear, pendingHighlight, setPendingHighlight, draft, setDraft, health, focusSignal } = eve;
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const noKey = health !== null && !health.tutor;

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, focusSignal]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pendingHighlight]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  function submit() {
    if (noKey || streaming) return;
    const text = draft.trim();
    if (!text) return;
    void send(text, pendingHighlight ?? undefined);
  }

  const suggestions = suggestionsFor(context.lessonTitle, context.courseTitle, pathname);

  return (
    <aside className="eve-drawer" data-open={open} aria-label="Eve, your tutor" aria-hidden={!open}>
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-eve-soft text-eve">
          <Bot size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-bold leading-tight">Eve · your tutor</div>
          <div className="truncate text-xs text-muted">
            {context.lessonSlug
              ? `${context.courseTitle ? `${context.courseTitle} · ` : ""}${context.lessonNumber} · ${context.lessonTitle}`
              : context.courseTitle
                ? `Course: ${context.courseTitle}`
                : "Platform-wide questions"}
          </div>
        </div>
        <button type="button" className="btn btn-sm" onClick={clear} aria-label="Clear conversation" title="Clear conversation">
          <Eraser size={14} />
        </button>
        <button type="button" className="btn btn-sm" onClick={() => setOpen(false)} aria-label="Close">
          <X size={16} />
        </button>
      </header>

      {noKey ? (
        <div className="m-3 rounded-lg border border-border bg-surface-2 p-3 text-sm">
          <div className="font-semibold">Eve is not connected yet</div>
          <p className="mt-1 text-muted">
            Eve runs through Vercel AI Gateway. Add an <code>AI_GATEWAY_API_KEY</code> environment variable on the server (locally in{" "}
            <code>.env.local</code>; on Vercel it can also authenticate automatically with OIDC) and restart. Everything else works without it.
          </p>
        </div>
      ) : null}

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Hi! I&apos;m Eve. Highlight any text in a lesson and click <strong>Ask Eve</strong>, or start with one of these:
            </p>
            <div className="flex flex-col gap-2">
              {suggestions.map((s) => (
                <button key={s} type="button" className="btn btn-sm justify-start text-left" onClick={() => setDraft(s)} disabled={noKey}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[92%] px-3 py-2 ${m.role === "user" ? "eve-msg-user" : "eve-msg-assistant"}`}>
              {m.highlight ? <div className="eve-quote mb-2">“{m.highlight}”</div> : null}
              {m.role === "user" ? (
                <div className="whitespace-pre-wrap text-[0.95rem]">{m.text ?? m.content}</div>
              ) : m.content ? (
                <Markdown content={m.content} className="prose-compact" />
              ) : (
                <span className="inline-flex gap-1 py-1" aria-label="Eve is thinking">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
              )}
            </div>
          </div>
        ))}
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
                <button key={a.label} type="button" className="pill pill-eve cursor-pointer" onClick={() => void send(a.prompt, pendingHighlight)} disabled={noKey || streaming}>
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
                submit();
              }
            }}
            disabled={noKey}
          />
          {streaming ? (
            <button type="button" className="btn" onClick={stop} aria-label="Stop">
              <Square size={16} />
            </button>
          ) : (
            <button type="button" className="btn btn-eve" onClick={submit} disabled={noKey || !draft.trim()} aria-label="Send">
              <Send size={16} />
            </button>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted">
          <Sparkles size={11} /> Eve can make mistakes. Check important claims against the lesson. <kbd>Enter</kbd> sends, <kbd>Shift+Enter</kbd> adds a line.
        </div>
      </footer>
    </aside>
  );
}

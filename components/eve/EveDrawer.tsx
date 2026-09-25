"use client";

import { Bot, Eraser, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { EveChat, type EveChatHandle } from "./EveChat";
import { useEve } from "./EveProvider";

export function EveDrawer() {
  const { open, setOpen, everOpened, context, health, threadKey } = useEve();
  const chatRef = useRef<EveChatHandle>(null);
  const noTutor = health !== null && !health.tutor;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

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
        <button type="button" className="btn btn-sm" onClick={() => void chatRef.current?.clear()} aria-label="New conversation" title="New conversation">
          <Eraser size={14} />
        </button>
        <button type="button" className="btn btn-sm" onClick={() => setOpen(false)} aria-label="Close">
          <X size={16} />
        </button>
      </header>

      {noTutor ? (
        <div className="m-3 rounded-lg border border-border bg-surface-2 p-3 text-sm">
          <div className="font-semibold">Eve is not connected yet</div>
          <p className="mt-1 text-muted">
            Eve is an <a href="https://eve.dev" className="underline" target="_blank" rel="noreferrer">eve</a> agent that runs next to this site. Locally, <code>npm run dev</code> starts it
            (Node 24 or newer); on Vercel it deploys as part of this project. Replies also need AI Gateway credentials on the server: an{" "}
            <code>AI_GATEWAY_API_KEY</code> in <code>.env.local</code>, or OIDC on Vercel. Everything else works without it.
          </p>
        </div>
      ) : null}

      {/* The chat mounts the first time the drawer opens and remounts per thread (lesson, course, or page). */}
      {everOpened ? <EveChat key={threadKey} threadKey={threadKey} ref={chatRef} /> : <div className="flex-1" />}
    </aside>
  );
}

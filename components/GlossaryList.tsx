"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GlossaryEntry } from "@/lib/course-types";
import { AskEveButton } from "./eve/AskEveButton";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function GlossaryList({
  courseSlug,
  entries,
  shortTitles,
  exampleHint,
}: {
  courseSlug: string;
  entries: GlossaryEntry[];
  shortTitles: Record<string, string>;
  /** Name of the course's running example, used in the Ask Eve prompt. */
  exampleHint?: string;
}) {
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState<string | null>(null);

  // Support /glossary#term-id links: scroll to the term once the list has rendered.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const t = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: "start" }), 50);
    return () => window.clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (letter && !e.term.toUpperCase().startsWith(letter)) return false;
      if (!q) return true;
      return e.term.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q) || e.id.includes(q);
    });
  }, [entries, query, letter]);

  const available = new Set(entries.map((e) => e.term[0]?.toUpperCase()));
  const byId = new Map(entries.map((e) => [e.id, e]));

  return (
    <div>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="input pl-9"
          placeholder={`Search ${entries.length} terms…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search glossary"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        <button type="button" className={`pill cursor-pointer ${letter === null ? "pill-accent" : ""}`} onClick={() => setLetter(null)}>
          All
        </button>
        {LETTERS.map((l) => (
          <button
            key={l}
            type="button"
            className={`pill cursor-pointer ${letter === l ? "pill-accent" : ""}`}
            onClick={() => setLetter(letter === l ? null : l)}
            disabled={!available.has(l)}
            style={!available.has(l) ? { opacity: 0.35, cursor: "default" } : undefined}
          >
            {l}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">
        {filtered.length} term{filtered.length === 1 ? "" : "s"}
      </p>
      <div className="mt-4 space-y-4">
        {filtered.map((e) => (
          <article key={e.id} id={e.id} className="card scroll-mt-24 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-lg font-bold">{e.term}</h2>
              <AskEveButton size="sm" label="Ask Eve" prompt={`Explain "${e.term}" with a new example${exampleHint ? ` from ${exampleHint}` : ""}, then tell me why it matters.`} />
            </div>
            <p className="mt-2">{e.definition}</p>
            <p className="mt-2 text-sm">
              <span className="font-semibold text-[color:var(--co-example)]">Example: </span>
              <span className="text-muted">{e.example}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              {e.lessons.length ? (
                <span>
                  Appears in:{" "}
                  {e.lessons.map((slug, i) => (
                    <span key={slug}>
                      {i > 0 ? ", " : ""}
                      <Link href={`/courses/${courseSlug}/${slug}`} className="underline">
                        {slug.slice(0, 2).toUpperCase()} {shortTitles[slug] ?? slug}
                      </Link>
                    </span>
                  ))}
                </span>
              ) : null}
              {e.related.length ? (
                <span>
                  Related:{" "}
                  {e.related.map((id, i) => (
                    <span key={id}>
                      {i > 0 ? ", " : ""}
                      <a href={`#${id}`} className="underline">
                        {byId.get(id)?.term ?? id}
                      </a>
                    </span>
                  ))}
                </span>
              ) : null}
            </div>
          </article>
        ))}
        {filtered.length === 0 ? <p className="text-muted">No terms match. Try a shorter word.</p> : null}
      </div>
    </div>
  );
}

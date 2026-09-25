import type { Metadata } from "next";
import Link from "next/link";
import { StatusPill } from "@/components/StatusPill";
import { getAllLessonMeta } from "@/lib/content";
import { MODULES } from "@/lib/course";

export const metadata: Metadata = { title: "Syllabus" };

const VERB_CLASS: Record<string, string> = {
  Analyze: "text-[color:var(--co-example)]",
  Measure: "text-[color:var(--co-warning)]",
  Improve: "text-[color:var(--co-key)]",
  Bonus: "text-muted",
};

export default function CoursePage() {
  const lessons = getAllLessonMeta();
  const bySlug = new Map(lessons.map((l) => [l.slug, l]));
  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight">Syllabus</h1>
      <p className="mt-2 max-w-prose text-muted">
        Five modules, nine core lessons, a beginner primer, and a bonus interview lesson. Each lesson maps to one of three verbs: <strong>Analyze</strong> (what is the agent doing?), <strong>Measure</strong> (how often does it fail, and can we detect it?), <strong>Improve</strong> (which change helps at the lowest cost?).
      </p>
      <div className="mt-8 space-y-8">
        {MODULES.map((m) => (
          <section key={m.id}>
            <h2 className="text-lg font-bold">
              <span className="mr-2 text-muted">Module {m.id}</span>
              {m.title}
            </h2>
            <p className="mt-1 max-w-prose text-sm text-muted">{m.blurb}</p>
            <ul className="mt-3 space-y-3">
              {m.lessons.map((slug) => {
                const l = bySlug.get(slug)!;
                return (
                  <li key={slug} className="card p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold">{l.number}</span>
                      <span className={`font-semibold ${VERB_CLASS[l.verb]}`}>{l.verb}</span>
                      <span className="text-muted">· {l.minutes} min</span>
                      <span className="ml-auto">
                        <StatusPill slug={slug} />
                      </span>
                    </div>
                    <Link href={`/course/${slug}`} className="mt-1 block text-lg font-bold hover:underline">
                      {l.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted">{l.summary}</p>
                    {l.objectives.length ? (
                      <ul className="mt-2 list-disc pl-5 text-sm">
                        {l.objectives.slice(0, 3).map((o) => (
                          <li key={o}>{o}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}

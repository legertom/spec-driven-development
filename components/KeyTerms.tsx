import Link from "next/link";
import type { GlossaryEntry } from "@/lib/course-types";

export function KeyTerms({ courseSlug, entries }: { courseSlug: string; entries: GlossaryEntry[] }) {
  if (!entries.length) return null;
  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold">Key terms in this lesson</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {entries.map((g) => (
          <Link key={g.id} href={`/courses/${courseSlug}/glossary#${g.id}`} className="pill hover:bg-accent-soft hover:text-accent" title={g.definition}>
            {g.term}
          </Link>
        ))}
      </div>
    </section>
  );
}

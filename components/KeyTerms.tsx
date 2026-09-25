import Link from "next/link";
import { GLOSSARY } from "@/content/glossary";

export function KeyTerms({ ids }: { ids: string[] }) {
  const entries = ids.map((id) => GLOSSARY.find((g) => g.id === id)).filter((g): g is NonNullable<typeof g> => Boolean(g));
  if (!entries.length) return null;
  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold">Key terms in this lesson</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {entries.map((g) => (
          <Link key={g.id} href={`/glossary#${g.id}`} className="pill hover:bg-accent-soft hover:text-accent" title={g.definition}>
            {g.term}
          </Link>
        ))}
      </div>
    </section>
  );
}

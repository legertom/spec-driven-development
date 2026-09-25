import type { Metadata } from "next";
import { GlossaryList } from "@/components/GlossaryList";
import { GLOSSARY } from "@/content/glossary";

export const metadata: Metadata = { title: "Glossary" };

export default function GlossaryPage() {
  return (
    <main className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Glossary</h1>
      <p className="mt-2 max-w-prose text-muted">
        Every term in the course, in plain English, with an example. Click <strong>Ask Eve</strong> on any term for a fresh explanation, or highlight part of a definition.
      </p>
      <div className="mt-6">
        <GlossaryList entries={GLOSSARY} />
      </div>
    </main>
  );
}

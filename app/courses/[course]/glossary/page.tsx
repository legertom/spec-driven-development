import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EveContext } from "@/components/eve/EveContext";
import { GlossaryList } from "@/components/GlossaryList";
import { getCourse, getCourses, getGlossary } from "@/lib/courses";

export function generateStaticParams() {
  return getCourses().map((c) => ({ course: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/courses/[course]/glossary">): Promise<Metadata> {
  const { course: slug } = await params;
  const course = getCourse(slug);
  return { title: course ? `Glossary · ${course.shortTitle}` : "Glossary" };
}

export default async function GlossaryPage({ params }: PageProps<"/courses/[course]/glossary">) {
  const { course: slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();
  const entries = getGlossary(course.slug);
  return (
    <main className="max-w-[900px]">
      <EveContext courseSlug={course.slug} courseTitle={course.title} />
      <h1 className="text-3xl font-extrabold tracking-tight">Glossary</h1>
      <p className="mt-2 max-w-prose text-muted">
        Every term in <strong>{course.title}</strong>, in plain English, with an example. Click <strong>Ask Eve</strong> on any term for a fresh explanation, or highlight part of a definition.
      </p>
      <div className="mt-6">
        {entries.length ? (
          <GlossaryList courseSlug={course.slug} entries={entries} shortTitles={course.shortTitles} exampleHint={course.runningExample?.title} />
        ) : (
          <p className="text-muted">This course does not have a glossary yet.</p>
        )}
      </div>
    </main>
  );
}

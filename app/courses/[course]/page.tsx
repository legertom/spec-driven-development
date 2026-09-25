import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EveContext } from "@/components/eve/EveContext";
import { ModuleCards } from "@/components/ModuleCards";
import { StatusPill } from "@/components/StatusPill";
import { getAllLessonMeta } from "@/lib/content";
import { getCourse, getCourses, verbColor } from "@/lib/courses";

export function generateStaticParams() {
  return getCourses().map((c) => ({ course: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/courses/[course]">): Promise<Metadata> {
  const { course: slug } = await params;
  const course = getCourse(slug);
  return { title: course?.title ?? "Course", description: course?.tagline };
}

export default async function CoursePage({ params }: PageProps<"/courses/[course]">) {
  const { course: slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();
  const lessons = getAllLessonMeta(course.slug);
  const bySlug = new Map(lessons.map((l) => [l.slug, l]));
  const totalMinutes = lessons.reduce((a, l) => a + l.minutes, 0);
  const first = course.lessonOrder[0];

  return (
    <main>
      <EveContext courseSlug={course.slug} courseTitle={course.title} courseNotes={course.tutorNotes} />

      <section className="grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="pill pill-accent">{course.level}</span>
            {course.audience ? <span className="pill">{course.audience.split(".")[0]}</span> : null}
          </div>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{course.title}</h1>
          <p className="mt-3 text-lg text-muted">{course.tagline}</p>
          {course.description ? <p className="mt-3 max-w-prose text-muted">{course.description}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            {first ? (
              <Link href={`/courses/${course.slug}/${first}`} className="btn btn-primary">
                Start with {bySlug.get(first)?.number ?? "the first lesson"}
              </Link>
            ) : null}
            <Link href={`/courses/${course.slug}/glossary`} className="btn">
              Glossary
            </Link>
          </div>
          <p className="mt-3 text-sm text-muted">
            {course.lessonCount} lessons · about {Math.max(1, Math.round(totalMinutes / 60))} hours of reading · quizzes graded by code and by Eve
          </p>
        </div>

        {course.pipeline.length ? (
          <div className="card p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">What you will build</div>
            <ol className="mt-3 space-y-2">
              {course.pipeline.map((p, i) => (
                <li key={p.step} className="flex items-center gap-3 text-sm">
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: verbColor(course, p.verb) }}>
                    {i + 1}
                  </span>
                  <span className="font-semibold">{p.step}</span>
                  <span className="text-muted">{p.note}</span>
                </li>
              ))}
            </ol>
            {course.verbs.length ? (
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                {course.verbs.map((v) => (
                  <span key={v.name} className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: verbColor(course, v.name) }} /> {v.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {course.verbs.length ? (
        <section className="mt-10 card p-5">
          <h2 className="text-lg font-bold">How the course is organized</h2>
          <div className="prose-lesson mt-3 max-w-none">
            <table>
              <thead>
                <tr>
                  <th>Phase</th>
                  <th>Question it answers</th>
                  <th>Lessons</th>
                </tr>
              </thead>
              <tbody>
                {course.verbs.map((v) => (
                  <tr key={v.name}>
                    <td>
                      <strong style={{ color: verbColor(course, v.name) }}>{v.name}</strong>
                    </td>
                    <td>{v.question}</td>
                    <td>{v.lessons}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Modules</h2>
        <div className="mt-4">
          <ModuleCards course={course} lessons={lessons} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Every lesson</h2>
        <div className="mt-4 space-y-8">
          {course.modules.map((m) => (
            <div key={m.id}>
              <h3 className="text-lg font-bold">
                <span className="mr-2 text-muted">Module {m.id}</span>
                {m.title}
              </h3>
              <ul className="mt-3 space-y-3">
                {m.lessons.map((slug) => {
                  const l = bySlug.get(slug)!;
                  return (
                    <li key={slug} className="card p-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold">{l.number}</span>
                        {l.verb ? (
                          <span className="font-semibold" style={{ color: verbColor(course, l.verb) }}>
                            {l.verb}
                          </span>
                        ) : null}
                        <span className="text-muted">· {l.minutes} min</span>
                        <span className="ml-auto">
                          <StatusPill courseSlug={course.slug} lessonSlug={slug} />
                        </span>
                      </div>
                      <Link href={`/courses/${course.slug}/${slug}`} className="mt-1 block text-lg font-bold hover:underline">
                        {l.title}
                      </Link>
                      <p className="mt-1 text-sm text-muted">{l.summary}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {course.runningExample ? (
        <section className="mt-10 card p-6">
          <h2 className="text-xl font-bold">Meet {course.runningExample.title}</h2>
          <p className="mt-2 max-w-prose text-muted">{course.runningExample.summary}</p>
          {course.runningExample.tools.length ? (
            <div className="prose-lesson mt-4 max-w-none">
              <table>
                <thead>
                  <tr>
                    <th>Tool</th>
                    <th>What it does</th>
                    <th>Risk tier</th>
                  </tr>
                </thead>
                <tbody>
                  {course.runningExample.tools.map((t) => (
                    <tr key={t.name}>
                      <td>
                        <code>{t.name}</code>
                      </td>
                      <td>{t.does}</td>
                      <td>{t.tier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      {course.credits ? <p className="mt-8 text-sm text-muted">{course.credits}</p> : null}
    </main>
  );
}

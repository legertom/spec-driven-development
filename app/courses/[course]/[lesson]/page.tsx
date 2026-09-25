import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EveContext } from "@/components/eve/EveContext";
import { HighlightMenu } from "@/components/eve/HighlightMenu";
import { InstructorNotes } from "@/components/InstructorNotes";
import { KeyTerms } from "@/components/KeyTerms";
import { LessonNav } from "@/components/LessonNav";
import { Markdown } from "@/components/Markdown";
import { CompleteButton } from "@/components/progress/CompleteButton";
import { LessonVisit } from "@/components/progress/LessonVisit";
import { Quiz } from "@/components/quiz/Quiz";
import { getLesson, getLessonMeta, getNotes, getQuiz, toPublicQuiz } from "@/lib/content";
import { getCourse, getCourses, getGlossary, isLessonSlug, neighbors, verbColor } from "@/lib/courses";

export function generateStaticParams() {
  return getCourses().flatMap((c) => c.lessonOrder.map((lesson) => ({ course: c.slug, lesson })));
}

export async function generateMetadata({ params }: PageProps<"/courses/[course]/[lesson]">): Promise<Metadata> {
  const { course: courseSlug, lesson: slug } = await params;
  const course = getCourse(courseSlug);
  const meta = course && isLessonSlug(course, slug) ? getLessonMeta(course.slug, slug) : null;
  return { title: meta ? `${meta.number} · ${meta.title}` : "Lesson", description: meta?.summary };
}

export default async function LessonPage({ params }: PageProps<"/courses/[course]/[lesson]">) {
  const { course: courseSlug, lesson: slug } = await params;
  const course = getCourse(courseSlug);
  if (!course || !isLessonSlug(course, slug)) notFound();
  const lesson = getLesson(course.slug, slug);
  const { prev, next } = neighbors(course, slug);
  const prevMeta = prev ? getLessonMeta(course.slug, prev) : undefined;
  const nextMeta = next ? getLessonMeta(course.slug, next) : undefined;

  if (!lesson) {
    const meta = getLessonMeta(course.slug, slug);
    return (
      <main className="max-w-[72ch]">
        <h1 className="text-3xl font-extrabold">{meta.title}</h1>
        <p className="mt-3 text-muted">This lesson is still being written. Check back soon.</p>
        <LessonNav courseSlug={course.slug} prev={prevMeta} next={nextMeta} />
      </main>
    );
  }

  const quiz = getQuiz(course.slug, slug);
  const notes = getNotes(course.slug, slug);
  const prereqs = lesson.prereqs.map((p) => getLessonMeta(course.slug, p));
  const glossary = getGlossary(course.slug);
  const keyTerms = lesson.keyTerms.map((id) => glossary.find((g) => g.id === id)).filter((g): g is NonNullable<typeof g> => Boolean(g));

  return (
    <main className="max-w-[76ch]">
      <EveContext courseSlug={course.slug} courseTitle={course.title} lessonSlug={lesson.slug} lessonTitle={lesson.title} lessonNumber={lesson.number} />
      <LessonVisit courseSlug={course.slug} lessonSlug={lesson.slug} />

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href={`/courses/${course.slug}`} className="hover:underline">
          {course.shortTitle}
        </Link>
        <span>·</span>
        <span>
          Module {lesson.module} · {lesson.moduleTitle}
        </span>
        <span>·</span>
        <span className="font-semibold text-ink">{lesson.number}</span>
        <span>·</span>
        <span>{lesson.minutes} min</span>
        {lesson.verb ? (
          <span className="pill" style={{ color: verbColor(course, lesson.verb), borderColor: "transparent", background: "color-mix(in srgb, currentColor 12%, transparent)" }}>
            {lesson.verb}
          </span>
        ) : null}
      </div>
      <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{lesson.title}</h1>
      <p className="mt-3 text-lg text-muted">{lesson.summary}</p>
      {prereqs.length ? (
        <p className="mt-2 text-sm text-muted">
          Before this:{" "}
          {prereqs.map((p, i) => (
            <span key={p.slug}>
              {i > 0 ? ", " : ""}
              <Link href={`/courses/${course.slug}/${p.slug}`} className="underline">
                {p.number} {p.shortTitle}
              </Link>
            </span>
          ))}
        </p>
      ) : null}

      {lesson.objectives.length ? (
        <div className="card mt-6 p-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">What you&apos;ll learn</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {lesson.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div id="lesson-content">
        <div className="mt-8">
          <Markdown content={lesson.body} />
        </div>
        <KeyTerms courseSlug={course.slug} entries={keyTerms} />
        {quiz ? <Quiz quiz={toPublicQuiz(quiz)} courseSlug={course.slug} lessonSlug={lesson.slug} /> : null}
      </div>
      <HighlightMenu containerId="lesson-content" />

      {notes ? <InstructorNotes notes={notes} /> : null}

      <div className="mt-12 border-t border-border pt-8">
        <CompleteButton courseSlug={course.slug} lessonSlug={lesson.slug} />
      </div>
      <LessonNav courseSlug={course.slug} prev={prevMeta} next={nextMeta} />
    </main>
  );
}

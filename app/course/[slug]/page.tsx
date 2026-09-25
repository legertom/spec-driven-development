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
import { isLessonSlug, LESSON_ORDER, neighbors } from "@/lib/course";

export function generateStaticParams() {
  return LESSON_ORDER.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/course/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const meta = isLessonSlug(slug) ? getLessonMeta(slug) : null;
  return { title: meta ? `${meta.number} · ${meta.title}` : "Lesson", description: meta?.summary };
}

const VERB_STYLE: Record<string, string> = {
  Analyze: "var(--co-example)",
  Measure: "var(--co-warning)",
  Improve: "var(--co-key)",
  Bonus: "var(--muted)",
};

export default async function LessonPage({ params }: PageProps<"/course/[slug]">) {
  const { slug } = await params;
  if (!isLessonSlug(slug)) notFound();
  const lesson = getLesson(slug);
  const { prev, next } = neighbors(slug);
  const prevMeta = prev ? getLessonMeta(prev) : undefined;
  const nextMeta = next ? getLessonMeta(next) : undefined;

  if (!lesson) {
    const meta = getLessonMeta(slug);
    return (
      <main className="max-w-[72ch]">
        <h1 className="text-3xl font-extrabold">{meta.title}</h1>
        <p className="mt-3 text-muted">This lesson is still being written. Check back soon.</p>
        <LessonNav prev={prevMeta} next={nextMeta} />
      </main>
    );
  }

  const quiz = getQuiz(slug);
  const notes = getNotes(slug);
  const prereqs = lesson.prereqs.map((p) => getLessonMeta(p));

  return (
    <main className="max-w-[76ch]">
      <EveContext lessonSlug={lesson.slug} lessonTitle={lesson.title} lessonNumber={lesson.number} />
      <LessonVisit slug={lesson.slug} />

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>
          Module {lesson.module} · {lesson.moduleTitle}
        </span>
        <span>·</span>
        <span className="font-semibold text-ink">{lesson.number}</span>
        <span>·</span>
        <span>{lesson.minutes} min</span>
        <span className="pill" style={{ color: VERB_STYLE[lesson.verb], borderColor: "transparent", background: "color-mix(in srgb, currentColor 12%, transparent)" }}>
          {lesson.verb}
        </span>
      </div>
      <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{lesson.title}</h1>
      <p className="mt-3 text-lg text-muted">{lesson.summary}</p>
      {prereqs.length ? (
        <p className="mt-2 text-sm text-muted">
          Before this:{" "}
          {prereqs.map((p, i) => (
            <span key={p.slug}>
              {i > 0 ? ", " : ""}
              <Link href={`/course/${p.slug}`} className="underline">
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
        <KeyTerms ids={lesson.keyTerms} />
        {quiz ? <Quiz quiz={toPublicQuiz(quiz)} lessonSlug={lesson.slug} /> : null}
      </div>
      <HighlightMenu containerId="lesson-content" />

      {notes ? <InstructorNotes notes={notes} /> : null}

      <div className="mt-12 border-t border-border pt-8">
        <CompleteButton slug={lesson.slug} />
      </div>
      <LessonNav prev={prevMeta} next={nextMeta} />
    </main>
  );
}

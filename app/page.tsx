import { BookOpen, ListChecks, Sparkles } from "lucide-react";
import Link from "next/link";
import { CourseCatalog } from "@/components/CourseCatalog";
import { PLATFORM_DESCRIPTION, PLATFORM_LONG_NAME, PLATFORM_TAGLINE } from "@/lib/platform";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <section className="max-w-3xl">
        <span className="pill pill-accent">Courses for beginner engineers and PMs</span>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{PLATFORM_LONG_NAME}</h1>
        <p className="mt-4 text-lg text-muted">{PLATFORM_TAGLINE}</p>
        <p className="mt-3 text-muted">{PLATFORM_DESCRIPTION}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/courses" className="btn btn-primary">
            Browse courses
          </Link>
          <Link href="/how-it-works" className="btn">
            How this works
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Courses</h2>
        <div className="mt-5">
          <CourseCatalog />
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <BookOpen className="text-accent" />
          <h2 className="mt-2 font-bold">Read, with examples everywhere</h2>
          <p className="mt-1 text-sm text-muted">Every concept is followed by a tiny concrete example from the course&apos;s running world. Callouts flag key ideas, beginner detours, and common mistakes.</p>
        </div>
        <div className="card p-5">
          <Sparkles className="text-eve" />
          <h2 className="mt-2 font-bold">Highlight anything, ask Eve</h2>
          <p className="mt-1 text-sm text-muted">Select a sentence and click &quot;Ask Eve&quot;. She knows the course and the lesson you are reading, and explains, re-examples, or quizzes you on that exact passage.</p>
        </div>
        <div className="card p-5">
          <ListChecks className="text-accent" />
          <h2 className="mt-2 font-bold">Prove it, get feedback</h2>
          <p className="mt-1 text-sm text-muted">Multiple choice is graded instantly in code. Written answers are graded by Eve against a rubric, with strengths, improvements, and a model answer.</p>
        </div>
      </section>
    </main>
  );
}

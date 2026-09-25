import type { Metadata } from "next";
import { ProgressDashboard } from "@/components/progress/ProgressDashboard";
import { getAllLessonMeta, type LessonMeta } from "@/lib/content";
import { getCourses } from "@/lib/courses";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  const courses = getCourses();
  const lessons: Record<string, LessonMeta[]> = {};
  for (const c of courses) lessons[c.slug] = getAllLessonMeta(c.slug);
  return (
    <main className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Your progress</h1>
      <p className="mt-2 max-w-prose text-muted">Lessons you have finished in every course, how your quizzes are going, and where to focus next.</p>
      <div className="mt-6">
        <ProgressDashboard courses={courses} lessons={lessons} />
      </div>
    </main>
  );
}

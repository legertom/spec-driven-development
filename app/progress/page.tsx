import type { Metadata } from "next";
import { ProgressDashboard } from "@/components/progress/ProgressDashboard";
import { getAllLessonMeta } from "@/lib/content";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  const lessons = getAllLessonMeta();
  return (
    <main className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Your progress</h1>
      <p className="mt-2 max-w-prose text-muted">Lessons you have finished, how your quizzes are going, and where to focus next.</p>
      <div className="mt-6">
        <ProgressDashboard lessons={lessons} />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { CourseCatalog } from "@/components/CourseCatalog";

export const metadata: Metadata = { title: "Courses" };

export default function CoursesPage() {
  return (
    <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Courses</h1>
      <p className="mt-2 max-w-prose text-muted">Pick a course. Your progress is saved automatically, and Eve is available on every page.</p>
      <div className="mt-6">
        <CourseCatalog />
      </div>
    </main>
  );
}

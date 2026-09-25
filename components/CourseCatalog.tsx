import { CourseCard } from "@/components/CourseCard";
import { getAllLessonMeta } from "@/lib/content";
import { getCourses } from "@/lib/courses";

/** Server component: lists every course with its total reading time. */
export function CourseCatalog() {
  const courses = getCourses();
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {courses.map((c) => (
        <CourseCard key={c.slug} course={c} minutes={getAllLessonMeta(c.slug).reduce((n, l) => n + l.minutes, 0)} />
      ))}
      <article className="card flex flex-col justify-center border-dashed p-6 text-sm text-muted">
        <div className="font-semibold text-ink">More courses are on the way</div>
        <p className="mt-1">New courses appear here as they are published. Each one is a folder of markdown lessons, quizzes, and a glossary, so they are quick to add.</p>
      </article>
    </div>
  );
}

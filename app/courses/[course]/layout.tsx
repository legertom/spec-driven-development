import { notFound } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getAllLessonMeta } from "@/lib/content";
import { getCourse } from "@/lib/courses";

export default async function CourseLayout({ children, params }: LayoutProps<"/courses/[course]">) {
  const { course: slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();
  const lessons = getAllLessonMeta(course.slug);
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:gap-8 md:py-8">
      <Sidebar course={course} lessons={lessons} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

import { Sidebar } from "@/components/Sidebar";
import { getAllLessonMeta } from "@/lib/content";

export default function CourseLayout({ children }: LayoutProps<"/course">) {
  const lessons = getAllLessonMeta();
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:gap-8 md:py-8">
      <Sidebar lessons={lessons} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

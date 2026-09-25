import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { LessonMeta } from "@/lib/content";

export function LessonNav({ prev, next }: { prev?: LessonMeta; next?: LessonMeta }) {
  return (
    <nav className="mt-10 grid gap-3 sm:grid-cols-2" aria-label="Lesson navigation">
      {prev ? (
        <Link href={`/course/${prev.slug}`} className="card flex items-center gap-3 p-4 hover:bg-surface-2">
          <ArrowLeft size={18} className="text-muted" />
          <span>
            <span className="block text-xs text-muted">Previous · {prev.number}</span>
            <span className="font-semibold">{prev.shortTitle}</span>
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={`/course/${next.slug}`} className="card flex items-center justify-end gap-3 p-4 text-right hover:bg-surface-2">
          <span>
            <span className="block text-xs text-muted">Next · {next.number}</span>
            <span className="font-semibold">{next.shortTitle}</span>
          </span>
          <ArrowRight size={18} className="text-muted" />
        </Link>
      ) : null}
    </nav>
  );
}

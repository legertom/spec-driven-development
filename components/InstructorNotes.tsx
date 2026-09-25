import { GraduationCap } from "lucide-react";
import { Markdown } from "./Markdown";

export function InstructorNotes({ notes }: { notes: string }) {
  return (
    <details className="notes card mt-12 p-5">
      <summary className="flex items-center gap-2 font-semibold">
        <GraduationCap size={18} className="text-accent" />
        Instructor notes
        <span className="ml-1 text-sm font-normal text-muted">(for whoever is teaching this lesson)</span>
      </summary>
      <div className="mt-4 border-t border-border pt-4">
        <Markdown content={notes} className="prose-compact" />
      </div>
    </details>
  );
}

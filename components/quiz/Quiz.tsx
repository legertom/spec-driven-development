"use client";

import { useState } from "react";
import { Markdown } from "@/components/Markdown";
import type { McQuestion, PublicGradedQuestion, PublicQuiz } from "@/lib/quiz-types";
import { GradedQuestionCard } from "./GradedQuestionCard";
import { McQuestionCard } from "./McQuestionCard";

export function Quiz({ quiz, courseSlug, lessonSlug }: { quiz: PublicQuiz; courseSlug: string; lessonSlug: string }) {
  const mc = quiz.questions.filter((q): q is McQuestion => q.type === "mc");
  const graded = quiz.questions.filter((q): q is PublicGradedQuestion => q.type !== "mc");
  const [results, setResults] = useState<Record<string, boolean>>({});
  const answered = Object.keys(results).length;
  const correct = Object.values(results).filter(Boolean).length;

  return (
    <section id="quiz" className="mt-14 space-y-12">
      {mc.length ? (
        <div>
          <h2 className="text-2xl font-bold">Check your understanding</h2>
          <p className="mt-1 text-muted">Pick an answer to see why it is right or wrong. These are graded in code, instantly.</p>
          <div className="mt-5 space-y-4">
            {mc.map((q, i) => (
              <McQuestionCard key={q.id} q={q} index={i + 1} courseSlug={courseSlug} lessonSlug={lessonSlug} onAnswered={(ok) => setResults((r) => ({ ...r, [q.id]: ok }))} />
            ))}
          </div>
          {answered > 0 ? (
            <p className="mt-4 text-sm font-semibold">
              {correct} of {answered} correct so far{answered === mc.length ? ` (${Math.round((correct / mc.length) * 100)}%)` : ""}.
            </p>
          ) : null}
        </div>
      ) : null}

      {graded.length ? (
        <div>
          <h2 className="text-2xl font-bold">Apply it</h2>
          <p className="mt-1 text-muted">
            Write your answer in your own words. Eve grades it against a rubric and gives you feedback, the same way an LLM judge works in Lesson 5.
          </p>
          <div className="mt-5 space-y-5">
            {graded.map((q) => (
              <GradedQuestionCard key={q.id} courseSlug={courseSlug} lessonSlug={lessonSlug} questionId={q.id} kind={q.type} prompt={q.prompt} rubricCount={q.rubricCount} maxWords={q.maxWords} />
            ))}
          </div>
        </div>
      ) : null}

      {quiz.homework ? (
        <div id="homework">
          <h2 className="text-2xl font-bold">{quiz.homework.title}</h2>
          <div className="mt-3 card p-5">
            <Markdown content={quiz.homework.prompt} className="prose-compact" />
            {quiz.homework.deliverables.length ? (
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">Deliverables</div>
                <ul className="mt-1 list-disc pl-5 text-sm">
                  {quiz.homework.deliverables.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="mt-4">
            <GradedQuestionCard courseSlug={courseSlug} lessonSlug={lessonSlug} questionId={quiz.homework.id} kind="homework" prompt="Paste your homework write-up below. Include every deliverable." rubricCount={quiz.homework.rubricCount} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

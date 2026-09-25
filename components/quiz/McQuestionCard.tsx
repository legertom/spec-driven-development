"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { useProgress } from "@/components/progress/ProgressProvider";
import type { McQuestion } from "@/lib/quiz-types";

export function McQuestionCard({
  q,
  index,
  lessonSlug,
  onAnswered,
}: {
  q: McQuestion;
  index: number;
  lessonSlug: string;
  onAnswered?: (correct: boolean) => void;
}) {
  const { recordAttempt, bestScore } = useProgress();
  const [chosen, setChosen] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const best = bestScore(lessonSlug, q.id);
  const answered = chosen !== null;
  const correct = chosen === q.answer;

  function choose(id: string) {
    if (answered) return;
    setChosen(id);
    const isCorrect = id === q.answer;
    recordAttempt({ lessonSlug, questionId: q.id, kind: "mc", answer: id, score: isCorrect ? 100 : 0, passed: isCorrect, feedback: { chosen: id, correct: isCorrect } });
    onAnswered?.(isCorrect);
  }

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="font-semibold">
          <span className="mr-2 text-muted">{index}.</span>
          {q.prompt}
        </div>
        {best !== undefined && !answered ? (
          <span className={`pill ${best === 100 ? "pill-accent" : ""}`}>{best === 100 ? "Got it before" : "Tried before"}</span>
        ) : null}
      </div>
      <div className="space-y-2">
        {q.options.map((opt) => {
          let state: string | undefined;
          if (answered) {
            if (opt.id === chosen) state = correct ? "correct" : "incorrect";
            else if (showAll && opt.id === q.answer) state = "reveal";
          }
          return (
            <div key={opt.id}>
              <button type="button" className="option-btn" data-state={state} onClick={() => choose(opt.id)} disabled={answered} aria-pressed={chosen === opt.id}>
                <span className="option-letter">{opt.id.toUpperCase()}</span>
                <span className="flex-1">{opt.text}</span>
                {state === "correct" ? <Check size={18} className="text-accent" /> : null}
                {state === "incorrect" ? <X size={18} className="text-danger" /> : null}
              </button>
              {answered && (opt.id === chosen || showAll) ? (
                <p className={`ml-9 mt-1 text-sm ${opt.id === q.answer ? "text-accent" : "text-muted"}`}>{q.explanations[opt.id]}</p>
              ) : null}
            </div>
          );
        })}
      </div>
      {answered ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className={`font-semibold ${correct ? "text-accent" : "text-danger"}`}>{correct ? "Correct!" : "Not quite."}</span>
          {!correct && !showAll ? (
            <button type="button" className="btn btn-sm" onClick={() => setShowAll(true)}>
              Show the right answer
            </button>
          ) : null}
          <button type="button" className="btn btn-sm" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Hide other explanations" : "Show all explanations"}
          </button>
          <button type="button" className="btn btn-sm" onClick={() => { setChosen(null); setShowAll(false); }}>
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}

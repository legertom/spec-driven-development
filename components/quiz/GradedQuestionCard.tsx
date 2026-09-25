"use client";

import { Check, LoaderCircle, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Markdown } from "@/components/Markdown";
import { useEve } from "@/components/eve/EveProvider";
import { useProgress } from "@/components/progress/ProgressProvider";
import type { AttemptKind, GradeResult } from "@/lib/quiz-types";

interface Props {
  courseSlug: string;
  lessonSlug: string;
  questionId: string;
  kind: AttemptKind; // short | free | homework
  prompt: string;
  rubricCount: number;
  maxWords?: number;
  label?: string;
}

export function GradedQuestionCard({ courseSlug, lessonSlug, questionId, kind, prompt, rubricCount, maxWords, label }: Props) {
  const { recordAttempt, attemptsFor } = useProgress();
  const { askWith, health } = useEve();
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModel, setShowModel] = useState(false);
  const previous = attemptsFor(courseSlug, lessonSlug, questionId);
  const noKey = health !== null && !health.tutor;
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  async function grade() {
    if (!answer.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowModel(false);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug, lessonSlug, questionId, answer }),
      });
      const data = (await res.json()) as GradeResult & { message?: string };
      if (!res.ok) throw new Error(data.message || `Grading failed (${res.status})`);
      setResult(data);
      recordAttempt({ courseSlug, lessonSlug, questionId, kind, answer, score: data.score, passed: data.passed, feedback: data });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const rows = kind === "homework" ? 14 : kind === "free" ? 8 : 4;
  const heading = label ?? (kind === "short" ? "Short answer" : kind === "free" ? "Free response" : "Homework submission");

  return (
    <div className="card p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <span>{heading}</span>
        <span className="pill">Graded by Eve · {rubricCount} criteria</span>
        {maxWords ? <span className="pill">up to ~{maxWords} words</span> : null}
        {previous.length ? <span className="pill">{previous.length} previous attempt{previous.length > 1 ? "s" : ""} · best {Math.max(...previous.map((a) => a.score))}%</span> : null}
      </div>
      <div className="prose-compact mb-3">
        <Markdown content={prompt} className="prose-compact" />
      </div>
      <textarea
        className="input"
        rows={rows}
        placeholder={kind === "homework" ? "Paste your write-up here. Markdown, code, and YAML are fine." : "Write your answer here…"}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={loading}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={grade} disabled={loading || !answer.trim() || noKey} title={noKey ? "Grading needs Vercel AI Gateway credentials on the server" : undefined}>
          {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? "Grading…" : result ? "Grade again" : "Grade with Eve"}
        </button>
        <span className="text-sm text-muted">{words} words</span>
        {noKey ? <span className="text-sm text-muted">Grading needs AI Gateway credentials on the server.</span> : null}
        <button type="button" className="btn btn-sm" onClick={() => askWith(`I'm working on this question and would like a hint (not the answer): "${prompt.slice(0, 400)}"`)}>
          Ask Eve for a hint
        </button>
      </div>

      {error ? <p className="mt-3 rounded-lg bg-danger-soft p-3 text-sm text-danger">{error}</p> : null}

      {result ? (
        <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4">
          <div className="flex items-center gap-4">
            <div className="score-ring" style={{ ["--p" as string]: result.score }} data-passed={result.passed}>
              <span>{result.score}%</span>
            </div>
            <div>
              <div className={`font-bold ${result.passed ? "text-accent" : "text-danger"}`}>{result.passed ? "Passed" : "Not there yet"}</div>
              <div className="text-sm text-muted">
                {result.rubricResults.filter((r) => r.met).length} of {result.rubricResults.length} criteria met
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Markdown content={result.feedback} className="prose-compact" />
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {result.rubricResults.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                {r.met ? <Check size={16} className="mt-0.5 flex-none text-accent" /> : <X size={16} className="mt-0.5 flex-none text-danger" />}
                <span>
                  <span className="font-medium">{r.criterion}</span>
                  <span className="text-muted"> — {r.note}</span>
                </span>
              </li>
            ))}
          </ul>
          {result.strengths.length ? (
            <div className="mt-3 text-sm">
              <div className="font-semibold">Strengths</div>
              <ul className="list-disc pl-5">{result.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          ) : null}
          {result.improvements.length ? (
            <div className="mt-2 text-sm">
              <div className="font-semibold">To improve</div>
              <ul className="list-disc pl-5">{result.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {result.modelAnswer ? (
              <button type="button" className="btn btn-sm" onClick={() => setShowModel((v) => !v)}>
                {showModel ? "Hide model answer" : "Show model answer"}
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-sm btn-eve"
              onClick={() =>
                askWith(
                  `I answered a question and got this feedback. Help me understand what to improve, without writing the answer for me.\n\nQuestion: ${prompt.slice(0, 500)}\n\nMy answer: ${answer.slice(0, 1500)}\n\nFeedback: ${result.feedback}\nImprovements: ${result.improvements.join("; ")}`,
                )
              }
            >
              <Sparkles size={13} /> Ask Eve about this feedback
            </button>
          </div>
          {showModel && result.modelAnswer ? (
            <div className="mt-3 rounded-lg border border-border bg-surface p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Model answer</div>
              <Markdown content={result.modelAnswer} className="prose-compact" />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

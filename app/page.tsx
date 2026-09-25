import { BookOpen, ListChecks, Sparkles } from "lucide-react";
import Link from "next/link";
import { ModuleCards } from "@/components/ModuleCards";
import { getAllLessonMeta } from "@/lib/content";
import { COURSE_TAGLINE, COURSE_TITLE } from "@/lib/course";

const PIPELINE = [
  { step: "SPEC.md", verb: "Analyze", note: "scope, tools, risk tiers" },
  { step: "Agent + traces", verb: "Analyze", note: "permissions in code" },
  { step: "Scenarios", verb: "Analyze", note: "~500 synthetic cases" },
  { step: "Failure taxonomy", verb: "Analyze", note: "open + axial coding" },
  { step: "Evaluators", verb: "Measure", note: "code checks + judges" },
  { step: "CI gate", verb: "Measure", note: "pass^k, monitoring" },
  { step: "Red team", verb: "Measure", note: "guards + approval" },
  { step: "Frontier", verb: "Improve", note: "accuracy × cost" },
];

const VERB_COLOR: Record<string, string> = {
  Analyze: "var(--co-example)",
  Measure: "var(--co-warning)",
  Improve: "var(--co-key)",
};

export default function HomePage() {
  const lessons = getAllLessonMeta();
  const totalMinutes = lessons.reduce((a, l) => a + l.minutes, 0);
  return (
    <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <section className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <span className="pill pill-accent">A course for beginner engineers and PMs</span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{COURSE_TITLE}</h1>
          <p className="mt-4 max-w-prose text-lg text-muted">{COURSE_TAGLINE}</p>
          <p className="mt-3 max-w-prose text-muted">
            You will build a support agent for a tiny fictional plant shop, record everything it does, find where it fails, turn those failures into
            tests, red-team it, and then make it both more accurate and cheaper. Every idea comes with a small example, and Eve, the built-in tutor, is
            one highlight away.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/course/l0-foundations-for-beginners" className="btn btn-primary">
              Start with L0 · Foundations
            </Link>
            <Link href="/how-it-works" className="btn">
              How this course works
            </Link>
          </div>
          <p className="mt-3 text-sm text-muted">
            {lessons.length} lessons · about {Math.round(totalMinutes / 60)} hours of reading · quizzes graded by code and by Eve
          </p>
        </div>
        <div className="card p-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">What you will build</div>
          <ol className="mt-3 space-y-2">
            {PIPELINE.map((p, i) => (
              <li key={p.step} className="flex items-center gap-3 text-sm">
                <span className="grid h-6 w-6 flex-none place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: VERB_COLOR[p.verb] }}>
                  {i + 1}
                </span>
                <span className="font-semibold">{p.step}</span>
                <span className="text-muted">{p.note}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex gap-3 text-xs">
            {Object.entries(VERB_COLOR).map(([verb, color]) => (
              <span key={verb} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /> {verb}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <BookOpen className="text-accent" />
          <h2 className="mt-2 font-bold">Read, with examples everywhere</h2>
          <p className="mt-1 text-sm text-muted">Every concept is followed by a tiny concrete example from Pip&apos;s Plant Shop. Callouts flag key ideas, beginner detours, and common mistakes.</p>
        </div>
        <div className="card p-5">
          <Sparkles className="text-eve" />
          <h2 className="mt-2 font-bold">Highlight anything, ask Eve</h2>
          <p className="mt-1 text-sm text-muted">Select a sentence and click &quot;Ask Eve&quot;. She knows the lesson you are reading and explains, re-examples, or quizzes you on that exact passage.</p>
        </div>
        <div className="card p-5">
          <ListChecks className="text-accent" />
          <h2 className="mt-2 font-bold">Prove it, get feedback</h2>
          <p className="mt-1 text-sm text-muted">Multiple choice is graded instantly in code. Written answers are graded by Eve against a rubric, with strengths, improvements, and a model answer.</p>
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">The modules</h2>
          <Link href="/course" className="text-sm font-semibold text-accent">
            Full syllabus
          </Link>
        </div>
        <div className="mt-5">
          <ModuleCards lessons={lessons} />
        </div>
      </section>

      <section className="mt-14 card p-6">
        <h2 className="text-xl font-bold">Meet Pip&apos;s Plant Shop</h2>
        <p className="mt-2 max-w-prose text-muted">
          A small online store that sells houseplants. <strong>Sprout</strong> is its support agent. Customers ask about orders, shipping, refunds, and plant care. Every lesson uses the same shop, the same people, and the same six tools, so you never have to re-learn the setting.
        </p>
        <div className="prose-lesson mt-4 max-w-none">
          <table>
            <thead>
              <tr>
                <th>Tool</th>
                <th>What it does</th>
                <th>Risk tier</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>lookup_order</code></td><td>Status, items, and dates for one order</td><td>T0 · read-only</td></tr>
              <tr><td><code>get_shipping_status</code></td><td>Carrier and tracking events</td><td>T0 · read-only</td></tr>
              <tr><td><code>search_care_guide</code></td><td>Plant-care articles</td><td>T0 · read-only</td></tr>
              <tr><td><code>cancel_order</code></td><td>Cancels an unshipped order</td><td>T1 · reversible write</td></tr>
              <tr><td><code>issue_refund</code></td><td>Sends money back</td><td>T2 · irreversible, needs a human</td></tr>
              <tr><td><code>escalate_to_human</code></td><td>Hands the chat to Maya</td><td>T0 · always allowed</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

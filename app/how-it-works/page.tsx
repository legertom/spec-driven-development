import { BookOpen, Database, GraduationCap, ListChecks, Shield, Sparkles, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AskEveButton } from "@/components/eve/AskEveButton";
import { HighlightMenu } from "@/components/eve/HighlightMenu";
import { Markdown } from "@/components/Markdown";
import { PLATFORM_LONG_NAME, PLATFORM_TAGLINE } from "@/lib/platform";

export const metadata: Metadata = { title: "How it works" };

const CALLOUT_DEMO = `:::example A tiny example
Sprout receives "Where is order #1042?", calls \`lookup_order("1042")\`, and answers from the result. That is one trace with two spans.
:::

:::key
If it is not written down, it cannot be tested.
:::

:::beginner Plain-English detour
A "span" is one step inside a trace, like one line in a receipt.
:::

:::warning Common mistake
Writing "please never refund without approval" in the prompt and calling that security. A prompt is a request; code is a lock.
:::

:::tip
Keep numbers tiny while you learn: ten traces, not ten thousand.
:::

:::try Ask Eve
Highlight this sentence and ask Eve to explain it with a pizza-shop example.
:::`;

function Section({ id, icon, title, children }: { id: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <span className="text-accent">{icon}</span>
        {title}
      </h2>
      <div className="prose-lesson mt-4 max-w-none">{children}</div>
    </section>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-[80ch] px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">How it works</h1>
      <p className="mt-2 text-lg text-muted">How the course is organized, what Eve knows, how grading works, where your data lives, and what is under the hood.</p>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm" aria-label="On this page">
        {[
          ["course", "The course"],
          ["lesson", "A lesson"],
          ["eve", "Eve"],
          ["grading", "Grading"],
          ["data", "Your data"],
          ["hood", "Under the hood"],
          ["change", "Change it"],
          ["credits", "Credits"],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="pill hover:bg-accent-soft hover:text-accent">
            {label}
          </a>
        ))}
      </nav>

      <div id="how-content" className="mt-10 space-y-14">
        <Section id="course" icon={<BookOpen />} title="The platform and its courses">
          <p>
            <strong>{PLATFORM_LONG_NAME}</strong> is a small learning platform: {PLATFORM_TAGLINE.toLowerCase()} It hosts several courses, and every course follows the same shape so you never have to learn a new interface. Each course is a folder of markdown lessons, JSON quizzes, instructor notes, and a glossary, with a <code>course.json</code> that lists its modules and lesson order. The <Link href="/courses">catalog</Link> lists what is available now and what is coming.
          </p>
          <p>The idea that runs through every course is spec-driven development: write down what &quot;correct&quot; means before you build, build so the result can be measured, and then improve with evidence instead of vibes. Courses organize their lessons into phases (for example Analyze, Measure, Improve), and each lesson page tells you which phase you are in.</p>
          <p>Every course also has a running example, a small fictional world that every lesson reuses so you learn the ideas rather than a new setting each time. The course page introduces it, and Eve uses it in her explanations.</p>
        </Section>

        <Section id="lesson" icon={<ListChecks />} title="What a lesson looks like">
          <p>Each lesson page has the same shape, top to bottom:</p>
          <ol>
            <li><strong>Header:</strong> module, lesson number, minutes, and the verb.</li>
            <li><strong>What you&apos;ll learn:</strong> three to five &quot;you can…&quot; objectives.</li>
            <li><strong>Why this matters:</strong> a short story from the plant shop showing the pain the lesson removes.</li>
            <li><strong>Numbered sections:</strong> concept, then a tiny example, then a slightly harder one. If a section has no example, it is not finished.</li>
            <li><strong>Key terms:</strong> chips that link to the <Link href="/glossary">glossary</Link>.</li>
            <li><strong>Check your understanding:</strong> multiple choice, graded instantly with an explanation for every option.</li>
            <li><strong>Apply it:</strong> a short answer and a free response, graded by Eve against a rubric.</li>
            <li><strong>Homework</strong> (after L5 and L9): a bigger project, also rubric-graded.</li>
            <li><strong>Instructor notes:</strong> a collapsed panel for whoever is teaching: talking points, a live demo, misconceptions, timing.</li>
            <li><strong>Mark complete</strong> and previous / next links.</li>
          </ol>
          <p>Callouts flag different kinds of content. Here is each one, live:</p>
          <Markdown content={CALLOUT_DEMO} className="prose-lesson" />
        </Section>

        <Section id="eve" icon={<Sparkles />} title="Eve, the tutor">
          <p>
            Eve is a tutor built on the Anthropic API. She lives in the drawer on the right (the <strong>Ask Eve</strong> button in the top bar opens it on any page). On a lesson page she is given three things: a fixed description of who she is and how to teach, the course you are in (its map, its running example, and course-specific teaching notes), and the <em>full text of the lesson you are reading</em>. That is why she can answer &quot;what does section 3 mean?&quot; without you pasting anything. On the catalog or progress pages she knows which courses exist and can recommend where to start.
          </p>
          <h3>Highlight to ask</h3>
          <p>
            Select any text in a lesson (or in a quiz question) and a small <strong>Ask Eve</strong> pill appears above it. Click it and the passage is attached to your next question, with four quick actions: <em>Explain this simply</em>, <em>Give me another example</em>, <em>Why does this matter?</em>, and <em>Quiz me on this</em>. You can also type your own question. Try it on this paragraph.
          </p>
          <div className="not-prose">
            <AskEveButton size="sm" label="Ask Eve what she knows" prompt="What information do you have about the page I'm on right now, and what can you help me with here?" />
          </div>
          <h3>Rules she follows</h3>
          <ul>
            <li>Answer first, then one tiny example, then the general rule. Short by default.</li>
            <li>On quiz and homework questions she guides (hints, pointers to the lesson, checking your reasoning) rather than writing the answer for you.</li>
            <li>She defines terms the first time she uses them and never assumes a machine-learning background.</li>
            <li>She can be wrong. Check important claims against the lesson text.</li>
          </ul>
          <h3>Memory</h3>
          <p>
            Each lesson (and each course page) has its own conversation, kept in this browser tab (session storage). Close the tab and it is gone. Chats are never written to the database. Every request sends the recent conversation back to the server, because the model itself has no memory between calls.
          </p>
        </Section>

        <Section id="grading" icon={<GraduationCap />} title="How grading works">
          <p>Every course uses the same two kinds of questions, graded two different ways on purpose. (The AI agents course teaches exactly this distinction in its Lesson 5, so the platform practices what that course preaches.)</p>
          <table>
            <thead>
              <tr>
                <th>Question type</th>
                <th>Graded by</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Multiple choice</td><td><strong>Code</strong>, instantly in your browser</td><td>The answer is objective. A code check is cheaper, faster, and never wrong about which option you picked. Every option has a pre-written explanation.</td></tr>
              <tr><td>Short answer, free response, homework</td><td><strong>An LLM judge</strong> (Eve) on the server</td><td>Your wording is open-ended, so the answer needs interpretation. That is exactly when Lesson 5 says to use a judge.</td></tr>
            </tbody>
          </table>
          <p>The judge is set up the way a good evaluation should be:</p>
          <ul>
            <li><strong>Binary criteria.</strong> Each question has a rubric of three to six criteria. The judge marks each one <em>met</em> or <em>not met</em>, with a one-sentence note. No 1–5 scores.</li>
            <li><strong>The score is computed in code.</strong> Score = criteria met ÷ total criteria. You pass at 70% or more. The model never picks the number.</li>
            <li><strong>A model answer as the boundary example.</strong> The judge sees a strong reference answer so it knows what &quot;good&quot; looks like, but it is told to accept different wording and different valid approaches.</li>
            <li><strong>Rubrics live on the server.</strong> Your browser only sends your answer and the question id, so nothing you type can change the rubric.</li>
            <li><strong>Feedback you can act on.</strong> Two to five sentences, strengths, concrete improvements, then the model answer if you want it. You can grade again as many times as you like, and ask Eve to explain the feedback without giving the answer away.</li>
          </ul>
          <p>Your best score per question is what shows up in the sidebar and on the progress page.</p>
        </Section>

        <Section id="data" icon={<Database />} title="Your progress and your data">
          <ul>
            <li><strong>No login.</strong> The first time you open the site, the server sets an anonymous cookie with a random id. That id is the only thing tying your progress together.</li>
            <li><strong>Two copies of progress.</strong> Your browser keeps a copy in local storage so the site feels instant. If the platform is deployed with a Neon Postgres database, the server keeps the durable copy too, and the two are merged when you load a page (newest wins).</li>
            <li><strong>What is stored:</strong> which lessons you started or completed in each course, and each quiz attempt (course, question id, your answer, score, pass/fail, and the feedback). <strong>What is not stored:</strong> your chats with Eve, your name, your email.</li>
            <li><strong>Reset</strong> from the <Link href="/progress">progress page</Link> erases both copies.</li>
          </ul>
        </Section>

        <Section id="hood" icon={<Wrench />} title="Under the hood">
          <p>The whole platform is one Next.js app. Pages are rendered on the server from each course&apos;s markdown files; the interactive parts (Eve, quizzes, progress) run in the browser and talk to three small API routes.</p>
          <div className="not-prose card overflow-x-auto p-4">
            <svg viewBox="0 0 760 300" width="100%" role="img" aria-label="Architecture diagram: the browser talks to Next.js on Vercel, which talks to the Anthropic API and Neon Postgres">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                </marker>
              </defs>
              <g fontFamily="var(--font-sans)" fontSize="13" fill="currentColor">
                <rect x="20" y="90" width="170" height="120" rx="12" fill="var(--surface-2)" stroke="var(--border)" />
                <text x="105" y="118" textAnchor="middle" fontWeight="700">Your browser</text>
                <text x="105" y="140" textAnchor="middle" fill="var(--muted)">lesson pages</text>
                <text x="105" y="158" textAnchor="middle" fill="var(--muted)">Eve drawer · quizzes</text>
                <text x="105" y="176" textAnchor="middle" fill="var(--muted)">localStorage copy</text>

                <rect x="290" y="70" width="190" height="160" rx="12" fill="var(--accent-soft)" stroke="var(--accent)" />
                <text x="385" y="98" textAnchor="middle" fontWeight="700">Next.js on Vercel</text>
                <text x="385" y="122" textAnchor="middle" fill="var(--muted)">renders markdown lessons</text>
                <text x="385" y="146" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12">/api/tutor</text>
                <text x="385" y="166" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12">/api/grade</text>
                <text x="385" y="186" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12">/api/progress</text>
                <text x="385" y="212" textAnchor="middle" fill="var(--muted)">holds the API key</text>

                <rect x="580" y="40" width="160" height="90" rx="12" fill="var(--eve-soft)" stroke="var(--eve)" />
                <text x="660" y="70" textAnchor="middle" fontWeight="700">Anthropic API</text>
                <text x="660" y="92" textAnchor="middle" fill="var(--muted)">Eve · the grader</text>
                <text x="660" y="110" textAnchor="middle" fill="var(--muted)">streaming, cached prompts</text>

                <rect x="580" y="170" width="160" height="90" rx="12" fill="var(--surface-2)" stroke="var(--border)" />
                <text x="660" y="200" textAnchor="middle" fontWeight="700">Neon Postgres</text>
                <text x="660" y="222" textAnchor="middle" fill="var(--muted)">lesson progress</text>
                <text x="660" y="240" textAnchor="middle" fill="var(--muted)">quiz attempts (optional)</text>

                <line x1="190" y1="150" x2="290" y2="150" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                <line x1="480" y1="120" x2="580" y2="90" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                <line x1="480" y1="190" x2="580" y2="215" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
              </g>
            </svg>
          </div>
          <h3>A question to Eve, step by step</h3>
          <ol>
            <li>You highlight a sentence in a lesson and click <strong>Ask Eve</strong>, then pick <em>Explain this simply</em>.</li>
            <li>The browser sends the course id, the lesson id, the highlighted passage, your question, and the recent conversation to <code>/api/tutor</code>.</li>
            <li>The server loads the lesson markdown from disk and builds the prompt: Eve&apos;s persona (cached), the course block (cached), the lesson text (cached), then your messages. Caching means repeated questions about the same lesson reuse most of the prompt instead of paying for it again.</li>
            <li>The server calls the Anthropic API with streaming on, and forwards each chunk of text to your browser as it arrives. That is why the answer appears word by word.</li>
            <li>Nothing from that exchange is stored on the server.</li>
          </ol>
          <h3>Grading a written answer, step by step</h3>
          <ol>
            <li>The browser sends the course id, lesson id, question id, and your answer to <code>/api/grade</code>.</li>
            <li>The server looks up the rubric and model answer for that question (they never leave the server).</li>
            <li>It asks the model for a strictly structured JSON result: one met / not-met verdict per rubric criterion, a feedback paragraph, strengths, and improvements. The request uses structured outputs, so the shape is guaranteed.</li>
            <li>The server computes the score from the verdicts, decides pass / fail at 70%, and returns everything along with the model answer.</li>
            <li>Your browser shows the feedback card and records the attempt (locally, and in the database if one is configured).</li>
          </ol>
          <h3>The pieces</h3>
          <table>
            <thead>
              <tr>
                <th>Piece</th>
                <th>What it is</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Next.js 16 (App Router)</td><td>The web framework. Pages are React components rendered on the server; API routes run as serverless functions on Vercel.</td></tr>
              <tr><td>Markdown + JSON content</td><td>Each course lives in <code>content/courses/&lt;slug&gt;/</code>: <code>course.json</code>, <code>lessons/*.md</code>, <code>quizzes/*.json</code>, <code>notes/*.md</code>, and <code>glossary.json</code>. Anyone can edit them in a text editor, and a new folder is a new course.</td></tr>
              <tr><td>Anthropic SDK</td><td>Talks to Claude. Eve streams; the grader uses structured outputs. The model id is configurable with <code>EVE_MODEL</code>.</td></tr>
              <tr><td>Neon + Drizzle</td><td>Serverless Postgres and a typed query layer for progress. Optional: without <code>DATABASE_URL</code> the site still works, browser-only.</td></tr>
              <tr><td>Vercel</td><td>Hosting. Push to the repository and it deploys.</td></tr>
            </tbody>
          </table>
          <h3>Cost</h3>
          <p>
            A tutor turn or a grading call with the default model costs on the order of a cent or two, thanks to prompt caching and short answers. Finishing a whole course with heavy tutor use is a few dollars. The owner can set a spending limit in the Anthropic console.
          </p>
        </Section>

        <Section id="change" icon={<Shield />} title="Running and changing it yourself">
          <ul>
            <li><strong>Edit a lesson:</strong> open <code>content/courses/&lt;course&gt;/lessons/&lt;slug&gt;.md</code>, change the text, save. Callouts use the <code>:::example Title … :::</code> syntax shown above.</li>
            <li><strong>Add a quiz question:</strong> edit <code>content/courses/&lt;course&gt;/quizzes/&lt;slug&gt;.json</code>. Multiple choice needs an <code>answer</code> and an explanation per option; written questions need a <code>rubric</code> and a <code>modelAnswer</code>.</li>
            <li><strong>Add a course:</strong> copy <code>content/courses/_template</code> to a new folder, fill in <code>course.json</code>, and write the lessons. It appears in the catalog on the next build. <code>docs/ADDING_A_COURSE.md</code> walks through it.</li>
            <li><strong>Change Eve&apos;s personality:</strong> <code>lib/prompts.ts</code>.</li>
            <li><strong>Run locally:</strong> <code>npm install</code>, put <code>ANTHROPIC_API_KEY</code> in <code>.env.local</code>, <code>npm run dev</code>.</li>
            <li><strong>Deploy:</strong> import the repository into Vercel, add the environment variables, deploy. Add a Neon database whenever you want progress to survive across devices.</li>
          </ul>
          <p>
            The design documents are in the repository: <code>docs/ARCHITECTURE.md</code>, <code>docs/UI_PLAN.md</code>, <code>docs/AUTHOR_BRIEF.md</code> (how to write a lesson), <code>docs/ADDING_A_COURSE.md</code>, and a plan per course under <code>docs/courses/</code>.
          </p>
        </Section>

        <Section id="credits" icon={<BookOpen />} title="Credits">
          <p>
            Each course page lists its own credits and sources. Eve and the grader run on Claude models from Anthropic. The platform itself is open source: Next.js, Tailwind CSS, Drizzle, and Neon.
          </p>
        </Section>
      </div>
      <HighlightMenu containerId="how-content" />
    </main>
  );
}

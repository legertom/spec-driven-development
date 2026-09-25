#!/usr/bin/env node
/**
 * Content validation: a code check for the course files.
 *   node scripts/validate-content.mjs
 * Verifies every lesson in lib/course.ts has a markdown file with valid
 * frontmatter, balanced callouts, glossary-backed key terms, and a valid quiz.
 * Exits non-zero on any error so it can run in CI.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

// Lesson order from lib/course.ts (regex, so this script needs no TypeScript toolchain).
const courseTs = read("lib/course.ts");
const modulesBlock = courseTs.slice(courseTs.indexOf("MODULES"), courseTs.indexOf("SHORT_TITLES"));
const slugs = [...modulesBlock.matchAll(/"((?:l\d|b\d)-[a-z0-9-]+)"/g)].map((m) => m[1]);
const uniqueSlugs = [...new Set(slugs)];

// Glossary ids from content/glossary.ts.
const glossaryIds = new Set([...read("content/glossary.ts").matchAll(/^\s*id:\s*"([a-z0-9-]+)"/gm)].map((m) => m[1]));

const CALLOUTS = new Set(["example", "key", "beginner", "warning", "tip", "try"]);
const REQUIRED_FM = ["slug", "number", "title", "module", "moduleTitle", "verb", "minutes", "prereqs", "summary", "objectives", "keyTerms"];

let errors = 0;
let warnings = 0;
const err = (msg) => { errors++; console.log(`  ✗ ${msg}`); };
const warn = (msg) => { warnings++; console.log(`  ! ${msg}`); };

for (const slug of uniqueSlugs) {
  console.log(`\n${slug}`);
  const lessonPath = `content/lessons/${slug}.md`;
  if (!fs.existsSync(path.join(root, lessonPath))) { err(`missing ${lessonPath}`); continue; }
  const { data, content } = matter(read(lessonPath));

  for (const k of REQUIRED_FM) if (!(k in data)) err(`frontmatter missing "${k}"`);
  if (data.slug && data.slug !== slug) err(`frontmatter slug "${data.slug}" != file slug`);
  if (!["Analyze", "Measure", "Improve", "Bonus"].includes(data.verb)) err(`bad verb "${data.verb}"`);
  for (const t of data.keyTerms ?? []) if (!glossaryIds.has(t)) err(`keyTerm "${t}" not in glossary`);
  for (const p of data.prereqs ?? []) if (!uniqueSlugs.includes(p)) err(`prereq "${p}" is not a lesson`);

  const lines = content.split("\n");
  let open = null;
  let examples = 0;
  for (const [i, line] of lines.entries()) {
    const m = /^:::([a-z]+)(\[|\s|$)/.exec(line);
    if (m) {
      if (open) err(`line ${i + 1}: "${m[1]}" opened while "${open}" still open (nested callouts are not supported)`);
      if (!CALLOUTS.has(m[1])) err(`line ${i + 1}: unknown callout ":::${m[1]}"`);
      if (m[1] === "example") examples++;
      open = m[1];
    } else if (/^:::\s*$/.test(line)) {
      if (!open) err(`line ${i + 1}: closing ::: without an open callout`);
      open = null;
    }
  }
  if (open) err(`callout "${open}" never closed`);
  if (examples < 6) warn(`only ${examples} example callouts (target: 6+)`);
  const prose = content.replace(/^```[\s\S]*?^```/gm, ""); // ignore fenced code for prose checks
  const words = content.split(/\s+/).filter(Boolean).length;
  if (words < 1400) warn(`only ${words} words`);
  if (!/^## Why this matters/m.test(content)) warn(`no "## Why this matters" section`);
  if (!/^## Summary/m.test(content)) warn(`no "## Summary" section`);
  if (/^# /m.test(prose)) warn(`contains an H1 outside code (the title comes from frontmatter)`);
  if (/—/.test(prose)) warn(`contains an em-dash outside code`);

  const quizPath = `content/quizzes/${slug}.json`;
  if (!fs.existsSync(path.join(root, quizPath))) { err(`missing ${quizPath}`); }
  else {
    let quiz;
    try { quiz = JSON.parse(read(quizPath)); } catch (e) { err(`${quizPath}: ${e.message}`); quiz = null; }
    if (quiz) {
      if (quiz.lessonSlug !== slug) err(`quiz lessonSlug "${quiz.lessonSlug}" != ${slug}`);
      const ids = new Set();
      let mc = 0, short = 0, free = 0;
      for (const q of quiz.questions ?? []) {
        if (ids.has(q.id)) err(`duplicate question id ${q.id}`); ids.add(q.id);
        if (q.type === "mc") {
          mc++;
          const optIds = (q.options ?? []).map((o) => o.id);
          if (optIds.length < 2) err(`${q.id}: fewer than 2 options`);
          if (!optIds.includes(q.answer)) err(`${q.id}: answer "${q.answer}" is not an option`);
          for (const o of optIds) if (!q.explanations?.[o]) err(`${q.id}: no explanation for option ${o}`);
        } else if (q.type === "short" || q.type === "free") {
          if (q.type === "short") short++; else free++;
          if (!Array.isArray(q.rubric) || q.rubric.length < 1) err(`${q.id}: rubric missing`);
          if (!q.modelAnswer) err(`${q.id}: modelAnswer missing`);
        } else err(`${q.id}: unknown type "${q.type}"`);
      }
      if (mc < 5) warn(`${mc} multiple-choice questions (target: 5–6)`);
      if (short !== 1) warn(`${short} short-answer questions (target: 1)`);
      if (free !== 1) warn(`${free} free-response questions (target: 1)`);
      if (quiz.homework) {
        if (!quiz.homework.id || !quiz.homework.title || !quiz.homework.prompt) err(`homework missing id/title/prompt`);
        if (!Array.isArray(quiz.homework.rubric) || !quiz.homework.rubric.length) err(`homework rubric missing`);
      }
      const expectHw = slug === "l5-measuring-with-evaluators" || slug === "l9-improving-cost";
      if (expectHw && !quiz.homework) warn(`expected a homework object`);
    }
  }

  if (!fs.existsSync(path.join(root, `content/notes/${slug}.md`))) warn(`missing instructor notes`);
  if (errors === 0 && warnings === 0) console.log("  ✓ ok");
}

console.log(`\n${uniqueSlugs.length} lessons checked · ${errors} error(s) · ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);

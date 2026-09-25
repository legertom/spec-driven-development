#!/usr/bin/env node
/**
 * Content validation: a code check for every course's files.
 *   node scripts/validate-content.mjs
 * For each folder in content/courses (except those starting with "_"): course.json
 * parses and lists modules; every lesson has a markdown file with valid frontmatter,
 * balanced callouts, glossary-backed key terms, and a valid quiz.
 * Exits non-zero on any error so it can run in CI.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const coursesDir = path.join(root, "content", "courses");
const read = (p) => fs.readFileSync(p, "utf8");

const CALLOUTS = new Set(["example", "key", "beginner", "warning", "tip", "try"]);
const REQUIRED_FM = ["slug", "number", "title", "module", "moduleTitle", "verb", "minutes", "prereqs", "summary", "objectives", "keyTerms"];

let errors = 0;
let warnings = 0;
const err = (msg) => { errors++; console.log(`  ✗ ${msg}`); };
const warn = (msg) => { warnings++; console.log(`  ! ${msg}`); };

const courseDirs = fs
  .readdirSync(coursesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
  .map((d) => d.name);

let lessonsChecked = 0;

for (const courseSlug of courseDirs) {
  const dir = path.join(coursesDir, courseSlug);
  console.log(`\n=== course: ${courseSlug} ===`);
  const courseFile = path.join(dir, "course.json");
  if (!fs.existsSync(courseFile)) { err("missing course.json"); continue; }
  let course;
  try { course = JSON.parse(read(courseFile)); } catch (e) { err(`course.json: ${e.message}`); continue; }
  if (course.slug !== courseSlug) err(`course.json slug "${course.slug}" != folder "${courseSlug}"`);
  for (const k of ["title", "modules"]) if (!(k in course)) err(`course.json missing "${k}"`);
  const modules = Array.isArray(course.modules) ? course.modules : [];
  const slugs = modules.flatMap((m) => m.lessons ?? []);
  if (new Set(slugs).size !== slugs.length) err("a lesson slug appears in more than one module");
  const verbs = new Set((course.verbs ?? []).map((v) => v.name));
  for (const s of slugs) if (!(course.shortTitles ?? {})[s]) warn(`no shortTitle for ${s} (sidebar will use the slug)`);

  const glossaryFile = path.join(dir, "glossary.json");
  let glossaryIds = new Set();
  if (fs.existsSync(glossaryFile)) {
    try {
      const g = JSON.parse(read(glossaryFile));
      glossaryIds = new Set(g.map((e) => e.id));
      for (const e of g) {
        if (!e.id || !e.term || !e.definition) err(`glossary entry ${JSON.stringify(e.id ?? e.term)} is missing id, term, or definition`);
        for (const r of e.related ?? []) if (!glossaryIds.has(r)) err(`glossary "${e.id}": related id "${r}" does not exist`);
        for (const l of e.lessons ?? []) if (!slugs.includes(l)) err(`glossary "${e.id}": lesson "${l}" is not in this course`);
      }
      console.log(`  glossary: ${g.length} entries`);
    } catch (e) { err(`glossary.json: ${e.message}`); }
  } else {
    warn("no glossary.json");
  }

  for (const slug of slugs) {
    lessonsChecked++;
    console.log(`\n${courseSlug}/${slug}`);
    const before = errors + warnings;
    const lessonPath = path.join(dir, "lessons", `${slug}.md`);
    if (!fs.existsSync(lessonPath)) { err(`missing lessons/${slug}.md`); continue; }
    const { data, content } = matter(read(lessonPath));

    for (const k of REQUIRED_FM) if (!(k in data)) err(`frontmatter missing "${k}"`);
    if (data.slug && data.slug !== slug) err(`frontmatter slug "${data.slug}" != file slug`);
    if (verbs.size && data.verb && data.verb !== "Bonus" && !verbs.has(data.verb)) warn(`verb "${data.verb}" is not one of the course's verbs (${[...verbs].join(", ")})`);
    for (const t of data.keyTerms ?? []) if (!glossaryIds.has(t)) err(`keyTerm "${t}" not in glossary`);
    for (const p of data.prereqs ?? []) if (!slugs.includes(p)) err(`prereq "${p}" is not a lesson in this course`);
    const mod = modules.find((m) => (m.lessons ?? []).includes(slug));
    if (mod && data.module !== undefined && data.module !== mod.id) warn(`frontmatter module ${data.module} != course.json module ${mod.id}`);

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
    const prose = content.replace(/^```[\s\S]*?^```/gm, "");
    const words = content.split(/\s+/).filter(Boolean).length;
    if (words < 1400) warn(`only ${words} words`);
    if (!/^## Why this matters/m.test(content)) warn(`no "## Why this matters" section`);
    if (!/^## Summary/m.test(content)) warn(`no "## Summary" section`);
    if (/^# /m.test(prose)) warn(`contains an H1 outside code (the title comes from frontmatter)`);
    if (/—/.test(prose)) warn(`contains an em-dash outside code`);

    const quizPath = path.join(dir, "quizzes", `${slug}.json`);
    if (!fs.existsSync(quizPath)) { err(`missing quizzes/${slug}.json`); }
    else {
      let quiz;
      try { quiz = JSON.parse(read(quizPath)); } catch (e) { err(`quiz: ${e.message}`); quiz = null; }
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
      }
    }

    if (!fs.existsSync(path.join(dir, "notes", `${slug}.md`))) warn(`missing instructor notes`);
    if (errors + warnings === before) console.log("  ✓ ok");
  }
}

console.log(`\n${courseDirs.length} course(s), ${lessonsChecked} lesson(s) checked · ${errors} error(s) · ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);

/**
 * Course structure: the single source of truth for module and lesson ORDER.
 * Lesson titles, summaries, and objectives live in each lesson's frontmatter
 * (content/lessons/<slug>.md); this file only says what exists and in what order.
 */

export type Verb = "Analyze" | "Measure" | "Improve" | "Bonus";

export interface ModuleDef {
  id: number;
  title: string;
  blurb: string;
  lessons: string[]; // lesson slugs, in order
}

export const COURSE_TITLE = "Spec-Driven AI Engineering";
export const COURSE_TAGLINE =
  "Build, evaluate, and ship reliable AI agents, from SPEC.md to production.";

export const MODULES: ModuleDef[] = [
  {
    id: 0,
    title: "Start Here",
    blurb:
      "A gentle primer for beginners: what language models, agents, tools, and traces are, and why normal testing is not enough.",
    lessons: ["l0-foundations-for-beginners"],
  },
  {
    id: 1,
    title: "Building Agents",
    blurb:
      "Write the spec, build a support agent with permissions enforced in code, instrument it so its behavior is measurable, and generate the scenarios every later module uses.",
    lessons: [
      "l1-building-agents-foundations",
      "l2-designing-for-evaluability",
      "l3-synthetic-data-and-scenarios",
    ],
  },
  {
    id: 2,
    title: "Error Analysis",
    blurb:
      "Turn traces into a human-owned failure taxonomy, then build validated evaluators and a prevalence estimate you can defend.",
    lessons: ["l4-finding-failures", "l5-measuring-with-evaluators"],
  },
  {
    id: 3,
    title: "CI/CD",
    blurb:
      "Turn failures into a regression suite that gates deployments, and monitor production with the same evaluators.",
    lessons: ["l6-ci-cd-for-agents"],
  },
  {
    id: 4,
    title: "Security, Safety, and Governance",
    blurb:
      "Map the attack surface, red-team the running agent, add guards and human approval, and keep a governance record.",
    lessons: ["l7-safety-and-adversarial-evaluation"],
  },
  {
    id: 5,
    title: "Improving Agents",
    blurb:
      "Compare configurations on accuracy and cost, route each fix to the cheapest layer, and run the upgrade drill when new models ship.",
    lessons: ["l8-improving-accuracy", "l9-improving-cost"],
  },
  {
    id: 6,
    title: "Bonus",
    blurb: "Common traps in eval-focused interviews and how to avoid them.",
    lessons: ["b1-evals-interview-prep"],
  },
];

/** Short labels for the sidebar (titles in frontmatter can be long). */
export const SHORT_TITLES: Record<string, string> = {
  "l0-foundations-for-beginners": "Foundations for beginners",
  "l1-building-agents-foundations": "Building agents: foundations",
  "l2-designing-for-evaluability": "Designing for evaluability",
  "l3-synthetic-data-and-scenarios": "Synthetic data and scenarios",
  "l4-finding-failures": "Finding failures",
  "l5-measuring-with-evaluators": "Measuring with evaluators",
  "l6-ci-cd-for-agents": "CI/CD for agents",
  "l7-safety-and-adversarial-evaluation": "Safety and adversarial evaluation",
  "l8-improving-accuracy": "Improving accuracy",
  "l9-improving-cost": "Improving cost",
  "b1-evals-interview-prep": "Evals interview prep",
};

export const LESSON_ORDER: string[] = MODULES.flatMap((m) => m.lessons);

export function moduleForLesson(slug: string): ModuleDef | undefined {
  return MODULES.find((m) => m.lessons.includes(slug));
}

export function neighbors(slug: string): { prev?: string; next?: string } {
  const i = LESSON_ORDER.indexOf(slug);
  if (i === -1) return {};
  return {
    prev: i > 0 ? LESSON_ORDER[i - 1] : undefined,
    next: i < LESSON_ORDER.length - 1 ? LESSON_ORDER[i + 1] : undefined,
  };
}

export function isLessonSlug(slug: string): boolean {
  return LESSON_ORDER.includes(slug);
}

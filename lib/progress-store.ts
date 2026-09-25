/**
 * A tiny external store for learner progress, backed by localStorage.
 * Used with React's useSyncExternalStore so server rendering (empty) and the
 * first client render (from localStorage) never disagree.
 */
import { EMPTY_PROGRESS, type ProgressSnapshot } from "./progress-types";

const STORAGE_KEY = "sdd:progress:v2"; // v2: records carry a courseSlug
const listeners = new Set<() => void>();
let state: ProgressSnapshot = EMPTY_PROGRESS;
let initialized = false;

function readLocal(): ProgressSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<ProgressSnapshot>;
    return { lessons: parsed.lessons ?? {}, attempts: parsed.attempts ?? [] };
  } catch {
    return EMPTY_PROGRESS;
  }
}

function writeLocal(s: ProgressSnapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* private mode or quota exceeded; the in-memory copy still works */
  }
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  state = readLocal();
}

export const progressStore = {
  subscribe(listener: () => void) {
    init();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot(): ProgressSnapshot {
    init();
    return state;
  },
  getServerSnapshot(): ProgressSnapshot {
    return EMPTY_PROGRESS;
  },
  update(fn: (s: ProgressSnapshot) => ProgressSnapshot) {
    const next = fn(state);
    if (next === state) return;
    state = next;
    writeLocal(state);
    listeners.forEach((l) => l());
  },
};

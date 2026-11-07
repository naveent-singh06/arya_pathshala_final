import { useCallback, useMemo, useSyncExternalStore } from 'react';

// Learner progress is stored in this browser only (localStorage), per signed-in user.
// It is NOT synced to any server: the pages say so. When a backend exists, replace the
// load/save functions below and nothing else needs to change.

const KEY = 'arya-pathshala-learner-v1';
const EMPTY = { enrolled: [], done: [], last: null, results: {}, activity: [] };
const MAX_ACTIVITY = 20;

// ---- pure helpers (easy to unit test) --------------------------------------------------

export const emptyState = () => ({ ...EMPTY, enrolled: [], done: [], results: {}, activity: [] });

const withActivity = (state, text, now) => ({
  ...state,
  activity: [{ text, at: now }, ...state.activity].slice(0, MAX_ACTIVITY),
});

export function enroll(state, courseId, title = 'a course', now = Date.now()) {
  if (state.enrolled.includes(courseId)) return state;
  return withActivity({ ...state, enrolled: [...state.enrolled, courseId] }, `Enrolled in ${title}`, now);
}

export function unenroll(state, courseId) {
  return { ...state, enrolled: state.enrolled.filter((id) => id !== courseId) };
}

export function recordVisit(state, courseId, lectureId, title = 'a lecture', now = Date.now()) {
  if (state.last && state.last.lectureId === lectureId) return state;
  return withActivity({ ...state, last: { courseId, lectureId, at: now } }, `Opened ${title}`, now);
}

export function markLectureDone(state, lectureId, title = 'a lecture', now = Date.now()) {
  if (state.done.includes(lectureId)) return state;
  return withActivity({ ...state, done: [...state.done, lectureId] }, `Completed ${title}`, now);
}

export function unmarkLectureDone(state, lectureId) {
  return { ...state, done: state.done.filter((id) => id !== lectureId) };
}

export function saveResult(state, setId, correct, total, title = 'a quiz', now = Date.now()) {
  const percent = total ? Math.round((correct / total) * 100) : 0;
  const previous = state.results[setId];
  const best = previous ? Math.max(previous.best, percent) : percent;
  const next = { ...state, results: { ...state.results, [setId]: { correct, total, percent, best, at: now } } };
  return withActivity(next, `Scored ${correct}/${total} in ${title}`, now);
}

/** Progress through a list of lecture ids: { done, total, percent }. */
export function courseProgress(state, lectureIds) {
  const total = lectureIds.length;
  const done = lectureIds.filter((id) => state.done.includes(id)).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

// ---- storage ---------------------------------------------------------------------------

const read = () => {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const listeners = new Set();
let cache = null;
let cacheRaw = null;

const snapshotAll = () => {
  let raw = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch (e) {
    /* storage unavailable: fall through to the in-memory copy */
  }
  if (cache === null || raw !== cacheRaw) {
    cache = raw ? read() : cache || {};
    cacheRaw = raw;
  }
  return cache;
};

const writeAll = (all) => {
  cache = all;
  try {
    const raw = JSON.stringify(all);
    window.localStorage.setItem(KEY, raw);
    cacheRaw = raw;
  } catch (e) {
    /* storage blocked: state still works for this tab */
  }
  listeners.forEach((fn) => fn());
};

const subscribe = (fn) => {
  listeners.add(fn);
  const onStorage = (event) => {
    if (event.key === KEY) fn();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
};

/** React hook: [state, actions] for one user (pass the Firebase uid, or nothing for a guest). */
export function useLearnerState(uid) {
  const id = uid || 'guest';
  const all = useSyncExternalStore(subscribe, snapshotAll, () => ({}));
  const stored = all[id];
  const state = useMemo(() => ({ ...emptyState(), ...(stored || {}) }), [stored]);

  const update = useCallback(
    (fn) => {
      const current = { ...emptyState(), ...(snapshotAll()[id] || {}) };
      const next = fn(current);
      if (next !== current) writeAll({ ...snapshotAll(), [id]: next });
    },
    [id]
  );

  const actions = useMemo(
    () => ({
      enroll: (courseId, title) => update((s) => enroll(s, courseId, title)),
      unenroll: (courseId) => update((s) => unenroll(s, courseId)),
      visit: (courseId, lectureId, title) => update((s) => recordVisit(s, courseId, lectureId, title)),
      markDone: (lectureId, title) => update((s) => markLectureDone(s, lectureId, title)),
      unmarkDone: (lectureId) => update((s) => unmarkLectureDone(s, lectureId)),
      saveResult: (setId, correct, total, title) => update((s) => saveResult(s, setId, correct, total, title)),
    }),
    [update]
  );

  return [state, actions];
}

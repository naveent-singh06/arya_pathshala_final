import { courseLectures, getCourse, getLectureContext } from './courses';
import { courseProgress } from './learnerState';

/**
 * What a student should do next in one course.
 * - last: the lecture they most recently opened in this course (or null)
 * - next: the lecture after it, or the first unfinished one, or the first lecture of a new course
 * - progress: { done, total, percent }
 */
export function continueFor(state, course) {
  const lectures = courseLectures(course);
  const progress = courseProgress(state, lectures.map((l) => l.id));
  const lastId = state.last && state.last.courseId === course.id ? state.last.lectureId : null;
  const last = lastId ? lectures.find((l) => l.id === lastId) || null : null;

  let next = null;
  if (last) next = lectures[last.order + 1] || null;
  if (!next || state.done.includes(next.id)) {
    next = lectures.find((l) => !state.done.includes(l.id) && (!last || l.order > last.order)) || lectures.find((l) => !state.done.includes(l.id)) || null;
  }
  if (!last && !next) next = lectures[0] || null;
  return { last, next, progress, finished: progress.total > 0 && progress.done === progress.total };
}

/** The course to feature first: the one last opened, else the first enrolled course. */
export function featuredCourse(state) {
  if (state.last) {
    const c = getCourse(state.last.courseId);
    if (c) return c;
  }
  for (const id of state.enrolled) {
    const c = getCourse(id);
    if (c) return c;
  }
  return null;
}

export { getLectureContext };

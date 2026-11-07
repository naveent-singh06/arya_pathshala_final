// Shared vocabulary and pure helpers for the content system.
import { CATEGORIES } from '../data/categories';

export const CLASSES = CATEGORIES.map((c) => ({ id: c.id, title: c.title }));
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
// Older content used Basic / Intermediate / Advanced; show those as Easy / Medium / Hard.
export const difficultyLabel = (d) => ({ Basic: 'Easy', Intermediate: 'Medium', Advanced: 'Hard' }[d] || d || 'Easy');
export const RESOURCE_TYPES = ['Chapter Notes', 'NCERT Solutions', 'Revision Notes', 'Formula Sheets', 'Important Questions', 'Sample Papers', 'DPP / Practice PDF', 'Other'];
export const STATUSES = ['draft', 'published', 'unpublished'];
export const COLLECTIONS = ['courses', 'batches', 'teachers', 'subjects', 'chapters', 'topics', 'lectures', 'resources', 'dpps', 'questions'];

/** The three built-in courses plus any course the admin adds (a course id is used as the classId of its content). */
export function allClasses(data) {
  const extra = ((data && data.courses) || []).slice().sort(byOrder).map((c) => ({ id: c.id, title: c.title }));
  return [...CLASSES, ...extra];
}

export const isPublished = (item) => !!item && item.status === 'published';
export const byOrder = (a, b) => (a.order || 0) - (b.order || 0) || String(a.title || a.name || '').localeCompare(String(b.title || b.name || ''));

/** Filter to what students may see: a published item whose parents are all published as well. */
export function visibleData(data) {
  const subjects = (data.subjects || []).filter(isPublished);
  const sIds = new Set(subjects.map((x) => x.id));
  const chapters = (data.chapters || []).filter((c) => isPublished(c) && sIds.has(c.subjectId));
  const cIds = new Set(chapters.map((x) => x.id));
  const topics = (data.topics || []).filter((t) => isPublished(t) && cIds.has(t.chapterId));
  const tIds = new Set(topics.map((x) => x.id));
  const child = (list) => (list || []).filter((x) => isPublished(x) && tIds.has(x.topicId));
  const dpps = (data.dpps || []).filter((d) => isPublished(d) && cIds.has(d.chapterId) && (!d.topicId || tIds.has(d.topicId)));
  const courses = (data.courses || []).filter(isPublished);
  const batches = (data.batches || []).filter(isPublished);
  return { courses, batches, teachers: (data.teachers || []).filter(isPublished), subjects, chapters, topics, lectures: child(data.lectures), resources: child(data.resources), questions: child(data.questions), dpps };
}

/** A built-in or admin-created course by id: { id, title, description } or null. */
export function findCourse(data, id) {
  const builtin = CATEGORIES.find((c) => c.id === id);
  if (builtin) {
    const edited = ((data && data.courses) || []).find((c) => c.id === id);
    return { id, title: builtin.title, description: (edited && edited.description) || builtin.description };
  }
  const c = ((data && data.courses) || []).find((x) => x.id === id);
  return c ? { id: c.id, title: c.title, description: c.description || '' } : null;
}

/** Published subjects assigned to a batch, in the batch's own order. */
export function batchSubjects(data, batch) {
  if (!batch) return [];
  const ids = batch.subjectIds || [];
  return ids.map((id) => (data.subjects || []).find((s) => s.id === id)).filter(Boolean);
}
export const batchTeachers = (data, batch) => ((batch && batch.teacherIds) || []).map((id) => (data.teachers || []).find((t) => t.id === id)).filter(Boolean);

/** Class -> subjects -> chapters -> topics (each topic carries its lectures, resources and questions), all sorted. */
export function buildTree(data, classId) {
  const group = (list, key) => {
    const map = new Map();
    (list || []).forEach((x) => map.set(x[key], [...(map.get(x[key]) || []), x]));
    return (id) => (map.get(id) || []).slice().sort(byOrder);
  };
  const chaptersOf = group(data.chapters, 'subjectId');
  const topicsOf = group(data.topics, 'chapterId');
  const lecturesOf = group(data.lectures, 'topicId');
  const resourcesOf = group(data.resources, 'topicId');
  const questionsOf = group(data.questions, 'topicId');
  const dppsOfTopic = group(data.dpps, 'topicId');
  const chapterDpps = group((data.dpps || []).filter((d) => !d.topicId), 'chapterId');
  return (data.subjects || [])
    .filter((s) => !classId || s.classId === classId)
    .sort(byOrder)
    .map((s) => ({
      ...s,
      chapters: chaptersOf(s.id).map((c) => ({
        ...c,
        dpps: chapterDpps(c.id),
        topics: topicsOf(c.id).map((t) => ({ ...t, lectures: lecturesOf(t.id), resources: resourcesOf(t.id), questions: questionsOf(t.id), dpps: dppsOfTopic(t.id) })),
      })),
    }));
}

/** Flat ordered topic list for one subject (used for Previous / Next navigation). */
export const flatTopics = (subject) => (subject ? subject.chapters.flatMap((c) => c.topics.map((t) => ({ ...t, chapterTitle: c.title }))) : []);

export function chapterProgress(chapter, progress) {
  const total = chapter.topics.length;
  const done = chapter.topics.filter((t) => progress && progress[t.id] && progress[t.id].completed).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

/** Where to put a new item: one after the highest existing order among its siblings. */
export const nextOrder = (siblings) => (siblings || []).reduce((m, x) => Math.max(m, x.order || 0), 0) + 1;

/** Swap the order of an item with its neighbour; returns the two changed { id, order } pairs (or []). */
export function reorderPairs(list, id, direction) {
  const sorted = list.slice().sort(byOrder);
  const i = sorted.findIndex((x) => x.id === id);
  const j = i + (direction === 'up' ? -1 : 1);
  if (i < 0 || j < 0 || j >= sorted.length) return [];
  // Give every item its position so equal/missing orders cannot collide.
  return [{ id: sorted[i].id, order: j + 1 }, { id: sorted[j].id, order: i + 1 }];
}

export const statusLabel = (s) => ({ draft: 'Draft', published: 'Published', unpublished: 'Unpublished' }[s] || 'Draft');

const isDone = (progress, id) => !!(progress && progress[id] && progress[id].completed);
const progressOf = (topics, progress) => {
  const total = topics.length;
  const done = topics.filter((t) => isDone(progress, t.id)).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
};
export const subjectProgress = (subject, progress) => progressOf(subject.chapters.flatMap((c) => c.topics), progress);
/** Progress across every subject of a batch. `subjects` are tree subjects (with chapters and topics). */
export const batchProgress = (subjects, progress) => progressOf(subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics)), progress);

/** Questions belong to the Practice tab unless the admin marked them as part of the DPP. */
export const splitQuestions = (questions) => ({
  practice: (questions || []).filter((q) => q.set !== 'dpp'),
  dpp: (questions || []).filter((q) => q.set === 'dpp'),
});

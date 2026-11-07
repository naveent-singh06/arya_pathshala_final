// Shared vocabulary and pure helpers for the content system.
import { CATEGORIES } from '../data/categories';

export const CLASSES = CATEGORIES.map((c) => ({ id: c.id, title: c.title }));
export const DIFFICULTIES = ['Basic', 'Intermediate', 'Advanced'];
export const RESOURCE_TYPES = ['Chapter Notes', 'NCERT Solutions', 'Revision Notes', 'Formula Sheets', 'Important Questions', 'Sample Papers', 'DPP / Practice PDF', 'Other'];
export const STATUSES = ['draft', 'published', 'unpublished'];
export const COLLECTIONS = ['subjects', 'chapters', 'topics', 'lectures', 'resources', 'questions'];

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
  return { subjects, chapters, topics, lectures: child(data.lectures), resources: child(data.resources), questions: child(data.questions) };
}

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
  return (data.subjects || [])
    .filter((s) => !classId || s.classId === classId)
    .sort(byOrder)
    .map((s) => ({
      ...s,
      chapters: chaptersOf(s.id).map((c) => ({
        ...c,
        topics: topicsOf(c.id).map((t) => ({ ...t, lectures: lecturesOf(t.id), resources: resourcesOf(t.id), questions: questionsOf(t.id) })),
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

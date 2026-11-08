import { parseYouTube } from '../cms/youtube';
import { parseDrive } from '../cms/drive';
import { normalizeLink, PLATFORMS } from '../cms/links';
import { DIFFICULTIES, RESOURCE_TYPES } from '../cms/model';

const httpsOrEmpty = (v) => {
  const t = String(v == null ? '' : v).trim();
  if (!t) return { ok: true, value: '' };
  try {
    const u = new URL(t);
    return u.protocol === 'https:' && u.hostname.includes('.') ? { ok: true, value: u.toString() } : { ok: false };
  } catch (e) {
    return { ok: false };
  }
};

const text = (v) => String(v == null ? '' : v).trim();
const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));

function base(form, errors, { levels, titleKey, titleLabel, max = 200 }) {
  if (!form.classId) errors.classId = 'Select a class or exam.';
  if (levels > 1 && !form.subjectId) errors.subjectId = 'Select a subject.';
  if (levels > 2 && !form.chapterId) errors.chapterId = 'Select a chapter.';
  if (levels > 3 && !form.topicId) errors.topicId = 'Select a topic.';
  if (!text(form[titleKey])) errors[titleKey] = `${titleLabel} is required.`;
  else if (text(form[titleKey]).length > max) errors[titleKey] = `Keep ${titleLabel.toLowerCase()} under ${max} characters.`;
  if (form.order !== undefined && form.order !== '' && (num(form.order) == null || num(form.order) < 0)) errors.order = 'Order must be a number, 0 or more.';
}

const scopeIds = (form, levels) => {
  const o = { classId: form.classId };
  if (levels > 1) o.subjectId = form.subjectId;
  if (levels > 2) o.chapterId = form.chapterId;
  if (levels > 3) o.topicId = form.topicId;
  return o;
};

export const MANAGERS = {
  subjects: {
    title: 'Subjects', singular: 'subject', levels: 1, parent: 'classId', titleKey: 'name',
    fields: [
      { key: 'name', label: 'Subject name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'imageUrl', label: 'Image link (optional)', type: 'text', help: 'A https:// picture link. Leave empty to use an icon.' },
      { key: 'addToBatch', label: 'Add to batch', type: 'batchpick', help: 'Students only see a subject through a batch. Pick the batch now, or tick the subject later under Batches.' },
      { key: 'order', label: 'Display order', type: 'number', help: 'Lower numbers show first.' },
    ],
    build(form) {
      const errors = {};
      base(form, errors, { levels: 1, titleKey: 'name', titleLabel: 'Subject name', max: 120 });
      const img = httpsOrEmpty(form.imageUrl);
      if (!img.ok) errors.imageUrl = 'Use a full https:// link.';
      return { errors, data: { ...scopeIds(form, 1), name: text(form.name), description: text(form.description), imageUrl: img.ok ? img.value : '', order: num(form.order) || 0 } };
    },
  },
  chapters: {
    title: 'Chapters', singular: 'chapter', levels: 2, parent: 'subjectId', titleKey: 'title',
    fields: [
      { key: 'number', label: 'Chapter number', type: 'number' },
      { key: 'title', label: 'Chapter title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'order', label: 'Display order', type: 'number', help: 'Lower numbers show first.' },
    ],
    build(form) {
      const errors = {};
      base(form, errors, { levels: 2, titleKey: 'title', titleLabel: 'Chapter title' });
      return { errors, data: { ...scopeIds(form, 2), number: num(form.number) || 0, title: text(form.title), description: text(form.description), order: num(form.order) || 0 } };
    },
  },
  topics: {
    title: 'Topics', singular: 'topic', levels: 3, parent: 'chapterId', titleKey: 'title',
    fields: [
      { key: 'title', label: 'Topic title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'difficulty', label: 'Difficulty', type: 'select', options: DIFFICULTIES },
      { key: 'order', label: 'Display order', type: 'number', help: 'Lower numbers show first.' },
    ],
    build(form) {
      const errors = {};
      base(form, errors, { levels: 3, titleKey: 'title', titleLabel: 'Topic title' });
      return { errors, data: { ...scopeIds(form, 3), title: text(form.title), description: text(form.description), difficulty: DIFFICULTIES.includes(form.difficulty) ? form.difficulty : 'Easy', order: num(form.order) || 0 } };
    },
  },
  lectures: {
    title: 'Lectures', singular: 'lecture', levels: 4, parent: 'topicId', titleKey: 'title',
    fields: [
      { key: 'title', label: 'Lecture title', type: 'text', required: true },
      { key: 'teacherName', label: 'Teacher name', type: 'text' },
      { key: 'youtubeUrl', label: 'YouTube link', type: 'text', required: true, help: 'Paste a watch, youtu.be, live or embed link.' },
      { key: 'duration', label: 'Duration (optional)', type: 'text', help: 'For example 24:30' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'order', label: 'Lecture number / order', type: 'number', help: 'A topic can have any number of lectures. Lower numbers show first.' },
    ],
    build(form) {
      const errors = {};
      base(form, errors, { levels: 4, titleKey: 'title', titleLabel: 'Lecture title' });
      const yt = parseYouTube(form.youtubeUrl);
      if (!yt.ok) errors.youtubeUrl = yt.error;
      if (text(form.duration).length > 30) errors.duration = 'Keep duration short, like 24:30.';
      return {
        errors,
        data: {
          ...scopeIds(form, 4), title: text(form.title), teacherName: text(form.teacherName), youtubeUrl: text(form.youtubeUrl),
          youtubeVideoId: yt.ok ? yt.id : '', duration: text(form.duration), description: text(form.description), order: num(form.order) || 0,
        },
      };
    },
  },
  resources: {
    title: 'Notes & PDFs', singular: 'resource', levels: 4, parent: 'topicId', titleKey: 'title', drive: true,
    help: 'Add notes, revision material or a quiz. Paste a Google Drive link, any https:// link (a PDF or a page), or for a quiz an in-app route such as /tests. You can add as many as you need to one topic.',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'type', label: 'Resource type', type: 'select', options: RESOURCE_TYPES },
      { key: 'driveUrl', label: 'Link (Google Drive, https:// PDF/page, or /tests route for a quiz)', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'order', label: 'Display order', type: 'number' },
    ],
    build(form) {
      const errors = {};
      base(form, errors, { levels: 4, titleKey: 'title', titleLabel: 'Title' });
      const raw = text(form.driveUrl);
      const type = RESOURCE_TYPES.includes(form.type) ? form.type : 'Chapter Notes';
      let link = { driveUrl: '', driveId: '', externalUrl: '', route: '' };
      if (!raw) errors.driveUrl = 'Paste a link.';
      else if (raw.startsWith('/')) {
        if (type === 'Quiz' && /^\/tests(\/[A-Za-z0-9_-]+)?$/.test(raw)) link.route = raw;
        else errors.driveUrl = type === 'Quiz' ? 'Use /tests or /tests/<quiz id>, or a full https:// link.' : 'In-app routes are only for the Quiz type. Use a full https:// link.';
      } else {
        const d = parseDrive(raw);
        if (d.ok) link = { ...link, driveUrl: d.viewUrl, driveId: d.id };
        else if (/drive\.google\.com|docs\.google\.com/i.test(raw)) errors.driveUrl = d.error;
        else {
          const ext = httpsOrEmpty(raw);
          if (ext.ok && ext.value) link.externalUrl = ext.value;
          else errors.driveUrl = 'Use a full https:// link, for example https://example.com/notes.pdf.';
        }
      }
      return { errors, data: { ...scopeIds(form, 4), title: text(form.title), type, ...link, description: text(form.description), order: num(form.order) || 0 } };
    },
    toForm(item) {
      return { ...item, driveUrl: item.driveUrl || item.externalUrl || item.route || '', order: String(item.order || 0) };
    },
  },
  questions: {
    title: 'Practice Questions', singular: 'question', levels: 4, parent: 'topicId', titleKey: 'question',
    fields: [
      { key: 'question', label: 'Question', type: 'textarea', required: true },
      { key: 'o0', label: 'Option A', type: 'text', required: true },
      { key: 'o1', label: 'Option B', type: 'text', required: true },
      { key: 'o2', label: 'Option C', type: 'text', required: true },
      { key: 'o3', label: 'Option D', type: 'text', required: true },
      { key: 'correctIndex', label: 'Correct answer', type: 'select', options: ['A', 'B', 'C', 'D'], valueByIndex: true },
      { key: 'explanation', label: 'Explanation', type: 'textarea' },
      { key: 'difficulty', label: 'Difficulty', type: 'select', options: DIFFICULTIES },
      { key: 'set', label: 'Where it appears', type: 'select', options: [{ value: 'practice', label: 'Practice questions' }, { value: 'dpp', label: 'DPP (daily practice problems)' }] },
      { key: 'order', label: 'Display order', type: 'number' },
    ],
    build(form) {
      const errors = {};
      base(form, errors, { levels: 4, titleKey: 'question', titleLabel: 'Question', max: 2000 });
      [0, 1, 2, 3].forEach((i) => {
        if (!text(form[`o${i}`])) errors[`o${i}`] = 'Enter this option.';
      });
      const options = [0, 1, 2, 3].map((i) => text(form[`o${i}`]));
      const unique = new Set(options.map((o) => o.toLowerCase()));
      if (!errors.o0 && !errors.o1 && !errors.o2 && !errors.o3 && unique.size < 4) errors.o3 = 'Each option must be different.';
      const ci = Number(form.correctIndex);
      if (!(ci >= 0 && ci <= 3)) errors.correctIndex = 'Choose the correct answer.';
      return {
        errors,
        data: {
          ...scopeIds(form, 4), question: text(form.question), options, correctIndex: ci >= 0 && ci <= 3 ? ci : 0,
          explanation: text(form.explanation), difficulty: DIFFICULTIES.includes(form.difficulty) ? form.difficulty : 'Easy', type: 'mcq', set: form.set === 'dpp' ? 'dpp' : 'practice', order: num(form.order) || 0,
        },
      };
    },
    // Edit form <- stored doc
    toForm(item) {
      return { ...item, o0: item.options[0], o1: item.options[1], o2: item.options[2], o3: item.options[3], correctIndex: String(item.correctIndex), set: item.set || 'practice', order: String(item.order || 0) };
    },
  },

  courses: {
    title: 'Courses', singular: 'course', levels: 0, titleKey: 'title',
    help: 'Class 9, Class 10 and NEET always exist. Add another course here and it appears next to them.',
    fields: [
      { key: 'title', label: 'Course name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'order', label: 'Display order', type: 'number' },
    ],
    build(form) {
      const errors = {};
      if (!text(form.title)) errors.title = 'Course name is required.';
      else if (text(form.title).length > 120) errors.title = 'Keep the name under 120 characters.';
      return { errors, data: { title: text(form.title), description: text(form.description), order: num(form.order) || 0 } };
    },
  },
  batches: {
    title: 'Batches', singular: 'batch', levels: 1, parent: 'classId', titleKey: 'name',
    fields: [
      { key: 'name', label: 'Batch name', type: 'text', required: true, help: 'For example "Class 9 Foundation Batch".' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'session', label: 'Academic session', type: 'text', help: 'For example 2026-27' },
      { key: 'duration', label: 'Course duration', type: 'text', help: 'For example "10 months"' },
      { key: 'coverUrl', label: 'Cover image link (optional)', type: 'text', help: 'A https:// picture link.' },
      { key: 'subjectIds', label: 'Subjects in this batch', type: 'multi', from: 'subjects', help: 'Tick the subjects students of this batch study. Subjects are listed for the selected class.' },
      { key: 'teacherIds', label: 'Teachers', type: 'multi', from: 'teachers', help: 'Add teachers in the Teachers section first.' },
      { key: 'order', label: 'Display order', type: 'number' },
    ],
    build(form) {
      const errors = {};
      base(form, errors, { levels: 1, titleKey: 'name', titleLabel: 'Batch name', max: 120 });
      const cover = httpsOrEmpty(form.coverUrl);
      if (!cover.ok) errors.coverUrl = 'Use a full https:// link.';
      const ids = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);
      return {
        errors,
        data: {
          ...scopeIds(form, 1), name: text(form.name), description: text(form.description), session: text(form.session), duration: text(form.duration),
          coverUrl: cover.ok ? cover.value : '', subjectIds: ids(form.subjectIds), teacherIds: ids(form.teacherIds), order: num(form.order) || 0,
        },
      };
    },
  },
  teachers: {
    title: 'Teachers', singular: 'teacher', levels: 0, titleKey: 'name',
    fields: [
      { key: 'name', label: 'Teacher name', type: 'text', required: true },
      { key: 'subjects', label: 'Subjects they teach', type: 'text', help: 'For example "Mathematics, Science"' },
      { key: 'bio', label: 'Short introduction', type: 'textarea' },
      { key: 'photoUrl', label: 'Photo link (optional)', type: 'text', help: 'A https:// picture link.' },
      { key: 'order', label: 'Display order', type: 'number' },
    ],
    build(form) {
      const errors = {};
      if (!text(form.name)) errors.name = 'Teacher name is required.';
      else if (text(form.name).length > 120) errors.name = 'Keep the name under 120 characters.';
      const photo = httpsOrEmpty(form.photoUrl);
      if (!photo.ok) errors.photoUrl = 'Use a full https:// link.';
      return { errors, data: { name: text(form.name), subjects: text(form.subjects), bio: text(form.bio), photoUrl: photo.ok ? photo.value : '', order: num(form.order) || 0 } };
    },
  },
  dpps: {
    title: 'DPP', singular: 'DPP', levels: 4, optionalLevel: 4, parent: 'chapterId', titleKey: 'title', drive: true,
    help: 'Pick a chapter. Pick a topic as well if this DPP belongs to one topic. Question-based DPPs: add questions under Practice Questions and set "Where it appears" to DPP.',
    fields: [
      { key: 'title', label: 'DPP title', type: 'text', required: true },
      { key: 'driveUrl', label: 'Google Drive PDF link', type: 'text', help: 'Use this or the external link below.' },
      { key: 'externalUrl', label: 'Or external practice link', type: 'text', help: 'A full https:// link.' },
      { key: 'instructions', label: 'Instructions', type: 'textarea' },
      { key: 'dueDate', label: 'Due date (optional)', type: 'date' },
      { key: 'order', label: 'Display order', type: 'number' },
    ],
    build(form) {
      const errors = {};
      base(form, errors, { levels: 3, titleKey: 'title', titleLabel: 'DPP title' });
      const drive = text(form.driveUrl) ? parseDrive(form.driveUrl) : null;
      const ext = httpsOrEmpty(form.externalUrl);
      if (drive && !drive.ok) errors.driveUrl = drive.error;
      if (!ext.ok) errors.externalUrl = 'Use a full https:// link.';
      if (!drive && !text(form.externalUrl) && !errors.driveUrl) errors.driveUrl = 'Add a Google Drive link or an external practice link.';
      if (form.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.dueDate)) errors.dueDate = 'Pick a valid date.';
      return {
        errors,
        data: {
          ...scopeIds(form, 3), topicId: form.topicId || '', title: text(form.title), driveUrl: drive && drive.ok ? drive.viewUrl : '', driveId: drive && drive.ok ? drive.id : '',
          externalUrl: ext.ok ? ext.value : '', instructions: text(form.instructions), dueDate: text(form.dueDate), order: num(form.order) || 0,
        },
      };
    },
  },
  socialLinks: {
    title: 'Social Links & Contact', singular: 'link', levels: 0, titleKey: 'label', noStatus: true,
    fields: [
      { key: 'platform', label: 'Platform', type: 'select', options: PLATFORMS.map((p) => ({ value: p.id, label: p.label })), required: true },
      { key: 'label', label: 'Display name', type: 'text', help: 'Shown to students, for example "Arya Pathshala on YouTube".' },
      { key: 'url', label: 'Link or email', type: 'text', required: true, help: 'Use a full https:// link. For Email, enter the address.' },
      { key: 'description', label: 'Description (optional)', type: 'textarea' },
      { key: 'order', label: 'Display order', type: 'number' },
    ],
    build(form) {
      const errors = {};
      const check = normalizeLink(form.platform, form.url);
      if (!form.platform) errors.platform = 'Choose a platform.';
      else if (!check.ok) errors.url = check.error;
      const p = PLATFORMS.find((x) => x.id === form.platform);
      return {
        errors,
        data: { platform: form.platform || '', label: text(form.label) || (p ? p.label : ''), url: check.ok ? check.value : text(form.url), description: text(form.description), order: num(form.order) || 0, active: form.active !== false },
      };
    },
  },
};

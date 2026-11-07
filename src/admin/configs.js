import { parseYouTube } from '../cms/youtube';
import { parseDrive } from '../cms/drive';
import { normalizeLink, PLATFORMS } from '../cms/links';
import { DIFFICULTIES, RESOURCE_TYPES } from '../cms/model';

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
      { key: 'order', label: 'Display order', type: 'number', help: 'Lower numbers show first.' },
    ],
    build(form) {
      const errors = {};
      base(form, errors, { levels: 1, titleKey: 'name', titleLabel: 'Subject name', max: 120 });
      return { errors, data: { ...scopeIds(form, 1), name: text(form.name), description: text(form.description), order: num(form.order) || 0 } };
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
      return { errors, data: { ...scopeIds(form, 3), title: text(form.title), description: text(form.description), difficulty: DIFFICULTIES.includes(form.difficulty) ? form.difficulty : 'Basic', order: num(form.order) || 0 } };
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
    title: 'Notes & PDFs', singular: 'note', levels: 4, parent: 'topicId', titleKey: 'title', drive: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'type', label: 'Resource type', type: 'select', options: RESOURCE_TYPES },
      { key: 'driveUrl', label: 'Google Drive link', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'order', label: 'Display order', type: 'number' },
    ],
    build(form) {
      const errors = {};
      base(form, errors, { levels: 4, titleKey: 'title', titleLabel: 'Title' });
      const d = parseDrive(form.driveUrl);
      if (!d.ok) errors.driveUrl = d.error;
      return {
        errors,
        data: {
          ...scopeIds(form, 4), title: text(form.title), type: RESOURCE_TYPES.includes(form.type) ? form.type : 'Chapter Notes',
          driveUrl: d.ok ? d.viewUrl : '', driveId: d.ok ? d.id : '', description: text(form.description), order: num(form.order) || 0,
        },
      };
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
          explanation: text(form.explanation), difficulty: DIFFICULTIES.includes(form.difficulty) ? form.difficulty : 'Basic', type: 'mcq',
        },
      };
    },
    // Edit form <- stored doc
    toForm(item) {
      return { ...item, o0: item.options[0], o1: item.options[1], o2: item.options[2], o3: item.options[3], correctIndex: String(item.correctIndex) };
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

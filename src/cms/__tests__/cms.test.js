import { parseYouTube } from '../youtube';
import { parseDrive } from '../drive';
import { normalizeLink, visibleLinks } from '../links';
import { buildTree, visibleData, chapterProgress, reorderPairs, nextOrder, flatTopics, resourceLink } from '../model';
import { MANAGERS } from '../../admin/configs';

describe('parseYouTube', () => {
  const id = 'dQw4w9WgXcQ';
  test.each([
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=30s`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/live/${id}?feature=share`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
    `https://www.youtube.com/shorts/${id}`,
    `m.youtube.com/watch?v=${id}`,
    id,
  ])('accepts %s', (url) => expect(parseYouTube(url)).toEqual({ ok: true, id }));
  test.each([
    '', 'hello', 'https://vimeo.com/12345', 'https://evil.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/playlist?list=PL123', 'https://www.youtube.com/', 'javascript:alert(1)', 'https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ',
  ])('rejects %s', (url) => expect(parseYouTube(url).ok).toBe(false));
});

describe('parseDrive', () => {
  test('normalizes a file link', () => {
    const r = parseDrive('https://drive.google.com/file/d/1AbCdEfGhIjK_lm-N/view?usp=sharing');
    expect(r.ok).toBe(true);
    expect(r.viewUrl).toBe('https://drive.google.com/file/d/1AbCdEfGhIjK_lm-N/view');
    expect(r.previewUrl).toMatch(/\/preview$/);
    expect(r.downloadUrl).toContain('export=download&id=1AbCdEfGhIjK_lm-N');
  });
  test('handles open?id= and uc?id=', () => {
    expect(parseDrive('https://drive.google.com/open?id=1AbCdEfGhIjK').id).toBe('1AbCdEfGhIjK');
    expect(parseDrive('https://drive.google.com/uc?id=1AbCdEfGhIjK&export=download').ok).toBe(true);
  });
  test('Google Docs have no direct download', () => {
    const r = parseDrive('https://docs.google.com/document/d/1AbCdEfGhIjK/edit');
    expect(r.ok).toBe(true);
    expect(r.downloadUrl).toBeNull();
  });
  test.each(['', 'https://example.com/file/d/1AbCdEfGhIjK/view', 'https://drive.google.com/drive/folders/1AbCdEfGhIjK', 'http://drive.google.com/file/d/1AbCdEfGhIjK/view', 'https://drive.google.com/'])('rejects %s', (u) => expect(parseDrive(u).ok).toBe(false));
});

describe('links', () => {
  test('email becomes mailto, others must be https', () => {
    expect(normalizeLink('email', 'help@example.com').href).toBe('mailto:help@example.com');
    expect(normalizeLink('email', 'nope').ok).toBe(false);
    expect(normalizeLink('instagram', 'https://instagram.com/aryapathshala').ok).toBe(true);
    expect(normalizeLink('instagram', 'http://instagram.com/x').ok).toBe(false);
    expect(normalizeLink('instagram', 'javascript:alert(1)').ok).toBe(false);
    expect(normalizeLink('nothing', 'https://a.com').ok).toBe(false);
  });
  test('visibleLinks hides inactive or invalid links and sorts', () => {
    const out = visibleLinks([
      { id: 'a', platform: 'youtube', url: 'https://youtube.com/@x', active: true, order: 2 },
      { id: 'b', platform: 'telegram', url: 'https://t.me/x', active: false },
      { id: 'c', platform: 'instagram', url: 'not a url', active: true },
      { id: 'd', platform: 'email', url: 'a@b.co', active: true, order: 1 },
    ]);
    expect(out.map((l) => l.id)).toEqual(['d', 'a']);
  });
});

const D = {
  subjects: [{ id: 's1', classId: 'class-10', name: 'Maths', status: 'published', order: 1 }, { id: 's2', classId: 'class-10', name: 'Draft', status: 'draft' }],
  chapters: [
    { id: 'c1', subjectId: 's1', title: 'Real Numbers', status: 'published', order: 2 },
    { id: 'c0', subjectId: 's1', title: 'Intro', status: 'published', order: 1 },
    { id: 'c2', subjectId: 's2', title: 'Hidden', status: 'published' },
    { id: 'c3', subjectId: 's1', title: 'Unpublished', status: 'unpublished' },
  ],
  topics: [
    { id: 't1', chapterId: 'c1', title: 'A', status: 'published', order: 1 },
    { id: 't2', chapterId: 'c1', title: 'B', status: 'draft', order: 2 },
    { id: 't3', chapterId: 'c2', title: 'C', status: 'published' },
  ],
  lectures: [{ id: 'l1', topicId: 't1', status: 'published' }, { id: 'l2', topicId: 't1', status: 'draft' }, { id: 'l3', topicId: 't2', status: 'published' }],
  resources: [{ id: 'r1', topicId: 't1', status: 'published' }],
  questions: [],
};

describe('content model', () => {
  test('students only see published items whose parents are published', () => {
    const v = visibleData(D);
    expect(v.subjects.map((x) => x.id)).toEqual(['s1']);
    expect(v.chapters.map((x) => x.id).sort()).toEqual(['c0', 'c1']);
    expect(v.topics.map((x) => x.id)).toEqual(['t1']);
    expect(v.lectures.map((x) => x.id)).toEqual(['l1']);
    expect(v.resources).toHaveLength(1);
  });
  test('tree nests chapters, topics and resources in order', () => {
    const tree = buildTree(visibleData(D), 'class-10');
    expect(tree[0].chapters.map((c) => c.id)).toEqual(['c0', 'c1']);
    const t = tree[0].chapters[1].topics[0];
    expect(t.lectures).toHaveLength(1);
    expect(t.resources).toHaveLength(1);
    expect(buildTree(visibleData(D), 'neet')).toEqual([]);
    expect(flatTopics(tree[0]).map((x) => x.id)).toEqual(['t1']);
  });
  test('chapter progress and ordering helpers', () => {
    const ch = { topics: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }] };
    expect(chapterProgress(ch, { a: { completed: true }, b: { completed: false } })).toEqual({ done: 1, total: 4, percent: 25 });
    expect(chapterProgress({ topics: [] }, {}).percent).toBe(0);
    expect(nextOrder([{ order: 3 }, { order: 1 }])).toBe(4);
    const list = [{ id: 'a', order: 1 }, { id: 'b', order: 2 }];
    expect(reorderPairs(list, 'b', 'up')).toEqual([{ id: 'b', order: 1 }, { id: 'a', order: 2 }]);
    expect(reorderPairs(list, 'a', 'up')).toEqual([]);
  });
});

describe('admin form validation', () => {
  const scope = { classId: 'class-10', subjectId: 's1', chapterId: 'c1', topicId: 't1' };
  test('lecture needs a valid YouTube link and extracts the id', () => {
    const bad = MANAGERS.lectures.build({ ...scope, title: 'L', youtubeUrl: 'https://vimeo.com/1' });
    expect(bad.errors.youtubeUrl).toBeTruthy();
    const ok = MANAGERS.lectures.build({ ...scope, title: 'L', youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ', order: '3' });
    expect(ok.errors).toEqual({});
    expect(ok.data.youtubeVideoId).toBe('dQw4w9WgXcQ');
    expect(ok.data.order).toBe(3);
    expect(MANAGERS.lectures.build({ title: '', youtubeUrl: '' }).errors).toMatchObject({ classId: expect.any(String), topicId: expect.any(String), title: expect.any(String) });
  });
  test('note stores the normalized Drive link', () => {
    const r = MANAGERS.resources.build({ ...scope, title: 'N', type: 'Formula Sheets', driveUrl: 'https://drive.google.com/file/d/1AbCdEfGhIjK/view?usp=sharing' });
    expect(r.errors).toEqual({});
    expect(r.data.driveUrl).toBe('https://drive.google.com/file/d/1AbCdEfGhIjK/view');
    expect(MANAGERS.resources.build({ ...scope, title: 'N', driveUrl: 'http://example.com/x' }).errors.driveUrl).toBeTruthy();
    expect(MANAGERS.resources.build({ ...scope, title: 'N', driveUrl: 'https://drive.google.com/drive/folders/abc' }).errors.driveUrl).toBeTruthy();
  });
  test('resource accepts an https PDF link, a revision link and a quiz route', () => {
    const pdf = MANAGERS.resources.build({ ...scope, title: 'N', type: 'Revision Material', driveUrl: 'https://example.com/rev.pdf' });
    expect(pdf.errors).toEqual({});
    expect(pdf.data).toMatchObject({ externalUrl: 'https://example.com/rev.pdf', driveUrl: '', route: '', type: 'Revision Material' });
    const quiz = MANAGERS.resources.build({ ...scope, title: 'Q', type: 'Quiz', driveUrl: '/tests/ch1-quiz' });
    expect(quiz.errors).toEqual({});
    expect(quiz.data.route).toBe('/tests/ch1-quiz');
    expect(MANAGERS.resources.build({ ...scope, title: 'Q', type: 'Chapter Notes', driveUrl: '/tests' }).errors.driveUrl).toBeTruthy();
    expect(MANAGERS.resources.build({ ...scope, title: 'Q', type: 'Quiz', driveUrl: '/admin/content' }).errors.driveUrl).toBeTruthy();
  });
  test('resourceLink picks the link a student can open and ignores junk', () => {
    expect(resourceLink({ driveUrl: 'https://drive.google.com/file/d/x/view' })).toEqual({ href: 'https://drive.google.com/file/d/x/view', internal: false });
    expect(resourceLink({ externalUrl: 'https://e.com/a.pdf' }).internal).toBe(false);
    expect(resourceLink({ route: '/tests/abc' })).toEqual({ href: '/tests/abc', internal: true });
    expect(resourceLink({ route: '/admin' })).toBeNull();
    expect(resourceLink({})).toBeNull();
  });
  test('question needs four distinct options', () => {
    const q = { ...scope, question: 'Q?', o0: 'a', o1: 'b', o2: 'c', o3: 'd', correctIndex: '2' };
    expect(MANAGERS.questions.build(q).data).toMatchObject({ options: ['a', 'b', 'c', 'd'], correctIndex: 2 });
    expect(MANAGERS.questions.build({ ...q, o3: 'A' }).errors.o3).toBeTruthy();
    expect(MANAGERS.questions.build({ ...q, o1: '' }).errors.o1).toBeTruthy();
  });
  test('social link is validated per platform', () => {
    expect(MANAGERS.socialLinks.build({ platform: 'email', url: 'bad' }).errors.url).toBeTruthy();
    expect(MANAGERS.socialLinks.build({ platform: 'telegram', url: 'https://t.me/aryapathshala' }).errors).toEqual({});
  });
});

describe('batches, DPPs and progress', () => {
  const {
    visibleData, buildTree, batchSubjects, batchTeachers, subjectProgress, batchProgress, splitQuestions, allClasses, findCourse, difficultyLabel,
  } = require('../model');
  const pub = (o) => ({ status: 'published', order: 1, ...o });
  const data = {
    courses: [pub({ id: 'crash', title: 'Crash Course' }), { id: 'hid', title: 'Hidden', status: 'draft' }],
    batches: [pub({ id: 'b1', classId: 'class-9', name: 'Foundation', subjectIds: ['s1', 's2'], teacherIds: ['te1'] }), { id: 'b2', classId: 'class-9', name: 'Draft batch', status: 'draft' }],
    teachers: [pub({ id: 'te1', name: 'T' }), { id: 'te2', name: 'Hidden', status: 'draft' }],
    subjects: [pub({ id: 's1', classId: 'class-9', name: 'Maths' }), pub({ id: 's2', classId: 'class-9', name: 'Science' }), { id: 's3', classId: 'class-9', name: 'Draft', status: 'draft' }],
    chapters: [pub({ id: 'c1', subjectId: 's1', title: 'Ch', classId: 'class-9' }), pub({ id: 'c3', subjectId: 's3', title: 'Orphan', classId: 'class-9' })],
    topics: [pub({ id: 't1', chapterId: 'c1', subjectId: 's1', title: 'A' }), pub({ id: 't2', chapterId: 'c1', subjectId: 's1', title: 'B', order: 2 }), pub({ id: 't3', chapterId: 'c3', title: 'X' })],
    lectures: [], resources: [],
    questions: [pub({ id: 'q1', topicId: 't1', set: 'dpp' }), pub({ id: 'q2', topicId: 't1' }), { id: 'q3', topicId: 't1', status: 'draft' }],
    dpps: [pub({ id: 'd1', chapterId: 'c1', topicId: 't1', title: 'T DPP' }), pub({ id: 'd2', chapterId: 'c1', title: 'Ch DPP' }), { id: 'd3', chapterId: 'c1', status: 'draft' }, pub({ id: 'd4', chapterId: 'c3' })],
  };
  const v = visibleData(data);

  test('students only see published items whose parents are published', () => {
    expect(v.batches.map((b) => b.id)).toEqual(['b1']);
    expect(v.teachers.map((t) => t.id)).toEqual(['te1']);
    expect(v.courses.map((c) => c.id)).toEqual(['crash']);
    expect(v.topics.map((t) => t.id)).toEqual(['t1', 't2']); // t3 sits under an unpublished subject
    expect(v.dpps.map((d) => d.id).sort()).toEqual(['d1', 'd2']);
    expect(v.questions.map((q) => q.id).sort()).toEqual(['q1', 'q2']);
  });
  test('a batch only lists the subjects assigned to it, in its own order', () => {
    expect(batchSubjects(v, v.batches[0]).map((s) => s.id)).toEqual(['s1', 's2']);
    expect(batchTeachers(v, v.batches[0]).map((t) => t.id)).toEqual(['te1']);
    expect(batchSubjects(v, null)).toEqual([]);
  });
  test('the tree attaches topic DPPs and chapter DPPs', () => {
    const tree = buildTree(v, 'class-9');
    const ch = tree.find((s) => s.id === 's1').chapters[0];
    expect(ch.dpps.map((d) => d.id)).toEqual(['d2']);
    expect(ch.topics[0].dpps.map((d) => d.id)).toEqual(['d1']);
  });
  test('progress is counted from completed topics only (opening a topic is not completing it)', () => {
    const tree = buildTree(v, 'class-9').filter((s) => s.id === 's1');
    const progress = { t1: { completed: true }, t2: { lastVisited: true } };
    expect(subjectProgress(tree[0], progress)).toEqual({ done: 1, total: 2, percent: 50 });
    expect(batchProgress(tree, progress).percent).toBe(50);
    expect(batchProgress([], {})).toEqual({ done: 0, total: 0, percent: 0 });
  });
  test('questions split between practice and DPP', () => {
    const s = splitQuestions(v.questions);
    expect(s.dpp.map((q) => q.id)).toEqual(['q1']);
    expect(s.practice.map((q) => q.id)).toEqual(['q2']);
  });
  test('built-in and admin-created courses', () => {
    expect(allClasses(data).map((c) => c.id)).toEqual(['class-9', 'class-10', 'neet', 'hid', 'crash']);
    expect(findCourse(v, 'crash').title).toBe('Crash Course');
    expect(findCourse(v, 'class-10').title).toBe('Class 10');
    expect(findCourse(v, 'nope')).toBeNull();
  });
  test('old difficulty names display as Easy / Medium / Hard', () => {
    expect(['Basic', 'Intermediate', 'Advanced', 'Hard', undefined].map(difficultyLabel)).toEqual(['Easy', 'Medium', 'Hard', 'Hard', 'Easy']);
  });
});

describe('firestore.rules (static checks; not run against the emulator)', () => {
  const rules = require('fs').readFileSync(require('path').join(__dirname, '../../../firestore.rules'), 'utf8');
  test.each(['courses', 'batches', 'teachers', 'subjects', 'chapters', 'topics', 'lectures', 'resources', 'dpps', 'questions'])('%s: only admins write, students read published only', (c) => {
    const block = rules.slice(rules.indexOf(`match /${c}/{id}`));
    const body = block.slice(0, block.indexOf('}\n') + 1);
    expect(body).toMatch(/allow read: if isAdmin\(\) \|\| \(signedIn\(\) && resource\.data\.status == 'published'\)/);
    expect(body).toMatch(/allow create, update: if isAdmin\(\)/);
    expect(body).toMatch(/allow delete: if isAdmin\(\)/);
  });
  test('admin comes from the signed token claim, and everything else stays denied', () => {
    expect(rules).toMatch(/request\.auth\.token\.admin == true/);
    expect(rules).not.toMatch(/token\.email/);
    expect(rules.trim().endsWith('}')).toBe(true);
    expect(rules).toMatch(/match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
  });
  test('students can only touch their own progress, notes and enrollments', () => {
    ['hubProgress/{topicId}', 'hubNotes/{topicId}', 'enrollments/{batchId}'].forEach((p) => {
      const block = rules.slice(rules.indexOf(`match /users/{uid}/${p}`));
      expect(block.slice(0, 400)).toMatch(/isOwner\(uid\)/);
    });
  });
});

describe('admin validation for batches, teachers and DPPs', () => {
  test('batch needs a name and class; cover must be https; subjects and teachers are saved as ids', () => {
    expect(MANAGERS.batches.build({ name: '', classId: '' }).errors).toMatchObject({ classId: expect.any(String), name: expect.any(String) });
    expect(MANAGERS.batches.build({ classId: 'neet', name: 'B', coverUrl: 'http://x.com/a.png' }).errors.coverUrl).toBeTruthy();
    const ok = MANAGERS.batches.build({ classId: 'class-9', name: ' Foundation ', session: '2026-27', coverUrl: 'https://img.example.com/a.png', subjectIds: ['s1', '', 's2'], teacherIds: ['t1'] });
    expect(ok.errors).toEqual({});
    expect(ok.data).toMatchObject({ name: 'Foundation', subjectIds: ['s1', 's2'], teacherIds: ['t1'], classId: 'class-9' });
  });
  test('teacher needs a name', () => {
    expect(MANAGERS.teachers.build({ name: ' ' }).errors.name).toBeTruthy();
    expect(MANAGERS.teachers.build({ name: 'Ms A', photoUrl: 'javascript:alert(1)' }).errors.photoUrl).toBeTruthy();
    expect(MANAGERS.teachers.build({ name: 'Ms A' }).errors).toEqual({});
  });
  test('DPP needs a chapter and a Drive or https link; the topic is optional', () => {
    const scope = { classId: 'class-9', subjectId: 's1', chapterId: 'c1', title: 'DPP 1' };
    expect(MANAGERS.dpps.build({ ...scope }).errors.driveUrl).toBeTruthy();
    expect(MANAGERS.dpps.build({ ...scope, driveUrl: 'https://example.com/x.pdf' }).errors.driveUrl).toBeTruthy();
    expect(MANAGERS.dpps.build({ ...scope, externalUrl: 'ftp://x.com/a' }).errors.externalUrl).toBeTruthy();
    expect(MANAGERS.dpps.build({ ...scope, externalUrl: 'https://quiz.example.com/1' }).errors).toEqual({});
    const ok = MANAGERS.dpps.build({ ...scope, topicId: 't1', driveUrl: 'https://drive.google.com/file/d/1AbCdEfGhIjK/view', dueDate: '2026-12-01' });
    expect(ok.errors).toEqual({});
    expect(ok.data).toMatchObject({ topicId: 't1', chapterId: 'c1', dueDate: '2026-12-01' });
    expect(MANAGERS.dpps.build({ ...scope, externalUrl: 'https://q.com', dueDate: 'soon' }).errors.dueDate).toBeTruthy();
  });
  test('question can be marked as DPP and the difficulty defaults to Easy', () => {
    const r = MANAGERS.questions.build({ classId: 'neet', subjectId: 's', chapterId: 'c', topicId: 't', question: 'Q?', o0: 'a', o1: 'b', o2: 'c', o3: 'd', correctIndex: '2', set: 'dpp' });
    expect(r.errors).toEqual({});
    expect(r.data).toMatchObject({ set: 'dpp', correctIndex: 2, difficulty: 'Easy' });
  });
});

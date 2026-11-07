import { parseYouTube } from '../youtube';
import { parseDrive } from '../drive';
import { normalizeLink, visibleLinks } from '../links';
import { buildTree, visibleData, chapterProgress, reorderPairs, nextOrder, flatTopics } from '../model';
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
    expect(MANAGERS.resources.build({ ...scope, title: 'N', driveUrl: 'https://evil.com/x' }).errors.driveUrl).toBeTruthy();
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

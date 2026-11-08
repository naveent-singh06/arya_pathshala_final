import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

jest.mock('lucide-react', () => new Proxy({}, { get: () => () => null }));
jest.mock('../../components/Login/firebase', () => ({ db: {}, auth: {}, firebaseConfigError: null }));
jest.mock('../../components/Login/useAuthUser', () => ({ __esModule: true, default: () => ({ uid: 'u1', email: 'a@b.co' }) }));
jest.mock('../../components/Header/Header', () => ({ BrandMark: () => null }));
jest.mock('../../cms/store', () => ({
  hasBackend: () => true,
  describeError: () => 'Something went wrong.',
  createItem: jest.fn(() => Promise.resolve('new1')),
  updateItem: jest.fn(() => Promise.resolve()),
  deleteItem: jest.fn(() => Promise.resolve()),
  applyOrder: jest.fn(() => Promise.resolve()),
  loadContent: jest.fn(),
  loadSocialLinks: jest.fn(() => Promise.resolve([])),
}));
const mockStatus = { value: { status: 'denied' } };
jest.mock('../../cms/hooks', () => ({
  ...jest.requireActual('../../cms/hooks'),
  useAdminStatus: () => mockStatus.value,
  useContent: () => ({ status: 'ready', data: {}, error: '', reload: () => {} }),
  useSocialLinks: () => [],
  clearSocialCache: () => {},
}));
jest.mock('../../cms/userData', () => ({ useHubProgress: () => ({ progress: {}, actions: null }), loadNote: jest.fn(), saveNote: jest.fn(), deleteNote: jest.fn() }));

const store = require('../../cms/store');
const { AdminContext } = require('../AdminContext');
const Manager = require('../Manager').default;
const AdminLayout = require('../AdminLayout').default;
const { HubContext } = require('../../pages/hub/HubContext');
const HubTopic = require('../../pages/hub/HubTopic').default;
const HubSubject = require('../../pages/hub/HubSubject').default;
const HubBatch = require('../../pages/hub/HubBatch').default;
const HubCourse = require('../../pages/hub/HubCourse').default;
const HubHome = require('../../pages/hub/HubHome').default;
const MyCourses = require('../../pages/MyCourses').default;
const Batches = require('../../pages/Batches').default;

const data = {
  subjects: [{ id: 's1', classId: 'class-10', name: 'Mathematics', status: 'published', order: 1 }],
  chapters: [{ id: 'c1', classId: 'class-10', subjectId: 's1', number: 1, title: 'Real Numbers', status: 'published', order: 1 }],
  topics: [{ id: 't1', classId: 'class-10', subjectId: 's1', chapterId: 'c1', title: 'Euclid Lemma', difficulty: 'Basic', status: 'published', order: 1 }],
  lectures: [{ id: 'l1', classId: 'class-10', subjectId: 's1', chapterId: 'c1', topicId: 't1', title: 'Lecture One', teacherName: 'Ms A', youtubeVideoId: 'dQw4w9WgXcQ', status: 'published', order: 1 }],
  resources: [{ id: 'r1', topicId: 't1', title: 'Notes PDF', type: 'Chapter Notes', driveUrl: 'https://drive.google.com/file/d/1AbCdEfGhIjK/view', status: 'published', order: 1 }],
  questions: [{ id: 'q1', topicId: 't1', question: 'What is 2+2?', options: ['3', '4', '5', '6'], correctIndex: 1, explanation: 'Basic sum.', status: 'published' }],
  courses: [], teachers: [{ id: 'te1', name: 'Ms A', subjects: 'Maths', status: 'published' }], dpps: [{ id: 'd1', classId: 'class-10', chapterId: 'c1', topicId: 't1', title: 'DPP 1', driveUrl: 'https://drive.google.com/file/d/1AbCdEfGhIjK/view', status: 'published' }],
  batches: [{ id: 'b1', classId: 'class-10', name: 'Board Batch', session: '2026-27', subjectIds: ['s1'], teacherIds: ['te1'], status: 'published', order: 1 }],
  socialLinks: [],
};

function renderManager(name) {
  return render(
    <AdminContext.Provider value={{ user: { uid: 'admin1' }, content: { data, reload: jest.fn(), status: 'ready' } }}>
      <MemoryRouter><Manager name={name} /></MemoryRouter>
    </AdminContext.Provider>,
  );
}

beforeEach(() => jest.clearAllMocks());

describe('admin route protection', () => {
  test('a signed-in non-admin sees "Admins only" and no portal content', () => {
    mockStatus.value = { status: 'denied' };
    render(<MemoryRouter initialEntries={['/admin/content']}><Routes><Route path="/admin/content" element={<AdminLayout />}><Route index element={<p>SECRET PORTAL</p>} /></Route></Routes></MemoryRouter>);
    expect(screen.getByText('Admins only')).toBeTruthy();
    expect(screen.queryByText('SECRET PORTAL')).toBeNull();
  });
  test('a signed-out visitor is asked to log in', () => {
    mockStatus.value = { status: 'signedout' };
    render(<MemoryRouter><Routes><Route path="/" element={<AdminLayout />}><Route index element={<p>SECRET PORTAL</p>} /></Route></Routes></MemoryRouter>);
    expect(screen.getByText('Sign in to continue')).toBeTruthy();
    expect(screen.queryByText('SECRET PORTAL')).toBeNull();
  });
  test('an admin sees the portal', () => {
    mockStatus.value = { status: 'admin', user: { uid: 'a', email: 'a@b.co' } };
    render(<MemoryRouter><Routes><Route path="/" element={<AdminLayout />}><Route index element={<p>SECRET PORTAL</p>} /></Route></Routes></MemoryRouter>);
    expect(screen.getByText('SECRET PORTAL')).toBeTruthy();
  });
});

describe('lecture manager', () => {
  test('rejects an invalid link and saves nothing', async () => {
    renderManager('lectures');
    fireEvent.click(screen.getByRole('button', { name: /add lecture/i }));
    fireEvent.change(screen.getByLabelText(/lecture title/i), { target: { value: 'New' } });
    fireEvent.change(screen.getByLabelText(/youtube link/i), { target: { value: 'https://vimeo.com/123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect((await screen.findAllByText(/only youtube links/i)).length).toBeGreaterThan(0);
    expect(store.createItem).not.toHaveBeenCalled();
  });
  test('previews the video and publishes with the extracted id', async () => {
    renderManager('lectures');
    fireEvent.click(screen.getByRole('button', { name: /add lecture/i }));
    const form = screen.getByRole('region', { name: /add lecture/i });
    fireEvent.change(within(form).getByLabelText(/course \/ class/i), { target: { value: 'class-10' } });
    fireEvent.change(within(form).getByLabelText(/^subject/i), { target: { value: 's1' } });
    fireEvent.change(within(form).getByLabelText(/^chapter/i), { target: { value: 'c1' } });
    fireEvent.change(within(form).getByLabelText(/^topic/i), { target: { value: 't1' } });
    fireEvent.change(within(form).getByLabelText(/lecture title/i), { target: { value: 'Intro' } });
    fireEvent.change(within(form).getByLabelText(/youtube link/i), { target: { value: 'https://youtu.be/dQw4w9WgXcQ' } });
    expect(within(form).getByTitle('Lecture preview').getAttribute('src')).toContain('/embed/dQw4w9WgXcQ');
    fireEvent.click(within(form).getByRole('button', { name: 'Publish' }));
    await waitFor(() => expect(store.createItem).toHaveBeenCalledTimes(1));
    const [col, payload, user] = store.createItem.mock.calls[0];
    expect(col).toBe('lectures');
    expect(payload).toMatchObject({ status: 'published', youtubeVideoId: 'dQw4w9WgXcQ', topicId: 't1', classId: 'class-10', title: 'Intro' });
    expect(user.uid).toBe('admin1');
  });
  test('save draft stores a draft', async () => {
    renderManager('subjects');
    fireEvent.click(screen.getByRole('button', { name: /add subject/i }));
    const form = screen.getByRole('region', { name: /add subject/i });
    fireEvent.change(within(form).getByLabelText(/course \/ class/i), { target: { value: 'neet' } });
    fireEvent.change(within(form).getByLabelText(/subject name/i), { target: { value: 'Biology' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(store.createItem).toHaveBeenCalled());
    expect(store.createItem.mock.calls[0][1]).toMatchObject({ status: 'draft', name: 'Biology', classId: 'neet' });
  });
  test('delete needs confirmation', async () => {
    renderManager('lectures');
    fireEvent.click(screen.getByRole('button', { name: /delete lecture one/i }));
    expect(store.deleteItem).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(store.deleteItem).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /delete lecture one/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(store.deleteItem).toHaveBeenCalledWith('lectures', 'l1'));
  });
  test('unpublish toggles the status', async () => {
    renderManager('lectures');
    fireEvent.click(screen.getByRole('button', { name: /unpublish lecture one/i }));
    await waitFor(() => expect(store.updateItem).toHaveBeenCalledWith('lectures', 'l1', { status: 'unpublished' }));
  });
  test('resource form warns about Drive sharing and rejects bad links', async () => {
    renderManager('resources');
    fireEvent.click(screen.getByRole('button', { name: /add resource/i }));
    expect(screen.getByText(/sharing permission allows students/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/title/i, { selector: '#f-title' }), { target: { value: 'N' } });
    fireEvent.change(screen.getByLabelText(/^link/i), { target: { value: 'not a link' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect((await screen.findAllByText(/full https/i)).length).toBeGreaterThan(0);
    expect(store.createItem).not.toHaveBeenCalled();
  });
});

describe('admin subject and resource workflow', () => {
  test('a new subject can be added to a batch in one step', async () => {
    store.createItem.mockResolvedValue('new1');
    renderManager('subjects');
    fireEvent.click(screen.getByRole('button', { name: /add subject/i }));
    fireEvent.change(document.getElementById('f-classId'), { target: { value: 'class-10' } });
    fireEvent.change(screen.getByLabelText(/subject name/i), { target: { value: 'Science' } });
    fireEvent.change(screen.getByLabelText(/add to batch/i), { target: { value: 'b1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await waitFor(() => expect(store.createItem).toHaveBeenCalledWith('subjects', expect.objectContaining({ name: 'Science', status: 'published' }), expect.anything()));
    await waitFor(() => expect(store.updateItem).toHaveBeenCalledWith('batches', 'b1', { subjectIds: ['s1', 'new1'] }));
  });
});

describe('student entry points', () => {
  const empty = { courses: [], batches: [], teachers: [], dpps: [], subjects: [], chapters: [], topics: [], lectures: [], resources: [], questions: [] };
  const wrap = (el, value, url = '/') => (
    <HubContext.Provider value={{ user: { uid: 'u1' }, progress: {}, progressActions: null, enrolled: [], isAdmin: false, ...value }}>
      <MemoryRouter initialEntries={[url]}><Routes><Route path="*" element={el} /></Routes></MemoryRouter>
    </HubContext.Provider>
  );
  test('with nothing published, Class 9, Class 10 and NEET are still offered', () => {
    render(wrap(<HubHome />, { data: empty }));
    ['Class 9', 'Class 10', 'NEET'].forEach((t) => expect(screen.getByRole('heading', { name: t })).toBeTruthy());
    expect(screen.getByText(/appear in each course as soon as your teachers publish/i)).toBeTruthy();
    expect(screen.queryByText(/Courses have not been published yet/)).toBeNull();
  });
  test('empty course page for a student has no admin link', () => {
    render(<HubContext.Provider value={{ data: empty, user: { uid: 'u1' }, progress: {}, enrolled: [], isAdmin: false }}><MemoryRouter initialEntries={['/hub/class-9']}><Routes><Route path="/hub/:classId" element={<HubCourse />} /></Routes></MemoryRouter></HubContext.Provider>);
    expect(screen.getByText(/content is coming soon/i)).toBeTruthy();
    expect(screen.queryByRole('link', { name: /create a batch/i })).toBeNull();
  });
  test('empty course page for an admin links to the content portal', () => {
    render(<HubContext.Provider value={{ data: empty, user: { uid: 'a' }, progress: {}, enrolled: [], isAdmin: true }}><MemoryRouter initialEntries={['/hub/class-9']}><Routes><Route path="/hub/:classId" element={<HubCourse />} /></Routes></MemoryRouter></HubContext.Provider>);
    expect(screen.getByRole('link', { name: /create a batch/i }).getAttribute('href')).toBe('/admin/content/batches');
  });
  test('My courses shows an enrolled batch with real progress', () => {
    render(wrap(<MyCourses />, { data, enrolled: ['b1'], progress: { t1: { completed: true } } }));
    expect(screen.getByText('Board Batch')).toBeTruthy();
    expect(screen.getByText(/1 of 1 topics completed/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open batch' }).getAttribute('href')).toBe('/hub/class-10/b1');
    expect(screen.getByRole('link', { name: 'Mathematics' }).getAttribute('href')).toContain('/hub/class-10/b1/s1');
  });
  test('My courses without a batch invites the student to join one', () => {
    render(wrap(<MyCourses />, { data }));
    expect(screen.getByText(/have not joined a batch yet/i)).toBeTruthy();
  });
  test('Batches lists published batches and an empty state for the other courses', () => {
    render(wrap(<Batches />, { data, enroll: jest.fn(() => Promise.resolve()) }));
    expect(screen.getByText('Board Batch')).toBeTruthy();
    expect(screen.getAllByText(/Batches coming soon/i).length).toBe(2);
    expect(screen.getByRole('button', { name: 'Enroll' })).toBeTruthy();
  });
  test('quiz and revision resources open correctly', () => {
    const d2 = { ...data, resources: [
      { id: 'q', topicId: 't1', title: 'Chapter Quiz', type: 'Quiz', route: '/tests/ch1', status: 'published', order: 1 },
      { id: 'r', topicId: 't1', title: 'Revision Sheet', type: 'Revision Material', externalUrl: 'https://example.com/rev.pdf', status: 'published', order: 2 },
    ] };
    render(
      <HubContext.Provider value={{ data: d2, user: { uid: 'u1' }, progress: {}, enrolled: [], isAdmin: false }}>
        <MemoryRouter initialEntries={['/hub/topic/t1']}><Routes><Route path="/hub/topic/:topicId" element={<HubTopic />} /></Routes></MemoryRouter>
      </HubContext.Provider>,
    );
    fireEvent.click(screen.getByRole('tab', { name: /notes, revision/i }));
    expect(screen.getByRole('link', { name: /take the quiz/i }).getAttribute('href')).toBe('/tests/ch1');
    const rev = screen.getByRole('link', { name: /open link/i });
    expect(rev.getAttribute('href')).toBe('https://example.com/rev.pdf');
    expect(rev.getAttribute('rel')).toContain('noopener');
  });
});

describe('student Study Hub', () => {
  const ctx = (extra) => ({ data, user: { uid: 'u1' }, progress: {}, progressActions: null, enrolled: [], ...extra });
  const at = (path, el, url) => (
    <HubContext.Provider value={ctx({ enrolled: [], enroll: null, leave: null })}>
      <MemoryRouter initialEntries={[url]}><Routes><Route path={path} element={el} /></Routes></MemoryRouter>
    </HubContext.Provider>
  );
  test('course page lists its batches', () => {
    render(at('/hub/:classId', <HubCourse />, '/hub/class-10'));
    expect(screen.getByText('Board Batch')).toBeTruthy();
    expect(screen.getByRole('link', { name: /view batch/i }).getAttribute('href')).toBe('/hub/class-10/b1');
  });
  test('batch dashboard shows subjects, teachers and progress', () => {
    render(at('/hub/:classId/:batchId', <HubBatch />, '/hub/class-10/b1'));
    expect(screen.getAllByText('Mathematics').length).toBeGreaterThan(0);
    expect(screen.getByText('Ms A')).toBeTruthy();
    expect(screen.getAllByText(/0\/1/).length).toBeGreaterThan(0);
  });
  test('a batch from another course is not found', () => {
    render(at('/hub/:classId/:batchId', <HubBatch />, '/hub/neet/b1'));
    expect(screen.queryByText('Board Batch')).toBeNull();
  });
  test('subject tracker expands, collapses and shows topic resource icons', () => {
    render(at('/hub/:classId/:batchId/:subjectId', <HubSubject />, '/hub/class-10/b1/s1'));
    expect(screen.getByText(/Chapter 1: Real Numbers/)).toBeTruthy();
    expect(screen.getByText('Euclid Lemma')).toBeTruthy();
    expect(screen.getByText('0/1 topics completed')).toBeTruthy();
    expect(screen.getByLabelText('Video lectures: 1')).toBeTruthy();
    expect(screen.getByLabelText('DPP: 1')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(screen.queryByText('Euclid Lemma')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(screen.getByText('Euclid Lemma')).toBeTruthy();
  });
  test('a subject not assigned to the batch is not found', () => {
    render(at('/hub/:classId/:batchId/:subjectId', <HubSubject />, '/hub/class-10/b1/other'));
    expect(screen.queryByText(/Chapter 1/)).toBeNull();
  });
  test('topic page embeds the lecture and opens notes safely', () => {
    render(
      <HubContext.Provider value={ctx()}>
        <MemoryRouter initialEntries={['/hub/topic/t1']}><Routes><Route path="/hub/topic/:topicId" element={<HubTopic />} /></Routes></MemoryRouter>
      </HubContext.Provider>,
    );
    expect(screen.getByTitle('Lecture One').getAttribute('src')).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(screen.getByText(/Taught by Ms A/)).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /notes, revision/i }));
    const open = screen.getByRole('link', { name: /open in google drive/i });
    expect(open.getAttribute('target')).toBe('_blank');
    expect(open.getAttribute('rel')).toContain('noopener');
    fireEvent.click(screen.getByRole('tab', { name: /^dpp/i }));
    expect(screen.getByText('DPP 1')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /practice/i }));
    fireEvent.click(screen.getByLabelText(/B\. 4/));
    expect(screen.queryByText(/Basic sum/)).toBeNull(); // the explanation only shows after Check
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }));
    expect(screen.getByText(/Basic sum/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /finish and see result/i }));
    expect(screen.getByText(/You scored 1 out of 1/)).toBeTruthy();
  });
  test('a topic that is not published is not found', () => {
    render(
      <HubContext.Provider value={ctx()}>
        <MemoryRouter initialEntries={['/hub/topic/missing']}><Routes><Route path="/hub/topic/:topicId" element={<HubTopic />} /></Routes></MemoryRouter>
      </HubContext.Provider>,
    );
    expect(screen.queryByText('Euclid Lemma')).toBeNull();
  });
});

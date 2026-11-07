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
const HubClass = require('../../pages/hub/HubClass').default;

const data = {
  subjects: [{ id: 's1', classId: 'class-10', name: 'Mathematics', status: 'published', order: 1 }],
  chapters: [{ id: 'c1', classId: 'class-10', subjectId: 's1', number: 1, title: 'Real Numbers', status: 'published', order: 1 }],
  topics: [{ id: 't1', classId: 'class-10', subjectId: 's1', chapterId: 'c1', title: 'Euclid Lemma', difficulty: 'Basic', status: 'published', order: 1 }],
  lectures: [{ id: 'l1', classId: 'class-10', subjectId: 's1', chapterId: 'c1', topicId: 't1', title: 'Lecture One', teacherName: 'Ms A', youtubeVideoId: 'dQw4w9WgXcQ', status: 'published', order: 1 }],
  resources: [{ id: 'r1', topicId: 't1', title: 'Notes PDF', type: 'Chapter Notes', driveUrl: 'https://drive.google.com/file/d/1AbCdEfGhIjK/view', status: 'published', order: 1 }],
  questions: [{ id: 'q1', topicId: 't1', question: 'What is 2+2?', options: ['3', '4', '5', '6'], correctIndex: 1, explanation: 'Basic sum.', status: 'published' }],
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
    fireEvent.change(within(form).getByLabelText(/class \/ exam/i), { target: { value: 'class-10' } });
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
    fireEvent.change(within(form).getByLabelText(/class \/ exam/i), { target: { value: 'neet' } });
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
  test('notes form warns about Drive sharing and rejects non-Drive links', async () => {
    renderManager('resources');
    fireEvent.click(screen.getByRole('button', { name: /add note/i }));
    expect(screen.getByText(/sharing permission allows students/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/title/i, { selector: '#f-title' }), { target: { value: 'N' } });
    fireEvent.change(screen.getByLabelText(/google drive link/i), { target: { value: 'https://example.com/x.pdf' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect((await screen.findAllByText(/only google drive links/i)).length).toBeGreaterThan(0);
    expect(store.createItem).not.toHaveBeenCalled();
  });
});

describe('student Study Hub', () => {
  const ctx = (extra) => ({ data, user: { uid: 'u1' }, progress: {}, progressActions: null, ...extra });
  test('chapter list shows topics with resource indicators', () => {
    render(
      <HubContext.Provider value={ctx()}>
        <MemoryRouter initialEntries={['/hub/class-10']}><Routes><Route path="/hub/:classId" element={<HubClass />} /></Routes></MemoryRouter>
      </HubContext.Provider>,
    );
    expect(screen.getByText(/Chapter 1: Real Numbers/)).toBeTruthy();
    expect(screen.getByText('Euclid Lemma')).toBeTruthy();
    expect(screen.getByText('0/1 topics completed')).toBeTruthy();
    expect(screen.getByLabelText('Lectures: 1')).toBeTruthy();
  });
  test('topic page embeds the lecture and opens notes safely', () => {
    render(
      <HubContext.Provider value={ctx()}>
        <MemoryRouter initialEntries={['/hub/topic/t1']}><Routes><Route path="/hub/topic/:topicId" element={<HubTopic />} /></Routes></MemoryRouter>
      </HubContext.Provider>,
    );
    expect(screen.getByTitle('Lecture One').getAttribute('src')).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(screen.getByText(/Taught by Ms A/)).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /handwritten notes/i }));
    const open = screen.getByRole('link', { name: /open in google drive/i });
    expect(open.getAttribute('target')).toBe('_blank');
    expect(open.getAttribute('rel')).toContain('noopener');
    fireEvent.click(screen.getByRole('tab', { name: /practice/i }));
    fireEvent.click(screen.getByLabelText(/B\. 4/));
    expect(screen.getByText(/Basic sum/)).toBeTruthy();
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

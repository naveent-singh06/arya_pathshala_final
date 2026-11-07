jest.mock('../../components/Login/firebase', () => ({ db: {} }));
const mockGetDocs = jest.fn();
jest.mock('firebase/firestore', () => ({
  collection: (_db, name) => ({ name }),
  query: (ref) => ref,
  where: () => null,
  getDocs: (...a) => mockGetDocs(...a),
  doc: jest.fn(), addDoc: jest.fn(), updateDoc: jest.fn(), deleteDoc: jest.fn(), serverTimestamp: jest.fn(), writeBatch: jest.fn(),
}));
const { loadContent, withTimeout, describeError } = require('../store');

const snap = (docs, fromCache = false) => ({ metadata: { fromCache }, docs: docs.map((d) => ({ id: d.id, data: () => d })) });

describe('loading never hangs and never lies', () => {
  beforeEach(() => mockGetDocs.mockReset());

  test('withTimeout rejects with code "timeout" when a request never settles', async () => {
    jest.useFakeTimers();
    const p = withTimeout(new Promise(() => {}), 1000);
    const assertion = expect(p).rejects.toMatchObject({ code: 'timeout' });
    jest.advanceTimersByTime(1001);
    await assertion;
    jest.useRealTimers();
  });
  test('withTimeout passes through a result or an error', async () => {
    await expect(withTimeout(Promise.resolve(5), 1000)).resolves.toBe(5);
    await expect(withTimeout(Promise.reject(Object.assign(new Error('x'), { code: 'permission-denied' })), 1000)).rejects.toMatchObject({ code: 'permission-denied' });
  });
  test('a stalled database request ends in a timeout error (so the screen can offer Retry)', async () => {
    jest.useFakeTimers();
    mockGetDocs.mockReturnValue(new Promise(() => {}));
    const p = loadContent({ admin: false });
    const assertion = expect(p).rejects.toMatchObject({ code: 'timeout' });
    jest.advanceTimersByTime(16000);
    await assertion;
    jest.useRealTimers();
  });
  test('an empty answer that came only from the offline cache is a connection error, not "no content"', async () => {
    mockGetDocs.mockResolvedValue(snap([], true));
    await expect(loadContent({ admin: false })).rejects.toMatchObject({ code: 'unavailable' });
  });
  test('an empty answer from the server is a genuinely empty database', async () => {
    mockGetDocs.mockResolvedValue(snap([], false));
    const data = await loadContent({ admin: false });
    expect(data.batches).toEqual([]);
  });
  test('permission errors pass through with a helpful message', async () => {
    mockGetDocs.mockRejectedValue(Object.assign(new Error('denied'), { code: 'permission-denied' }));
    await expect(loadContent({ admin: false })).rejects.toMatchObject({ code: 'permission-denied' });
    expect(describeError({ code: 'permission-denied' })).toMatch(/rules/i);
    expect(describeError({ code: 'timeout' })).toMatch(/did not answer/i);
    expect(describeError({ code: 'not-found' })).toMatch(/not found/i);
  });
});

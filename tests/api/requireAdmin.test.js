const test = require('node:test');
const assert = require('node:assert');
const { requireAdmin } = require('../../api/_lib/requireAdmin');
const { createAdminSessionHandler } = require('../../api/admin-session');
const { ConfigError } = require('../../api/_lib/errors');
const { MockRes } = require('./helpers');

const tokens = {
  admin: { uid: 'a1', email: 'owner@example.com', admin: true },
  student: { uid: 's1', email: 'kid@example.com' },
  fakeAdminEmail: { uid: 's2', email: 'akshaykumar865079@gmail.com' }, // right email but no claim
  stringClaim: { uid: 's3', admin: 'true' },
};
const verify = async (t) => {
  if (!tokens[t]) throw new Error('bad token');
  return tokens[t];
};
const req = (t, method = 'GET') => ({ method, headers: t ? { authorization: `Bearer ${t}` } : {} });

test('no token -> 401', async () => {
  await assert.rejects(requireAdmin(req(null), verify), { status: 401 });
});
test('invalid token -> 401', async () => {
  await assert.rejects(requireAdmin(req('nope'), verify), { status: 401 });
});
test('student -> 403', async () => {
  await assert.rejects(requireAdmin(req('student'), verify), { status: 403 });
});
test('an admin-looking email without the signed claim -> 403 (email is never trusted)', async () => {
  await assert.rejects(requireAdmin(req('fakeAdminEmail'), verify), { status: 403 });
  await assert.rejects(requireAdmin(req('stringClaim'), verify), { status: 403 });
});
test('admin claim -> allowed', async () => {
  assert.deepEqual(await requireAdmin(req('admin'), verify), { uid: 'a1', email: 'owner@example.com' });
});
test('server not configured -> 503, not a pass', async () => {
  await assert.rejects(requireAdmin(req('admin'), async () => { throw new ConfigError('x'); }), { status: 503 });
});
test('/api/admin-session returns 200 / 401 / 403 / 405 correctly', async () => {
  const h = createAdminSessionHandler({ verifyIdToken: verify });
  const run = async (r) => { const res = new MockRes(); await h(r, res); return res; };
  assert.equal((await run(req('admin'))).statusCode, 200);
  assert.equal((await run(req(null))).statusCode, 401);
  assert.equal((await run(req('student'))).statusCode, 403);
  assert.equal((await run(req('admin', 'POST'))).statusCode, 405);
  assert.ok(!(await run(req('student'))).text.includes('s1'));
});

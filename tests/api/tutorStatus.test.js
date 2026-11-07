const test = require('node:test');
const assert = require('node:assert');
const { createStatusHandler } = require('../../api/tutor-status');
const { MockRes } = require('./helpers');

const SECRET = 'sk-super-secret-value';
const account = JSON.stringify({ project_id: 'p', client_email: 'a@p.iam.gserviceaccount.com', private_key: 'PRIVATE-KEY-VALUE' });
const run = async (deps, url = '/api/tutor-status', headers = {}, method = 'GET') => {
  const h = createStatusHandler(deps);
  const res = new MockRes();
  await h({ method, url, headers }, res);
  return { res, body: JSON.parse(res.text) };
};
const cfg = (apiKey) => () => ({ apiKey, baseUrl: 'https://api.example.com/v1', model: 'm1' });
const admin = async () => ({ uid: 'a', admin: true });

test('reports what is missing without revealing any value', async () => {
  const { body, res } = await run({ getConfig: cfg(''), env: {} });
  assert.equal(body.llmApiKey, 'missing');
  assert.equal(body.firebaseServiceAccount, 'missing');
  assert.equal(body.readyToTry, false);
  assert.equal(body.provider, 'api.example.com');
  const { res: r2 } = await run({ getConfig: cfg(SECRET), env: { FIREBASE_SERVICE_ACCOUNT_JSON: account } });
  assert.ok(!r2.text.includes(SECRET) && !r2.text.includes('PRIVATE-KEY-VALUE'));
});
test('flags an invalid service account and ready state', async () => {
  assert.equal((await run({ getConfig: cfg('k'), env: { FIREBASE_SERVICE_ACCOUNT_JSON: '{bad' } })).body.firebaseServiceAccount, 'invalid');
  assert.equal((await run({ getConfig: cfg('k'), env: { FIREBASE_SERVICE_ACCOUNT_JSON: account } })).body.readyToTry, true);
});
test('the live probe needs an admin; students get 403, no token 401', async () => {
  const base = { getConfig: cfg('k'), env: { FIREBASE_SERVICE_ACCOUNT_JSON: account }, verifyIdToken: async () => ({ uid: 's' }) };
  assert.equal((await run(base, '/api/tutor-status?probe=1', { authorization: 'Bearer t' })).res.statusCode, 403);
  assert.equal((await run(base, '/api/tutor-status?probe=1')).res.statusCode, 401);
});
test('admin probe reports provider and Firestore results, including failures', async () => {
  const deps = { getConfig: cfg('k'), env: { FIREBASE_SERVICE_ACCOUNT_JSON: account }, verifyIdToken: admin, readFirestore: async () => ({}) };
  const h = { authorization: 'Bearer t' };
  assert.deepEqual((await run({ ...deps, fetch: async () => ({ ok: true, status: 200 }) }, '/x?probe=1', h)).body.probe, { provider: 'ok', firestore: 'ok' });
  assert.match((await run({ ...deps, fetch: async () => ({ ok: false, status: 401 }) }, '/x?probe=1', h)).body.probe.provider, /refused/);
  assert.match((await run({ ...deps, fetch: async () => { throw new Error('net'); } }, '/x?probe=1', h)).body.probe.provider, /could not reach/);
  assert.match((await run({ ...deps, fetch: async () => ({ ok: true }), readFirestore: async () => { throw Object.assign(new Error('x'), { code: 'not-found' }); } }, '/x?probe=1', h)).body.probe.firestore, /not-found/);
});
test('only GET is allowed', async () => {
  assert.equal((await run({ getConfig: cfg('k'), env: {} }, '/', {}, 'POST')).res.statusCode, 405);
});

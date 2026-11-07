'use strict';

// GET /api/tutor-status - tells the site owner exactly what the AI Tutor is missing.
//   Public:   which settings are present (true/false only, never values), plus provider host and model name.
//   Admin only (?probe=1, needs "Authorization: Bearer <admin ID token>"): also tries the real provider
//   (a free "list models" call, no tokens used) and a Firestore read, and reports ok / the failure reason.
// No secret is ever returned.

const { getConfig } = require('./_lib/config');
const { parseServiceAccount, getDb, getAuthAdmin } = require('./_lib/firebaseAdmin');
const { requireAdmin } = require('./_lib/requireAdmin');

const withTimeout = (p, ms) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'timeout' })), ms))]);

function createStatusHandler(deps = {}) {
  const readConfig = deps.getConfig || getConfig;
  const env = deps.env || process.env;
  const verifyIdToken = deps.verifyIdToken || ((t) => getAuthAdmin().verifyIdToken(t));
  const fetchImpl = deps.fetch || ((...a) => fetch(...a));
  const readFirestore = deps.readFirestore || (() => getDb().collection('tutorUsage').doc('_health').get());

  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const send = (status, body) => {
      res.statusCode = status;
      res.end(JSON.stringify(body));
    };
    if (req.method !== 'GET') return send(405, { error: 'method_not_allowed' });

    const config = readConfig();
    let firebaseAdminSettings = 'missing';
    try {
      parseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT_JSON);
      firebaseAdminSettings = 'present';
    } catch (e) {
      firebaseAdminSettings = String(env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim() ? 'invalid' : 'missing';
    }
    let host = '';
    try { host = new URL(config.baseUrl).host; } catch (e) { host = 'invalid LLM_BASE_URL'; }
    const body = {
      llmApiKey: config.apiKey ? 'present' : 'missing',
      firebaseServiceAccount: firebaseAdminSettings,
      provider: host,
      model: config.model,
      readyToTry: !!config.apiKey && firebaseAdminSettings === 'present',
    };

    const url = new URL(req.url || '/', 'http://x');
    if (url.searchParams.get('probe') !== '1') return send(200, body);

    try {
      await requireAdmin(req, verifyIdToken);
    } catch (err) {
      return send(err.status || 401, { ...body, probe: 'Sign in as an administrator and send your ID token to run the live probe.' });
    }
    const probe = {};
    if (!config.apiKey) probe.provider = 'skipped: LLM_API_KEY is missing';
    else {
      try {
        const r = await withTimeout(fetchImpl(`${config.baseUrl}/models`, { headers: { Authorization: `Bearer ${config.apiKey}` } }), 10000);
        probe.provider = r.ok ? 'ok' : r.status === 401 || r.status === 403 ? 'rejected: the API key was refused (check LLM_API_KEY)' : `failed: HTTP ${r.status} (check LLM_BASE_URL)`;
      } catch (e) {
        probe.provider = e && e.code === 'timeout' ? 'failed: no answer within 10 seconds' : 'failed: could not reach the provider (check LLM_BASE_URL)';
      }
    }
    try {
      await withTimeout(readFirestore(), 8000);
      probe.firestore = 'ok';
    } catch (e) {
      probe.firestore = e && e.code === 'timeout' ? 'failed: no answer (is Firestore created?)' : `failed: ${(e && (e.code || e.message)) || 'unknown'} (is Firestore created and the service account for this project?)`;
    }
    return send(200, { ...body, probe });
  };
}

module.exports = createStatusHandler();
module.exports.createStatusHandler = createStatusHandler;

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseServiceAccount } = require('../../api/_lib/firebaseAdmin');
const { ConfigError } = require('../../api/_lib/errors');
const { getConfig } = require('../../api/_lib/config');

const account = {
  project_id: 'demo-project',
  client_email: 'svc@demo-project.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n',
};

test('parses raw JSON service account and fixes escaped newlines', () => {
  const parsed = parseServiceAccount(JSON.stringify(account));
  assert.equal(parsed.project_id, 'demo-project');
  assert.match(parsed.private_key, /\nABC\n/);
});

test('parses base64-encoded service account', () => {
  const b64 = Buffer.from(JSON.stringify(account)).toString('base64');
  assert.equal(parseServiceAccount(b64).client_email, account.client_email);
});

test('rejects missing, malformed or incomplete credentials without echoing them', () => {
  assert.throws(() => parseServiceAccount(''), ConfigError);
  assert.throws(() => parseServiceAccount('{not json'), ConfigError);
  assert.throws(() => parseServiceAccount(JSON.stringify({ project_id: 'x' })), (e) => {
    assert.ok(e instanceof ConfigError);
    assert.doesNotMatch(e.message, /BEGIN PRIVATE KEY/);
    return true;
  });
});

test('config: provider is configurable, with safe defaults and clamped limits', () => {
  const d = getConfig({});
  assert.equal(d.baseUrl, 'https://api.groq.com/openai/v1');
  assert.equal(d.model, 'llama-3.3-70b-versatile');
  assert.equal(d.apiKey, '');

  const c = getConfig({
    LLM_API_KEY: ' key ',
    GROQ_API_KEY: 'old',
    LLM_BASE_URL: 'https://other.example/v1/',
    LLM_MODEL: 'my-model',
    LLM_MAX_TOKENS: '999999',
    TUTOR_RATE_PER_MINUTE: 'abc',
  });
  assert.equal(c.apiKey, 'key');
  assert.equal(c.baseUrl, 'https://other.example/v1');
  assert.equal(c.model, 'my-model');
  assert.equal(c.maxTokens, 8192);
  assert.equal(c.perMinute, 8);

  assert.equal(getConfig({ GROQ_API_KEY: 'legacy' }).apiKey, 'legacy');
});

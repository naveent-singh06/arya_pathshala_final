'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createTutorHandler } = require('../../api/_lib/handler');
const { ProviderError, ConfigError } = require('../../api/_lib/errors');
const { MockRes, makeReq, validBody } = require('./helpers');

const goodConfig = () => ({
  apiKey: 'k',
  baseUrl: 'https://x/v1',
  model: 'm',
  maxTokens: 100,
  temperature: 0.3,
  timeoutMs: 1000,
  perMinute: 5,
  perDay: 50,
});

function build(overrides = {}) {
  const calls = { stream: [], limit: [] };
  const handler = createTutorHandler({
    verifyIdToken: async (t) => {
      if (t !== 'good-token') throw new Error('bad token');
      return { uid: 'student-1', email: 's@example.com' };
    },
    consumeRateLimit: async (uid, limits) => {
      calls.limit.push({ uid, limits });
      return { allowed: true };
    },
    getConfig: goodConfig,
    streamChat: async function* (args) {
      calls.stream.push(args);
      yield { type: 'delta', text: 'Hello ' };
      yield { type: 'delta', text: 'student' };
      yield { type: 'done', finishReason: 'stop' };
    },
    ...overrides,
  });
  return { handler, calls };
}

test('rejects non-POST methods', async () => {
  const { handler } = build();
  const res = new MockRes();
  await handler(makeReq({ method: 'GET' }), res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'POST');
});

test('rejects requests without a valid Firebase token (401) and never calls the AI', async () => {
  const { handler, calls } = build();
  for (const token of [null, 'wrong-token']) {
    const res = new MockRes();
    await handler(makeReq({ token, body: validBody() }), res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.json.code, 'unauthenticated');
  }
  assert.equal(calls.stream.length, 0);
});

test('returns 503 when Firebase Admin is not configured', async () => {
  const { handler } = build({
    verifyIdToken: async () => {
      throw new ConfigError('FIREBASE_SERVICE_ACCOUNT_JSON is not set.');
    },
  });
  const res = new MockRes();
  await handler(makeReq({ body: validBody() }), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.json.code, 'not_configured');
  assert.doesNotMatch(res.text, /FIREBASE_SERVICE_ACCOUNT_JSON/);
});

test('returns 503 when the LLM key is missing', async () => {
  const { handler } = build({ getConfig: () => ({ ...goodConfig(), apiKey: '' }) });
  const res = new MockRes();
  await handler(makeReq({ body: validBody() }), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.json.code, 'not_configured');
});

test('returns 400 for invalid input', async () => {
  const { handler, calls } = build();
  const res = new MockRes();
  await handler(makeReq({ body: { messages: [] } }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(calls.stream.length, 0);

  const res2 = new MockRes();
  await handler(makeReq({ body: undefined }), res2);
  assert.equal(res2.statusCode, 400);

  const res3 = new MockRes();
  await handler(makeReq({ body: '{broken' }), res3);
  assert.equal(res3.statusCode, 400);
});

test('returns 429 with Retry-After when the rate limit is hit', async () => {
  const { handler, calls } = build({
    consumeRateLimit: async () => ({ allowed: false, reason: 'minute', retryAfterSec: 42 }),
  });
  const res = new MockRes();
  await handler(makeReq({ body: validBody() }), res);
  assert.equal(res.statusCode, 429);
  assert.equal(res.headers['retry-after'], '42');
  assert.equal(calls.stream.length, 0);
});

test('fails closed (503) when usage tracking is unavailable', async () => {
  const { handler, calls } = build({
    consumeRateLimit: async () => {
      throw new Error('NOT_FOUND: database does not exist');
    },
  });
  const res = new MockRes();
  await handler(makeReq({ body: validBody() }), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.json.code, 'usage_unavailable');
  assert.equal(calls.stream.length, 0);
});

test('streams NDJSON events for a valid signed-in request', async () => {
  const { handler, calls } = build();
  const res = new MockRes();
  await handler(makeReq({ body: validBody() }), res);
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['content-type'], /application\/x-ndjson/);
  assert.deepEqual(res.events, [
    { type: 'delta', text: 'Hello ' },
    { type: 'delta', text: 'student' },
    { type: 'done', finishReason: 'stop' },
  ]);
  assert.equal(calls.limit[0].uid, 'student-1');
  const sent = calls.stream[0].messages;
  assert.equal(sent[0].role, 'system');
  assert.equal(sent[sent.length - 1].content, 'What is photosynthesis?');
});

test('accepts a JSON string body (as some runtimes deliver it)', async () => {
  const { handler } = build();
  const res = new MockRes();
  await handler(makeReq({ body: JSON.stringify(validBody()) }), res);
  assert.equal(res.statusCode, 200);
});

test('maps provider failures before streaming to safe JSON errors', async () => {
  const cases = [
    [new ProviderError('x', { status: 429, kind: 'http' }), 503, 'provider_busy'],
    [new ProviderError('x', { status: 401, kind: 'http', detail: 'invalid api key sk-secret' }), 502, 'provider_misconfigured'],
    [new ProviderError('x', { kind: 'timeout' }), 504, 'timeout'],
    [new ProviderError('x', { status: 500, kind: 'http' }), 502, 'provider_error'],
  ];
  for (const [error, status, code] of cases) {
    const { handler } = build({
      streamChat: async function* () {
        throw error;
      },
    });
    const res = new MockRes();
    await handler(makeReq({ body: validBody() }), res);
    assert.equal(res.statusCode, status);
    assert.equal(res.json.code, code);
    assert.doesNotMatch(res.text, /sk-secret/);
  }
});

test('reports a mid-stream failure as an error event', async () => {
  const { handler } = build({
    streamChat: async function* () {
      yield { type: 'delta', text: 'Partial ' };
      throw new ProviderError('x', { kind: 'stream' });
    },
  });
  const res = new MockRes();
  await handler(makeReq({ body: validBody() }), res);
  assert.equal(res.statusCode, 200);
  const events = res.events;
  assert.deepEqual(events[0], { type: 'delta', text: 'Partial ' });
  assert.equal(events[1].type, 'error');
  assert.equal(events[1].code, 'provider_error');
});

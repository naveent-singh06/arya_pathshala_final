'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { streamChatCompletion, parseSseLine } = require('../../api/_lib/llm');
const { ProviderError } = require('../../api/_lib/errors');
const { sseFetch, sseChunk } = require('./helpers');

const config = {
  apiKey: 'test-key',
  baseUrl: 'https://provider.example/v1',
  model: 'test-model',
  maxTokens: 100,
  temperature: 0.3,
  timeoutMs: 5000,
};

async function collect(iterable) {
  const out = [];
  for await (const e of iterable) out.push(e);
  return out;
}

test('parseSseLine handles data, [DONE], junk and malformed JSON', () => {
  assert.deepEqual(parseSseLine('data: [DONE]'), { done: true });
  assert.equal(parseSseLine(''), null);
  assert.equal(parseSseLine(': keep-alive'), null);
  assert.equal(parseSseLine('data: {not json'), null);
  assert.deepEqual(parseSseLine(sseChunk('Hi', 'stop')), { text: 'Hi', finishReason: 'stop' });
});

test('streams deltas then a done event with the finish reason', async () => {
  const fetchImpl = sseFetch([sseChunk('Photo'), sseChunk('synthesis'), sseChunk('', 'stop'), 'data: [DONE]']);
  const events = await collect(streamChatCompletion({ config, messages: [], fetchImpl }));
  assert.deepEqual(events, [
    { type: 'delta', text: 'Photo' },
    { type: 'delta', text: 'synthesis' },
    { type: 'done', finishReason: 'stop' },
  ]);
});

test('reports truncation when the provider stops at the token limit', async () => {
  const fetchImpl = sseFetch([sseChunk('Long answer'), sseChunk('', 'length'), 'data: [DONE]']);
  const events = await collect(streamChatCompletion({ config, messages: [], fetchImpl }));
  assert.equal(events[events.length - 1].finishReason, 'length');
});

test('sends model, key and settings to the configured provider', async () => {
  let captured;
  const fetchImpl = async (url, init) => {
    captured = { url, init };
    return sseFetch(['data: [DONE]'])();
  };
  await collect(streamChatCompletion({ config, messages: [{ role: 'user', content: 'hi' }], fetchImpl }));
  assert.equal(captured.url, 'https://provider.example/v1/chat/completions');
  assert.equal(captured.init.headers.Authorization, 'Bearer test-key');
  const body = JSON.parse(captured.init.body);
  assert.equal(body.model, 'test-model');
  assert.equal(body.stream, true);
  assert.equal(body.max_tokens, 100);
});

test('throws ProviderError with the HTTP status on provider failure', async () => {
  const fetchImpl = sseFetch([], { ok: false, status: 429, errorText: 'rate limited' });
  await assert.rejects(collect(streamChatCompletion({ config, messages: [], fetchImpl })), (e) => {
    assert.ok(e instanceof ProviderError);
    assert.equal(e.status, 429);
    assert.equal(e.kind, 'http');
    return true;
  });
});

test('network failure becomes a ProviderError', async () => {
  const fetchImpl = async () => {
    throw new Error('ECONNRESET');
  };
  await assert.rejects(collect(streamChatCompletion({ config, messages: [], fetchImpl })), (e) => {
    assert.equal(e.kind, 'network');
    return true;
  });
});

test('times out when the provider never answers', async () => {
  const fetchImpl = (url, init) =>
    new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new Error('aborted')));
    });
  await assert.rejects(
    collect(streamChatCompletion({ config: { ...config, timeoutMs: 20 }, messages: [], fetchImpl })),
    (e) => {
      assert.equal(e.kind, 'timeout');
      return true;
    }
  );
});

'use strict';

// End-to-end check over real HTTP: tutor handler -> fake OpenAI-compatible provider.
// No network access or API keys are needed.

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createTutorHandler } = require('../../api/_lib/handler');
const { validBody, sseChunk } = require('./helpers');

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(JSON.parse(data)));
  });
}

test('streams a real provider response through the handler over HTTP', async () => {
  let providerRequest;
  const provider = http.createServer(async (req, res) => {
    providerRequest = { url: req.url, auth: req.headers.authorization, body: await readJsonBody(req) };
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.write(`${sseChunk('Plants ')}\n\n`);
    setTimeout(() => {
      res.write(`${sseChunk('make food.', 'stop')}\n\n`);
      res.end('data: [DONE]\n\n');
    }, 30);
  });
  const providerPort = await listen(provider);

  const handler = createTutorHandler({
    verifyIdToken: async (t) => {
      if (t !== 'good-token') throw new Error('bad');
      return { uid: 'u1' };
    },
    consumeRateLimit: async () => ({ allowed: true }),
    getConfig: () => ({
      apiKey: 'provider-key',
      baseUrl: `http://127.0.0.1:${providerPort}/v1`,
      model: 'any-model',
      maxTokens: 64,
      temperature: 0.2,
      timeoutMs: 5000,
      perMinute: 5,
      perDay: 50,
    }),
  });
  const app = http.createServer(async (req, res) => {
    req.body = await readJsonBody(req);
    handler(req, res);
  });
  const appPort = await listen(app);

  try {
    const response = await fetch(`http://127.0.0.1:${appPort}/api/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer good-token' },
      body: JSON.stringify(validBody()),
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/x-ndjson/);

    const events = (await response.text())
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l));
    assert.equal(events.filter((e) => e.type === 'delta').map((e) => e.text).join(''), 'Plants make food.');
    assert.deepEqual(events[events.length - 1], { type: 'done', finishReason: 'stop' });

    // The provider key reaches the provider only, never the browser-facing response.
    assert.equal(providerRequest.auth, 'Bearer provider-key');
    assert.equal(providerRequest.url, '/v1/chat/completions');
    assert.equal(providerRequest.body.model, 'any-model');
    assert.equal(providerRequest.body.messages[0].role, 'system');
    assert.ok(!JSON.stringify(events).includes('provider-key'));

    const unauth = await fetch(`http://127.0.0.1:${appPort}/api/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody()),
    });
    assert.equal(unauth.status, 401);
  } finally {
    app.close();
    provider.close();
  }
});

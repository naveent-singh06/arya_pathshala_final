'use strict';

const { EventEmitter } = require('node:events');

/** A minimal stand-in for Node's ServerResponse. */
class MockRes extends EventEmitter {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.chunks = [];
    this.writableEnded = false;
    this.destroyed = false;
  }
  setHeader(k, v) {
    this.headers[k.toLowerCase()] = v;
  }
  flushHeaders() {}
  write(chunk) {
    this.chunks.push(String(chunk));
    return true;
  }
  end(chunk) {
    if (chunk) this.chunks.push(String(chunk));
    this.writableEnded = true;
    this.emit('close');
  }
  get text() {
    return this.chunks.join('');
  }
  get json() {
    return JSON.parse(this.text);
  }
  get events() {
    return this.text
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l));
  }
}

function makeReq({ method = 'POST', token = 'good-token', body } = {}) {
  return {
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body,
  };
}

const validBody = (extra = {}) => ({
  messages: [{ role: 'user', content: 'What is photosynthesis?' }],
  subject: 'biology',
  classLevel: 'neet',
  language: 'english',
  ...extra,
});

/** Builds a fetch() stand-in that streams the given SSE lines. */
function sseFetch(lines, { ok = true, status = 200, errorText = '' } = {}) {
  return async () => {
    if (!ok) {
      return { ok: false, status, text: async () => errorText };
    }
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        for (const line of lines) controller.enqueue(encoder.encode(`${line}\n\n`));
        controller.close();
      },
    });
    return { ok: true, status: 200, body };
  };
}

const sseChunk = (text, finish = null) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content: text }, finish_reason: finish }] })}`;

module.exports = { MockRes, makeReq, validBody, sseFetch, sseChunk };

'use strict';

const { getConfig } = require('./config');
const { authenticate } = require('./auth');
const { validateTutorRequest } = require('./validate');
const { buildMessages } = require('./prompt');
const { streamChatCompletion } = require('./llm');
const { HttpError, ProviderError } = require('./errors');

function sendJson(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  const body = req.body;
  if (body === undefined || body === null || body === '') {
    throw new HttpError(400, 'invalid_request', 'Request body is missing.');
  }
  if (Buffer.isBuffer(body)) {
    return parseJson(body.toString('utf8'));
  }
  if (typeof body === 'string') return parseJson(body);
  return body;
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new HttpError(400, 'invalid_request', 'Request body must be valid JSON.');
  }
}

/** Converts any failure into a student-safe HttpError. Provider details stay in the server log. */
function toHttpError(err) {
  if (err instanceof HttpError) return err;
  if (err instanceof ProviderError) {
    console.error('[tutor] provider error:', err.kind, err.status || '', err.detail || err.message);
    if (err.kind === 'timeout') {
      return new HttpError(504, 'timeout', 'The AI took too long to answer. Please try again.');
    }
    if (err.kind === 'http' && err.status === 429) {
      return new HttpError(503, 'provider_busy', 'The AI service is busy right now. Please try again in a moment.');
    }
    if (err.kind === 'http' && (err.status === 401 || err.status === 403 || err.status === 404)) {
      return new HttpError(502, 'provider_misconfigured', 'The AI service is not set up correctly. Please tell the administrator.');
    }
    return new HttpError(502, 'provider_error', 'The AI service had a problem. Please try again.');
  }
  console.error('[tutor] unexpected error:', err && err.message);
  return new HttpError(500, 'internal_error', 'Something went wrong. Please try again.');
}

/**
 * Creates the POST /api/tutor handler. All external effects are injected:
 *  - verifyIdToken(token) -> decoded token (Firebase Admin in production)
 *  - consumeRateLimit(uid, limits, nowMs) -> { allowed, reason?, retryAfterSec? }
 *  - streamChat / getConfig / now (optional, for tests)
 */
function createTutorHandler(deps) {
  const { verifyIdToken, consumeRateLimit } = deps;
  const readConfig = deps.getConfig || getConfig;
  const streamChat = deps.streamChat || streamChatCompletion;
  const now = deps.now || Date.now;

  return async function tutorHandler(req, res) {
    try {
      if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method not allowed.', code: 'method_not_allowed' }, { Allow: 'POST' });
      }

      const user = await authenticate(req, verifyIdToken);

      const config = readConfig();
      if (!config.apiKey) {
        console.error('[tutor] LLM_API_KEY (or GROQ_API_KEY) is not set.');
        throw new HttpError(503, 'not_configured', 'The AI Tutor is not configured on the server yet.');
      }

      const parsed = validateTutorRequest(parseBody(req));
      if (!parsed.ok) throw new HttpError(400, 'invalid_request', parsed.error);

      let limit;
      try {
        limit = await consumeRateLimit(user.uid, { perMinute: config.perMinute, perDay: config.perDay }, now());
      } catch (e) {
        console.error('[tutor] usage check failed (is Firestore enabled?):', e && e.message);
        throw new HttpError(503, 'usage_unavailable', "The AI Tutor can't check usage limits right now. Please try again later.");
      }
      if (!limit.allowed) {
        const message =
          limit.reason === 'daily'
            ? "You've reached today's AI Tutor limit. It resets tomorrow."
            : 'You are sending questions too quickly. Please wait a moment and try again.';
        throw new HttpError(429, 'rate_limited', message, { 'Retry-After': String(limit.retryAfterSec) });
      }

      const controller = new AbortController();
      res.on('close', () => {
        if (!res.writableEnded) controller.abort();
      });

      const iterator = streamChat({
        config,
        messages: buildMessages(parsed.value),
        signal: controller.signal,
      })[Symbol.asyncIterator]();

      // Wait for the first event so provider failures can still return a clean JSON error.
      let step;
      try {
        step = await iterator.next();
      } catch (e) {
        throw toHttpError(e);
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-transform');
      res.setHeader('X-Accel-Buffering', 'no');
      if (typeof res.flushHeaders === 'function') res.flushHeaders();

      const write = (event) => res.write(`${JSON.stringify(event)}\n`);
      try {
        while (!step.done) {
          write(step.value);
          step = await iterator.next();
        }
      } catch (e) {
        // If the student closed the tab, there is nobody to tell.
        if (!controller.signal.aborted) {
          const httpErr = toHttpError(e);
          if (!res.writableEnded && !res.destroyed) {
            write({ type: 'error', code: httpErr.code, message: httpErr.message });
          }
        }
      }
      res.end();
      return undefined;
    } catch (err) {
      const httpErr = toHttpError(err);
      return sendJson(res, httpErr.status, { error: httpErr.message, code: httpErr.code }, httpErr.headers);
    }
  };
}

module.exports = { createTutorHandler, toHttpError };

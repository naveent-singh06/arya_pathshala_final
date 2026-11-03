'use strict';

// Single source of truth shared with the React app.
const options = require('../../src/components/Tutor/tutorOptions.json');

const SUBJECTS = options.subjects.map((o) => o.value);
const LEVELS = options.levels.map((o) => o.value);
const LANGUAGES = options.languages.map((o) => o.value);
const LIMITS = options.limits;

const fail = (error) => ({ ok: false, error });

function pick(value, name, allowed, fallback) {
  if (value === undefined || value === null || value === '') return { value: fallback };
  if (typeof value !== 'string' || !allowed.includes(value)) {
    return { error: `Invalid "${name}". Allowed values: ${allowed.join(', ')}.` };
  }
  return { value };
}

/**
 * Validates and normalises the body of POST /api/tutor.
 * Returns { ok: true, value } or { ok: false, error }.
 */
function validateTutorRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return fail('Request body must be a JSON object.');
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return fail('"messages" must be a non-empty array.');
  }
  if (messages.length > LIMITS.maxMessages) {
    return fail(`Too many messages in one request (max ${LIMITS.maxMessages}).`);
  }

  const clean = [];
  let total = 0;
  for (let i = 0; i < messages.length; i += 1) {
    const m = messages[i];
    if (!m || typeof m !== 'object') return fail(`Message ${i + 1} is invalid.`);
    if (m.role !== 'user' && m.role !== 'assistant') {
      return fail(`Message ${i + 1} has an invalid role.`);
    }
    if (typeof m.content !== 'string') return fail(`Message ${i + 1} must have text content.`);
    const content = m.content.trim();
    if (!content) return fail(`Message ${i + 1} is empty.`);
    const max = m.role === 'user' ? LIMITS.maxUserChars : LIMITS.maxAssistantChars;
    if (content.length > max) {
      return fail(`Message ${i + 1} is too long (max ${max} characters).`);
    }
    total += content.length;
    clean.push({ role: m.role, content });
  }

  if (total > LIMITS.maxTotalChars) {
    return fail('The conversation is too long. Please start a new chat.');
  }
  if (clean[clean.length - 1].role !== 'user') {
    return fail('The last message must be from the student.');
  }

  const subject = pick(body.subject, 'subject', SUBJECTS, 'general');
  if (subject.error) return fail(subject.error);
  const classLevel = pick(body.classLevel, 'classLevel', LEVELS, 'auto');
  if (classLevel.error) return fail(classLevel.error);
  const language = pick(body.language, 'language', LANGUAGES, 'auto');
  if (language.error) return fail(language.error);

  return {
    ok: true,
    value: {
      messages: clean,
      subject: subject.value,
      classLevel: classLevel.value,
      language: language.value,
    },
  };
}

module.exports = { validateTutorRequest, SUBJECTS, LEVELS, LANGUAGES, LIMITS };

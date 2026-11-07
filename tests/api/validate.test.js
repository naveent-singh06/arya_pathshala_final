'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTutorRequest, LIMITS } = require('../../api/_lib/validate');

const msg = (role, content) => ({ role, content });

test('accepts a valid request and applies defaults', () => {
  const r = validateTutorRequest({ messages: [msg('user', '  Explain Newton  ')] });
  assert.equal(r.ok, true);
  assert.equal(r.value.messages[0].content, 'Explain Newton');
  assert.equal(r.value.subject, 'general');
  assert.equal(r.value.classLevel, 'auto');
  assert.equal(r.value.language, 'auto');
});

test('rejects non-object bodies and missing messages', () => {
  assert.equal(validateTutorRequest(null).ok, false);
  assert.equal(validateTutorRequest([]).ok, false);
  assert.equal(validateTutorRequest({}).ok, false);
  assert.equal(validateTutorRequest({ messages: [] }).ok, false);
});

test('rejects bad roles, empty and non-string content', () => {
  assert.equal(validateTutorRequest({ messages: [msg('system', 'hi')] }).ok, false);
  assert.equal(validateTutorRequest({ messages: [msg('user', '   ')] }).ok, false);
  assert.equal(validateTutorRequest({ messages: [{ role: 'user', content: 5 }] }).ok, false);
});

test('last message must be from the student', () => {
  const r = validateTutorRequest({ messages: [msg('user', 'hi'), msg('assistant', 'hello')] });
  assert.equal(r.ok, false);
});

test('enforces length and count limits', () => {
  const tooLong = 'a'.repeat(LIMITS.maxUserChars + 1);
  assert.equal(validateTutorRequest({ messages: [msg('user', tooLong)] }).ok, false);

  const many = Array.from({ length: LIMITS.maxMessages + 1 }, (_, i) =>
    msg(i % 2 === 0 ? 'user' : 'assistant', 'x')
  );
  assert.equal(validateTutorRequest({ messages: many }).ok, false);

  const bigAssistant = 'b'.repeat(LIMITS.maxAssistantChars);
  const total = [
    msg('user', 'a'.repeat(LIMITS.maxUserChars)),
    msg('assistant', bigAssistant),
    msg('user', 'a'.repeat(LIMITS.maxUserChars)),
    msg('assistant', bigAssistant),
    msg('user', 'a'.repeat(LIMITS.maxUserChars)),
  ];
  assert.equal(validateTutorRequest({ messages: total }).ok, false);
});

test('rejects unknown subject, level and language values', () => {
  const base = { messages: [msg('user', 'hi')] };
  assert.equal(validateTutorRequest({ ...base, subject: 'astrology' }).ok, false);
  assert.equal(validateTutorRequest({ ...base, classLevel: '13' }).ok, false);
  assert.equal(validateTutorRequest({ ...base, language: 'klingon' }).ok, false);
  assert.equal(validateTutorRequest({ ...base, subject: 'biology', classLevel: 'neet', language: 'hinglish' }).ok, true);
});

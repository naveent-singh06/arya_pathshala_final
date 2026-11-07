'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSystemPrompt, buildMessages } = require('../../api/_lib/prompt');

test('system prompt states honesty and uncertainty rules', () => {
  const p = buildSystemPrompt({});
  assert.match(p, /Never invent facts/);
  assert.match(p, /not fully sure/);
  assert.match(p, /cannot browse the internet/);
});

test('system prompt covers Hindi, English and Hinglish', () => {
  assert.match(buildSystemPrompt({ language: 'hindi' }), /Devanagari/);
  assert.match(buildSystemPrompt({ language: 'english' }), /simple English/);
  assert.match(buildSystemPrompt({ language: 'hinglish' }), /Hinglish/);
  const auto = buildSystemPrompt({ language: 'auto' });
  assert.match(auto, /Hinglish/);
  assert.match(auto, /Devanagari/);
});

test('system prompt reflects subject and level', () => {
  const p = buildSystemPrompt({ subject: 'biology', classLevel: 'neet' });
  assert.match(p, /Subject focus: Biology/);
  assert.match(p, /NEET-UG/);
  assert.match(buildSystemPrompt({ classLevel: 'jee' }), /JEE/);
  assert.match(buildSystemPrompt({ classLevel: '9' }), /Class 9/);
});

test('retrieved context is included only when provided', () => {
  assert.doesNotMatch(buildSystemPrompt({}), /Reference material/);
  assert.match(buildSystemPrompt({ context: 'ATP is the energy currency.' }), /ATP is the energy currency/);
});

test('buildMessages puts the system prompt first and keeps order', () => {
  const out = buildMessages({
    messages: [
      { role: 'user', content: 'a' },
      { role: 'assistant', content: 'b' },
      { role: 'user', content: 'c' },
    ],
    subject: 'physics',
    classLevel: '11',
    language: 'auto',
  });
  assert.equal(out[0].role, 'system');
  assert.deepEqual(out.slice(1).map((m) => m.content), ['a', 'b', 'c']);
});

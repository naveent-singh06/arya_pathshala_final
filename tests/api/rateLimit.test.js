'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { applyLimits, consume } = require('../../api/_lib/rateLimit');

const limits = { perMinute: 3, perDay: 5 };
const T0 = Date.UTC(2026, 10, 3, 10, 0, 0);

test('first request is allowed and counted', () => {
  const r = applyLimits(null, T0, limits);
  assert.equal(r.allowed, true);
  assert.equal(r.next.minuteCount, 1);
  assert.equal(r.next.dayCount, 1);
  assert.equal(r.remainingToday, 4);
});

test('blocks after the per-minute limit and reports retry time', () => {
  let state = null;
  for (let i = 0; i < 3; i += 1) {
    const r = applyLimits(state, T0 + i * 1000, limits);
    assert.equal(r.allowed, true);
    state = r.next;
  }
  const blocked = applyLimits(state, T0 + 10 * 1000, limits);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, 'minute');
  assert.equal(blocked.retryAfterSec, 50);
});

test('minute window resets after 60 seconds', () => {
  let state = null;
  for (let i = 0; i < 3; i += 1) state = applyLimits(state, T0, limits).next;
  const later = applyLimits(state, T0 + 61 * 1000, limits);
  assert.equal(later.allowed, true);
  assert.equal(later.next.minuteCount, 1);
  assert.equal(later.next.dayCount, 4);
});

test('blocks after the daily limit until the next UTC day', () => {
  let state = null;
  for (let i = 0; i < 5; i += 1) {
    state = applyLimits(state, T0 + i * 61 * 1000, limits).next;
  }
  const blocked = applyLimits(state, T0 + 6 * 61 * 1000, limits);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, 'daily');
  assert.ok(blocked.retryAfterSec > 0);

  const nextDay = applyLimits(state, Date.UTC(2026, 10, 4, 0, 0, 5), limits);
  assert.equal(nextDay.allowed, true);
  assert.equal(nextDay.next.dayCount, 1);
});

test('consume stores state through a Firestore-style transaction', async () => {
  const store = new Map();
  const db = {
    collection: (name) => ({ doc: (id) => ({ key: `${name}/${id}` }) }),
    runTransaction: async (fn) =>
      fn({
        get: async (ref) => ({ exists: store.has(ref.key), data: () => store.get(ref.key) }),
        set: (ref, data) => store.set(ref.key, data),
      }),
  };
  const a = await consume(db, 'uid1', limits, T0);
  const b = await consume(db, 'uid1', limits, T0 + 1000);
  assert.equal(a.allowed, true);
  assert.equal(b.allowed, true);
  assert.equal(store.get('tutorUsage/uid1').dayCount, 2);
  const other = await consume(db, 'uid2', limits, T0);
  assert.equal(other.next.dayCount, 1);
});

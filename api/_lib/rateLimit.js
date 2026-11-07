'use strict';

const MINUTE_MS = 60 * 1000;
const COLLECTION = 'tutorUsage'; // server-only; Firestore rules deny all client access

function msUntilNextUtcMidnight(nowMs) {
  const d = new Date(nowMs);
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  return next - nowMs;
}

/**
 * Pure usage rule: a per-minute window and a per-day (UTC) counter.
 * Returns { allowed, next?, reason?, retryAfterSec?, remainingToday? }.
 */
function applyLimits(prev, nowMs, { perMinute, perDay }) {
  const dayKey = new Date(nowMs).toISOString().slice(0, 10);

  let minuteStart = prev && Number.isFinite(prev.minuteStart) ? prev.minuteStart : nowMs;
  let minuteCount = prev && Number.isFinite(prev.minuteCount) ? prev.minuteCount : 0;
  if (nowMs - minuteStart >= MINUTE_MS || nowMs < minuteStart) {
    minuteStart = nowMs;
    minuteCount = 0;
  }
  const dayCount = prev && prev.dayKey === dayKey && Number.isFinite(prev.dayCount) ? prev.dayCount : 0;

  if (dayCount >= perDay) {
    return {
      allowed: false,
      reason: 'daily',
      retryAfterSec: Math.max(1, Math.ceil(msUntilNextUtcMidnight(nowMs) / 1000)),
    };
  }
  if (minuteCount >= perMinute) {
    return {
      allowed: false,
      reason: 'minute',
      retryAfterSec: Math.max(1, Math.ceil((minuteStart + MINUTE_MS - nowMs) / 1000)),
    };
  }
  return {
    allowed: true,
    remainingToday: perDay - dayCount - 1,
    next: { minuteStart, minuteCount: minuteCount + 1, dayKey, dayCount: dayCount + 1 },
  };
}

/** Atomically checks and records one request for `uid` in Firestore. */
async function consume(db, uid, limits, nowMs = Date.now()) {
  const ref = db.collection(COLLECTION).doc(uid);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const result = applyLimits(snap.exists ? snap.data() : null, nowMs, limits);
    if (result.allowed) tx.set(ref, result.next);
    return result;
  });
}

module.exports = { applyLimits, consume, COLLECTION };

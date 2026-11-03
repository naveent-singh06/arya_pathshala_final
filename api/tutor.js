'use strict';

// POST /api/tutor - streams an AI Tutor answer for a signed-in student.
// Secrets (LLM_API_KEY, FIREBASE_SERVICE_ACCOUNT_JSON) are read from server
// environment variables only and are never sent to the browser.

const { createTutorHandler } = require('./_lib/handler');
const { consume } = require('./_lib/rateLimit');
const admin = require('./_lib/firebaseAdmin');

module.exports = createTutorHandler({
  verifyIdToken: (token) => admin.getAuthAdmin().verifyIdToken(token),
  consumeRateLimit: (uid, limits, nowMs) => consume(admin.getDb(), uid, limits, nowMs),
});

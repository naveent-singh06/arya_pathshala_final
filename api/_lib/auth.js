'use strict';

const { HttpError, ConfigError } = require('./errors');

/**
 * Verifies the Firebase ID token in the "Authorization: Bearer <token>" header.
 * `verifyIdToken` is injected so the check can be tested without Firebase.
 * Returns { uid, email }.
 */
async function authenticate(req, verifyIdToken) {
  const header = (req.headers && (req.headers.authorization || req.headers.Authorization)) || '';
  const match = /^Bearer\s+(\S+)$/i.exec(String(header).trim());
  if (!match) {
    throw new HttpError(401, 'unauthenticated', 'Please sign in to use the AI Tutor.');
  }

  let decoded;
  try {
    decoded = await verifyIdToken(match[1]);
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error('[tutor] Firebase Admin is not configured:', err.message);
      throw new HttpError(503, 'not_configured', 'The AI Tutor is not configured on the server yet.');
    }
    throw new HttpError(401, 'unauthenticated', 'Your session has expired. Please sign in again.');
  }

  if (!decoded || !decoded.uid) {
    throw new HttpError(401, 'unauthenticated', 'Please sign in to use the AI Tutor.');
  }
  return { uid: decoded.uid, email: decoded.email || null };
}

module.exports = { authenticate };

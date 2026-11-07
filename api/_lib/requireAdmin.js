'use strict';

const { HttpError, ConfigError } = require('./errors');

/**
 * Server-side admin check for any privileged API. Verifies the Firebase ID token from the
 * "Authorization: Bearer <token>" header and requires the signed custom claim `admin === true`.
 * No Bearer token or an invalid one -> 401. A valid student token -> 403. Never trusts the body,
 * query string, cookies or an email address. `verifyIdToken` is injected so it can be tested.
 */
async function requireAdmin(req, verifyIdToken) {
  const header = (req.headers && (req.headers.authorization || req.headers.Authorization)) || '';
  const match = /^Bearer\s+(\S+)$/i.exec(String(header).trim());
  if (!match) throw new HttpError(401, 'unauthenticated', 'Please sign in.');

  let decoded;
  try {
    decoded = await verifyIdToken(match[1]);
  } catch (err) {
    if (err instanceof ConfigError) throw new HttpError(503, 'not_configured', 'The server is not configured yet.');
    throw new HttpError(401, 'unauthenticated', 'Your session has expired. Please sign in again.');
  }
  if (!decoded || !decoded.uid) throw new HttpError(401, 'unauthenticated', 'Please sign in.');
  if (decoded.admin !== true) throw new HttpError(403, 'forbidden', 'Administrator access is required.');
  return { uid: decoded.uid, email: decoded.email || null };
}

module.exports = { requireAdmin };

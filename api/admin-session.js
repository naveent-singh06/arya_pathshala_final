'use strict';

// GET /api/admin-session - answers 200 only for a signed-in user whose verified ID token carries the
// `admin: true` custom claim; 401 without a valid token, 403 for every other signed-in user.
// Use this pattern (requireAdmin) for every future privileged endpoint.

const { requireAdmin } = require('./_lib/requireAdmin');
const admin = require('./_lib/firebaseAdmin');

function createAdminSessionHandler({ verifyIdToken }) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const send = (status, body) => {
      res.statusCode = status;
      res.end(JSON.stringify(body));
    };
    if (req.method !== 'GET') return send(405, { error: 'method_not_allowed' });
    try {
      const user = await requireAdmin(req, verifyIdToken);
      return send(200, { admin: true, uid: user.uid });
    } catch (err) {
      if (err && err.status) return send(err.status, { error: err.code, message: err.message });
      return send(500, { error: 'server_error' });
    }
  };
}

module.exports = createAdminSessionHandler({ verifyIdToken: (token) => admin.getAuthAdmin().verifyIdToken(token) });
module.exports.createAdminSessionHandler = createAdminSessionHandler;

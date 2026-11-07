'use strict';

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { ConfigError } = require('./errors');

/**
 * Parses the service-account credentials from FIREBASE_SERVICE_ACCOUNT_JSON.
 * Accepts the raw JSON or the same JSON base64-encoded (handy for hosts that
 * mangle newlines in the private key). The value is never logged or returned.
 */
function parseServiceAccount(raw) {
  if (!raw || !String(raw).trim()) {
    throw new ConfigError('FIREBASE_SERVICE_ACCOUNT_JSON is not set.');
  }
  let text = String(raw).trim();
  if (!text.startsWith('{')) {
    text = Buffer.from(text, 'base64').toString('utf8').trim();
  }
  let account;
  try {
    account = JSON.parse(text);
  } catch (e) {
    throw new ConfigError('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON (or base64-encoded JSON).');
  }
  if (!account || !account.project_id || !account.client_email || !account.private_key) {
    throw new ConfigError('FIREBASE_SERVICE_ACCOUNT_JSON is missing project_id, client_email or private_key.');
  }
  account.private_key = String(account.private_key).replace(/\\n/g, '\n');
  return account;
}

function getAdminApp(env = process.env) {
  const existing = getApps()[0];
  if (existing) return existing;
  const account = parseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  return initializeApp({ credential: cert(account) });
}

const getAuthAdmin = () => getAuth(getAdminApp());
const getDb = () => getFirestore(getAdminApp());

module.exports = { parseServiceAccount, getAdminApp, getAuthAdmin, getDb };

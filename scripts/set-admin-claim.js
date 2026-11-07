#!/usr/bin/env node
/*
 * Gives (or removes) the `admin` custom claim for one Firebase Auth user.
 *
 *   node scripts/set-admin-claim.js you@example.com          -> make admin
 *   node scripts/set-admin-claim.js you@example.com --revoke -> remove admin
 *
 * Run it on YOUR computer. The service-account key is read from a file path in
 * GOOGLE_APPLICATION_CREDENTIALS (or the FIREBASE_SERVICE_ACCOUNT_JSON variable) and is never
 * printed, logged or sent anywhere. The person must sign out and in again to pick up the claim.
 */
const fs = require('fs');
const admin = require('firebase-admin');

async function main() {
  const email = process.argv[2];
  const revoke = process.argv.includes('--revoke');
  if (!email || !email.includes('@')) {
    console.error('Usage: node scripts/set-admin-claim.js <email> [--revoke]');
    process.exit(1);
  }
  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    credential = admin.credential.cert(JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')));
  } else {
    console.error('Set GOOGLE_APPLICATION_CREDENTIALS to the path of your service-account JSON file. See docs/CMS_SETUP.md.');
    process.exit(1);
  }
  admin.initializeApp({ credential });
  const user = await admin.auth().getUserByEmail(email);
  const claims = { ...(user.customClaims || {}) };
  if (revoke) delete claims.admin;
  else claims.admin = true;
  await admin.auth().setCustomUserClaims(user.uid, claims);
  console.log(`${revoke ? 'Removed admin from' : 'Made admin:'} ${email}. They must sign out and sign in again.`);
}

main().catch((e) => {
  console.error('Failed:', e && e.code ? e.code : e && e.message);
  process.exit(1);
});

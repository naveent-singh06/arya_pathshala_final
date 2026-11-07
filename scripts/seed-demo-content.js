#!/usr/bin/env node
/*
 * Adds clearly-labelled DEMO content (Class 9, Class 10, NEET, a Foundation Batch each, subjects,
 * chapters, topics and a few questions) to Firestore. It is admin-only (it uses the service account)
 * and writes nothing unless you confirm the exact Firebase project:
 *
 *   node scripts/seed-demo-content.js                          -> dry run: shows what it would write
 *   node scripts/seed-demo-content.js --confirm-project=<id>   -> writes (skips documents that already exist)
 *   node scripts/seed-demo-content.js --confirm-project=<id> --remove   -> deletes only the demo documents
 *
 * Run it on YOUR computer with GOOGLE_APPLICATION_CREDENTIALS pointing at your service-account file.
 * Nothing secret is printed. Run it against a test project first if you have one.
 */
const fs = require('fs');
const { build } = require('./demo-content');

async function main() {
  const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1];
  const remove = process.argv.includes('--remove');
  const docs = build();
  const confirm = arg('confirm-project');

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  let creds = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  else if (credPath) creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  if (!creds) {
    console.log(`Dry run: ${docs.length} demo documents would be written (${[...new Set(docs.map((d) => d.collection))].join(', ')}).`);
    console.log('Set GOOGLE_APPLICATION_CREDENTIALS to your service-account file to continue. See docs/CMS_SETUP.md.');
    return;
  }
  const admin = require('firebase-admin');
  admin.initializeApp({ credential: admin.credential.cert(creds) });
  const db = admin.firestore();
  console.log(`Target Firebase project: ${creds.project_id}`);
  if (confirm !== creds.project_id) {
    console.log(`Dry run only. To really ${remove ? 'remove' : 'write'} ${docs.length} demo documents, repeat with --confirm-project=${creds.project_id}`);
    return;
  }
  let written = 0;
  let skipped = 0;
  for (const d of docs) {
    const ref = db.collection(d.collection).doc(d.id);
    if (remove) {
      const snap = await ref.get();
      if (snap.exists && snap.data().demo === true) { await ref.delete(); written += 1; } else skipped += 1;
    } else {
      const snap = await ref.get();
      if (snap.exists) { skipped += 1; continue; }
      await ref.set({ ...d.data, createdBy: 'demo-seed', createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      written += 1;
    }
  }
  console.log(`${remove ? 'Removed' : 'Created'} ${written}, skipped ${skipped} (${remove ? 'not demo or missing' : 'already existed'}).`);
}
main().catch((e) => { console.error('Failed:', e && e.code ? e.code : e && e.message); process.exit(1); });

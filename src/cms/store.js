// Firestore access for the content system. Everything degrades to a clear error when Firebase is not configured.
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../components/Login/firebase';
import { COLLECTIONS } from './model';

export const hasBackend = () => !!db;

export function describeError(error) {
  const code = error && error.code;
  if (code === 'permission-denied') return 'The database refused access. If you are an admin, make sure the latest firestore.rules are published (see docs/CMS_SETUP.md). Students may need to log in first.';
  if (code === 'unauthenticated') return 'Please log in again and retry.';
  if (code === 'timeout') return 'The database did not answer in time. Check your internet connection. If this keeps happening, Firestore may not be created for this Firebase project yet.';
  if (code === 'unavailable') return 'Could not reach the database. Check your connection and try again.';
  if (code === 'not-found') return 'The Firestore database was not found. Create it in the Firebase console (see docs/CMS_SETUP.md).';
  if (code === 'failed-precondition') return 'The database needs a setup step. See docs/CMS_SETUP.md.';
  return 'Something went wrong. Please try again.';
}

export const LOAD_TIMEOUT_MS = 15000;
/** Rejects with code "timeout" if the promise has not settled in time, so a screen can never load forever. */
export function withTimeout(promise, ms = LOAD_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'timeout' })), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

/** Reads every content collection. Admins read all documents; students only what is published. */
export async function loadContent({ admin }) {
  if (!db) throw Object.assign(new Error('not-configured'), { code: 'not-configured' });
  const result = {};
  const cached = [];
  await withTimeout(
    Promise.all(
      COLLECTIONS.map(async (name) => {
        const ref = collection(db, name);
        const snap = await getDocs(admin ? ref : query(ref, where('status', '==', 'published')));
        cached.push(!!(snap.metadata && snap.metadata.fromCache));
        result[name] = rows(snap);
      }),
    ),
  );
  // When the server cannot be reached the SDK answers from its (empty) cache. That is a connection
  // problem, not an empty database, so say so instead of "nothing published yet".
  if (cached.length && cached.every(Boolean) && COLLECTIONS.every((n) => !result[n].length)) {
    throw Object.assign(new Error('unavailable'), { code: 'unavailable' });
  }
  if (admin) result.socialLinks = await loadSocialLinks({ admin: true });
  return result;
}

export async function loadSocialLinks({ admin }) {
  if (!db) return [];
  const ref = collection(db, 'socialLinks');
  const snap = await withTimeout(getDocs(admin ? ref : query(ref, where('active', '==', true))));
  return rows(snap);
}

export async function createItem(name, data, user) {
  if (!db) throw Object.assign(new Error('not-configured'), { code: 'not-configured' });
  const ref = await addDoc(collection(db, name), {
    ...data,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateItem(name, id, data) {
  if (!db) throw Object.assign(new Error('not-configured'), { code: 'not-configured' });
  await updateDoc(doc(db, name, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteItem(name, id) {
  if (!db) throw Object.assign(new Error('not-configured'), { code: 'not-configured' });
  await deleteDoc(doc(db, name, id));
}

/** Applies several { id, order } changes at once (used by move up / move down). */
export async function applyOrder(name, pairs) {
  if (!db || !pairs.length) return;
  const batch = writeBatch(db);
  pairs.forEach((p) => batch.update(doc(db, name, p.id), { order: p.order, updatedAt: serverTimestamp() }));
  await batch.commit();
}

/** Creates several documents at once (bulk topics). Firestore allows 500 writes per batch; callers send far fewer. */
export async function createMany(name, items, user) {
  if (!db) throw Object.assign(new Error('not-configured'), { code: 'not-configured' });
  const batch = writeBatch(db);
  items.forEach((data) => batch.set(doc(collection(db, name)), { ...data, createdBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  await batch.commit();
}

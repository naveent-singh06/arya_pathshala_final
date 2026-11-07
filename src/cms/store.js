// Firestore access for the content system. Everything degrades to a clear error when Firebase is not configured.
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../components/Login/firebase';
import { COLLECTIONS } from './model';

export const hasBackend = () => !!db;

export function describeError(error) {
  const code = error && error.code;
  if (code === 'permission-denied') return 'You do not have permission to do that.';
  if (code === 'unavailable') return 'Could not reach the database. Check your connection and try again.';
  if (code === 'failed-precondition') return 'The database needs a setup step. See docs/CMS_SETUP.md.';
  return 'Something went wrong. Please try again.';
}

const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

/** Reads every content collection. Admins read all documents; students only what is published. */
export async function loadContent({ admin }) {
  if (!db) throw Object.assign(new Error('not-configured'), { code: 'not-configured' });
  const result = {};
  await Promise.all(
    COLLECTIONS.map(async (name) => {
      const ref = collection(db, name);
      const snap = await getDocs(admin ? ref : query(ref, where('status', '==', 'published')));
      result[name] = rows(snap);
    }),
  );
  if (admin) result.socialLinks = await loadSocialLinks({ admin: true });
  return result;
}

export async function loadSocialLinks({ admin }) {
  if (!db) return [];
  const ref = collection(db, 'socialLinks');
  const snap = await getDocs(admin ? ref : query(ref, where('active', '==', true)));
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

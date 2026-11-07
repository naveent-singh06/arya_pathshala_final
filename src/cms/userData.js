// Per-student study data: progress, bookmarks and personal notes. Stored under the student's own
// users/{uid}/... path, which Firestore rules restrict to that student.
import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, setDoc, getDoc, deleteDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../components/Login/firebase';

export function useHubProgress(uid) {
  const [map, setMap] = useState({});
  const [error, setError] = useState('');
  useEffect(() => {
    setMap({});
    if (!db || !uid) return undefined;
    return onSnapshot(
      collection(db, 'users', uid, 'hubProgress'),
      (snap) => {
        const next = {};
        snap.forEach((d) => {
          next[d.id] = d.data();
        });
        setMap(next);
        setError('');
      },
      () => setError('Your progress could not be loaded.'),
    );
  }, [uid]);
  const actions = useMemo(() => {
    const ref = (topicId) => doc(db, 'users', uid, 'hubProgress', topicId);
    const write = (topicId, data) => setDoc(ref(topicId), { ...data, lastStudiedAt: serverTimestamp() }, { merge: true });
    return {
      setCompleted: (topicId, completed) => write(topicId, { completed }),
      setBookmarked: (topicId, bookmarked) => write(topicId, { bookmarked }),
      visit: (topicId, topicTitle) => write(topicId, { lastVisited: true, title: String(topicTitle || '').slice(0, 200) }),
      recordAttempt: (topicId, score, total, set = 'practice') => write(topicId, set === 'dpp' ? { dppAttempts: increment(1), dppLastScore: score, dppLastTotal: total } : { attempts: increment(1), lastScore: score, lastTotal: total }),
    };
  }, [uid]);
  return { progress: map, error, actions: db && uid ? actions : null };
}

export async function loadNote(uid, topicId) {
  if (!db || !uid) return '';
  const snap = await getDoc(doc(db, 'users', uid, 'hubNotes', topicId));
  return snap.exists() ? snap.data().text || '' : '';
}
export const saveNote = (uid, topicId, text) => setDoc(doc(db, 'users', uid, 'hubNotes', topicId), { text, updatedAt: serverTimestamp() });
export const deleteNote = (uid, topicId) => deleteDoc(doc(db, 'users', uid, 'hubNotes', topicId));

/** The batches this student has joined: users/{uid}/enrollments/{batchId}. */
export function useEnrollments(uid) {
  const [ids, setIds] = useState([]);
  useEffect(() => {
    setIds([]);
    if (!db || !uid) return undefined;
    return onSnapshot(collection(db, 'users', uid, 'enrollments'), (snap) => setIds(snap.docs.map((d) => d.id)), () => {});
  }, [uid]);
  const enroll = (batchId, classId) => setDoc(doc(db, 'users', uid, 'enrollments', batchId), { classId, enrolledAt: serverTimestamp() });
  const leave = (batchId) => deleteDoc(doc(db, 'users', uid, 'enrollments', batchId));
  return { enrolled: ids, enroll: db && uid ? enroll : null, leave: db && uid ? leave : null };
}

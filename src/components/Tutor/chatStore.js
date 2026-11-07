import {
  collection,
  doc,
  deleteDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { buildSearchText, makePreview } from "./chatText";

// Data model (all under the signed-in student's own document):
//   users/{uid}/chats/{chatId}                  title, subject, classLevel, language,
//                                               preview, searchText, createdAt, updatedAt
//   users/{uid}/chats/{chatId}/messages/{msgId} role, content, createdAt
// Access is restricted to the owner by firestore.rules.

const chatsCol = (db, uid) => collection(db, "users", uid, "chats");
const chatDoc = (db, uid, chatId) => doc(db, "users", uid, "chats", chatId);
const messagesCol = (db, uid, chatId) => collection(db, "users", uid, "chats", chatId, "messages");

const readData = (snapshotDoc) => ({
  id: snapshotDoc.id,
  ...snapshotDoc.data({ serverTimestamps: "estimate" }),
});

export function subscribeChats(db, uid, onData, onError) {
  const q = query(chatsCol(db, uid), orderBy("updatedAt", "desc"), limit(100));
  return onSnapshot(q, (snap) => onData(snap.docs.map(readData)), onError);
}

export function subscribeMessages(db, uid, chatId, onData, onError) {
  const q = query(messagesCol(db, uid, chatId), orderBy("createdAt", "asc"), limit(500));
  return onSnapshot(q, (snap) => onData(snap.docs.map(readData)), onError);
}

export async function createChat(db, uid, { title, subject, classLevel, language }) {
  const ref = doc(chatsCol(db, uid));
  await setDoc(ref, {
    title,
    subject,
    classLevel,
    language,
    preview: "",
    searchText: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Saves a message and refreshes the chat's preview/search text in one atomic write. */
export async function addMessage(db, uid, chat, { role, content }) {
  const batch = writeBatch(db);
  const messageRef = doc(messagesCol(db, uid, chat.id));
  batch.set(messageRef, { role, content, createdAt: serverTimestamp() });

  const patch = { preview: makePreview(content), updatedAt: serverTimestamp() };
  if (role === "user") patch.searchText = buildSearchText(chat.searchText, content);
  batch.update(chatDoc(db, uid, chat.id), patch);

  await batch.commit();
  return messageRef.id;
}

export async function deleteMessage(db, uid, chatId, messageId) {
  await deleteDoc(doc(messagesCol(db, uid, chatId), messageId));
}

export async function updateChatSettings(db, uid, chatId, { subject, classLevel, language }) {
  // firestore.rules require updatedAt == request.time on every chat update.
  await updateDoc(chatDoc(db, uid, chatId), { subject, classLevel, language, updatedAt: serverTimestamp() });
}

async function deleteAllMessages(db, uid, chatId) {
  const snap = await getDocs(messagesCol(db, uid, chatId));
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = writeBatch(db);
    docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    // eslint-disable-next-line no-await-in-loop
    await batch.commit();
  }
}

/** Removes every message but keeps the chat (title and settings). */
export async function clearMessages(db, uid, chatId) {
  await deleteAllMessages(db, uid, chatId);
  await updateDoc(chatDoc(db, uid, chatId), {
    preview: "",
    searchText: "",
    updatedAt: serverTimestamp(),
  });
}

export async function deleteChat(db, uid, chatId) {
  await deleteAllMessages(db, uid, chatId);
  await deleteDoc(chatDoc(db, uid, chatId));
}

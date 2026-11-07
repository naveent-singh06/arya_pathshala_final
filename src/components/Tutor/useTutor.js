import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../Login/firebase";
import * as store from "./chatStore";
import { streamTutorReply } from "./tutorApi";
import { filterChats, friendlyFirestoreError, makeTitle } from "./chatText";
import { DEFAULT_SETTINGS, LANGUAGES, LEVELS, LIMITS, SUBJECTS } from "./constants";

const SETTINGS_KEY = "arya.tutor.settings";

const isAllowed = (list, value) => list.some((o) => o.value === value);

function loadSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}");
    return {
      subject: isAllowed(SUBJECTS, saved.subject) ? saved.subject : DEFAULT_SETTINGS.subject,
      classLevel: isAllowed(LEVELS, saved.classLevel) ? saved.classLevel : DEFAULT_SETTINGS.classLevel,
      language: isAllowed(LANGUAGES, saved.language) ? saved.language : DEFAULT_SETTINGS.language,
    };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    // Storage can be unavailable (private mode); settings just won't be remembered.
  }
}

/**
 * All AI Tutor state and actions: chat list, messages, sending, streaming,
 * stopping, regenerating, clearing and deleting. `user` is the signed-in Firebase user.
 */
export default function useTutor(user) {
  const uid = user.uid;

  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [chatsError, setChatsError] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState(null);
  const [truncated, setTruncated] = useState(false);
  const abortRef = useRef(null);

  // Live list of this student's chats.
  useEffect(() => {
    setChatsLoading(true);
    return store.subscribeChats(
      db,
      uid,
      (list) => {
        setChats(list);
        setChatsError(null);
        setChatsLoading(false);
      },
      (e) => {
        setChatsError(friendlyFirestoreError(e));
        setChatsLoading(false);
      }
    );
  }, [uid]);

  // Live messages of the open chat.
  useEffect(() => {
    setMessages([]);
    if (!activeChatId) {
      setMessagesLoading(false);
      return undefined;
    }
    setMessagesLoading(true);
    return store.subscribeMessages(
      db,
      uid,
      activeChatId,
      (list) => {
        setMessages(list);
        setMessagesLoading(false);
      },
      (e) => {
        setError({ message: friendlyFirestoreError(e) });
        setMessagesLoading(false);
      }
    );
  }, [uid, activeChatId]);

  // Stop any running request if the page is closed.
  useEffect(
    () => () => {
      if (abortRef.current) abortRef.current.abort();
    },
    []
  );

  const activeChat = useMemo(() => chats.find((c) => c.id === activeChatId) || null, [chats, activeChatId]);
  const visibleChats = useMemo(() => filterChats(chats, search), [chats, search]);

  /** Streams one answer for `history` and saves it to the chat. */
  const generateReply = async (chatId, history, chatSettings) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setGenerating(true);
    setStreamText("");
    setError(null);
    setTruncated(false);

    let text = "";
    let finishReason = null;
    let failure = null;
    try {
      const events = streamTutorReply({
        messages: history,
        subject: chatSettings.subject,
        classLevel: chatSettings.classLevel,
        language: chatSettings.language,
        getToken: () => user.getIdToken(),
        signal: controller.signal,
      });
      for await (const event of events) {
        if (event.type === "delta") {
          text += event.text;
          setStreamText(text);
        } else if (event.type === "done") {
          finishReason = event.finishReason;
        }
      }
    } catch (e) {
      if (!(e && e.name === "AbortError")) failure = e;
    }

    const answer = text.trim();
    if (!failure && answer) {
      try {
        await store.addMessage(db, uid, { id: chatId, searchText: "" }, { role: "assistant", content: answer });
        setTruncated(finishReason === "length");
      } catch (e) {
        setError({ message: friendlyFirestoreError(e) });
      }
    } else if (failure) {
      setError({ message: failure.message, retryAfter: failure.retryAfter || null });
    } else if (!controller.signal.aborted) {
      setError({ message: "The AI Tutor returned an empty answer. Please try again." });
    }

    setStreamText("");
    setGenerating(false);
    abortRef.current = null;
  };

  const sendMessage = async (raw) => {
    const text = String(raw || "").trim();
    if (!text || generating) return false;
    if (text.length > LIMITS.maxUserChars) {
      setError({ message: `Please keep your question under ${LIMITS.maxUserChars} characters.` });
      return false;
    }
    setError(null);

    let chatId = activeChatId;
    let chatMeta = activeChat || { id: chatId, searchText: "" };
    try {
      if (!chatId) {
        chatId = await store.createChat(db, uid, { title: makeTitle(text), ...settings });
        chatMeta = { id: chatId, searchText: "" };
        setActiveChatId(chatId);
      }
      await store.addMessage(db, uid, chatMeta, { role: "user", content: text });
    } catch (e) {
      setError({ message: friendlyFirestoreError(e) });
      return false;
    }

    generateReply(chatId, [...messages, { role: "user", content: text }], settings);
    return true;
  };

  const regenerate = async () => {
    const last = messages[messages.length - 1];
    if (generating || !activeChatId || !last || last.role !== "assistant") return;
    try {
      await store.deleteMessage(db, uid, activeChatId, last.id);
    } catch (e) {
      setError({ message: friendlyFirestoreError(e) });
      return;
    }
    generateReply(activeChatId, messages.slice(0, -1), settings);
  };

  /** Re-asks the last question after an error (the question is already saved). */
  const retry = () => {
    const last = messages[messages.length - 1];
    if (generating || !activeChatId || !last || last.role !== "user") return;
    generateReply(activeChatId, messages, settings);
  };

  const stop = () => {
    if (abortRef.current) abortRef.current.abort();
  };

  const newChat = () => {
    if (generating) return;
    setActiveChatId(null);
    setError(null);
    setTruncated(false);
  };

  const selectChat = (chatId) => {
    if (generating || chatId === activeChatId) return;
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setSettings({ subject: chat.subject, classLevel: chat.classLevel, language: chat.language });
    }
    setActiveChatId(chatId);
    setError(null);
    setTruncated(false);
  };

  const changeSetting = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
    if (activeChatId) {
      store.updateChatSettings(db, uid, activeChatId, next).catch((e) => {
        setError({ message: friendlyFirestoreError(e) });
      });
    }
  };

  const clearChat = async () => {
    if (generating || !activeChatId) return;
    try {
      await store.clearMessages(db, uid, activeChatId);
      setTruncated(false);
      setError(null);
    } catch (e) {
      setError({ message: friendlyFirestoreError(e) });
    }
  };

  const removeChat = async (chatId) => {
    if (generating) return;
    try {
      await store.deleteChat(db, uid, chatId);
      if (chatId === activeChatId) newChat();
    } catch (e) {
      setError({ message: friendlyFirestoreError(e) });
    }
  };

  return {
    chats: visibleChats,
    totalChats: chats.length,
    chatsLoading,
    chatsError,
    activeChatId,
    activeChat,
    messages,
    messagesLoading,
    settings,
    search,
    setSearch,
    generating,
    streamText,
    error,
    dismissError: () => setError(null),
    truncated,
    sendMessage,
    regenerate,
    retry,
    stop,
    newChat,
    selectChat,
    changeSetting,
    clearChat,
    removeChat,
  };
}

import React from "react";
import { MessageSquare, Plus, Search, Trash2, X } from "lucide-react";
import { formatRelativeTime } from "./chatText";
import styles from "./Tutor.module.css";

export default function ChatSidebar({
  chats,
  totalChats,
  loading,
  error,
  activeChatId,
  search,
  onSearch,
  onNewChat,
  onSelect,
  onDelete,
  disabled,
  open,
  onClose,
}) {
  const confirmDelete = (chat) => {
    if (window.confirm(`Delete the chat "${chat.title}"? This cannot be undone.`)) onDelete(chat.id);
  };

  return (
    <>
      {open && <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />}
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`} aria-label="Chat history">
        <div className={styles.sidebarHead}>
          <button type="button" className={styles.newChat} onClick={onNewChat} disabled={disabled}>
            <Plus size={18} />
            <span>New chat</span>
          </button>
          <button type="button" className={styles.iconBtn + " " + styles.sidebarClose} onClick={onClose} aria-label="Close chat list">
            <X size={20} />
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search your chats"
            aria-label="Search your chats"
          />
        </div>

        <div className={styles.chatList}>
          {loading && <p className={styles.sideNote}>Loading your chats...</p>}
          {!loading && error && <p className={`${styles.sideNote} ${styles.sideError}`}>{error}</p>}
          {!loading && !error && totalChats === 0 && (
            <p className={styles.sideNote}>No chats yet. Ask your first question to begin.</p>
          )}
          {!loading && !error && totalChats > 0 && chats.length === 0 && (
            <p className={styles.sideNote}>No chats match your search.</p>
          )}
          {chats.map((chat) => (
            <div key={chat.id} className={`${styles.chatItem} ${chat.id === activeChatId ? styles.chatItemActive : ""}`}>
              <button
                type="button"
                className={styles.chatItemMain}
                onClick={() => onSelect(chat.id)}
                disabled={disabled}
                aria-current={chat.id === activeChatId ? "true" : undefined}
              >
                <MessageSquare size={16} aria-hidden="true" />
                <span className={styles.chatText}>
                  <span className={styles.chatTitle}>{chat.title}</span>
                  <span className={styles.chatTime}>{formatRelativeTime(chat.updatedAt)}</span>
                </span>
              </button>
              <button
                type="button"
                className={styles.chatDelete}
                onClick={() => confirmDelete(chat)}
                disabled={disabled}
                aria-label={`Delete chat ${chat.title}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, Trash2 } from "lucide-react";
import useTutor from "./useTutor";
import ChatSidebar from "./ChatSidebar";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";
import { CONTINUE_PROMPT, LANGUAGES, LEVELS, SUBJECTS, SUGGESTIONS } from "./constants";
import styles from "./Tutor.module.css";

function SettingSelect({ label, value, options, onChange }) {
  return (
    <label className={styles.setting}>
      <span className={styles.settingLabel}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Tutor({ user, isAdmin = false }) {
  const navigate = useNavigate();
  const tutor = useTutor(user);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const scrollRef = useRef(null);
  const stickToBottom = useRef(true);

  const { messages, generating, streamText, error, truncated, settings, activeChatId } = tutor;
  const showSuggestions = !activeChatId && messages.length === 0;
  const lastMessage = messages[messages.length - 1];
  const waitingForFirstWord = generating && !streamText;
  const needsRetry = !generating && error && lastMessage && lastMessage.role === "user";

  // Keep the newest text in view, unless the student scrolled up to read.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, streamText, generating, error]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const handleSend = (text) => {
    stickToBottom.current = true;
    return tutor.sendMessage(text);
  };

  const confirmClear = () => {
    if (window.confirm("Clear all messages in this chat? This cannot be undone.")) tutor.clearChat();
  };

  const goBack = () => navigate(isAdmin ? "/dashboardadmin" : "/dashboard");

  return (
    <div className={styles.page}>
      <ChatSidebar
        chats={tutor.chats}
        totalChats={tutor.totalChats}
        loading={tutor.chatsLoading}
        error={tutor.chatsError}
        activeChatId={activeChatId}
        search={tutor.search}
        onSearch={tutor.setSearch}
        onNewChat={() => {
          tutor.newChat();
          setSidebarOpen(false);
        }}
        onSelect={(id) => {
          tutor.selectChat(id);
          setSidebarOpen(false);
        }}
        onDelete={tutor.removeChat}
        disabled={generating}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={styles.main}>
        <header className={styles.topbar}>
          <button type="button" className={`${styles.iconBtn} ${styles.menuBtn}`} onClick={() => setSidebarOpen(true)} aria-label="Open chat list">
            <Menu size={22} />
          </button>
          <button type="button" className={styles.backBtn} onClick={goBack} aria-label="Back to dashboard">
            <ArrowLeft size={18} />
            <span>Dashboard</span>
          </button>
          <Link to="/" className={styles.brand}>
            ARYA PATHSHALA
          </Link>
          <span className={styles.brandSub}>AI Tutor</span>
          <div className={styles.topSpacer} />
          {activeChatId && messages.length > 0 && (
            <button type="button" className={styles.clearBtn} onClick={confirmClear} disabled={generating}>
              <Trash2 size={16} />
              <span>Clear chat</span>
            </button>
          )}
        </header>

        <div className={styles.settings}>
          <SettingSelect label="Subject" value={settings.subject} options={SUBJECTS} onChange={(v) => tutor.changeSetting("subject", v)} />
          <SettingSelect label="Class / exam" value={settings.classLevel} options={LEVELS} onChange={(v) => tutor.changeSetting("classLevel", v)} />
          <SettingSelect label="Language" value={settings.language} options={LANGUAGES} onChange={(v) => tutor.changeSetting("language", v)} />
        </div>

        <div className={styles.scroll} ref={scrollRef} onScroll={handleScroll}>
          <div className={styles.thread}>
            {showSuggestions && (
              <section className={styles.welcome}>
                <h1>Hi {user.displayName ? user.displayName.split(" ")[0] : "there"}, I'm Arya.</h1>
                <p>
                  Your AI Tutor for Class 9-12, NEET and JEE. Ask me anything in English, हिन्दी or Hinglish. I explain step by step, and I will tell you
                  honestly when I'm not sure.
                </p>
                <div className={styles.suggestions}>
                  {(SUGGESTIONS[settings.subject] || SUGGESTIONS.general).map((s) => (
                    <button key={s} type="button" className={styles.suggestion} onClick={() => handleSend(s)} disabled={generating}>
                      {s}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {tutor.messagesLoading && messages.length === 0 && <p className={styles.note}>Loading chat...</p>}

            {messages.map((m, index) => (
              <MessageBubble
                key={m.id}
                message={m}
                canRegenerate={!generating && index === messages.length - 1 && m.role === "assistant"}
                onRegenerate={tutor.regenerate}
              />
            ))}

            {generating && (
              <MessageBubble message={{ role: "assistant", content: waitingForFirstWord ? "" : streamText }} streaming />
            )}

            {truncated && !generating && (
              <div className={styles.notice}>
                <span>This answer reached the length limit and may be cut off.</span>
                <button type="button" onClick={() => handleSend(CONTINUE_PROMPT)}>
                  Continue
                </button>
              </div>
            )}

            {error && (
              <div className={styles.error} role="alert">
                <span>{error.message}</span>
                <div className={styles.errorActions}>
                  {needsRetry && (
                    <button type="button" onClick={tutor.retry}>
                      Try again
                    </button>
                  )}
                  <button type="button" onClick={tutor.dismissError}>
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Composer onSend={handleSend} onStop={tutor.stop} generating={generating} focusKey={activeChatId || "new"} />
      </main>
    </div>
  );
}

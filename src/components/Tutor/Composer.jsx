import React, { useEffect, useRef, useState } from "react";
import { SendHorizontal, Square } from "lucide-react";
import { LIMITS } from "./constants";
import styles from "./Tutor.module.css";

export default function Composer({ onSend, onStop, generating, focusKey }) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const areaRef = useRef(null);

  // Grow the box with the text (up to a limit).
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  // Put the cursor back in the box when a new chat starts.
  useEffect(() => {
    if (areaRef.current) areaRef.current.focus();
  }, [focusKey]);

  const submit = async () => {
    const text = value.trim();
    if (!text || generating || sending) return;
    setSending(true);
    const ok = await onSend(text);
    setSending(false);
    if (ok) setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const remaining = LIMITS.maxUserChars - value.length;
  const canSend = value.trim().length > 0 && !generating && !sending && remaining >= 0;

  return (
    <div className={styles.composerWrap}>
      <div className={styles.composer}>
        <textarea
          ref={areaRef}
          className={styles.input}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your doubt in English, हिन्दी or Hinglish..."
          aria-label="Type your question"
          maxLength={LIMITS.maxUserChars + 200}
        />
        {generating ? (
          <button type="button" className={`${styles.sendBtn} ${styles.stopBtn}`} onClick={onStop} aria-label="Stop answering">
            <Square size={16} fill="currentColor" />
          </button>
        ) : (
          <button type="button" className={styles.sendBtn} onClick={submit} disabled={!canSend} aria-label="Send question">
            <SendHorizontal size={18} />
          </button>
        )}
      </div>
      <div className={styles.composerMeta}>
        <span>Enter to send, Shift+Enter for a new line.</span>
        {remaining < 300 && (
          <span className={remaining < 0 ? styles.overLimit : undefined}>{remaining} characters left</span>
        )}
      </div>
      <p className={styles.disclaimer}>
        ARYA PATHSHALA AI Tutor can make mistakes. Please check important answers with your textbook or teacher.
      </p>
    </div>
  );
}

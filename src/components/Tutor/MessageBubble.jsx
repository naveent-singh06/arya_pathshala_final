import React, { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import MarkdownContent from "./MarkdownContent";
import { copyToClipboard } from "./clipboard";
import styles from "./Tutor.module.css";

export default function MessageBubble({ message, streaming = false, canRegenerate = false, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    if (await copyToClipboard(message.content)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (isUser) {
    return (
      <div className={`${styles.row} ${styles.rowUser}`}>
        <div className={`${styles.bubble} ${styles.bubbleUser}`}>{message.content}</div>
      </div>
    );
  }

  return (
    <div className={`${styles.row} ${styles.rowAssistant}`}>
      <div className={styles.avatar} aria-hidden="true">
        A
      </div>
      <div className={styles.assistantBody}>
        {message.content ? (
          <MarkdownContent text={message.content} />
        ) : (
          <div className={styles.typing} role="status" aria-label="Arya is thinking">
            <span />
            <span />
            <span />
          </div>
        )}
        {streaming && message.content && <span className={styles.cursor} aria-hidden="true" />}
        {!streaming && (
          <div className={styles.actions}>
            <button type="button" className={styles.actionBtn} onClick={handleCopy} aria-label="Copy answer">
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
            {canRegenerate && (
              <button type="button" className={styles.actionBtn} onClick={onRegenerate} aria-label="Regenerate answer">
                <RefreshCw size={15} />
                <span>Regenerate</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

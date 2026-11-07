// Pure helpers for chat titles, previews, search and times (no Firebase imports).

export function makeTitle(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > 60 ? `${clean.slice(0, 57).trimEnd()}...` : clean;
}

export function makePreview(text) {
  const clean = String(text || "")
    .replace(/```[\s\S]*?```/g, " [code] ")
    .replace(/[#*_`>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > 140 ? `${clean.slice(0, 137).trimEnd()}...` : clean;
}

const SEARCH_TEXT_MAX = 2000;

/** Appends a new student question to a chat's searchable text (keeps the most recent part). */
export function buildSearchText(existing, question) {
  const merged = `${existing || ""} ${String(question || "").replace(/\s+/g, " ").trim()}`.trim();
  return merged.length > SEARCH_TEXT_MAX ? merged.slice(-SEARCH_TEXT_MAX) : merged;
}

/** Case-insensitive search over title, last message and the student's questions. */
export function filterChats(chats, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return chats;
  return chats.filter((chat) =>
    `${chat.title || ""} ${chat.preview || ""} ${chat.searchText || ""}`.toLowerCase().includes(q)
  );
}

export function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return Number(value) || 0;
}

export function formatRelativeTime(value, now = Date.now()) {
  const ms = toMillis(value);
  if (!ms) return "";
  const diff = Math.max(0, now - ms);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)} min ago`;
  if (diff < day) return `${Math.floor(diff / hour)} hr ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} d ago`;
  return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/**
 * Many models write math as \( ... \) and \[ ... \]. The renderer expects
 * $ ... $ and $$ ... $$, so convert them (but never inside code).
 */
export function normalizeMath(text) {
  const source = String(text || "");
  return source
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, index) => {
      if (index % 2 === 1) return part; // code segment
      return part
        .replace(/\\\[([\s\S]+?)\\\]/g, (_, expr) => `\n$$\n${expr.trim()}\n$$\n`)
        .replace(/\\\(([\s\S]+?)\\\)/g, (_, expr) => `$${expr.trim()}$`);
    })
    .join("");
}

export function friendlyFirestoreError(error) {
  const code = error && error.code;
  if (code === "permission-denied") {
    return "Could not use your chat history. The database or its security rules may not be set up yet - please tell the administrator.";
  }
  if (code === "unavailable" || code === "deadline-exceeded") {
    return "You seem to be offline. Please check your internet connection.";
  }
  if (code === "not-found") {
    return "The chat database is not set up yet - please tell the administrator.";
  }
  return "Something went wrong while saving your chat. Please try again.";
}

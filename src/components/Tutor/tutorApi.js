import { LIMITS } from "./constants";

export const TUTOR_API_URL = `${process.env.REACT_APP_API_BASE_URL || ""}/api/tutor`;

export class TutorApiError extends Error {
  constructor(message, { code = "error", status = 0, retryAfter = null } = {}) {
    super(message);
    this.name = "TutorApiError";
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

/**
 * Prepares the conversation to send to the server: keeps only role/content,
 * drops empty messages, and keeps the most recent messages that fit the
 * server limits (this is the chat's "memory").
 */
export function prepareMessages(messages) {
  let list = (messages || [])
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim()
    )
    .map((m) => ({ role: m.role, content: m.content.trim() }))
    .map((m) =>
      m.role === "assistant" && m.content.length > LIMITS.maxAssistantChars
        ? { ...m, content: m.content.slice(0, LIMITS.maxAssistantChars) }
        : m
    );

  if (list.length > LIMITS.maxMessages) list = list.slice(-LIMITS.maxMessages);

  const total = () => list.reduce((sum, m) => sum + m.content.length, 0);
  while (list.length > 1 && total() > LIMITS.maxTotalChars) list.shift();
  return list;
}

/** Incremental parser for newline-delimited JSON streamed by the server. */
export function createNdjsonParser() {
  let buffer = "";
  const parseLines = (lines) => lines.filter(Boolean).map((line) => JSON.parse(line));
  return {
    push(text) {
      buffer += text;
      const lines = buffer.split("\n");
      buffer = lines.pop();
      return parseLines(lines.map((l) => l.trim()));
    },
    flush() {
      const rest = buffer.trim();
      buffer = "";
      return rest ? parseLines([rest]) : [];
    },
  };
}

// The server normally answers with JSON. Anything else comes from the hosting layer, not the Tutor itself.
function unreadableFailure(status) {
  if (status === 404) return "The AI Tutor service was not found at this website address (error 404). The site owner should check the deployment.";
  if (status === 401 || status === 403) return `The website's host blocked the AI Tutor request (error ${status}). If this is a Vercel Preview, Deployment Protection may be on; ask the site owner.`;
  if (status >= 500) return `The AI Tutor service crashed or timed out (error ${status}). Please try again; if it keeps happening the site owner should check the Vercel function logs.`;
  return `The AI Tutor is unavailable right now (error ${status}).`;
}

function badResponse() {
  return new TutorApiError("The AI Tutor sent an unreadable answer. Please try again.", {
    code: "bad_response",
  });
}

/**
 * Sends the conversation to /api/tutor and yields stream events:
 *   { type: "delta", text }  and finally  { type: "done", finishReason }.
 * Throws TutorApiError for server/network problems (messages are student-friendly).
 * An aborted request throws the browser's AbortError.
 */
export async function* streamTutorReply({
  messages,
  subject,
  classLevel,
  language,
  getToken,
  signal,
  fetchImpl,
}) {
  let token;
  try {
    token = await getToken();
  } catch (e) {
    throw new TutorApiError("Please sign in again to use the AI Tutor.", {
      code: "unauthenticated",
      status: 401,
    });
  }

  const doFetch = fetchImpl || ((...args) => fetch(...args));
  let response;
  try {
    response = await doFetch(TUTOR_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messages: prepareMessages(messages), subject, classLevel, language }),
      signal,
    });
  } catch (e) {
    if (e && e.name === "AbortError") throw e;
    throw new TutorApiError(
      "Could not reach the AI Tutor. Please check your internet connection and try again.",
      { code: "network" }
    );
  }

  if (!response.ok) {
    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
    const retry = Number(response.headers && response.headers.get && response.headers.get("Retry-After"));
    throw new TutorApiError(
      (data && data.error) || unreadableFailure(response.status),
      {
        code: (data && data.code) || "http_error",
        status: response.status,
        retryAfter: Number.isFinite(retry) && retry > 0 ? retry : null,
      }
    );
  }

  const parser = createNdjsonParser();
  let finished = false;

  const handle = function* handle(events) {
    for (const event of events) {
      if (event.type === "error") {
        throw new TutorApiError(event.message || "The AI Tutor had a problem. Please try again.", {
          code: event.code || "stream_error",
        });
      }
      if (event.type === "done") finished = true;
      yield event;
    }
  };
  const safeParse = (fn) => {
    try {
      return fn();
    } catch (e) {
      if (e instanceof TutorApiError) throw e;
      throw badResponse();
    }
  };

  if (!response.body || typeof response.body.getReader !== "function") {
    // Very old browsers: read the whole answer at once.
    const text = await response.text();
    yield* handle(safeParse(() => [...parser.push(text), ...parser.flush()]));
  } else {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        yield* handle(safeParse(() => parser.push(decoder.decode(value, { stream: true }))));
      }
      yield* handle(safeParse(() => parser.flush()));
    } finally {
      try {
        reader.releaseLock();
      } catch (e) {
        // Reader already released; nothing to do.
      }
    }
  }

  if (!finished) {
    throw new TutorApiError("The answer was interrupted. Please try again.", { code: "interrupted" });
  }
}

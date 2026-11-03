import { TextDecoder as NodeTextDecoder } from "util";
import { LIMITS } from "./constants";
import { TutorApiError, createNdjsonParser, prepareMessages, streamTutorReply } from "./tutorApi";

if (typeof global.TextDecoder === "undefined") global.TextDecoder = NodeTextDecoder;

const collect = async (iterable) => {
  const out = [];
  for await (const event of iterable) out.push(event);
  return out;
};

const okResponse = (text) => ({ ok: true, status: 200, body: null, text: async () => text });

const baseArgs = (fetchImpl) => ({
  messages: [{ role: "user", content: "What is velocity?" }],
  subject: "physics",
  classLevel: "11",
  language: "hinglish",
  getToken: async () => "id-token",
  fetchImpl,
});

describe("prepareMessages", () => {
  test("keeps only role/content, trims, and drops empty or unknown messages", () => {
    const result = prepareMessages([
      { role: "user", content: "  hello  ", id: "x", createdAt: 1 },
      { role: "system", content: "ignore me" },
      { role: "assistant", content: "   " },
      null,
    ]);
    expect(result).toEqual([{ role: "user", content: "hello" }]);
  });

  test("keeps only the most recent messages when there are too many", () => {
    const many = Array.from({ length: LIMITS.maxMessages + 5 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `m${i}`,
    }));
    const result = prepareMessages(many);
    expect(result).toHaveLength(LIMITS.maxMessages);
    expect(result[result.length - 1].content).toBe(`m${many.length - 1}`);
  });

  test("stays under the total character limit by dropping the oldest messages", () => {
    const big = "a".repeat(LIMITS.maxAssistantChars);
    const result = prepareMessages([
      { role: "user", content: "first" },
      { role: "assistant", content: big },
      { role: "user", content: "b".repeat(LIMITS.maxUserChars) },
      { role: "assistant", content: big },
      { role: "user", content: "last question" },
    ]);
    const total = result.reduce((n, m) => n + m.content.length, 0);
    expect(total).toBeLessThanOrEqual(LIMITS.maxTotalChars);
    expect(result[result.length - 1].content).toBe("last question");
  });
});

describe("createNdjsonParser", () => {
  test("handles events split across chunks", () => {
    const parser = createNdjsonParser();
    expect(parser.push('{"type":"delta","te')).toEqual([]);
    expect(parser.push('xt":"Hi"}\n{"type":"done"')).toEqual([{ type: "delta", text: "Hi" }]);
    expect(parser.push("}\n")).toEqual([{ type: "done" }]);
    expect(parser.flush()).toEqual([]);
  });

  test("flush returns a final line without a trailing newline", () => {
    const parser = createNdjsonParser();
    parser.push('{"type":"done"}');
    expect(parser.flush()).toEqual([{ type: "done" }]);
  });
});

describe("streamTutorReply", () => {
  test("sends the Firebase token and request fields, and yields deltas then done", async () => {
    const fetchImpl = jest.fn(async () =>
      okResponse('{"type":"delta","text":"Speed has "}\n{"type":"delta","text":"direction? No."}\n{"type":"done","finishReason":"stop"}\n')
    );
    const events = await collect(streamTutorReply(baseArgs(fetchImpl)));

    expect(events.map((e) => e.type)).toEqual(["delta", "delta", "done"]);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toMatch(/\/api\/tutor$/);
    expect(init.headers.Authorization).toBe("Bearer id-token");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ subject: "physics", classLevel: "11", language: "hinglish" });
    expect(body.messages).toEqual([{ role: "user", content: "What is velocity?" }]);
  });

  test("reads a streamed body chunk by chunk", async () => {
    const encoder = new (global.TextEncoder || require("util").TextEncoder)();
    const chunks = [
      encoder.encode('{"type":"delta","text":"A"}\n{"type":"de'),
      encoder.encode('lta","text":"B"}\n{"type":"done","finishReason":"stop"}\n'),
    ];
    let i = 0;
    const response = {
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: async () => (i < chunks.length ? { done: false, value: chunks[i++] } : { done: true }),
          releaseLock: () => {},
        }),
      },
    };
    const events = await collect(streamTutorReply(baseArgs(async () => response)));
    expect(events.filter((e) => e.type === "delta").map((e) => e.text)).toEqual(["A", "B"]);
  });

  test("turns a server error response into a TutorApiError with its message and Retry-After", async () => {
    const response = {
      ok: false,
      status: 429,
      headers: { get: (name) => (name === "Retry-After" ? "30" : null) },
      json: async () => ({ error: "You are sending questions too quickly.", code: "rate_limited" }),
    };
    await expect(collect(streamTutorReply(baseArgs(async () => response)))).rejects.toMatchObject({
      name: "TutorApiError",
      code: "rate_limited",
      status: 429,
      retryAfter: 30,
      message: "You are sending questions too quickly.",
    });
  });

  test("reports an error event sent in the middle of the stream", async () => {
    const response = okResponse('{"type":"delta","text":"Par"}\n{"type":"error","code":"timeout","message":"The AI took too long."}\n');
    await expect(collect(streamTutorReply(baseArgs(async () => response)))).rejects.toMatchObject({
      code: "timeout",
      message: "The AI took too long.",
    });
  });

  test("fails when the stream ends without a done event", async () => {
    const response = okResponse('{"type":"delta","text":"Cut off"}\n');
    await expect(collect(streamTutorReply(baseArgs(async () => response)))).rejects.toMatchObject({
      code: "interrupted",
    });
  });

  test("gives a friendly error when the network is down", async () => {
    const fetchImpl = async () => {
      throw new TypeError("Failed to fetch");
    };
    await expect(collect(streamTutorReply(baseArgs(fetchImpl)))).rejects.toMatchObject({ code: "network" });
  });

  test("lets an aborted request surface as AbortError", async () => {
    const fetchImpl = async () => {
      const e = new Error("aborted");
      e.name = "AbortError";
      throw e;
    };
    await expect(collect(streamTutorReply(baseArgs(fetchImpl)))).rejects.toMatchObject({ name: "AbortError" });
  });

  test("asks the student to sign in again when the token cannot be obtained", async () => {
    const args = { ...baseArgs(jest.fn()), getToken: async () => Promise.reject(new Error("expired")) };
    await expect(collect(streamTutorReply(args))).rejects.toBeInstanceOf(TutorApiError);
    await expect(collect(streamTutorReply(args))).rejects.toMatchObject({ code: "unauthenticated" });
  });

  test("rejects unreadable server output", async () => {
    const response = okResponse("this is not json\n");
    await expect(collect(streamTutorReply(baseArgs(async () => response)))).rejects.toMatchObject({
      code: "bad_response",
    });
  });
});

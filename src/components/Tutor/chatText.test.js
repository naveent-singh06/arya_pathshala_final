import {
  buildSearchText,
  filterChats,
  formatRelativeTime,
  friendlyFirestoreError,
  makePreview,
  makeTitle,
  normalizeMath,
} from "./chatText";

describe("makeTitle / makePreview", () => {
  test("makeTitle collapses whitespace, truncates long text and has a fallback", () => {
    expect(makeTitle("  What   is\n photosynthesis? ")).toBe("What is photosynthesis?");
    expect(makeTitle("")).toBe("New chat");
    const long = makeTitle("x".repeat(200));
    expect(long.length).toBeLessThanOrEqual(60);
    expect(long.endsWith("...")).toBe(true);
  });

  test("makePreview strips markdown symbols and replaces code blocks", () => {
    expect(makePreview("## Answer\n**Use** `F = ma`")).toBe("Answer Use F = ma");
    expect(makePreview("Here:\n```python\nprint(1)\n```\nDone")).toBe("Here: [code] Done");
    expect(makePreview("y".repeat(500)).length).toBeLessThanOrEqual(140);
  });
});

describe("search", () => {
  test("buildSearchText keeps only the most recent 2000 characters", () => {
    const text = buildSearchText("a".repeat(1990), "b".repeat(100));
    expect(text.length).toBe(2000);
    expect(text.endsWith("b")).toBe(true);
  });

  test("filterChats matches title, preview and earlier questions, ignoring case", () => {
    const chats = [
      { id: "1", title: "Newton's laws", preview: "Force equals mass times acceleration", searchText: "" },
      { id: "2", title: "Cells", preview: "", searchText: "explain MITOCHONDRIA function" },
    ];
    expect(filterChats(chats, "newton").map((c) => c.id)).toEqual(["1"]);
    expect(filterChats(chats, "acceleration").map((c) => c.id)).toEqual(["1"]);
    expect(filterChats(chats, "mitochondria").map((c) => c.id)).toEqual(["2"]);
    expect(filterChats(chats, "   ")).toHaveLength(2);
    expect(filterChats(chats, "zzz")).toHaveLength(0);
  });
});

describe("normalizeMath", () => {
  test("converts \\( \\) and \\[ \\] to dollar delimiters", () => {
    expect(normalizeMath("Speed is \\(v = d/t\\).")).toBe("Speed is $v = d/t$.");
    expect(normalizeMath("So:\\[ x^2 = 4 \\]")).toContain("$$\nx^2 = 4\n$$");
  });

  test("does not touch code", () => {
    const code = "Use `\\(x\\)` and\n```\n\\[y\\]\n```";
    expect(normalizeMath(code)).toBe(code);
  });
});

describe("formatRelativeTime", () => {
  const now = Date.UTC(2026, 10, 4, 12, 0, 0);
  test("formats recent times", () => {
    expect(formatRelativeTime(now - 10 * 1000, now)).toBe("Just now");
    expect(formatRelativeTime(now - 5 * 60 * 1000, now)).toBe("5 min ago");
    expect(formatRelativeTime(now - 3 * 60 * 60 * 1000, now)).toBe("3 hr ago");
    expect(formatRelativeTime(now - 2 * 24 * 60 * 60 * 1000, now)).toBe("2 d ago");
    expect(formatRelativeTime(null, now)).toBe("");
  });
});

describe("friendlyFirestoreError", () => {
  test("maps known Firestore codes to student-friendly text", () => {
    expect(friendlyFirestoreError({ code: "permission-denied" })).toMatch(/security rules/);
    expect(friendlyFirestoreError({ code: "unavailable" })).toMatch(/offline/);
    expect(friendlyFirestoreError(new Error("boom"))).toMatch(/try again/);
  });
});

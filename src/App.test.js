import options from "./components/Tutor/tutorOptions.json";
import { DEFAULT_SETTINGS, SUGGESTIONS } from "./components/Tutor/constants";

// The default Create React App test ("renders learn react link") could never pass:
// this app has no such text, and rendering <App /> needs a live Firebase configuration.
// These checks cover the shared AI Tutor settings used by both the website and the API.
describe("AI Tutor settings", () => {
  test("the defaults are valid options", () => {
    expect(options.subjects.map((o) => o.value)).toContain(DEFAULT_SETTINGS.subject);
    expect(options.levels.map((o) => o.value)).toContain(DEFAULT_SETTINGS.classLevel);
    expect(options.languages.map((o) => o.value)).toContain(DEFAULT_SETTINGS.language);
  });

  test("every subject has starter questions", () => {
    options.subjects.forEach((s) => {
      expect(SUGGESTIONS[s.value]).toBeDefined();
      expect(SUGGESTIONS[s.value].length).toBeGreaterThan(0);
    });
  });

  test("Hindi, English and Hinglish are all supported", () => {
    const languages = options.languages.map((o) => o.value);
    expect(languages).toEqual(expect.arrayContaining(["hindi", "english", "hinglish"]));
  });
});

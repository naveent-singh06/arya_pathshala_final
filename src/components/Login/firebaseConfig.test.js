import { REQUIRED_FIREBASE_VARS, getMissingFirebaseVars } from "./firebaseConfig";

const complete = {
  apiKey: "k",
  authDomain: "d.firebaseapp.com",
  projectId: "p",
  appId: "a",
};

describe("getMissingFirebaseVars", () => {
  test("returns nothing when every required setting is present", () => {
    expect(getMissingFirebaseVars(complete)).toEqual([]);
  });

  test("lists the environment variable NAME of each missing or blank setting", () => {
    expect(getMissingFirebaseVars({ ...complete, apiKey: undefined, appId: "   " })).toEqual([
      "REACT_APP_FIREBASE_API_KEY",
      "REACT_APP_FIREBASE_APP_ID",
    ]);
  });

  test("reports everything missing for an empty configuration (the broken Preview case)", () => {
    expect(getMissingFirebaseVars({})).toEqual(REQUIRED_FIREBASE_VARS.map(([, name]) => name));
    expect(getMissingFirebaseVars(undefined)).toHaveLength(REQUIRED_FIREBASE_VARS.length);
  });

  test("optional settings are not required", () => {
    expect(getMissingFirebaseVars({ ...complete, storageBucket: undefined, measurementId: "" })).toEqual([]);
  });
});

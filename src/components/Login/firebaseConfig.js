// Which Firebase settings the app cannot start without, and the environment
// variable that supplies each one. (The other REACT_APP_FIREBASE_* values are optional.)
export const REQUIRED_FIREBASE_VARS = [
  ["apiKey", "REACT_APP_FIREBASE_API_KEY"],
  ["authDomain", "REACT_APP_FIREBASE_AUTH_DOMAIN"],
  ["projectId", "REACT_APP_FIREBASE_PROJECT_ID"],
  ["appId", "REACT_APP_FIREBASE_APP_ID"],
];

/** Returns the names of the required environment variables that are missing or empty. */
export function getMissingFirebaseVars(config) {
  return REQUIRED_FIREBASE_VARS.filter(([key]) => {
    const value = config && config[key];
    return value === undefined || value === null || String(value).trim() === "";
  }).map(([, envName]) => envName);
}

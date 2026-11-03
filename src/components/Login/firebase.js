import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMissingFirebaseVars } from "./firebaseConfig";

// Values come from the REACT_APP_FIREBASE_* environment variables (unchanged).
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// If the settings are missing (for example a deployment built without its environment
// variables), Firebase must not crash the whole website at start-up. Instead `auth` and `db`
// are null and `firebaseConfigError` says what is wrong, so public pages still open and the
// pages that need sign-in can show a clear message.
let auth = null;
let db = null;
let firebaseConfigError = null;

const missing = getMissingFirebaseVars(firebaseConfig);

if (missing.length > 0) {
  firebaseConfigError = {
    missing,
    message: "Sign-in is not available because this website's Firebase settings are missing.",
  };
  // Names only - never values.
  console.warn(`[ARYA PATHSHALA] Firebase is not configured. Missing environment variables: ${missing.join(", ")}`);
} else {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app); // Used by the AI Tutor for chat history
  } catch (error) {
    auth = null;
    db = null;
    firebaseConfigError = {
      missing: [],
      message: "Sign-in is not available because Firebase could not start with this website's settings.",
    };
    console.error("[ARYA PATHSHALA] Firebase failed to start:", (error && error.code) || (error && error.message));
  }
}

export { auth, db, firebaseConfigError };

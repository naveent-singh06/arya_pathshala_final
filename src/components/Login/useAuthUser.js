import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

/**
 * The signed-in Firebase user (or null). Unlike useAuthState(auth), this does not crash
 * when Firebase is not configured: the user is simply null, so public pages keep working.
 */
export default function useAuthUser() {
  const [user, setUser] = useState(auth ? auth.currentUser : null);

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, setUser);
  }, []);

  return user;
}

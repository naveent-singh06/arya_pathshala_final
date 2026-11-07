import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, firebaseConfigError } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  getIdTokenResult,
  signOut,
} from "firebase/auth";
import { useUser } from "../../UserContext";
import styles from "./Login.module.css";

const getLoginError = (code) => {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email or password is incorrect. Please check and try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your internet connection and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact the administrator.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled in Firebase Authentication.";
    default:
      return "Login failed. Please try again.";
  }
};

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const { setIsAdmin } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth) return undefined;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const finishLogin = async (signedInUser) => {
    let admin = false;
    try {
      const tokenResult = await getIdTokenResult(signedInUser, true);
      admin = tokenResult.claims.admin === true;
    } catch (tokenError) {
      console.error("[ARYA PATHSHALA] Could not verify admin claim:", tokenError.code || tokenError.message);
    }
    setIsAdmin(admin);
    navigate(admin ? "/dashboardadmin" : "/");
  };

  const handleGoogleLogin = async () => {
    if (!auth) {
      setError(firebaseConfigError?.message || "Sign-in is not available right now.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await finishLogin(result.user);
    } catch (loginError) {
      setError(getLoginError(loginError.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter both your email address and password.");
      return;
    }
    if (!auth) {
      setError(firebaseConfigError?.message || "Sign-in is not available right now.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        username.trim(),
        password
      );
      await finishLogin(credential.user);
    } catch (loginError) {
      setError(getLoginError(loginError.code));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => navigate("/register");

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    navigate("/login");
  };

  return (
    <div className={styles.page}>
      <div className={styles.loginContainer}>
        <h1>Log in with</h1>
        {!user ? (
          <>
            {firebaseConfigError && (
              <p className={styles.error} role="alert">
                {firebaseConfigError.message} Please contact the site administrator.
              </p>
            )}
            <div className={styles.socialLoginContainer}>
              <button type="button" onClick={handleGoogleLogin} className={styles.googleLoginBtn} disabled={loading}>Google</button>
              <button type="button" className={styles.appleLoginBtn} disabled>Apple</button>
            </div>
            <p className={styles.or}>or</p>
            <form onSubmit={handleSubmit} className={styles.loginForm}>
              <div className={styles.formGroup}>
                <label htmlFor="username">Email address</label>
                <input
                  type="email"
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>
            <p className={styles.switchLine}>
              Don't have an account?{" "}
              <span
                role="link"
                tabIndex={0}
                onClick={handleRegister}
                onKeyDown={(e) => { if (e.key === "Enter") handleRegister(); }}
              >
                Sign up
              </span>
            </p>
          </>
        ) : (
          <div>
            <p>Welcome, {user.email}</p>
            <button onClick={handleLogout} className={styles.submitBtn}>Logout</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

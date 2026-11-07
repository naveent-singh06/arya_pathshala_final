import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, firebaseConfigError } from "./firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { authErrorMessage } from "./authErrors";
import styles from "./Login.module.css";

// Signing in only authenticates with Firebase. Where the person lands (admin dashboard or student
// dashboard) is decided afterwards by App.js from the verified `admin` claim, never from this page.
const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const unavailable = () => {
    setError(firebaseConfigError ? firebaseConfigError.message : "Sign-in is not available right now.");
  };

  const handleGoogleLogin = async () => {
    if (busy) return;
    if (!auth) return unavailable();
    setBusy(true);
    setError("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!username.trim() || !password) return setError("Please enter your email address and password.");
    if (!auth) return unavailable();
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, username.trim(), password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = () => {
    navigate("/register");
  };

  return (
    <div className={styles.page}>
      <div className={styles.loginContainer}>
        <h1>Log in with</h1>
        <>
            {firebaseConfigError && (
              <p className={styles.error} role="alert">
                {firebaseConfigError.message} Please contact the site administrator.
              </p>
            )}
            <div className={styles.socialLoginContainer}>
              <button type="button" disabled={busy} onClick={handleGoogleLogin} className={styles.googleLoginBtn}>Google</button>
              <button type="button" disabled title="Apple sign-in is not available yet" className={styles.appleLoginBtn}>Apple</button>
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
                />
              </div>


              {error && <p className={styles.error} role="alert">{error}</p>}
              <button type="submit" disabled={busy} className={styles.submitBtn}>{busy ? "Signing in..." : "Log In"}</button>
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
      </div>
    </div>
  );
};

export default Login;

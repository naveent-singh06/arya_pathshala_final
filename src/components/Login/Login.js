import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, firebaseConfigError } from "./firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { useUser } from "../../UserContext"; // Import global context
import styles from "./Login.module.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("student"); // Default role: student
  const { setIsAdmin } = useUser(); // Use global context
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    if (!auth) {
      setError(firebaseConfigError ? firebaseConfigError.message : "Sign-in is not available right now.");
      return;
    }
    const provider = new GoogleAuthProvider();
    try { 
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      // Admin status comes from the signed `admin` claim (App.js listens for it), never from an email address.
      // Force one token refresh right after sign-in so a freshly granted claim is picked up.
      let admin = false;
      try {
        admin = (await getIdTokenResult(user, true)).claims.admin === true;
      } catch (e) {
        admin = false;
      }
      setIsAdmin(admin);

      setUser(user);
      navigate(admin ? "/dashboardadmin" : "/");
    } catch (error) {
      setError(error.message);
    }
  };
  

  useEffect(() => {
    if (!auth) return undefined; // Firebase not configured: nobody can be signed in
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields");
    } else {
      setError("");
      
      // This form does not sign anyone in, so it must never grant admin: admin comes only from the verified claim.
      alert("Login successful!");
      navigate("/");
    }
  };

  const handleRegister = () => {
    navigate("/register");
  };

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
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
              <button onClick={handleGoogleLogin} className={styles.googleLoginBtn}>Google</button>
              <button className={styles.appleLoginBtn}>Apple</button>
            </div>
            <p className={styles.or}>or</p>
            <form onSubmit={handleSubmit} className={styles.loginForm}>
              <div className={styles.formGroup}>
                <label htmlFor="username">Email address</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Dropdown for selecting user role */}
              <div className={styles.formGroup}>
                <label htmlFor="role">Log in as?</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={styles.dropdown}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className={styles.submitBtn}>Log In</button>
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

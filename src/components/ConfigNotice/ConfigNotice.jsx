import { Link } from "react-router-dom";
import { firebaseConfigError } from "../Login/firebase";
import styles from "./ConfigNotice.module.css";

/**
 * Shown instead of a sign-in dependent page (login, dashboards, AI Tutor) when Firebase is
 * not configured on this deployment. Lists variable NAMES only, never values.
 */
export default function ConfigNotice({ page = "This page" }) {
  const missing = (firebaseConfigError && firebaseConfigError.missing) || [];

  return (
    <div className={styles.wrap}>
      <div className={styles.card} role="alert">
        <div className={styles.brand}>ARYA PATHSHALA</div>
        <h1>{page} is not available yet</h1>
        <p>
          Sign-in, the dashboards and the AI Tutor need this website's Firebase settings, and they are not configured
          on this deployment. The rest of the website works normally.
        </p>
        <p className={styles.admin}>
          <strong>For the site administrator:</strong>{" "}
          {missing.length > 0 ? (
            <>
              add these environment variables in Vercel (Project Settings, Environment Variables, enabled for this
              environment) and redeploy:
            </>
          ) : (
            <>check that the Firebase environment variables in Vercel are correct and redeploy.</>
          )}
        </p>
        {missing.length > 0 && (
          <ul className={styles.list}>
            {missing.map((name) => (
              <li key={name}>
                <code>{name}</code>
              </li>
            ))}
          </ul>
        )}
        <Link to="/" className={styles.home}>
          Back to the homepage
        </Link>
      </div>
    </div>
  );
}

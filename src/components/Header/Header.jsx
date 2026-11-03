import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../Login/firebase"; 
import styles from "./Header.module.css";  
import defaultAvatar from "./avatar-icon.png"; // Ensure this path is correct

const Header = ({ user }) => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleHomeClick = () => {
    navigate("/");
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  console.log("User in Header:", user);

  return (
    <header className={styles.header}>
      {/* Logo with Home navigation */}
      <div className={`${styles.logo} ${styles.clickable}`} onClick={handleHomeClick}>
        ARYA PATHSHALA
      </div>

      {/* Navigation Links */}
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          <li className={styles.navItem}>
            <Link to="/" className={styles.navLink}>Home</Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/features" className={styles.navLink}>Features</Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/tutor" className={styles.navLink}>AI Tutor</Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/testimonials" className={styles.navLink}>Testimonials</Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/about" className={styles.navLink}>About</Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/contact" className={styles.navLink}>Contact</Link>
          </li>
        </ul>
      </nav>

      {/* User Profile or Login Button */}
      {user === undefined ? null : user ? (
        <div className={styles.userInfo}>
          <img 
            src={user.photoURL || defaultAvatar} 
            alt="User Profile" 
            className={styles.profilePic} 
            onError={(e) => e.target.src = defaultAvatar} // Fallback image if loading fails
          />
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <button className={styles.loginBtn} onClick={handleLoginClick}>
          Register / Login
        </button>
      )}
    </header>
  );
};

export default Header;

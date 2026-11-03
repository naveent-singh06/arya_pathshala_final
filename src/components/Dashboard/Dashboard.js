import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";
import { auth } from "../Login/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import defaultAvatar from "./Media/avatar-icon.png";
import faceDetFeature1 from "./Media/face-det-feature1.png";
import Planner from "./Media/planner.jpg";
import Attendance from "../DashboardAdmin/Media/attendance-record.png";
import Classroom from "../DashboardAdmin/Media/classroom.png";
import dashboardICO from "./Media/dashboard-icon.png";
import homeICO from "./Media/homepage-icon.png";
import pricingICO from "./Media/pricing-icon.png";
import featureICO from "./Media/features-icon.png";
import contactICO from "./Media/contact-icon.png"

const Dashboard = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleSignOut = () => {
    auth.signOut();
    navigate("/");
  };

  return (
    <div className={styles.dashboard}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <a href="/">
        <div className={styles.logo}>ARYA PATHSHALA</div>
        </a>
        <hr style={{width:"100%"}}></hr>
        <nav className={styles.nav}>
          <ul>
            <li className={styles.active}>
              <img src={dashboardICO} alt="Dashboard" className={styles.icon} /> Dashboard
            </li>
            <li>
              <a href="/">
                <img style={{ marginTop: "-2px" }} src={homeICO} alt="Homepage" className={styles.icon} /> Homepage
              </a>
            </li>
            <li>
            <a href="/testimonials">
                <img style={{ marginLeft: "-3px", marginTop: "-2px", height:"30px", width:"30px" }} src={pricingICO} alt="pricing" className={styles.icon} /> Testimonials
              </a>
            </li>
            <li>
              <a href="/">
                <img style={{ marginTop: "-2px" }} src={featureICO} alt="features" className={styles.icon} /> Features
              </a>
            </li>
            <li>
              <a href="/">
                <img style={{ marginTop: "-1px" }} src={contactICO} alt="Contact Us" className={styles.icon} /> Contact Us
              </a>
            </li>
            <li>
              <a href="/tutor">
                <img style={{ marginTop: "-1px" }} src={Classroom} alt="AI Tutor" className={styles.icon} /> AI Tutor
              </a>
            </li>
          </ul>
        </nav>
        <div style={{marginLeft:"10px"}}><button onClick={handleSignOut} className={styles.signOutButton}>Sign Out</button></div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.topBar}>
          <h1>Dashboard</h1>
          <div className={styles.userInfo}>
          <img 
            src={user?.photoURL || defaultAvatar} 
            alt="Avatar" 
            className={styles.avatar} 
            onError={(e) => e.target.src = defaultAvatar} // Fallback if the image fails to load
          />
          <div className={styles.userName}>{user?.displayName || "Guest"}</div>
          </div>
        </div>


        {/* Feature Cards */}
        <div className={styles.grid}>
<a href="/tutor">
  <div className={`${styles.card} ${styles.fullWidth}`}>
    <img src={Classroom} alt="AI Tutor" className={styles.cardImage} />
    <div className={styles.cardContent}>
      <h2 style={{ fontSize: "2rem" }}>AI Tutor</h2>
      <p>Ask doubts in English, Hindi or Hinglish and get</p>
      <p>step-by-step explanations for Class 9-12, NEET and JEE.</p>
      <p>‎ </p>
      <p className={styles.rightArrow}>→</p>
    </div>
  </div>
</a>

        <a href="/facerecog">
  <div className={styles.card}>
    <img src={faceDetFeature1} alt="Face Recognition" className={styles.cardImage} />
    <div className={styles.cardContent}>
      <h2 style={{ fontSize: "2rem" }}>Face Recognition</h2>
      <p>Automatically detect and recognize faces in</p>
      <p>real-time using AI-powered image processing.</p>
      <p>‎ </p>
      <p className={styles.rightArrow}>→</p>
    </div>
  </div>
</a>

<a href="/planner">
  <div className={styles.card}>
    <img src={Planner} alt="Study Planner" className={styles.cardImage} />
    <div className={styles.cardContent}>
      <h2 style={{ fontSize: "2rem" }}>Study Planner</h2>
      <p>Organize your study schedule efficiently</p>
      <p>with AI-driven planning tools and reminders.</p>
      <p>‎ </p>
      <p className={styles.rightArrow}>→</p>
    </div>
  </div>
</a>

<a href="/personalattendance">
  <div className={`${styles.card} ${styles.fullWidth}`}>
    <img src={Attendance} alt="Personal Attendance" className={styles.cardImage} />
    <div className={styles.cardContent}>
      <h2 style={{ fontSize: "2rem" }}>Personal Attendance Record</h2>
      <p>Keep track of your attendance records</p>
      <p>effortlessly with automated logging.</p>
      <p>‎ </p>
      <p className={styles.rightArrow}>→</p>
    </div>
  </div>
</a>

<a href="/schedule">
  <div className={`${styles.card} ${styles.fullWidth}`}>
    <img src={Classroom} alt="Class Schedule" className={styles.cardImage} />
    <div className={styles.cardContent}>
      <h2 style={{ fontSize: "2rem" }}>Class Schedule</h2>
      <p>View and manage your daily, weekly, or monthly</p>
      <p>class schedule in one place.</p>
      <p>‎ </p>
      <p className={styles.rightArrow}>→</p>
    </div>
  </div>
</a>

        </div>

        <footer className={styles.footer}>
          <p>© 2025, Made with Passion ✊ by Team Digi Dynamos</p>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;

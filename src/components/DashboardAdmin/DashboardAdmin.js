import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DashboardAdmin.module.css";
import { auth } from "../Login/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import defaultAvatar from "./Media/avatar-icon.png";
import faceDetFeature1 from "./Media/face-det-feature1.png";
import attendanceRecord from "./Media/attendance-record.png";
import gradingAssistant from "./Media/grading-assistant.jpg";
import Classroom from "./Media/classroom.png";
import dashboardICO from "./Media/dashboard-icon.png";
import homeICO from "./Media/homepage-icon.png";
import pricingICO from "./Media/pricing-icon.png";
import featureICO from "./Media/features-icon.png";
import contactICO from "./Media/contact-icon.png";
import Class from "./Media/class.png";

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
                <img style={{ marginLeft: "-5px", marginTop: "-2px", height:"30px", width:"30px" }} src={pricingICO} alt="pricing" className={styles.icon} />Testimonials
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
              <a href="/schedule">
                <img style={{ marginTop: "-1px" }} src={Class} alt="Schedule" className={styles.icon} /> Class Schedule
              </a>
            </li>
          </ul>
        </nav>
        <div style={{marginLeft:"10px"}}><button onClick={handleSignOut} className={styles.signOutButton}>Sign Out</button></div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.topBar}>
          <h1>Admin Dashboard</h1>
          <h2 className={styles.adminLabel}>ADMIN</h2>
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
          <a href="/facerecog">
          <div className={styles.card} >
            <img src={faceDetFeature1} alt="Video Analysis" className={styles.cardImage} />
            <div className={styles.cardContent}>
              <h2 style={{fontSize:"2rem"}}>Face Recognition</h2>
              <p>Accurately identify individuals using AI-powered facial recognition and</p>
              <p>automate attendance marking with real-time face detection.</p>
              <p>‎ </p>
              <p className={styles.rightArrow}>→</p>
            </div>
          </div>
          </a>

          <a href="/attendance">
          <div className={styles.card}>
            <img src={attendanceRecord} alt="Article Analysis" className={styles.cardImage} />
            <div className={styles.cardContent}>
              <h2 style={{fontSize:"2rem"}}>Attendance Record</h2>
              <p>Maintain a secure, real-time record of student attendance and</p>
              <p>easily access and track attendance history for any class.</p>
              <p>‎ </p>
              <p className={styles.rightArrow}>→</p>
            </div>
          </div>
          </a>

          <a href="/assistant">
          <div className={`${styles.card} ${styles.fullWidth}`}>
            <img src={gradingAssistant} alt="News Summarizer" className={styles.cardImage} />
            <div className={styles.cardContent}>
              <h2 style={{fontSize:"2rem"}}>Grading Assistant</h2>
              <p>AI-powered grading for accurate assignment evaluation and</p>
              <p>provides instant feedback and ensures unbiased assessment.</p>
              <p>‎ </p>
              <p className={styles.rightArrow}>→</p>
            </div>
          </div>
          </a>

          <a href="/list">
          <div className={`${styles.card} ${styles.fullWidth}`}>
            <img src={Classroom} alt="News Summarizer" className={styles.cardImage} />
            <div className={styles.cardContent}>
              <h2 style={{fontSize:"2rem"}}>Class List</h2>
              <p>View and manage student rosters for different courses and</p>
              <p>keep track of enrolled students with an organized list.</p>
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

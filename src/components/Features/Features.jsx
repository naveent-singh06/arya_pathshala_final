import styles from "./Features.module.css";

const Features = () => {
  return (
    <section className={styles.features}>
      <h2 className={styles.sectionTitle}>Our Features</h2>
      <div className={styles.featuresGrid}>
        <div className={styles.featureCard}>
          <h3>Face Recognition Attendance</h3>
          <p>● Uses AI-powered face recognition to mark attendance automatically.</p>
          <p>● Eliminates manual roll calls, ensuring efficiency and accuracy.</p>
        </div>
        <div className={styles.featureCard}>
          <h3>Attendance Record</h3>
          <p>● View a detailed log of attendance records with timestamps.</p>
          <p>● Keeps track of present, absent, and late entries for better monitoring.</p>
        </div>
        <div className={styles.featureCard}>
          <h3>Grading AI Assistant</h3>
          <p>● Automatically evaluates assignments with detailed feedback.</p>
          <p>● Provides structured grading based on clarity, accuracy, and creativity.</p>
        </div>
        <div className={styles.featureCard}>
          <h3>Class List</h3>
          <p>● Manage and display a list of enrolled students for each class.</p>
          <p>● Allows easy tracking and updates of student details.</p>
        </div>
        <div className={styles.featureCard}>
          <h3>Class Schedule</h3>
          <p>● Access and manage a structured timetable for all classes.</p>
          <p>● Notifies students of upcoming lectures and schedule changes.</p>
        </div>
        <div className={styles.featureCard}>
          <h3>Personal Attendance Record</h3>
          <p>● Students can check their attendance history and trends.</p>
          <p>● Provides insights on attendance percentage and missed classes.</p>
        </div>
      </div>
    </section>
  );
};

export default Features;

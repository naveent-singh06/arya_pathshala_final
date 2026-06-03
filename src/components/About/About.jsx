import styles from "./About.module.css";

const AboutUs = () => {
  return (
    <section className={styles.about}>
      <h2 className={styles.sectionTitle}>About Us</h2>
      <p className={styles.aboutDescription}>
      NeuraClass is an advanced AI-powered platform for facial recognition attendance and academic management.
      Our goal is to streamline attendance tracking, automate grading, and enhance classroom efficiency through intelligent insights.
      Trusted by institutions worldwide, our technology ensures accuracy, reliability, and seamless academic management.
      </p>
    </section>
  );
};

export default AboutUs;

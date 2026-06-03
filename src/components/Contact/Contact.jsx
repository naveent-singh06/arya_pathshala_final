import styles from "./Contact.module.css";

const Contact = () => {
  return (
    <section className={styles.contact}>
      <h2 className={styles.sectionTitle}>Contact Us</h2>
      <p>Email: support@vigil.ai</p>
      <p>Phone: +91 98765 43210</p>
      <p>Address: 123 AI Street, Tech City, India</p>
    </section>
    
  );
};

export default Contact;

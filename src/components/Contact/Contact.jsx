import styles from "./Contact.module.css";
import SocialLinks from "../../cms/SocialLinks";
import { useSocialLinks } from "../../cms/hooks";
import { visibleLinks } from "../../cms/links";
import "../../styles/hub.css";

// Contact details come from the admin portal (Social Links & Contact). Nothing is hard-coded here.
const Contact = () => {
  const hasLinks = visibleLinks(useSocialLinks()).length > 0;
  return (
    <section className={styles.contact}>
      <h2 className={styles.sectionTitle}>Contact Us</h2>
      {hasLinks ? (
        <>
          <p>Reach Arya Pathshala here:</p>
          <SocialLinks withLabels />
        </>
      ) : (
        <p>Contact details are coming soon.</p>
      )}
    </section>
  );
};

export default Contact;

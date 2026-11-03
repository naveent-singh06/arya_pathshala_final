import React from "react";
import styles from "./Testimonials.module.css";

const testimonials = [
  {
    name: "Mathew",
    text: "This changed the way I work. It's amazing!",
    handle: "@heymatt_oo",
    imageSrc: "https://picsum.photos/100/100.webp?random=2",
  },
  {
    name: "Joshua",
    text: "Perfect for my needs. Highly recommend!",
    handle: "@joshua",
    imageSrc: "https://picsum.photos/100/100.webp?random=3",
  },
  {
    name: "Parl Coppa",
    text: "Absolutely love it. Never going back!",
    handle: "@coppalipse",
    imageSrc: "https://picsum.photos/100/100.webp?random=1",
  },
  {
    name: "Mandy",
    text: "Excellent tool! Super easy to use.",
    handle: "@mandy",
    imageSrc: "https://picsum.photos/100/100.webp?random=4",
  },
  {
    name: "Alex",
    text: "Simple, effective, and well-designed.",
    handle: "@alex",
    imageSrc: "https://picsum.photos/100/100.webp?random=5",
  },
  {
    name: "Sans",
    text: "Amazing and well-designed.",
    handle: "@ILoveBones",
    imageSrc: "https://picsum.photos/100/100.webp?random=5",
  },
];

const Testimonials = () => {
  return (
    <section className={styles.testimonialSection}>
      <h2 className={styles.title}>Don't take it from us</h2>
      <p className={styles.description}>
        See what our users have to say about ARYA PATHSHALA.
      </p>

      <div className={styles.grid}>
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className={`${styles.testimonialCard} ${
              testimonial.featured ? styles.featured : ""
            }`}
          >
            <img
              src={testimonial.imageSrc}
              alt={testimonial.name}
              className={styles.image}
            />
            <h3 className={styles.name}>{testimonial.name}</h3>
            <p className={styles.handle}>{testimonial.handle}</p>
            <p className={styles.text}>{testimonial.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;

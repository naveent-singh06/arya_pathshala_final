import styles from "./Herosection.module.css";
import { auth } from "../Login/firebase";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { useUser } from "../../UserContext"; // Import useUser hook
import Features from "../Features/Features";
import Testimonials from "../Testimonials/Testimonials";
import AboutUs from "../About/About";
import Contact from "../Contact/Contact";
import Footer from "../Footer/Footer";

const HeroSection = () => {
  const [isSignedIn] = useAuthState(auth);
  const { isAdmin } = useUser(); // Get isAdmin value from context
  const navigate = useNavigate();

  const handleGetStartedClick = () => {
    if (!isSignedIn) {
      navigate("/login");
    } else {
      navigate(isAdmin ? "/dashboardadmin" : "/dashboard");
    }
  };

  const handleGithubClick = () => {
    window.open("https://github.com/svsaurav95/Technovate/", "_blank");
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`${styles.hero} relative overflow-hidden pt-32 pb-24`}>
        <div className={styles.container}>
          <div className={`${styles.textCenter} animate-fade-in`}>
            <div className={styles.heroContainer}>
              <h1 className={`${styles.heroTitle} animate-title`}>
                Welcome to <span style={{ color: "rgb(0, 153, 255)" }}>ARYA PATHSHALA</span>
              </h1>
              <p className={`${styles.heroSubtitle} animate-subtitle`}>
                Advanced facial recognition and crowd analysis solutions
              </p>

              {/* Updated Get Started Button */}
              <div className={styles.buttonContainer}>
                <button className={styles.button} onClick={handleGetStartedClick}>
                  Get Started
                  <svg fill="currentColor" viewBox="0 0 24 24" className={styles.icon}>
                    <path
                      clipRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
                      fillRule="evenodd"
                    ></path>
                  </svg>
                </button>
                <button className={styles.Githubbutton} onClick={handleGithubClick}>
                  Star on Github
                  <svg fill="currentColor" viewBox="0 0 24 24" className={styles.icon}>
                    <path
                      clipRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
                      fillRule="evenodd"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wave Divider */}
      <div className={styles.waveDivider}>
        <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" className={styles.waveSvg}>
          <path
            fill="rgb(170, 221, 255)"
            fillOpacity="1"
            d="M0,224L48,218.7C96,213,192,203,288,186.7C384,171,480,149,576,165.3C672,181,768,235,864,245.3C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224V320H0Z"
          ></path>
        </svg>
      </div>

      {/* Our Features (Upside-Down Conical Shape) */}
      <div className={styles.belowWave}>
        <div className={styles.container}>
          <Features />
          <Testimonials />
          <AboutUs />
          <Contact />
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;

import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { auth } from "./components/Login/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Header from "./components/Header/Header";
import HeroSection from "./components/Herosection/Herosection";
import Dashboard from "./components/Dashboard/Dashboard";
import DashboardAdmin from "./components/DashboardAdmin/DashboardAdmin";
import Testimonials from "./components/Testimonials/Testimonials";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import About from "./components/About/About";
import Contact from "./components/Contact/Contact";
import Features from "./components/Features/Features";
import FaceRecog from "./components/Dashboard/FaceRecog/FaceRecog";
import PersonalAttendance from "./components/Dashboard/PersonalAttendance/PersonalAttendance";
import Attendance from "./components/DashboardAdmin/Attendance/Attendance";
import StudRegister from "./components/Dashboard/StudRegister/StudRegister";
import Planner from "./components/Dashboard/Planner/Planner";
import Schedule from "./components/Dashboard/Schedule/Schedule";
import Assistant from "./components/DashboardAdmin/Assistant/Assistant";
import List from "./components/DashboardAdmin/List/List";
import { UserProvider, useUser } from "./UserContext";
import Footer from "./components/Footer/Footer";

// Loaded on demand so the Markdown/math libraries don't slow down the other pages.
const Tutor = lazy(() => import("./components/Tutor/Tutor"));

const loadingStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  letterSpacing: "0.04em",
  color: "rgb(15, 69, 155)",
};

function App() {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
}

function AppContent() {
  const [user, setUser] = useState(undefined);
  const { isAdmin, setIsAdmin } = useUser(); // Get isAdmin from UserContext
  const location = useLocation();
  const showHeader = !["/dashboard", "/dashboardadmin", "/tutor"].includes(location.pathname);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("User state changed:", currentUser);
      setUser(currentUser || null);

      // Check if user is admin (Hardcoded Email)
      if (currentUser?.email === "suryanshhimalayan@gmail.com") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, [setIsAdmin]);

  if (user === undefined) return <div style={loadingStyle}>ARYA PATHSHALA</div>;

  return (
    <>
      {showHeader && <Header user={user} />}
      <Routes>
        <Route path="/" element={<HeroSection />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/dashboardadmin" element={user && isAdmin ? <DashboardAdmin /> : <Navigate to="/login" replace />} />
        <Route
          path="/tutor"
          element={
            user ? (
              <Suspense fallback={<div style={loadingStyle}>ARYA PATHSHALA</div>}>
                <Tutor user={user} isAdmin={isAdmin} />
              </Suspense>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/features" element={<Features />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/facerecog" element={<FaceRecog />} />
        <Route path="/personalattendance" element={<PersonalAttendance />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/studregister" element={<StudRegister />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/list" element={<List />} />
        <Route path="/footer" element={<Footer />} />
      </Routes>
    </>
  );
}

export default App;

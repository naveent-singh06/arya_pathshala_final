import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { auth, firebaseConfigError } from "./components/Login/firebase";
import ConfigNotice from "./components/ConfigNotice/ConfigNotice";
import { onAuthStateChanged } from "firebase/auth";
import Header from "./components/Header/Header";
import Home from "./pages/Home";
import CourseListing from "./pages/CourseListing";
import LearnLayout from "./components/learn/LearnLayout";
import Dashboard from "./pages/Dashboard";
import MyCourses from "./pages/MyCourses";
import Batches from "./pages/Batches";
import Progress from "./pages/Progress";
import Study from "./pages/Study";
import LecturesHub from "./pages/LecturesHub";
import TeacherList from "./pages/TeacherList";
import TeacherProfile from "./pages/TeacherProfile";
import StudyMaterial from "./pages/StudyMaterial";
import Practice from "./pages/Practice";
import Tests from "./pages/Tests";
import CourseDetails from "./pages/CourseDetails";
import CourseLectures from "./pages/CourseLectures";
import LecturePlayer from "./pages/LecturePlayer";
import NotFound from "./pages/NotFound";
import HubLayout from "./pages/hub/HubLayout";
import HubHome from "./pages/hub/HubHome";
import HubCourse from "./pages/hub/HubCourse";
import HubBatch from "./pages/hub/HubBatch";
import HubSubject from "./pages/hub/HubSubject";
import HubTopic from "./pages/hub/HubTopic";
import AdminLayout from "./admin/AdminLayout";
import AdminOverview from "./admin/Overview";
import AdminManager from "./admin/Manager";
import { ThemeProvider } from "./theme/ThemeContext";
import ThemePicker from "./theme/ThemePicker";
import GalaxyBackground from "./components/Galaxy/GalaxyBackground";
import FloatingSymbols from "./components/Galaxy/FloatingSymbols";
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
  color: "var(--ap-brand, rgb(15, 69, 155))",
};

// Pages that draw their own navigation (the learning sidebar, the AI Tutor, the admin dashboard).
const LEARN_PREFIXES = [
  "/dashboard", "/my-courses", "/batches", "/lectures", "/teachers", "/study", "/study-material",
  "/practice", "/tests", "/progress", "/course/", "/hub", "/admin",
];
function isOwnLayoutPath(pathname) {
  if (pathname === "/dashboardadmin" || pathname === "/tutor") return true;
  return LEARN_PREFIXES.some((prefix) => pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`));
}

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Router>
          <GalaxyBackground />
          <FloatingSymbols />
          <AppContent />
          <ThemePicker />
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const [user, setUser] = useState(undefined);
  const { isAdmin, setIsAdmin } = useUser(); // Get isAdmin from UserContext
  const location = useLocation();
  const showHeader = !isOwnLayoutPath(location.pathname);

  useEffect(() => {
    // Firebase not configured: nobody can be signed in, but the public site must still open.
    if (!auth) {
      setUser(null);
      setIsAdmin(false);
      return undefined;
    }
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

  // Signed-in-only pages: a config notice if Firebase is missing, a redirect to login otherwise.
  const needsLogin = (element, page) =>
    firebaseConfigError ? <ConfigNotice page={page} /> : user ? element : <Navigate to="/login" replace />;

  if (user === undefined) return <div style={loadingStyle}>ARYA PATHSHALA</div>;

  return (
    <>
      {showHeader && <Header user={user} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<CourseListing />} />
        <Route path="/courses/:categoryId" element={<CourseListing />} />
        <Route element={<LearnLayout />}>
          <Route element={<HubLayout />}>
            <Route path="/hub" element={<HubHome />} />
            <Route path="/hub/topic/:topicId" element={<HubTopic />} />
            <Route path="/hub/:classId" element={<HubCourse />} />
            <Route path="/hub/:classId/:batchId" element={<HubBatch />} />
            <Route path="/hub/:classId/:batchId/:subjectId" element={<HubSubject />} />
          </Route>
          <Route path="/dashboard" element={needsLogin(<Dashboard />, "The dashboard")} />
          <Route path="/my-courses" element={needsLogin(<MyCourses />, "My courses")} />
          <Route path="/progress" element={needsLogin(<Progress />, "Progress")} />
          <Route path="/study" element={<Study />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/lectures" element={<LecturesHub />} />
          <Route path="/teachers" element={<TeacherList />} />
          <Route path="/teachers/:teacherId" element={<TeacherProfile />} />
          <Route path="/study-material" element={<StudyMaterial />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/practice/:setId" element={<Practice />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/tests/:testId" element={<Tests />} />
          <Route path="/course/:courseId" element={<CourseDetails />} />
          <Route path="/course/:courseId/lectures" element={<CourseLectures />} />
          <Route path="/course/:courseId/lecture/:lectureId" element={<LecturePlayer />} />
        </Route>
        {/* Admin content portal: access is decided by the signed admin claim inside AdminLayout. */}
        <Route path="/admin/content" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path=":section" element={<AdminManager />} />
        </Route>
        <Route
          path="/dashboardadmin"
          element={
            firebaseConfigError ? (
              <ConfigNotice page="The admin dashboard" />
            ) : user && isAdmin ? (
              <DashboardAdmin />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/tutor"
          element={
            firebaseConfigError ? (
              <ConfigNotice page="The AI Tutor" />
            ) : user ? (
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;

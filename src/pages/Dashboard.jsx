import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ClipboardList, Sparkles, ListChecks, ScanFace, CalendarDays, NotebookPen, UserCheck } from 'lucide-react';
import { useLearn } from '../components/learn/LearnContext';
import { COURSES, getCourse, courseLectures, coursePath } from '../data/courses';
import { TEACHERS, getTeacher } from '../data/teachers';
import { TESTS } from '../data/practice';
import { featuredCourse } from '../data/continueLearning';
import { courseProgress } from '../data/learnerState';
import ContinueCard from '../components/learn/ContinueCard';
import RecentActivity from '../components/learn/RecentActivity';
import { Avatar, ProgressBar, DemoNote, EmptyState } from '../components/learn/shared';

const QUICK = [
  { to: '/study-material', label: 'Notes & PDFs', icon: FileText },
  { to: '/practice', label: 'DPP / Practice', icon: ClipboardList },
  { to: '/tests', label: 'Tests & Quizzes', icon: ListChecks },
  { to: '/tutor', label: 'AI Tutor', icon: Sparkles },
];

const TOOLS = [
  { to: '/facerecog', label: 'Face recognition', icon: ScanFace },
  { to: '/personalattendance', label: 'Personal attendance', icon: UserCheck },
  { to: '/planner', label: 'Planner', icon: NotebookPen },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
];

export default function Dashboard() {
  const { user, state } = useLearn();
  const name = (user && (user.displayName || user.email)) || 'Student';
  const enrolled = state.enrolled.map(getCourse).filter(Boolean);
  const featured = featuredCourse(state);
  const myTeacherIds = [...new Set(enrolled.flatMap((c) => c.subjects.map((s) => s.teacherId)))];
  const myTeachers = (myTeacherIds.length ? myTeacherIds : TEACHERS.map((t) => t.id)).map(getTeacher).filter(Boolean);
  const allLectures = enrolled.flatMap((c) => courseLectures(c));
  const overall = courseProgress(state, allLectures.map((l) => l.id));
  const upcoming = TESTS.filter((t) => !state.results[t.id]).slice(0, 3);

  return (
    <div className="ap-stack" style={{ gap: 22 }}>
      <section className="ap-card ap-welcome">
        <h1>Welcome, {name}</h1>
        <p>{enrolled.length ? 'Pick up where you left off.' : 'Enroll in a course to start tracking your progress.'}</p>
      </section>
      <DemoNote>Courses, lectures and quizzes here are sample content. Your progress is saved in this browser only, not on a server.</DemoNote>

      <div className="ap-stats">
        <div className="ap-card ap-stat"><strong>{enrolled.length}</strong><span>Enrolled courses</span></div>
        <div className="ap-card ap-stat"><strong>{overall.done}</strong><span>Lectures completed</span></div>
        <div className="ap-card ap-stat"><strong>{overall.percent}%</strong><span>Overall progress</span></div>
        <div className="ap-card ap-stat"><strong>{Object.keys(state.results).length}</strong><span>Quizzes attempted</span></div>
      </div>

      {featured ? (
        <ContinueCard course={featured} state={state} />
      ) : (
        <EmptyState title="No course started yet" action={<Link className="ap-btn ap-btn--primary" to="/courses">Browse courses</Link>}>
          Choose a course for Class 9, Class 10 or NEET and enroll for free.
        </EmptyState>
      )}

      <section aria-label="Quick access">
        <div className="ap-quicklinks">
          {QUICK.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="ap-card ap-quicklink"><Icon size={24} aria-hidden="true" />{label}</Link>
          ))}
        </div>
      </section>

      <div className="ap-two">
        <section className="ap-card ap-panel" aria-labelledby="dash-courses">
          <h2 id="dash-courses">Enrolled courses</h2>
          {enrolled.length ? (
            <ul className="ap-stack">
              {enrolled.map((c) => {
                const p = courseProgress(state, courseLectures(c).map((l) => l.id));
                return (
                  <li key={c.id} className="ap-stack" style={{ gap: 6 }}>
                    <Link to={coursePath(c.id)}><strong>{c.title}</strong></Link>
                    <ProgressBar percent={p.percent} label={`${c.title} progress`} />
                    <span className="ap-muted">{p.done} of {p.total} lectures</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="ap-muted">You have not enrolled in any course. <Link to="/courses">Browse courses</Link> ({COURSES.length} sample courses).</p>
          )}
        </section>

        <section className="ap-card ap-panel" aria-labelledby="dash-teachers">
          <h2 id="dash-teachers">My teachers</h2>
          <ul className="ap-stack">
            {myTeachers.map((t) => (
              <li key={t.id} className="ap-row">
                <Avatar teacher={t} size={44} />
                <div>
                  <Link to={`/teachers/${t.id}`}><strong>{t.name}</strong></Link>
                  <div className="ap-muted">{t.subject}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="ap-card ap-panel" aria-labelledby="dash-activity">
          <h2 id="dash-activity">Recent activity</h2>
          <RecentActivity items={state.activity} limit={6} />
        </section>

        <section className="ap-card ap-panel" aria-labelledby="dash-tests">
          <h2 id="dash-tests">Upcoming tests</h2>
          <p className="ap-muted">Scheduled tests are not available yet. These quizzes are ready to take now.</p>
          {upcoming.length ? (
            <ul className="ap-stack">
              {upcoming.map((t) => (
                <li key={t.id} className="ap-row ap-row--wrap" style={{ justifyContent: 'space-between' }}>
                  <span>{t.title}</span>
                  <Link className="ap-btn ap-btn--ghost ap-btn--sm" to={`/tests/${t.id}`}>Start<span className="ap-sr-only">: {t.title}</span></Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>You have attempted every quiz. <Link to="/progress">See your results</Link>.</p>
          )}
        </section>
      </div>

      <section className="ap-card ap-panel" aria-labelledby="dash-tools">
        <h2 id="dash-tools">More tools</h2>
        <div className="ap-quicklinks">
          {TOOLS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="ap-card ap-quicklink"><Icon size={22} aria-hidden="true" />{label}</Link>
          ))}
        </div>
      </section>
    </div>
  );
}

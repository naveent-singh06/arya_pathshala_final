import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTeacher } from '../data/teachers';
import { teacherCourses, teacherLectures, lecturePath, coursePath } from '../data/courses';
import useTabParam from '../components/learn/useTabParam';
import { Avatar, CourseCard, Tabs, TabPanel, accentStyle, DemoNote } from '../components/learn/shared';
import NotFound from './NotFound';

const TABS = [
  { id: 'about', label: 'About' },
  { id: 'courses', label: 'Courses' },
  { id: 'lectures', label: 'Recorded lectures' },
  { id: 'demo', label: 'Demo lectures' },
];

export default function TeacherProfile() {
  const { teacherId } = useParams();
  const teacher = getTeacher(teacherId);
  const [tab, setTab] = useTabParam(TABS.map((t) => t.id));
  if (!teacher) return <NotFound what="teacher" />;

  const courses = teacherCourses(teacher.id);
  const lectures = teacherLectures(teacher.id);
  const demo = lectures.filter((l) => l.isFree);

  const LectureRows = ({ list }) => (
    <div className="ap-rows">
      {list.map((l) => (
        <div key={l.id} className="ap-card ap-rowcard">
          <div className="ap-rowcard__main">
            <h3>{l.title}</h3>
            <span className="ap-muted">{l.courseTitle}, {l.subject}, Chapter {l.chapterIndex}: {l.chapterTitle}</span>
          </div>
          {l.isFree && <span className="ap-badge ap-badge--ok">Free demo</span>}
          <Link className="ap-btn ap-btn--primary ap-btn--sm" to={lecturePath(l.courseId, l.id)}>Watch</Link>
        </div>
      ))}
    </div>
  );

  return (
    <div className="ap-stack" style={{ gap: 20, ...accentStyle(teacher.accent) }}>
      <nav className="ap-crumbs" aria-label="Breadcrumb"><Link to="/teachers">Teachers</Link> / <span aria-current="page">{teacher.name}</span></nav>
      <header className="ap-card ap-panel ap-row ap-row--wrap" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <Avatar teacher={teacher} size={104} />
        <div className="ap-stack" style={{ flex: '1 1 260px' }}>
          <h1 style={{ fontSize: 'clamp(1.6rem,3.4vw,2.3rem)' }}>{teacher.name}</h1>
          <span className="ap-badge ap-badge--subject" style={{ justifySelf: 'start' }}>{teacher.subject}</span>
          <p>{teacher.intro}</p>
        </div>
      </header>

      <div className="ap-card ap-panel" style={{ gap: 0 }}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} label="Teacher sections" />
        {tab === 'about' && (
          <TabPanel id="about">
            <h2>About {teacher.name}</h2>
            <p>{teacher.intro}</p>
            <dl className="ap-kv">
              <div><dt>Subject</dt><dd>{teacher.subject}</dd></div>
              <div><dt>Courses</dt><dd>{courses.length}</dd></div>
              <div><dt>Recorded lectures</dt><dd>{lectures.length}</dd></div>
            </dl>
            {teacher.bioIsPlaceholder && <DemoNote>A full introduction and photograph for {teacher.name} will be added soon.</DemoNote>}
          </TabPanel>
        )}
        {tab === 'courses' && (
          <TabPanel id="courses">
            <h2>Available courses</h2>
            <div className="ap-grid-3">{courses.map((c) => <CourseCard key={c.id} course={c} />)}</div>
          </TabPanel>
        )}
        {tab === 'lectures' && (
          <TabPanel id="lectures">
            <h2>Recorded lectures</h2>
            <p className="ap-muted">{lectures.length} sample lectures. Video files have not been uploaded yet.</p>
            <LectureRows list={lectures.slice(0, 30)} />
            {lectures.length > 30 && (
              <p className="ap-muted">Showing the first 30. Open a course to see every lecture: {courses.slice(0, 3).map((c) => (
                <Link key={c.id} to={coursePath(c.id)} style={{ marginRight: 8 }}>{c.title}</Link>
              ))}</p>
            )}
          </TabPanel>
        )}
        {tab === 'demo' && (
          <TabPanel id="demo">
            <h2>Demo lectures</h2>
            <p className="ap-muted">Free to open without enrolling.</p>
            <LectureRows list={demo} />
          </TabPanel>
        )}
      </div>
    </div>
  );
}

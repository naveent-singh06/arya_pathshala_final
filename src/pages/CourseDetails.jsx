import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, Languages, Play, CheckCircle2 } from 'lucide-react';
import { getCourse, courseTeachers, courseLectures, lecturePath, courseLecturesPath } from '../data/courses';
import { getCategory } from '../data/categories';
import { quizSetForChapter } from '../data/practice';
import { courseProgress } from '../data/learnerState';
import { useLearn } from '../components/learn/LearnContext';
import useTabParam from '../components/learn/useTabParam';
import ContinueCard from '../components/learn/ContinueCard';
import LectureTree from '../components/learn/LectureTree';
import { accentStyle, DemoNote, Tabs, TabPanel, Avatar, ProgressBar } from '../components/learn/shared';
import NotFound from './NotFound';

const TABS = [
  { id: 'description', label: 'Description' },
  { id: 'classes', label: 'All Classes' },
  { id: 'teachers', label: 'Teachers' },
  { id: 'free', label: 'Free Content' },
  { id: 'more', label: 'More Details' },
];
const TAB_IDS = TABS.map((t) => t.id);

export default function CourseDetails() {
  const { courseId } = useParams();
  const course = getCourse(courseId);
  const { state, actions } = useLearn();
  const [tab, setTab] = useTabParam(TAB_IDS);
  if (!course) return <NotFound what="course" />;

  const category = getCategory(course.categoryId);
  const lectures = courseLectures(course);
  const teachers = courseTeachers(course);
  const free = lectures.filter((l) => l.isFree);
  const progress = courseProgress(state, lectures.map((l) => l.id));
  const enrolled = state.enrolled.includes(course.id);
  const chapters = course.subjects.flatMap((s) => s.chapters.map((c) => ({ ...c, subject: s.name })));
  const dppCount = chapters.filter((c) => quizSetForChapter(course.categoryId, c.subject, c.title)).length;

  return (
    <div className="ap-detail" style={accentStyle(course.accent)}>
      <div className="ap-stack" style={{ gap: 18, minWidth: 0 }}>
        <nav className="ap-crumbs" aria-label="Breadcrumb">
          <Link to="/courses">Courses</Link> / <Link to={`/courses/${course.categoryId}`}>{category.title}</Link> / <span aria-current="page">{course.title}</span>
        </nav>

        <header className="ap-card ap-coursehead ap-wm">
          <div className="ap-row ap-row--wrap">
            <span className="ap-badge">{category.title}</span>
            <span className="ap-badge">Demo content</span>
          </div>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <ul className="ap-meta">
            <li><Clock size={16} aria-hidden="true" /> {course.duration}</li>
            <li><Languages size={16} aria-hidden="true" /> {course.language}</li>
            <li><Play size={16} aria-hidden="true" /> {lectures.length} lectures</li>
          </ul>
          <Link className="ap-btn ap-btn--primary" to={`/hub/${course.categoryId}`}>Open the Study Hub for {category.title}</Link>
        </header>

        {enrolled && <ContinueCard course={course} state={state} />}

        <div className="ap-card ap-panel" style={{ gap: 0 }}>
          <Tabs tabs={TABS} active={tab} onChange={setTab} label="Course sections" />

          {tab === 'description' && (
            <TabPanel id="description">
              <section className="ap-stack">
                <h2>What you will learn</h2>
                <ul className="ap-bullets">
                  {chapters.slice(0, 6).map((c) => (
                    <li key={`${c.subject}-${c.index}`}>{c.title} ({c.subject})</li>
                  ))}
                  {chapters.length > 6 && <li>…and {chapters.length - 6} more chapters</li>}
                </ul>
              </section>
              <section className="ap-stack">
                <h2>Subjects included</h2>
                <div className="ap-row ap-row--wrap">
                  {course.subjects.map((s) => (
                    <span key={s.slug} className="ap-badge ap-badge--subject" style={accentStyle(s.accent)}>{s.name}</span>
                  ))}
                </div>
              </section>
              <section className="ap-stack">
                <h2>Course features</h2>
                <ul className="ap-bullets">{course.features.map((f) => <li key={f}>{f}</li>)}</ul>
              </section>
              <section className="ap-stack">
                <h2>Study material</h2>
                <p>Every chapter has notes and a DPP. {dppCount} of {chapters.length} chapters have sample practice questions in this demo. PDFs have not been uploaded yet.</p>
                <div className="ap-row ap-row--wrap">
                  <Link className="ap-btn ap-btn--ghost ap-btn--sm" to={`/study-material?category=${course.categoryId}`}>Notes and PDFs</Link>
                  <Link className="ap-btn ap-btn--ghost ap-btn--sm" to={`/practice?category=${course.categoryId}`}>DPP and practice</Link>
                </div>
              </section>
              <section className="ap-stack">
                <h2>Demo lecture</h2>
                <FreeList course={course} free={free} />
              </section>
            </TabPanel>
          )}

          {tab === 'classes' && (
            <TabPanel id="classes">
              <LectureTree course={course} done={state.done} />
              <Link className="ap-btn ap-btn--ghost ap-btn--sm" style={{ justifySelf: 'start' }} to={courseLecturesPath(course.id)}>Open the full lecture page</Link>
            </TabPanel>
          )}

          {tab === 'teachers' && (
            <TabPanel id="teachers">
              <div className="ap-demo-grid">
                {teachers.map((t) => (
                  <div key={t.id} className="ap-card ap-democard" style={accentStyle(t.accent)}>
                    <Avatar teacher={t} size={64} />
                    <h4>{t.name}</h4>
                    <span className="ap-muted">{course.subjects.filter((s) => s.teacherId === t.id).map((s) => s.name).join(', ')}</span>
                    <Link className="ap-btn ap-btn--ghost ap-btn--sm" to={`/teachers/${t.id}`}>View profile</Link>
                  </div>
                ))}
              </div>
            </TabPanel>
          )}

          {tab === 'free' && (
            <TabPanel id="free">
              <h2>Free content</h2>
              <p className="ap-muted">The first lecture of each subject is free to open without enrolling.</p>
              <FreeList course={course} free={free} />
            </TabPanel>
          )}

          {tab === 'more' && (
            <TabPanel id="more">
              <h2>More details</h2>
              <dl className="ap-kv">
                <div><dt>Class or exam</dt><dd>{category.title}</dd></div>
                <div><dt>Duration</dt><dd>{course.duration}</dd></div>
                <div><dt>Language</dt><dd>{course.language}</dd></div>
                <div><dt>Subjects</dt><dd>{course.subjects.map((s) => s.name).join(', ')}</dd></div>
                <div><dt>Chapters</dt><dd>{chapters.length}</dd></div>
                <div><dt>Lectures</dt><dd>{lectures.length}</dd></div>
              </dl>
              <DemoNote>This course is sample content. Fees, start dates and live class timings will be added when real batches are published.</DemoNote>
            </TabPanel>
          )}
        </div>
      </div>

      <aside className="ap-detail__aside ap-card ap-panel" aria-label="Course summary">
        <h2>Course summary</h2>
        <dl className="ap-kv">
          <div><dt>Class or exam</dt><dd>{category.title}</dd></div>
          <div><dt>Duration</dt><dd>{course.duration}</dd></div>
          <div><dt>Language</dt><dd>{course.language}</dd></div>
          <div><dt>Lectures</dt><dd>{lectures.length}</dd></div>
          <div><dt>Free demo lectures</dt><dd>{free.length}</dd></div>
        </dl>
        {enrolled && (
          <div className="ap-stack">
            <ProgressBar percent={progress.percent} label="Your progress" />
            <span className="ap-muted">{progress.done} of {progress.total} lectures completed</span>
          </div>
        )}
        <div className="ap-stack">
          {enrolled ? (
            <>
              <p className="ap-row" style={{ color: 'var(--ap-ok)', fontWeight: 600 }}><CheckCircle2 size={18} aria-hidden="true" /> You are enrolled</p>
              <Link className="ap-btn ap-btn--accent" to={courseLecturesPath(course.id)}>Go to lectures</Link>
              <button type="button" className="ap-btn ap-btn--ghost" onClick={() => actions.unenroll(course.id)}>Leave course</button>
            </>
          ) : (
            <>
              <button type="button" className="ap-btn ap-btn--accent" onClick={() => actions.enroll(course.id, course.title)}>Enroll for free</button>
              <Link className="ap-btn ap-btn--ghost" to={free[0] ? lecturePath(course.id, free[0].id) : courseLecturesPath(course.id)}>Watch the free demo</Link>
            </>
          )}
        </div>
        <p className="ap-muted" style={{ fontSize: '0.85rem' }}>Enrolment is saved in this browser only. Payments and accounts for batches are not connected yet.</p>
      </aside>
    </div>
  );
}

function FreeList({ course, free }) {
  if (!free.length) return <p className="ap-muted">No free lectures in this course yet.</p>;
  return (
    <div className="ap-demo-grid">
      {free.map((l) => (
        <div key={l.id} className="ap-card ap-democard">
          <span className="ap-badge ap-badge--ok">Free demo</span>
          <h4>{l.title}</h4>
          <span className="ap-muted">{l.subject}, Chapter {l.chapterIndex}: {l.chapterTitle}</span>
          <Link className="ap-btn ap-btn--primary ap-btn--sm" to={lecturePath(course.id, l.id)}>Watch</Link>
        </div>
      ))}
    </div>
  );
}

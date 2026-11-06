import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2, PlayCircle, FileText, ClipboardList } from 'lucide-react';
import { getLectureContext, getCourse, coursePath, lecturePath } from '../data/courses';
import { getTeacher } from '../data/teachers';
import { quizSetForChapter } from '../data/practice';
import { useLearn } from '../components/learn/LearnContext';
import LectureTree from '../components/learn/LectureTree';
import { accentStyle, DemoNote } from '../components/learn/shared';
import NotFound from './NotFound';

export default function LecturePlayer() {
  const { courseId, lectureId } = useParams();
  const ctx = getLectureContext(courseId, lectureId);
  const { state, actions } = useLearn();

  useEffect(() => {
    if (ctx) actions.visit(ctx.course.id, ctx.lecture.id, ctx.lecture.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lectureId]);

  if (!ctx) return <NotFound what={getCourse(courseId) ? 'lecture' : 'course'} />;
  const { course, lecture, previous, next } = ctx;
  const teacher = getTeacher(lecture.teacherId);
  const done = state.done.includes(lecture.id);
  const dpp = quizSetForChapter(course.categoryId, lecture.subject, lecture.chapterTitle);
  const subject = course.subjects.find((s) => s.name === lecture.subject);
  const chapter = subject.chapters[lecture.chapterIndex - 1];

  return (
    <div className="ap-stack" style={{ gap: 18, ...accentStyle(subject.accent) }}>
      <nav className="ap-crumbs" aria-label="Breadcrumb">
        <Link to={coursePath(course.id)}>{course.title}</Link> / <Link to={`/course/${course.id}/lectures`}>Lectures</Link> / <span aria-current="page">{lecture.title}</span>
      </nav>
      <div className="ap-player-layout">
        <div className="ap-stack" style={{ gap: 18, minWidth: 0 }}>
          <div className="ap-video">
            {lecture.youtubeId ? (
              <iframe title={lecture.title} src={`https://www.youtube-nocookie.com/embed/${lecture.youtubeId}`} allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
            ) : (
              <div className="ap-video__placeholder">
                <span className="ap-video__badge">Demo placeholder</span>
                <PlayCircle size={56} aria-hidden="true" />
                <h2>{lecture.title}</h2>
                <p>No video has been uploaded for this lecture yet. The player will show it here once a video link is added.</p>
              </div>
            )}
          </div>

          <div className="ap-lecturehead">
            <h1>{lecture.title}</h1>
            <p className="ap-muted">
              {lecture.subject}, Chapter {lecture.chapterIndex}: {lecture.chapterTitle}
              {teacher && <> · Taught by <Link to={`/teachers/${teacher.id}`}>{teacher.name}</Link></>}
            </p>
          </div>

          <div className="ap-navrow">
            {previous ? (
              <Link className="ap-btn ap-btn--ghost" to={lecturePath(course.id, previous.id)}><ChevronLeft size={18} aria-hidden="true" /> Previous lecture</Link>
            ) : (
              <button type="button" className="ap-btn ap-btn--ghost" disabled><ChevronLeft size={18} aria-hidden="true" /> Previous lecture</button>
            )}
            <button type="button" className={`ap-btn ${done ? 'ap-btn--ghost' : 'ap-btn--accent'}`} aria-pressed={done} onClick={() => (done ? actions.unmarkDone(lecture.id) : actions.markDone(lecture.id, lecture.title))}>
              <CheckCircle2 size={18} aria-hidden="true" /> {done ? 'Completed. Undo' : 'Mark as completed'}
            </button>
            {next ? (
              <Link className="ap-btn ap-btn--primary" to={lecturePath(course.id, next.id)}>Next lecture <ChevronRight size={18} aria-hidden="true" /></Link>
            ) : (
              <button type="button" className="ap-btn ap-btn--primary" disabled>Next lecture <ChevronRight size={18} aria-hidden="true" /></button>
            )}
          </div>

          <div className="ap-two">
            <section className="ap-card ap-panel" aria-label="Notes and PDF">
              <h2><FileText size={18} aria-hidden="true" /> Notes and PDF</h2>
              <p className="ap-muted">Topics in this chapter:</p>
              <ul className="ap-bullets">{chapter.lectures.map((l) => <li key={l.id}>{l.title.replace(/^Lecture \d+: /, '')}</li>)}</ul>
              <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" disabled style={{ justifySelf: 'start' }}>Chapter PDF: not uploaded yet</button>
              <Link className="ap-btn ap-btn--ghost ap-btn--sm" style={{ justifySelf: 'start' }} to={`/study-material?category=${course.categoryId}`}>All notes and PDFs</Link>
            </section>
            <section className="ap-card ap-panel" aria-label="Related DPP">
              <h2><ClipboardList size={18} aria-hidden="true" /> Related DPP</h2>
              {dpp ? (
                <>
                  <p>{dpp.title}: {dpp.questions.length} sample questions with explanations.</p>
                  {state.results[dpp.id] && <p className="ap-muted">Your last score: {state.results[dpp.id].correct}/{state.results[dpp.id].total}</p>}
                  <Link className="ap-btn ap-btn--primary ap-btn--sm" style={{ justifySelf: 'start' }} to={`/practice/${dpp.id}`}>Start this DPP</Link>
                </>
              ) : (
                <>
                  <p className="ap-muted">There is no DPP for this chapter yet.</p>
                  <Link className="ap-btn ap-btn--ghost ap-btn--sm" style={{ justifySelf: 'start' }} to={`/practice?category=${course.categoryId}`}>Browse all DPPs</Link>
                </>
              )}
            </section>
          </div>
          <DemoNote>Sample lecture. Progress and completion are saved in this browser only.</DemoNote>
        </div>

        <aside className="ap-card ap-playlist" aria-label="Lecture list">
          <LectureTree key={lecture.id} course={course} done={state.done} currentId={lecture.id} />
        </aside>
      </div>
    </div>
  );
}

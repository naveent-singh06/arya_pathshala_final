import React from 'react';
import { Link } from 'react-router-dom';
import { getCourse, courseLectures } from '../data/courses';
import { getAnySet } from '../data/practice';
import { courseProgress } from '../data/learnerState';
import { useLearn } from '../components/learn/LearnContext';
import RecentActivity from '../components/learn/RecentActivity';
import { PageHead, ProgressBar, DemoNote, EmptyState } from '../components/learn/shared';

export default function Progress() {
  const { state } = useLearn();
  const courses = state.enrolled.map(getCourse).filter(Boolean);
  const results = Object.entries(state.results).map(([id, r]) => ({ id, r, set: getAnySet(id) })).filter((x) => x.set);
  return (
    <>
      <PageHead title="Progress" description="Lectures you have completed and quizzes you have taken." />
      <DemoNote>Progress is saved in this browser only, so it will not follow you to another device yet.</DemoNote>
      <div className="ap-two">
        <section className="ap-card ap-panel" aria-labelledby="pr-courses">
          <h2 id="pr-courses">Course progress</h2>
          {courses.length ? (
            <ul className="ap-stack">
              {courses.map((c) => {
                const p = courseProgress(state, courseLectures(c).map((l) => l.id));
                return (
                  <li key={c.id} className="ap-stack" style={{ gap: 6 }}>
                    <Link to={`/course/${c.id}/lectures`}><strong>{c.title}</strong></Link>
                    <ProgressBar percent={p.percent} label={`${c.title} progress`} />
                    <span className="ap-muted">{p.done} of {p.total} lectures ({p.percent}%)</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="No courses yet" action={<Link className="ap-btn ap-btn--primary" to="/courses">Browse courses</Link>}>Enroll in a course to track it here.</EmptyState>
          )}
        </section>
        <section className="ap-card ap-panel" aria-labelledby="pr-quiz">
          <h2 id="pr-quiz">Quiz results</h2>
          {results.length ? (
            <ul className="ap-stack">
              {results.map(({ id, r, set }) => (
                <li key={id} className="ap-row ap-row--wrap" style={{ justifyContent: 'space-between' }}>
                  <span>{set.title}</span>
                  <span className="ap-badge ap-badge--ok">Last {r.correct}/{r.total} · best {r.best}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ap-muted">No quiz taken yet. <Link to="/practice">Try a DPP</Link> or <Link to="/tests">a quiz</Link>.</p>
          )}
        </section>
      </div>
      <section className="ap-card ap-panel" aria-labelledby="pr-act" style={{ marginTop: 20 }}>
        <h2 id="pr-act">Recent activity</h2>
        <RecentActivity items={state.activity} />
      </section>
    </>
  );
}

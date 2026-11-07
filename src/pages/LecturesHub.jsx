import React from 'react';
import { Link } from 'react-router-dom';
import { COURSES, getCourse, courseLecturesPath, courseLectures } from '../data/courses';
import { featuredCourse } from '../data/continueLearning';
import { courseProgress } from '../data/learnerState';
import { useLearn } from '../components/learn/LearnContext';
import ContinueCard from '../components/learn/ContinueCard';
import { PageHead, ProgressBar } from '../components/learn/shared';

export default function LecturesHub() {
  const { state } = useLearn();
  const featured = featuredCourse(state);
  const enrolled = state.enrolled.map(getCourse).filter(Boolean);
  const list = enrolled.length ? enrolled : COURSES;
  return (
    <>
      <PageHead title="Lectures" description={enrolled.length ? 'Your enrolled courses.' : 'Choose a course to see its subjects, chapters and lectures.'} />
      {featured && <ContinueCard course={featured} state={state} />}
      <div className="ap-rows">
        {list.map((c) => {
          const progress = courseProgress(state, courseLectures(c).map((l) => l.id));
          return (
            <div key={c.id} className="ap-card ap-rowcard">
              <div className="ap-rowcard__main">
                <h3>{c.title}</h3>
                <span className="ap-muted">{c.subjects.map((s) => s.name).join(', ')}</span>
                <ProgressBar percent={progress.percent} label={`${c.title} progress`} />
              </div>
              <Link className="ap-btn ap-btn--primary ap-btn--sm" to={courseLecturesPath(c.id)}>Open lectures<span className="ap-sr-only">: {c.title}</span></Link>
            </div>
          );
        })}
      </div>
      {!enrolled.length && <p className="ap-muted">You have not enrolled in a course yet, so every sample course is shown. <Link to="/courses">Browse courses</Link> to enroll.</p>}
    </>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { continueFor } from '../../data/continueLearning';
import { lecturePath, coursePath } from '../../data/courses';
import { getTeacher } from '../../data/teachers';
import { ProgressBar, CourseThumb } from './shared';

/** "Continue learning / next lecture" card for one course. */
export default function ContinueCard({ course, state, heading = 'Continue learning' }) {
  const { last, next, progress, finished } = continueFor(state, course);
  const target = next || last;
  const teacher = target ? getTeacher(target.teacherId) : null;
  return (
    <section className="ap-card ap-continue" aria-label={heading}>
      <div className="ap-continue__main">
        <div className="ap-continue__head">
          <div className="ap-continue__thumb"><CourseThumb course={course} /></div>
          <div>
            <h2>{heading}</h2>
            <p className="ap-continue__course">{course.title}</p>
          </div>
        </div>
        <dl className="ap-facts">
          <div>
            <dt>Last watched</dt>
            <dd>{last ? last.title : 'Nothing watched yet'}</dd>
          </div>
          <div>
            <dt>Next lecture</dt>
            <dd>{finished ? 'You have finished every lecture' : next ? next.title : '—'}</dd>
          </div>
          <div>
            <dt>Chapter</dt>
            <dd>{target ? `${target.subject}, Chapter ${target.chapterIndex}: ${target.chapterTitle}` : '—'}</dd>
          </div>
          <div>
            <dt>Teacher</dt>
            <dd>{teacher ? teacher.name : '—'}</dd>
          </div>
        </dl>
        <div className="ap-continue__progress">
          <ProgressBar percent={progress.percent} label={`${course.title} progress`} />
          <span>
            {progress.done} of {progress.total} lectures completed ({progress.percent}%)
          </span>
        </div>
      </div>
      <div className="ap-continue__actions">
        {target ? (
          <Link className="ap-btn ap-btn--accent" to={lecturePath(course.id, target.id)}>
            <PlayCircle size={20} aria-hidden="true" /> {last ? 'Continue watching' : 'Start watching'}
          </Link>
        ) : null}
        <Link className="ap-btn ap-btn--ghost" to={coursePath(course.id)}>
          Course details
        </Link>
      </div>
    </section>
  );
}

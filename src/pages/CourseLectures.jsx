import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCourse, coursePath } from '../data/courses';
import { useLearn } from '../components/learn/LearnContext';
import ContinueCard from '../components/learn/ContinueCard';
import LectureTree from '../components/learn/LectureTree';
import { PageHead, DemoNote, accentStyle } from '../components/learn/shared';
import NotFound from './NotFound';

export default function CourseLectures() {
  const { courseId } = useParams();
  const course = getCourse(courseId);
  const { state } = useLearn();
  if (!course) return <NotFound what="course" />;
  return (
    <div className="ap-stack" style={{ gap: 20, ...accentStyle(course.accent) }}>
      <nav className="ap-crumbs" aria-label="Breadcrumb"><Link to="/lectures">Lectures</Link> / <Link to={coursePath(course.id)}>{course.title}</Link> / <span aria-current="page">All lectures</span></nav>
      <PageHead title={`${course.title}: lectures`} description="Pick a subject, open a chapter, then choose a lecture." />
      <ContinueCard course={course} state={state} heading="Continue learning" />
      <div className="ap-card ap-panel">
        <LectureTree course={course} done={state.done} />
      </div>
      <DemoNote>These are sample lectures. Real video links will be added when lectures are uploaded.</DemoNote>
    </div>
  );
}

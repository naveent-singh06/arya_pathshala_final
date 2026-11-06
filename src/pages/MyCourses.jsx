import React from 'react';
import { Link } from 'react-router-dom';
import { getCourse } from '../data/courses';
import { useLearn } from '../components/learn/LearnContext';
import { CourseCard, EmptyState, PageHead, DemoNote } from '../components/learn/shared';

export default function MyCourses() {
  const { state } = useLearn();
  const courses = state.enrolled.map(getCourse).filter(Boolean);
  return (
    <>
      <PageHead title="My courses" description="Courses you have enrolled in." />
      <DemoNote>Enrollment is saved in this browser only. Real enrollment needs a backend and is not connected yet.</DemoNote>
      {courses.length ? (
        <div className="ap-grid-3">{courses.map((c) => <CourseCard key={c.id} course={c} />)}</div>
      ) : (
        <EmptyState title="You have not enrolled yet" action={<Link className="ap-btn ap-btn--primary" to="/courses">Browse courses</Link>}>
          Open any course and choose Enroll for free.
        </EmptyState>
      )}
    </>
  );
}

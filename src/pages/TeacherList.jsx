import React from 'react';
import { TEACHERS } from '../data/teachers';
import { TeacherCard, PageHead, DemoNote } from '../components/learn/shared';

export default function TeacherList() {
  return (
    <>
      <PageHead title="Our teachers" description="Three teachers take every subject in Class 9, Class 10 and NEET." />
      <div className="ap-teachers-row">
        {TEACHERS.map((t) => <TeacherCard key={t.id} teacher={t} />)}
      </div>
      <DemoNote>Teacher photographs and full introductions have not been added yet, so each teacher shows an initials avatar and a short line.</DemoNote>
    </>
  );
}

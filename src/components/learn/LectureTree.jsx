import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronDown } from 'lucide-react';
import { lecturePath } from '../../data/courses';
import { getTeacher } from '../../data/teachers';
import { accentStyle, Tabs, TabPanel } from './shared';

/** Subject -> chapter -> lecture list for one course. Subjects are tabs; chapters expand. */
export default function LectureTree({ course, done = [], currentId = null }) {
  const [subjectId, setSubjectId] = useState(
    (course.subjects.find((s) => s.chapters.some((c) => c.lectures.some((l) => l.id === currentId))) || course.subjects[0]).slug
  );
  const subject = course.subjects.find((s) => s.slug === subjectId) || course.subjects[0];
  const teacher = getTeacher(subject.teacherId);

  return (
    <div className="ap-tree" style={accentStyle(subject.accent)}>
      {course.subjects.length > 1 && (
        <Tabs label="Subjects" active={subject.slug} onChange={setSubjectId} tabs={course.subjects.map((s) => ({ id: s.slug, label: s.name }))} />
      )}
      <TabPanel id={subject.slug}>
        <p className="ap-muted ap-tree__teacher">
          {subject.name} is taught by {teacher ? teacher.name : 'our teachers'}.
        </p>
        {subject.chapters.map((chapter) => {
          const open = chapter.lectures.some((l) => l.id === currentId) || chapter.index === 1;
          return (
            <details key={chapter.index} className="ap-chapter" open={open}>
              <summary>
                <span>
                  Chapter {chapter.index}: {chapter.title}
                </span>
                <span className="ap-muted">{chapter.lectures.length} lectures</span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <ul>
                {chapter.lectures.map((lecture) => (
                  <li key={lecture.id}>
                    <Link
                      to={lecturePath(course.id, lecture.id)}
                      className={`ap-lecture ${lecture.id === currentId ? 'is-current' : ''}`}
                      aria-current={lecture.id === currentId ? 'true' : undefined}
                    >
                      {done.includes(lecture.id) ? (
                        <CheckCircle2 size={18} className="ap-ok" aria-label="Completed" />
                      ) : (
                        <Circle size={18} aria-hidden="true" />
                      )}
                      <span>{lecture.title}</span>
                      {lecture.isFree && <span className="ap-badge ap-badge--ok">Free demo</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </TabPanel>
    </div>
  );
}

import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Clock } from 'lucide-react';
import { findCourse, byOrder, batchSubjects } from '../../cms/model';
import { PageHead, EmptyState } from '../../components/learn/shared';
import { useHub } from './HubContext';
import NotFound from '../NotFound';
import '../../styles/hub.css';

/** Step 2: the batches of one course (Class 9, Class 10, NEET, ...). */
export default function HubCourse() {
  const { classId } = useParams();
  const { data, enrolled, enroll, user } = useHub();
  const course = findCourse(data, classId);
  if (!course) return <NotFound what="course" />;
  const batches = data.batches.filter((b) => b.classId === classId).sort(byOrder);
  return (
    <div className="ap-stack" style={{ gap: 16 }}>
      <nav className="ap-crumbs" aria-label="Breadcrumb"><Link to="/hub">All courses</Link> / <span aria-current="page">{course.title}</span></nav>
      <PageHead title={course.title} description={course.description || 'Choose a batch to start learning.'} />
      {!batches.length ? (
        <EmptyState title="No batches yet">Batches for {course.title} will appear here as soon as your teachers publish them.</EmptyState>
      ) : (
        <div className="ap-grid-3">
          {batches.map((b) => {
            const joined = enrolled.includes(b.id);
            const count = batchSubjects(data, b).length;
            return (
              <article key={b.id} className="ap-card hub-batch">
                {b.coverUrl ? <img className="hub-batch__cover" src={b.coverUrl} alt="" loading="lazy" /> : <div className="hub-batch__cover hub-batch__cover--blank" aria-hidden="true" />}
                <div className="hub-batch__body">
                  <h2>{b.name}</h2>
                  {b.description && <p className="ap-muted">{b.description}</p>}
                  <p className="ap-muted hub-batch__meta">
                    {b.session && <span><CalendarDays size={14} aria-hidden="true" /> {b.session}</span>}
                    {b.duration && <span><Clock size={14} aria-hidden="true" /> {b.duration}</span>}
                    <span>{count} {count === 1 ? 'subject' : 'subjects'}</span>
                  </p>
                  <div className="ap-row ap-row--wrap">
                    <Link className="ap-btn ap-btn--primary ap-btn--sm" to={`/hub/${classId}/${b.id}`}>{joined ? 'Open batch' : 'View batch'}</Link>
                    {joined ? <span className="ap-badge ap-badge--ok">Enrolled</span> : user && enroll ? (
                      <button type="button" className="ap-btn ap-btn--accent ap-btn--sm" onClick={() => enroll(b.id, classId).catch(() => {})}>Enroll</button>
                    ) : <Link className="ap-btn ap-btn--ghost ap-btn--sm" to="/login">Log in to enroll</Link>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

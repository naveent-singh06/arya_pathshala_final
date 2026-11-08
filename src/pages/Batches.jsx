import React from 'react';
import { Link } from 'react-router-dom';
import { allClasses, byOrder, batchSubjects, findCourse } from '../cms/model';
import { PageHead, EmptyState } from '../components/learn/shared';
import { useHub } from './hub/HubContext';
import { AdminShortcut } from './hub/MyLearning';
import '../styles/hub.css';

/** Batches: every published batch for Class 9, Class 10 and NEET. */
export default function Batches() {
  const { data, enrolled, enroll, user, isAdmin } = useHub();
  return (
    <div className="ap-stack" style={{ gap: 16 }}>
      <PageHead title="Batches" description="Full-year batches for each class and exam. Open one to see its subjects, chapters and topics."><AdminShortcut isAdmin={isAdmin} /></PageHead>
      {allClasses(data).map((c) => {
        const batches = data.batches.filter((b) => b.classId === c.id).sort(byOrder);
        const course = findCourse(data, c.id);
        return (
          <section key={c.id} className="ap-stack" style={{ gap: 10 }} aria-label={c.title}>
            <h2 style={{ fontSize: '1.2rem' }}><Link to={`/hub/${c.id}`}>{c.title}</Link></h2>
            {!batches.length ? (
              <EmptyState title="Batches coming soon">{course ? course.title : c.title} batches will appear here after your teachers publish them.</EmptyState>
            ) : (
              <div className="ap-rows">
                {batches.map((b) => (
                  <div key={b.id} className="ap-card ap-rowcard">
                    <div className="ap-rowcard__main">
                      <h3>{b.name}</h3>
                      <span className="ap-muted">{batchSubjects(data, b).length} subject(s){b.session ? ` · ${b.session}` : ''}{b.duration ? ` · ${b.duration}` : ''}</span>
                    </div>
                    <div className="ap-rowcard__actions">
                      <Link className="ap-btn ap-btn--primary ap-btn--sm" to={`/hub/${c.id}/${b.id}`}>{enrolled.includes(b.id) ? 'Open batch' : 'View batch'}<span className="ap-sr-only">: {b.name}</span></Link>
                      {enrolled.includes(b.id) ? <span className="ap-badge ap-badge--ok">Enrolled</span> : user && enroll ? (
                        <button type="button" className="ap-btn ap-btn--accent ap-btn--sm" onClick={() => enroll(b.id, c.id).catch(() => {})}>Enroll</button>
                      ) : <Link className="ap-btn ap-btn--ghost ap-btn--sm" to="/login">Log in to enroll</Link>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

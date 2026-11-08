import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Settings } from 'lucide-react';
import { allClasses, byOrder, buildTree, batchSubjects, batchProgress, findCourse } from '../../cms/model';
import { ProgressBar, EmptyState } from '../../components/learn/shared';

function batchSubjectTrees(data, batch) {
  const ids = new Set(batchSubjects(data, batch).map((s) => s.id));
  const tree = buildTree(data, batch.classId).filter((s) => ids.has(s.id));
  return (batch.subjectIds || []).map((id) => tree.find((s) => s.id === id)).filter(Boolean);
}

/** Shortcut for admins to the content portal. */
export function AdminShortcut({ isAdmin }) {
  if (!isAdmin) return null;
  return <Link className="ap-btn ap-btn--accent ap-btn--sm" to="/admin/content"><Settings size={16} aria-hidden="true" /> Manage content</Link>;
}

/** The student's own batches with real progress, a Continue card, and entry points for Class 9, Class 10 and NEET. */
export function MyBatches({ hub, compact = false }) {
  const { data, progress, enrolled, isAdmin } = hub;
  const mine = useMemo(() => data.batches.filter((b) => enrolled.includes(b.id)).sort(byOrder), [data, enrolled]);
  const byId = useMemo(() => Object.fromEntries(data.topics.map((t) => [t.id, t])), [data.topics]);
  const last = useMemo(() => {
    const entries = Object.entries(progress || {}).filter(([id]) => byId[id] && progress[id].lastStudiedAt && progress[id].lastStudiedAt.toMillis);
    entries.sort((a, b) => b[1].lastStudiedAt.toMillis() - a[1].lastStudiedAt.toMillis());
    return entries[0] ? byId[entries[0][0]] : null;
  }, [progress, byId]);

  return (
    <div className="ap-stack" style={{ gap: 14 }}>
      {last && (
        <section className="ap-card ap-continue" aria-label="Continue learning">
          <p className="ap-muted"><Clock size={14} aria-hidden="true" /> Continue where you left off</p>
          <h2>{last.title}</h2>
          <Link className="ap-btn ap-btn--accent" style={{ justifySelf: 'start' }} to={`/hub/topic/${last.id}`}>Continue learning</Link>
        </section>
      )}
      {mine.length ? (
        <div className="ap-grid-3">
          {mine.map((b) => {
            const subjects = batchSubjectTrees(data, b);
            const pr = batchProgress(subjects, progress);
            const course = findCourse(data, b.classId);
            return (
              <article key={b.id} className="ap-card ap-panel">
                <p className="ap-muted">{course ? course.title : b.classId}</p>
                <h3>{b.name}</h3>
                <ProgressBar percent={pr.percent} label={`${b.name} progress`} />
                <p className="ap-muted">{pr.done} of {pr.total} topics completed · {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'}</p>
                {!compact && subjects.length > 0 && (
                  <ul className="ap-row ap-row--wrap">
                    {subjects.map((s) => <li key={s.id}><Link className="ap-btn ap-btn--ghost ap-btn--sm" to={`/hub/${b.classId}/${b.id}/${s.id}?batch=${b.id}`}>{s.name}</Link></li>)}
                  </ul>
                )}
                <Link className="ap-btn ap-btn--primary ap-btn--sm" style={{ justifySelf: 'start' }} to={`/hub/${b.classId}/${b.id}`}>Open batch</Link>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="You have not joined a batch yet" action={<Link className="ap-btn ap-btn--primary" to="/batches">See all batches</Link>}>
          Pick Class 9, Class 10 or NEET below, open a batch and choose Enroll.
        </EmptyState>
      )}
      <CourseEntryPoints data={data} isAdmin={isAdmin} />
    </div>
  );
}

/** Class 9, Class 10 and NEET are always shown, even before anything is published. */
export function CourseEntryPoints({ data, isAdmin }) {
  return (
    <section aria-label="Courses">
      <div className="ap-row ap-row--wrap" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ fontSize: '1.2rem' }}>Courses</h2>
        <AdminShortcut isAdmin={isAdmin} />
      </div>
      <div className="ap-grid-3">
        {allClasses(data).map((c) => {
          const info = findCourse(data, c.id);
          const n = data.batches.filter((b) => b.classId === c.id).length;
          return (
            <Link key={c.id} to={`/hub/${c.id}`} className="ap-card ap-catcard">
              <h3>{c.title}</h3>
              {info && info.description && <p className="ap-muted">{info.description}</p>}
              <p>{n ? <><strong>{n}</strong> {n === 1 ? 'batch' : 'batches'}</> : <span className="ap-muted">Content coming soon</span>}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

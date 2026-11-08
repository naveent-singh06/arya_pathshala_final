import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Clock } from 'lucide-react';
import { CourseEntryPoints } from './MyLearning';
import { PageHead, EmptyState } from '../../components/learn/shared';
import { useHub } from './HubContext';

/** Step 1: All Courses. */
export default function HubHome() {
  const { data, progress, user, isAdmin } = useHub();
  const topics = data.topics;
  const byId = useMemo(() => Object.fromEntries(topics.map((t) => [t.id, t])), [topics]);
  const last = useMemo(() => {
    const entries = Object.entries(progress).filter(([id]) => byId[id] && progress[id].lastStudiedAt && progress[id].lastStudiedAt.toMillis);
    entries.sort((a, b) => b[1].lastStudiedAt.toMillis() - a[1].lastStudiedAt.toMillis());
    return entries[0] ? byId[entries[0][0]] : null;
  }, [progress, byId]);
  const saved = topics.filter((t) => progress[t.id] && progress[t.id].bookmarked);
  const anyBatch = data.batches.length > 0;

  return (
    <div className="ap-stack" style={{ gap: 18 }}>
      <PageHead title="All courses" description="Pick your class or exam, choose a batch, then open a subject to study chapter by chapter." />
      {last && (
        <section className="ap-card ap-continue" aria-label="Continue learning">
          <p className="ap-muted"><Clock size={14} aria-hidden="true" /> Continue where you left off</p>
          <h2>{last.title}</h2>
          <Link className="ap-btn ap-btn--accent" style={{ justifySelf: 'start' }} to={`/hub/topic/${last.id}`}>Continue</Link>
        </section>
      )}
      {!anyBatch && <EmptyState title="Nothing is published yet">Pick your class below. Lectures, notes and practice appear in each course as soon as your teachers publish them.</EmptyState>}
      <CourseEntryPoints data={data} isAdmin={isAdmin} />
      {user && saved.length > 0 && (
        <section className="ap-card ap-panel" aria-label="Saved topics">
          <h2><Bookmark size={18} aria-hidden="true" /> Saved topics</h2>
          <ul className="ap-bullets">{saved.map((t) => <li key={t.id}><Link to={`/hub/topic/${t.id}`}>{t.title}</Link></li>)}</ul>
        </section>
      )}
    </div>
  );
}

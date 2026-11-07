import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, Clock, Users } from 'lucide-react';
import { findCourse, buildTree, batchSubjects, batchTeachers, subjectProgress, batchProgress } from '../../cms/model';
import { PageHead, ProgressBar, EmptyState } from '../../components/learn/shared';
import { useHub } from './HubContext';
import NotFound from '../NotFound';
import '../../styles/hub.css';

/** Step 3: the batch dashboard. */
export default function HubBatch() {
  const { classId, batchId } = useParams();
  const { data, progress, enrolled, enroll, leave, user } = useHub();
  const batch = data.batches.find((b) => b.id === batchId && b.classId === classId);
  const course = findCourse(data, classId);
  const subjects = useMemo(() => {
    if (!batch) return [];
    const ids = new Set(batchSubjects(data, batch).map((s) => s.id));
    const tree = buildTree(data, classId).filter((s) => ids.has(s.id));
    return (batch.subjectIds || []).map((id) => tree.find((s) => s.id === id)).filter(Boolean);
  }, [data, batch, classId]);
  const topicIds = useMemo(() => new Set(subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics.map((t) => t.id)))), [subjects]);
  const topics = useMemo(() => subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics.map((t) => ({ ...t, subjectId: s.id })))), [subjects]);
  const recent = useMemo(() => {
    const stamp = (id) => (progress[id] && progress[id].lastStudiedAt && progress[id].lastStudiedAt.toMillis ? progress[id].lastStudiedAt.toMillis() : 0);
    return topics.filter((t) => stamp(t.id)).sort((a, b) => stamp(b.id) - stamp(a.id)).slice(0, 5);
  }, [topics, progress]);
  if (!batch || !course) return <NotFound what="batch" />;
  const teachers = batchTeachers(data, batch);
  const total = batchProgress(subjects, progress);
  const joined = enrolled.includes(batch.id);
  const next = recent.length ? recent[0] : topics.find((t) => !(progress[t.id] && progress[t.id].completed)) || topics[0];
  const chapters = subjects.flatMap((s) => s.chapters.map((c) => ({ ...c, subject: s })));
  const qs = `?batch=${batch.id}`;

  return (
    <div className="ap-stack" style={{ gap: 16 }}>
      <nav className="ap-crumbs" aria-label="Breadcrumb"><Link to="/hub">All courses</Link> / <Link to={`/hub/${classId}`}>{course.title}</Link> / <span aria-current="page">{batch.name}</span></nav>
      <PageHead title={batch.name} description={batch.description || ''} />
      <section className="ap-card ap-panel hub-overview" aria-label="Batch overview">
        {batch.coverUrl && <img className="hub-overview__cover" src={batch.coverUrl} alt="" loading="lazy" />}
        <div className="ap-stack" style={{ gap: 8 }}>
          <p className="ap-muted">{[batch.session && `Session ${batch.session}`, batch.duration && `Duration ${batch.duration}`, `${subjects.length} subjects`, `${topics.length} topics`].filter(Boolean).join(' · ')}</p>
          <ProgressBar percent={total.percent} label={`${batch.name} progress`} />
          <p><strong>{total.done}/{total.total}</strong> topics completed</p>
          <div className="ap-row ap-row--wrap">
            {next && <Link className="ap-btn ap-btn--accent" to={`/hub/topic/${next.id}${qs}`}><Clock size={16} aria-hidden="true" /> {recent.length ? 'Continue learning' : 'Start learning'}</Link>}
            {joined ? <button type="button" className="ap-btn ap-btn--ghost" onClick={() => leave && leave(batch.id).catch(() => {})}>Enrolled. Leave batch</button>
              : user && enroll ? <button type="button" className="ap-btn ap-btn--primary" onClick={() => enroll(batch.id, classId).catch(() => {})}>Enroll in this batch</button>
              : <Link className="ap-btn ap-btn--primary" to="/login">Log in to enroll</Link>}
          </div>
        </div>
      </section>

      <section aria-label="Subjects">
        <h2><BookOpen size={18} aria-hidden="true" /> Subjects</h2>
        {!subjects.length ? <EmptyState title="No subjects yet">Subjects for this batch will appear once your teachers publish them.</EmptyState> : (
          <div className="ap-grid-3">
            {subjects.map((s) => {
              const sp = subjectProgress(s, progress);
              return (
                <Link key={s.id} to={`/hub/${classId}/${batch.id}/${s.id}`} className="ap-card hub-subject">
                  {s.imageUrl && <img src={s.imageUrl} alt="" loading="lazy" className="hub-subject__img" />}
                  <h3>{s.name}</h3>
                  <p className="ap-muted">{s.chapters.length} chapters · {sp.done}/{sp.total} topics</p>
                  <ProgressBar percent={sp.percent} label={`${s.name} progress`} />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section aria-label="Chapters" className="ap-card ap-panel">
        <h2>Chapters</h2>
        {!chapters.length ? <p className="ap-muted">No chapters published yet.</p> : (
          <ul className="ap-bullets">{chapters.map((c) => <li key={c.id}><Link to={`/hub/${classId}/${batch.id}/${c.subject.id}?chapter=${c.id}`}>{c.subject.name}: {c.number ? `Chapter ${c.number}: ` : ''}{c.title}</Link></li>)}</ul>
        )}
      </section>

      <section aria-label="Teachers" className="ap-card ap-panel">
        <h2><Users size={18} aria-hidden="true" /> Teachers</h2>
        {!teachers.length ? <p className="ap-muted">Teachers for this batch will be announced soon.</p> : (
          <ul className="hub-teachers">{teachers.map((t) => (
            <li key={t.id}>{t.photoUrl && <img src={t.photoUrl} alt="" loading="lazy" />}<div><strong>{t.name}</strong>{t.subjects && <div className="ap-muted">{t.subjects}</div>}{t.bio && <p>{t.bio}</p>}</div></li>
          ))}</ul>
        )}
      </section>

      {recent.length > 0 && (
        <section aria-label="Recently studied" className="ap-card ap-panel">
          <h2>Recently studied</h2>
          <ul className="ap-bullets">{recent.filter((t) => topicIds.has(t.id)).map((t) => <li key={t.id}><Link to={`/hub/topic/${t.id}${qs}`}>{t.title}</Link></li>)}</ul>
        </section>
      )}
    </div>
  );
}

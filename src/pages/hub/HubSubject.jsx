import React, { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Bookmark, ChevronDown, ClipboardList, FileText, HelpCircle, PlayCircle, Search } from 'lucide-react';
import { findCourse, buildTree, chapterProgress, subjectProgress, batchProgress, difficultyLabel, DIFFICULTIES, splitQuestions } from '../../cms/model';
import { PageHead, ProgressBar, EmptyState } from '../../components/learn/shared';
import { useHub } from './HubContext';
import NotFound from '../NotFound';
import '../../styles/hub.css';

/** Step 4: a subject's chapters as an expandable tracker (batch > subject > chapters > topics). */
export default function HubSubject() {
  const { classId, batchId, subjectId } = useParams();
  const { data, progress, progressActions } = useHub();
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('');
  const [open, setOpen] = useState(() => (params.get('chapter') ? { [params.get('chapter')]: true } : {}));
  const batch = data.batches.find((b) => b.id === batchId && b.classId === classId);
  const course = findCourse(data, classId);
  const inBatch = !!batch && (batch.subjectIds || []).includes(subjectId);
  const tree = useMemo(() => buildTree(data, classId), [data, classId]);
  const batchTree = useMemo(() => (batch ? tree.filter((s) => (batch.subjectIds || []).includes(s.id)) : []), [tree, batch]);
  const subject = batchTree.find((s) => s.id === subjectId);
  if (!batch || !course || !inBatch || !subject) return <NotFound what="subject" />;

  const needle = q.trim().toLowerCase();
  const filtering = !!(needle || level);
  const chapters = subject.chapters
    .map((c) => ({ ...c, shown: c.topics.filter((t) => (!needle || t.title.toLowerCase().includes(needle) || c.title.toLowerCase().includes(needle)) && (!level || difficultyLabel(t.difficulty) === level)) }))
    .filter((c) => c.shown.length || (!needle && !level));
  const isOpen = (c, i) => (filtering ? true : open[c.id] !== undefined ? open[c.id] : i === 0);
  const setAll = (value) => setOpen(Object.fromEntries(subject.chapters.map((c) => [c.id, value])));
  const sp = subjectProgress(subject, progress);
  const bp = batchProgress(batchTree, progress);
  const qs = `?batch=${batch.id}`;

  return (
    <div className="ap-stack" style={{ gap: 16 }}>
      <nav className="ap-crumbs" aria-label="Breadcrumb">
        <Link to="/hub">All courses</Link> / <Link to={`/hub/${classId}`}>{course.title}</Link> / <Link to={`/hub/${classId}/${batch.id}`}>{batch.name}</Link> / <span aria-current="page">{subject.name}</span>
      </nav>
      <PageHead title={subject.name} description={subject.description || 'Open a chapter to see its topics. Each topic has its own lecture, notes, DPP and practice.'} />
      <section className="ap-card ap-panel hub-summary" aria-label="Progress">
        <div><strong>{subject.name}</strong><span className="ap-muted"> {sp.done}/{sp.total} topics</span><ProgressBar percent={sp.percent} label={`${subject.name} progress`} /></div>
        <div><strong>{batch.name}</strong><span className="ap-muted"> {bp.done}/{bp.total} topics</span><ProgressBar percent={bp.percent} label={`${batch.name} progress`} /></div>
      </section>

      <div className="ap-tabs hub-subjects" role="group" aria-label="Subjects in this batch">
        {batchTree.map((s) => <Link key={s.id} className="ap-tab" aria-current={s.id === subjectId ? 'page' : undefined} to={`/hub/${classId}/${batch.id}/${s.id}`}>{s.name}</Link>)}
      </div>

      <div className="ap-filters hub-filters">
        <div className="ap-search"><Search size={16} aria-hidden="true" /><input type="search" className="ap-input" placeholder="Search topics or chapters" aria-label="Search topics or chapters" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="ap-input" aria-label="Difficulty" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All difficulty levels</option>
          {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
        </select>
        <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setAll(true)}>Expand all</button>
        <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setAll(false)}>Collapse all</button>
      </div>

      {!chapters.length ? (
        <EmptyState title={filtering ? 'No topics match your search' : 'No chapters yet'}>{filtering ? 'Try a different word or level.' : `${subject.name} chapters are coming soon.`}</EmptyState>
      ) : chapters.map((c, i) => {
        const pr = chapterProgress(c, progress);
        const expanded = isOpen(c, i);
        return (
          <section key={c.id} className="ap-card hub-chapter">
            <button type="button" className="hub-chapter__head" aria-expanded={expanded} aria-controls={`ch-${c.id}`} onClick={() => setOpen((o) => ({ ...o, [c.id]: !expanded }))}>
              <ChevronDown size={18} aria-hidden="true" className={expanded ? 'is-open' : ''} />
              <span className="hub-chapter__title">{c.number ? `Chapter ${c.number}: ` : ''}{c.title}</span>
              <span className="hub-chapter__count">{pr.done}/{pr.total} topics completed</span>
            </button>
            <ProgressBar percent={pr.percent} label={`${c.title} progress`} />
            {expanded && (
              <ul id={`ch-${c.id}`} className="hub-topics">
                {!c.shown.length && <li className="ap-muted hub-empty">Topics are coming soon.</li>}
                {c.shown.map((t) => {
                  const p = progress[t.id] || {};
                  const { practice, dpp } = splitQuestions(t.questions);
                  const dppCount = t.dpps.length + dpp.length;
                  const label = difficultyLabel(t.difficulty);
                  const base = `/hub/topic/${t.id}`;
                  return (
                    <li key={t.id} className="hub-topic">
                      <button type="button" role="checkbox" aria-checked={!!p.completed} aria-label={`Mark ${t.title} as completed`} disabled={!progressActions} title={progressActions ? 'Mark as completed' : 'Log in to track progress'} className={`hub-check ${p.completed ? 'is-on' : ''}`} onClick={() => progressActions.setCompleted(t.id, !p.completed)} />
                      <Link className="hub-topic__name" to={`${base}${qs}`}>{t.title}</Link>
                      <span className={`hub-level hub-level--${label.toLowerCase()}`}>{label}</span>
                      <span className="hub-icons">
                        <Link to={`${base}${qs}&tab=lecture`} className={`hub-ico ${t.lectures.length ? '' : 'is-off'}`} aria-label={`Video lectures: ${t.lectures.length}`} title={t.lectures.length ? `${t.lectures.length} lecture(s)` : 'No lecture yet'}><PlayCircle size={18} /></Link>
                        <Link to={`${base}${qs}&tab=notes`} className={`hub-ico ${t.resources.length ? '' : 'is-off'}`} aria-label={`Notes and PDFs: ${t.resources.length}`} title={t.resources.length ? `${t.resources.length} notes` : 'No notes yet'}><FileText size={18} /></Link>
                        <Link to={`${base}${qs}&tab=dpp`} className={`hub-ico ${dppCount ? '' : 'is-off'}`} aria-label={`DPP: ${dppCount}`} title={dppCount ? `${dppCount} DPP item(s)` : 'No DPP yet'}><ClipboardList size={18} /></Link>
                        <Link to={`${base}${qs}&tab=practice`} className={`hub-ico ${practice.length ? '' : 'is-off'}`} aria-label={`Practice questions: ${practice.length}`} title={practice.length ? `${practice.length} question(s)` : 'No questions yet'}><HelpCircle size={18} /></Link>
                        <button type="button" className={`hub-ico hub-bookmark ${p.bookmarked ? 'is-on' : ''}`} aria-pressed={!!p.bookmarked} aria-label={`Save ${t.title}`} title={progressActions ? 'Save this topic' : 'Log in to save topics'} disabled={!progressActions} onClick={() => progressActions.setBookmarked(t.id, !p.bookmarked)}><Bookmark size={18} /></button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {expanded && c.dpps.length > 0 && (
              <div className="hub-chapter__dpp">
                <strong>Chapter DPP:</strong>{' '}
                {c.dpps.map((d) => <a key={d.id} href={d.driveUrl || d.externalUrl} target="_blank" rel="noopener noreferrer">{d.title}</a>).reduce((a, b) => [a, ' · ', b])}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

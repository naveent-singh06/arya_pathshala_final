import React, { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Bookmark, ChevronDown, FileText, HelpCircle, PlayCircle, Search } from 'lucide-react';
import { getCategory } from '../../data/categories';
import { buildTree, chapterProgress, DIFFICULTIES } from '../../cms/model';
import { PageHead, ProgressBar, EmptyState } from '../../components/learn/shared';
import { useHub } from './HubContext';
import NotFound from '../NotFound';
import '../../styles/hub.css';

export default function HubClass() {
  const { classId } = useParams();
  const category = getCategory(classId);
  const { data, progress, progressActions } = useHub();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('');
  const [open, setOpen] = useState({});
  const tree = useMemo(() => buildTree(data, classId), [data, classId]);
  if (!category) return <NotFound what="class" />;

  const subject = tree.find((s) => s.id === params.get('subject')) || tree[0];
  const needle = q.trim().toLowerCase();
  const chapters = subject
    ? subject.chapters
        .map((c) => ({ ...c, shown: c.topics.filter((t) => (!needle || t.title.toLowerCase().includes(needle) || c.title.toLowerCase().includes(needle)) && (!level || t.difficulty === level)) }))
        .filter((c) => c.shown.length || (!needle && !level))
    : [];
  const filtering = !!(needle || level);
  const toggleOpen = (id, cur) => setOpen((o) => ({ ...o, [id]: !cur }));

  return (
    <div className="ap-stack" style={{ gap: 16 }}>
      <nav className="ap-crumbs" aria-label="Breadcrumb"><Link to="/hub">Study Hub</Link> / <span aria-current="page">{category.title}</span></nav>
      <PageHead title={category.title} description="Open a chapter to see its topics. Each topic has its own lecture, notes and practice." />

      {!tree.length ? (
        <EmptyState title="Nothing published here yet">Subjects for {category.title} will appear as soon as your teachers publish them.</EmptyState>
      ) : (
        <>
          <div className="ap-tabs hub-subjects" role="group" aria-label="Subjects">
            {tree.map((s) => (
              <button key={s.id} type="button" className="ap-tab" aria-pressed={subject.id === s.id} onClick={() => setParams({ subject: s.id })}>{s.name}</button>
            ))}
          </div>
          <div className="ap-filters hub-filters">
            <div className="ap-search"><Search size={16} aria-hidden="true" /><input type="search" className="ap-input" placeholder="Search topics or chapters" aria-label="Search topics or chapters" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <select className="ap-input" aria-label="Difficulty" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">All difficulty levels</option>
              {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>

          {!chapters.length ? (
            <EmptyState title={filtering ? 'No topics match your search' : 'No chapters yet'}>{filtering ? 'Try a different word or level.' : `${subject.name} chapters are coming soon.`}</EmptyState>
          ) : chapters.map((c) => {
            const pr = chapterProgress(c, progress);
            const isOpen = filtering ? true : open[c.id] !== undefined ? open[c.id] : c.id === (subject.chapters[0] || {}).id;
            return (
              <section key={c.id} className="ap-card hub-chapter">
                <button type="button" className="hub-chapter__head" aria-expanded={isOpen} aria-controls={`ch-${c.id}`} onClick={() => toggleOpen(c.id, isOpen)}>
                  <ChevronDown size={18} aria-hidden="true" className={isOpen ? 'is-open' : ''} />
                  <span className="hub-chapter__title">{c.number ? `Chapter ${c.number}: ` : ''}{c.title}</span>
                  <span className="hub-chapter__count">{pr.done}/{pr.total} topics completed</span>
                </button>
                <ProgressBar percent={pr.percent} label={`${c.title} progress`} />
                {isOpen && (
                  <ul id={`ch-${c.id}`} className="hub-topics">
                    {!c.shown.length && <li className="ap-muted hub-empty">Topics are coming soon.</li>}
                    {c.shown.map((t) => {
                      const p = progress[t.id] || {};
                      return (
                        <li key={t.id} className="hub-topic">
                          <button type="button" role="checkbox" aria-checked={!!p.completed} aria-label={`Mark ${t.title} as completed`} disabled={!progressActions} title={progressActions ? 'Mark as completed' : 'Log in to track progress'} className={`hub-check ${p.completed ? 'is-on' : ''}`} onClick={() => progressActions.setCompleted(t.id, !p.completed)} />
                          <Link className="hub-topic__name" to={`/hub/topic/${t.id}`}>{t.title}</Link>
                          <span className={`hub-level hub-level--${(t.difficulty || 'Basic').toLowerCase()}`}>{t.difficulty || 'Basic'}</span>
                          <span className="hub-icons">
                            <Link to={`/hub/topic/${t.id}?tab=lecture`} className={`hub-ico ${t.lectures.length ? '' : 'is-off'}`} aria-label={`Lectures: ${t.lectures.length}`} title={t.lectures.length ? `${t.lectures.length} lecture(s)` : 'No lecture yet'}><PlayCircle size={18} /></Link>
                            <Link to={`/hub/topic/${t.id}?tab=notes`} className={`hub-ico ${t.resources.length ? '' : 'is-off'}`} aria-label={`Notes and PDFs: ${t.resources.length}`} title={t.resources.length ? `${t.resources.length} notes` : 'No notes yet'}><FileText size={18} /></Link>
                            <Link to={`/hub/topic/${t.id}?tab=practice`} className={`hub-ico ${t.questions.length ? '' : 'is-off'}`} aria-label={`Practice questions: ${t.questions.length}`} title={t.questions.length ? `${t.questions.length} question(s)` : 'No questions yet'}><HelpCircle size={18} /></Link>
                            <button type="button" className={`hub-ico hub-bookmark ${p.bookmarked ? 'is-on' : ''}`} aria-pressed={!!p.bookmarked} aria-label={`Save ${t.title}`} title={progressActions ? 'Save this topic' : 'Log in to save topics'} disabled={!progressActions} onClick={() => progressActions.setBookmarked(t.id, !p.bookmarked)}><Bookmark size={18} /></button>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}

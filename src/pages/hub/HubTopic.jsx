import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, Download, Bookmark } from 'lucide-react';
import { buildTree, flatTopics } from '../../cms/model';
import { getCategory } from '../../data/categories';
import { youTubeEmbedUrl, youTubeWatchUrl } from '../../cms/youtube';
import { parseDrive } from '../../cms/drive';
import { loadNote, saveNote, deleteNote } from '../../cms/userData';
import { Tabs, TabPanel, EmptyState } from '../../components/learn/shared';
import { useHub } from './HubContext';
import NotFound from '../NotFound';
import '../../styles/hub.css';

const TABS = [
  { id: 'lecture', label: 'Video lecture' },
  { id: 'notes', label: 'Handwritten notes' },
  { id: 'practice', label: 'Practice' },
  { id: 'mine', label: 'My notes' },
];

function Lectures({ lectures }) {
  const [i, setI] = useState(0);
  if (!lectures.length) return <EmptyState title="Lecture coming soon">The video for this topic has not been published yet.</EmptyState>;
  const l = lectures[Math.min(i, lectures.length - 1)];
  return (
    <div className="ap-stack" style={{ gap: 12 }}>
      <div className="ap-video"><iframe key={l.id} title={l.title} src={youTubeEmbedUrl(l.youtubeVideoId)} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen /></div>
      <h2>{l.title}</h2>
      <p className="ap-muted">{[l.teacherName && `Taught by ${l.teacherName}`, l.duration && `Duration ${l.duration}`].filter(Boolean).join(' · ')}</p>
      {l.description && <p>{l.description}</p>}
      <p className="ap-muted">If the video does not play, its owner may have turned off embedding.</p>
      <a className="ap-btn ap-btn--accent" style={{ justifySelf: 'start' }} href={youTubeWatchUrl(l.youtubeVideoId)} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" /> Watch lecture on YouTube</a>
      {lectures.length > 1 && (
        <ol className="hub-playlist" aria-label="Lectures in this topic">
          {lectures.map((x, n) => <li key={x.id}><button type="button" className={`ap-btn ap-btn--sm ${n === i ? 'ap-btn--primary' : 'ap-btn--ghost'}`} aria-current={n === i} onClick={() => setI(n)}>{n + 1}. {x.title}</button></li>)}
        </ol>
      )}
    </div>
  );
}

function Notes({ resources }) {
  const [viewing, setViewing] = useState(null);
  if (!resources.length) return <EmptyState title="Notes coming soon">The handwritten notes for this topic have not been published yet.</EmptyState>;
  return (
    <ul className="hub-res">
      {resources.map((r) => {
        const d = parseDrive(r.driveUrl);
        return (
          <li key={r.id} className="ap-card ap-panel">
            <h3>{r.title}</h3>
            <p className="ap-muted">{r.type}{r.updatedAt && r.updatedAt.toDate ? ` · Updated ${r.updatedAt.toDate().toLocaleDateString()}` : ''}</p>
            {r.description && <p>{r.description}</p>}
            <div className="ap-row ap-row--wrap">
              <a className="ap-btn ap-btn--primary ap-btn--sm" href={r.driveUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" /> Open in Google Drive</a>
              {d.ok && <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" aria-expanded={viewing === r.id} onClick={() => setViewing(viewing === r.id ? null : r.id)}>{viewing === r.id ? 'Hide viewer' : 'Read here'}</button>}
              {d.ok && d.downloadUrl && <a className="ap-btn ap-btn--ghost ap-btn--sm" href={d.downloadUrl} target="_blank" rel="noopener noreferrer"><Download size={16} aria-hidden="true" /> Download</a>}
            </div>
            {d.ok && viewing === r.id && (
              <>
                <div className="adm-pdf"><iframe title={r.title} src={d.previewUrl} /></div>
                <p className="ap-muted">If you see a sign-in or "access denied" page, this file is not shared with students yet. Tell your teacher, or use "Open in Google Drive".</p>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Practice({ topic, questions, onAttempt, attempts, last }) {
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  if (!questions.length) return <EmptyState title="Questions coming soon">Practice questions for this topic have not been published yet.</EmptyState>;
  const score = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const finish = () => {
    setDone(true);
    onAttempt(score, questions.length);
  };
  return (
    <div className="ap-stack" style={{ gap: 14 }}>
      {attempts > 0 && <p className="ap-muted">Attempts: {attempts}{last ? ` · Last score ${last.score}/${last.total}` : ''}</p>}
      {done && (
        <div className="ap-card ap-score" role="status">
          <h2>You scored {score} out of {questions.length}</h2>
          <button type="button" className="ap-btn ap-btn--primary" style={{ justifySelf: 'start' }} onClick={() => { setAnswers({}); setDone(false); }}>Try again</button>
        </div>
      )}
      {questions.map((q, n) => {
        const chosen = answers[q.id];
        const show = done || chosen !== undefined;
        return (
          <fieldset key={q.id} className="ap-card ap-question">
            <legend><span className="ap-question__n">{n + 1}</span> {q.question}</legend>
            <div className="ap-options">
              {q.options.map((o, i) => {
                const cls = show ? (i === q.correctIndex ? 'is-right' : chosen === i ? 'is-wrong' : '') : chosen === i ? 'is-chosen' : '';
                return (
                  <label key={i} className={`ap-option ${cls}`}>
                    <input type="radio" name={q.id} checked={chosen === i} disabled={done} onChange={() => setAnswers((a) => ({ ...a, [q.id]: i }))} />
                    <span>{String.fromCharCode(65 + i)}. {o}</span>
                  </label>
                );
              })}
            </div>
            {show && chosen !== undefined && (
              <p className="ap-explain" role="status"><strong>{chosen === q.correctIndex ? 'Correct. ' : 'Not quite. '}</strong>{q.explanation || `The correct answer is ${String.fromCharCode(65 + q.correctIndex)}.`}</p>
            )}
          </fieldset>
        );
      })}
      {!done && <button type="button" className="ap-btn ap-btn--accent" style={{ justifySelf: 'start' }} disabled={Object.keys(answers).length === 0} onClick={finish}>Finish and save my score</button>}
    </div>
  );
}

function MyNotes({ user, topicId }) {
  const [text, setText] = useState('');
  const [state, setState] = useState('loading');
  const [msg, setMsg] = useState('');
  useEffect(() => {
    let live = true;
    setState('loading');
    if (!user) {
      setState('signedout');
      return undefined;
    }
    loadNote(user.uid, topicId)
      .then((t) => live && (setText(t), setState('ready')))
      .catch(() => live && setState('error'));
    return () => { live = false; };
  }, [user, topicId]);
  if (state === 'signedout') return <EmptyState title="Log in to keep your own notes" action={<Link className="ap-btn ap-btn--primary" to="/login">Log in</Link>}>Your notes are private and saved to your account.</EmptyState>;
  if (state === 'loading') return <p className="ap-muted" role="status">Loading your notes…</p>;
  if (state === 'error') return <p className="adm-err" role="alert">Your notes could not be loaded. Try again later.</p>;
  const act = async (fn, ok) => {
    try { await fn(); setMsg(ok); } catch (e) { setMsg('Could not save. Try again.'); }
  };
  return (
    <div className="ap-stack" style={{ gap: 10 }}>
      <label htmlFor="my-notes"><strong>Your personal notes</strong> <span className="ap-muted">(only you can see these, separate from your teacher's notes)</span></label>
      <textarea id="my-notes" className="ap-input" rows={8} maxLength={8000} value={text} onChange={(e) => { setText(e.target.value); setMsg(''); }} />
      <div className="ap-row ap-row--wrap">
        <button type="button" className="ap-btn ap-btn--primary" onClick={() => act(() => saveNote(user.uid, topicId, text), 'Saved.')} disabled={!text.trim()}>Save notes</button>
        <button type="button" className="ap-btn ap-btn--ghost" onClick={() => act(async () => { await deleteNote(user.uid, topicId); setText(''); }, 'Notes deleted.')}>Delete notes</button>
        {msg && <span role="status" className="ap-muted">{msg}</span>}
      </div>
    </div>
  );
}

export default function HubTopic() {
  const { topicId } = useParams();
  const [params, setParams] = useSearchParams();
  const { data, user, progress, progressActions } = useHub();
  const topic = data.topics.find((t) => t.id === topicId);
  const tree = useMemo(() => (topic ? buildTree(data, topic.classId) : []), [data, topic]);
  const subject = tree.find((s) => s.id === (topic && topic.subjectId));
  const flat = useMemo(() => flatTopics(subject), [subject]);
  const full = flat.find((t) => t.id === topicId);
  const idx = flat.findIndex((t) => t.id === topicId);
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'lecture';
  const p = progress[topicId] || {};

  useEffect(() => {
    if (progressActions && topic) progressActions.visit(topic.id, topic.title).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, !!progressActions]);

  if (!topic || !full) return <NotFound what="topic" />;
  const chapter = subject.chapters.find((c) => c.id === topic.chapterId);
  const category = getCategory(topic.classId);

  return (
    <div className="ap-stack" style={{ gap: 16 }}>
      <nav className="ap-crumbs" aria-label="Breadcrumb">
        <Link to="/hub">Study Hub</Link> / <Link to={`/hub/${topic.classId}?subject=${subject.id}`}>{category ? category.title : topic.classId} · {subject.name}</Link> / <span aria-current="page">{topic.title}</span>
      </nav>
      <header className="ap-lecturehead">
        <h1>{topic.title}</h1>
        <p className="ap-muted">{subject.name}{chapter ? `, ${chapter.number ? `Chapter ${chapter.number}: ` : ''}${chapter.title}` : ''} · {topic.difficulty || 'Basic'}</p>
        {topic.description && <p>{topic.description}</p>}
      </header>
      <div className="ap-navrow">
        {idx > 0 ? <Link className="ap-btn ap-btn--ghost" to={`/hub/topic/${flat[idx - 1].id}`}><ChevronLeft size={18} aria-hidden="true" /> Previous topic</Link> : <button type="button" className="ap-btn ap-btn--ghost" disabled><ChevronLeft size={18} aria-hidden="true" /> Previous topic</button>}
        <button type="button" className={`ap-btn ${p.completed ? 'ap-btn--ghost' : 'ap-btn--accent'}`} aria-pressed={!!p.completed} disabled={!progressActions} title={progressActions ? undefined : 'Log in to track progress'} onClick={() => progressActions.setCompleted(topicId, !p.completed)}><CheckCircle2 size={18} aria-hidden="true" /> {p.completed ? 'Completed. Undo' : 'Mark as completed'}</button>
        <button type="button" className="ap-btn ap-btn--ghost" aria-pressed={!!p.bookmarked} disabled={!progressActions} title={progressActions ? undefined : 'Log in to save topics'} onClick={() => progressActions.setBookmarked(topicId, !p.bookmarked)}><Bookmark size={18} aria-hidden="true" /> {p.bookmarked ? 'Saved' : 'Save topic'}</button>
        {idx < flat.length - 1 ? <Link className="ap-btn ap-btn--primary" to={`/hub/topic/${flat[idx + 1].id}`}>Next topic <ChevronRight size={18} aria-hidden="true" /></Link> : <button type="button" className="ap-btn ap-btn--primary" disabled>Next topic <ChevronRight size={18} aria-hidden="true" /></button>}
      </div>
      <Tabs tabs={TABS.map((t) => ({ ...t, label: `${t.label}${t.id === 'lecture' ? ` (${full.lectures.length})` : t.id === 'notes' ? ` (${full.resources.length})` : t.id === 'practice' ? ` (${full.questions.length})` : ''}` }))} active={tab} onChange={(id) => setParams({ tab: id }, { replace: true })} label="Topic sections" />
      <TabPanel id={tab}>
        {tab === 'lecture' && <Lectures lectures={full.lectures} />}
        {tab === 'notes' && <Notes resources={full.resources} />}
        {tab === 'practice' && <Practice key={topicId} topic={topic} questions={full.questions} attempts={p.attempts || 0} last={p.lastScore !== undefined ? { score: p.lastScore, total: p.lastTotal } : null} onAttempt={(s, t) => progressActions && progressActions.recordAttempt(topicId, s, t).catch(() => {})} />}
        {tab === 'mine' && <MyNotes user={user} topicId={topicId} />}
      </TabPanel>
    </div>
  );
}

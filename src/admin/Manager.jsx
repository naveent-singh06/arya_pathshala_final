import React, { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2, Search, ExternalLink } from 'lucide-react';
import { MANAGERS } from './configs';
import { Field, HierarchyPicker, ConfirmDialog, Notice, StatusBadge, Pager } from './ui';
import { useAdmin } from './AdminContext';
import { createItem, updateItem, deleteItem, applyOrder, describeError } from '../cms/store';
import { clearSocialCache } from '../cms/hooks';
import { CLASSES, byOrder, nextOrder, reorderPairs } from '../cms/model';
import { parseYouTube, youTubeEmbedUrl } from '../cms/youtube';
import { parseDrive, DRIVE_SHARING_HINT } from '../cms/drive';
import { PLATFORMS } from '../cms/links';

const PAGE = 10;
const SCOPE_KEYS = ['classId', 'subjectId', 'chapterId', 'topicId'];
const itemTitle = (item, key) => String(item[key] || '');
const className = (id) => (CLASSES.find((c) => c.id === id) || {}).title || id;

function Preview({ kind, form }) {
  if (kind === 'lectures') {
    const yt = parseYouTube(form.youtubeUrl);
    if (!form.youtubeUrl) return <p className="ap-muted">Paste a YouTube link to see the video here.</p>;
    if (!yt.ok) return <Notice kind="error">{yt.error}</Notice>;
    return (
      <div className="ap-stack" style={{ gap: 8 }}>
        <div className="ap-video"><iframe title="Lecture preview" src={youTubeEmbedUrl(yt.id)} allow="encrypted-media; picture-in-picture" allowFullScreen /></div>
        <p className="ap-muted">Video ID <code>{yt.id}</code>. If the preview says the video cannot be played here, the owner has switched off embedding; students will get an "Open on YouTube" link instead.</p>
      </div>
    );
  }
  if (kind === 'resources') {
    const d = parseDrive(form.driveUrl);
    if (!form.driveUrl) return <p className="ap-muted">Paste a Google Drive link to check it here.</p>;
    if (!d.ok) return <Notice kind="error">{d.error}</Notice>;
    return (
      <div className="ap-stack" style={{ gap: 8 }}>
        <div className="adm-pdf"><iframe title="PDF preview" src={d.previewUrl} /></div>
        <p className="ap-muted">If this shows a sign-in or "access denied" page, students cannot open the file yet. Change the sharing setting in Google Drive.</p>
      </div>
    );
  }
  if (kind === 'questions') {
    if (!form.question) return <p className="ap-muted">The question appears here as students will see it.</p>;
    return (
      <div className="ap-stack" style={{ gap: 6 }}>
        <strong>{form.question}</strong>
        {['o0', 'o1', 'o2', 'o3'].map((k, i) => (
          <div key={k} className={`ap-option ${String(form.correctIndex) === String(i) ? 'is-correct' : ''}`}>{String.fromCharCode(65 + i)}. {form[k] || '…'}</div>
        ))}
      </div>
    );
  }
  return null;
}

export default function Manager({ name: nameProp }) {
  const params = useParams();
  const name = nameProp || params.section;
  if (!MANAGERS[name]) return <Notice kind="error">This section does not exist.</Notice>;
  return <ManagerInner key={name} name={name} cfg={MANAGERS[name]} />;
}

function ManagerInner({ name, cfg }) {
  const { user, content } = useAdmin();
  const { data, reload } = content;
  const formRef = useRef(null);
  const [filter, setFilter] = useState({ classId: '', subjectId: '', chapterId: '', topicId: '' });
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const list = useMemo(() => data[name] || [], [data, name]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list
      .filter((x) => SCOPE_KEYS.slice(0, cfg.levels).every((k) => !filter[k] || x[k] === filter[k]))
      .filter((x) => !statusFilter || (cfg.noStatus ? (x.active !== false ? 'published' : 'unpublished') === statusFilter : x.status === statusFilter))
      .filter((x) => !needle || itemTitle(x, cfg.titleKey).toLowerCase().includes(needle))
      .sort(cfg.noStatus ? (a, b) => (a.order || 0) - (b.order || 0) : byOrder);
  }, [list, filter, q, statusFilter, cfg]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice((Math.min(page, pages) - 1) * PAGE, Math.min(page, pages) * PAGE);

  const siblings = (scope) => list.filter((x) => !cfg.parent || x[cfg.parent] === scope[cfg.parent]);
  const parentLabel = (x) => {
    const sub = (data.subjects || []).find((s) => s.id === x.subjectId);
    const ch = (data.chapters || []).find((c) => c.id === x.chapterId);
    const tp = (data.topics || []).find((t) => t.id === x.topicId);
    return [x.classId && className(x.classId), sub && sub.name, ch && ch.title, tp && tp.title].filter(Boolean).join(' › ');
  };

  const openNew = () => {
    const scope = {};
    SCOPE_KEYS.slice(0, cfg.levels).forEach((k) => {
      scope[k] = filter[k] || '';
    });
    setForm({ ...scope, order: String(nextOrder(siblings(scope))), difficulty: 'Basic', type: 'Chapter Notes', correctIndex: '0', platform: '', active: true });
    setErrors({});
    setMsg(null);
    setEditing('new');
    setTimeout(() => formRef.current && formRef.current.scrollIntoView && formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };
  const openEdit = (item) => {
    setForm(cfg.toForm ? cfg.toForm(item) : { ...item, order: String(item.order || 0) });
    setErrors({});
    setMsg(null);
    setEditing(item);
    setTimeout(() => formRef.current && formRef.current.scrollIntoView && formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };
  const close = () => {
    setEditing(null);
    setErrors({});
  };

  const run = async (fn, okMessage) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      if (name === 'socialLinks') clearSocialCache();
      reload();
      setMsg({ kind: 'ok', text: okMessage });
      return true;
    } catch (e) {
      setMsg({ kind: 'error', text: describeError(e) });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const save = async (status) => {
    if (busy) return; // no duplicate submissions
    const { errors: errs, data: doc } = cfg.build(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setMsg({ kind: 'error', text: 'Fix the highlighted fields and try again.' });
      return;
    }
    const payload = cfg.noStatus ? { ...doc, active: form.active !== false } : { ...doc, status };
    const isNew = editing === 'new';
    const ok = await run(
      () => (isNew ? createItem(name, payload, user) : updateItem(name, editing.id, payload)),
      cfg.noStatus ? 'Saved.' : status === 'published' ? 'Published. Students can see it now.' : 'Saved as draft. Students cannot see it yet.',
    );
    if (ok) close();
  };

  const toggle = (item) => {
    if (cfg.noStatus) return run(() => updateItem(name, item.id, { active: item.active === false }), item.active === false ? 'Link is now active.' : 'Link hidden from students.');
    const next = item.status === 'published' ? 'unpublished' : 'published';
    return run(() => updateItem(name, item.id, { status: next }), next === 'published' ? 'Published.' : 'Unpublished. Students no longer see it.');
  };
  const move = (item, dir) => run(() => applyOrder(name, reorderPairs(siblings(item), item.id, dir)), 'Order updated.');
  const remove = async () => {
    const item = confirm;
    const ok = await run(() => deleteItem(name, item.id), 'Deleted.');
    if (ok) setConfirm(null);
  };

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isOrdered = !!cfg.fields.find((f) => f.key === 'order');
  const dependents = { subjects: 'chapters', chapters: 'topics', topics: 'lectures, notes and questions' }[name];

  return (
    <div className="ap-stack" style={{ gap: 16 }}>
      <header className="ap-pagehead">
        <div>
          <h1>{cfg.title}</h1>
          <p>{filtered.length} {filtered.length === 1 ? cfg.singular : `${cfg.singular}s`}{list.length !== filtered.length ? ` shown of ${list.length}` : ''}</p>
        </div>
        <button type="button" className="ap-btn ap-btn--primary" onClick={openNew}><Plus size={18} aria-hidden="true" /> Add {cfg.singular}</button>
      </header>

      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      {editing && (
        <section ref={formRef} className="ap-card ap-panel adm-form" aria-label={editing === 'new' ? `Add ${cfg.singular}` : `Edit ${cfg.singular}`}>
          <h2>{editing === 'new' ? `Add ${cfg.singular}` : `Edit ${cfg.singular}`}</h2>
          {cfg.drive && <Notice>{DRIVE_SHARING_HINT}</Notice>}
          <form onSubmit={(e) => e.preventDefault()} noValidate className="adm-form__grid">
            <div className="adm-form__cols">
              {cfg.levels > 0 && <HierarchyPicker idPrefix="f" value={form} onChange={(v) => setForm((f) => ({ ...f, ...v }))} levels={cfg.levels} data={data} errors={errors} required />}
              {cfg.fields.map((f) => {
                const id = `f-${f.key}`;
                const common = { id, className: 'ap-input', value: form[f.key] == null ? '' : form[f.key], onChange: (e) => setField(f.key, e.target.value), 'aria-invalid': !!errors[f.key], 'aria-describedby': errors[f.key] ? `${id}-err` : f.help ? `${id}-help` : undefined };
                return (
                  <Field key={f.key} id={id} label={f.label} help={f.help} error={errors[f.key]} required={f.required}>
                    {f.type === 'textarea' ? <textarea rows={3} {...common} />
                      : f.type === 'select' ? (
                        <select {...common}>
                          {!f.valueByIndex && f.key === 'platform' && <option value="">Select platform</option>}
                          {f.options.map((o, i) => {
                            const value = f.valueByIndex ? String(i) : typeof o === 'string' ? o : o.value;
                            return <option key={value} value={value}>{typeof o === 'string' ? o : o.label}</option>;
                          })}
                        </select>
                      ) : <input type={f.type === 'number' ? 'number' : 'text'} min={f.type === 'number' ? 0 : undefined} {...common} />}
                  </Field>
                );
              })}
              {cfg.noStatus && (
                <label className="adm-check"><input type="checkbox" checked={form.active !== false} onChange={(e) => setField('active', e.target.checked)} /> Active (show on the website)</label>
              )}
            </div>
            <div className="adm-form__preview ap-stack" style={{ gap: 8 }}>
              <h3>Preview</h3>
              <Preview kind={name} form={form} />
              {name === 'socialLinks' && <p className="ap-muted">Shown in the footer and Contact page only while active and valid. Platforms: {PLATFORMS.map((p) => p.label).join(', ')}.</p>}
            </div>
            <div className="ap-row ap-row--wrap adm-form__actions">
              {cfg.noStatus ? (
                <button type="button" className="ap-btn ap-btn--primary" disabled={busy} onClick={() => save('published')}>{busy ? 'Saving…' : 'Save'}</button>
              ) : (
                <>
                  <button type="button" className="ap-btn ap-btn--ghost" disabled={busy} onClick={() => save('draft')}>{busy ? 'Saving…' : 'Save draft'}</button>
                  <button type="button" className="ap-btn ap-btn--primary" disabled={busy} onClick={() => save('published')}>{busy ? 'Publishing…' : 'Publish'}</button>
                </>
              )}
              <button type="button" className="ap-btn ap-btn--ghost" disabled={busy} onClick={close}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      <section className="ap-card ap-panel" aria-label={`${cfg.title} list`}>
        <div className="adm-filters">
          <div className="ap-search adm-search">
            <Search size={16} aria-hidden="true" />
            <input type="search" className="ap-input" placeholder={`Search ${cfg.title.toLowerCase()}`} aria-label={`Search ${cfg.title}`} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </div>
          {cfg.levels > 0 && <HierarchyPicker idPrefix="flt" allowAll value={filter} onChange={(v) => { setFilter((f) => ({ ...f, ...v })); setPage(1); }} levels={cfg.levels} data={data} />}
          <Field id="flt-status" label="Status">
            <select id="flt-status" className="ap-input" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="published">{cfg.noStatus ? 'Active' : 'Published'}</option>
              {!cfg.noStatus && <option value="draft">Draft</option>}
              <option value="unpublished">{cfg.noStatus ? 'Inactive' : 'Unpublished'}</option>
            </select>
          </Field>
        </div>

        {!shown.length ? (
          <div className="ap-empty"><h3>{list.length ? 'Nothing matches these filters' : `No ${cfg.title.toLowerCase()} yet`}</h3><p>{list.length ? 'Clear the search or filters.' : `Use "Add ${cfg.singular}" to create the first one.`}</p></div>
        ) : (
          <ul className="adm-list">
            {shown.map((item) => (
              <li key={item.id} className="adm-row">
                <div className="adm-row__main">
                  <strong>{name === 'chapters' && item.number ? `Ch ${item.number}: ` : ''}{itemTitle(item, cfg.titleKey) || '(untitled)'}</strong>
                  <span className="ap-muted">
                    {name === 'socialLinks' ? `${(PLATFORMS.find((p) => p.id === item.platform) || {}).label || item.platform} · ${item.url}` : parentLabel(item)}
                    {name === 'lectures' && item.teacherName ? ` · ${item.teacherName}` : ''}
                    {name === 'resources' && item.type ? ` · ${item.type}` : ''}
                    {name === 'topics' && item.difficulty ? ` · ${item.difficulty}` : ''}
                  </span>
                </div>
                {cfg.noStatus ? <span className={`ap-badge ${item.active === false ? '' : 'ap-badge--ok'}`}>{item.active === false ? 'Inactive' : 'Active'}</span> : <StatusBadge status={item.status} />}
                <div className="adm-row__actions">
                  {isOrdered && <>
                    <button type="button" className="ap-iconbtn" aria-label={`Move ${itemTitle(item, cfg.titleKey)} up`} title="Move up" disabled={busy} onClick={() => move(item, 'up')}><ArrowUp size={16} /></button>
                    <button type="button" className="ap-iconbtn" aria-label={`Move ${itemTitle(item, cfg.titleKey)} down`} title="Move down" disabled={busy} onClick={() => move(item, 'down')}><ArrowDown size={16} /></button>
                  </>}
                  {name === 'lectures' && item.youtubeVideoId && <a className="ap-iconbtn" href={`https://www.youtube.com/watch?v=${item.youtubeVideoId}`} target="_blank" rel="noopener noreferrer" aria-label="Open on YouTube" title="Open on YouTube"><ExternalLink size={16} /></a>}
                  {name === 'resources' && item.driveUrl && <a className="ap-iconbtn" href={item.driveUrl} target="_blank" rel="noopener noreferrer" aria-label="Open in Google Drive" title="Open in Google Drive"><ExternalLink size={16} /></a>}
                  <button type="button" className="ap-iconbtn" aria-label={`${(cfg.noStatus ? item.active !== false : item.status === 'published') ? 'Unpublish' : 'Publish'} ${itemTitle(item, cfg.titleKey)}`} title={(cfg.noStatus ? item.active !== false : item.status === 'published') ? 'Unpublish' : 'Publish'} disabled={busy} onClick={() => toggle(item)}>
                    {(cfg.noStatus ? item.active !== false : item.status === 'published') ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button type="button" className="ap-iconbtn" aria-label={`Edit ${itemTitle(item, cfg.titleKey)}`} title="Edit" onClick={() => openEdit(item)}><Pencil size={16} /></button>
                  <button type="button" className="ap-iconbtn adm-danger" aria-label={`Delete ${itemTitle(item, cfg.titleKey)}`} title="Delete" onClick={() => setConfirm(item)}><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Pager page={Math.min(page, pages)} pages={pages} onPage={setPage} />
      </section>

      {confirm && (
        <ConfirmDialog title={`Delete this ${cfg.singular}?`} busy={busy} onConfirm={remove} onCancel={() => setConfirm(null)}>
          <p><strong>{itemTitle(confirm, cfg.titleKey)}</strong> will be removed for good. This cannot be undone.</p>
          {dependents && <p className="ap-muted">Its {dependents} are not deleted, but students will no longer see them until you move or delete them.</p>}
        </ConfirmDialog>
      )}
    </div>
  );
}

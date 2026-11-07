import React, { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { allClasses, byOrder, statusLabel } from '../cms/model';

export function Field({ id, label, help, error, required, children }) {
  return (
    <div className="adm-field">
      <label htmlFor={id}>
        {label}
        {required && <span className="adm-req" aria-hidden="true"> *</span>}
      </label>
      {children}
      {help && <small id={`${id}-help`} className="ap-muted">{help}</small>}
      {error && <small id={`${id}-err`} className="adm-err" role="alert">{error}</small>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const cls = status === 'published' ? 'ap-badge ap-badge--ok' : 'ap-badge';
  return <span className={`${cls} adm-status adm-status--${status || 'draft'}`}>{statusLabel(status)}</span>;
}

export function Notice({ kind = 'info', children }) {
  const Icon = kind === 'error' ? AlertTriangle : kind === 'ok' ? CheckCircle2 : Info;
  return (
    <div className={`adm-notice adm-notice--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function ConfirmDialog({ title, children, confirmLabel = 'Delete', busy, onConfirm, onCancel }) {
  const cancelRef = useRef(null);
  useEffect(() => {
    if (cancelRef.current) cancelRef.current.focus();
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div className="adm-modal" role="presentation" onClick={onCancel}>
      <div className="adm-modal__box ap-card" role="alertdialog" aria-modal="true" aria-labelledby="adm-dlg-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="adm-dlg-title">{title}</h2>
        <div>{children}</div>
        <div className="ap-row ap-row--wrap" style={{ justifyContent: 'flex-end' }}>
          <button ref={cancelRef} type="button" className="ap-btn ap-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className="ap-btn adm-btn-danger" onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

const PLURAL = { classId: 'courses', batchId: 'batches', subjectId: 'subjects', chapterId: 'chapters', topicId: 'topics' };
const LEVELS = [
  { key: 'classId', label: 'Course / class' },
  { key: 'batchId', label: 'Batch (optional)', optional: true, filterOnly: true },
  { key: 'subjectId', label: 'Subject' },
  { key: 'chapterId', label: 'Chapter' },
  { key: 'topicId', label: 'Topic' },
];

/**
 * Cascading course -> batch -> subject -> chapter -> topic selects. `levels` is how many of
 * course/subject/chapter/topic to show (the batch select appears with subjects and only narrows
 * the subject list; it is not saved). `optionalLevel` marks the deepest level as optional.
 */
export function HierarchyPicker({ value, onChange, levels, data, allowAll, errors = {}, idPrefix = 'h', required, optionalLevel }) {
  const active = LEVELS.filter((l) => (l.key === 'batchId' ? levels >= 2 : true)).filter((l) => {
    const depth = { classId: 1, subjectId: 2, chapterId: 3, topicId: 4 }[l.key];
    return !depth || depth <= levels;
  });
  const options = (key) => {
    if (key === 'classId') return allClasses(data).map((c) => ({ id: c.id, label: c.title }));
    if (key === 'batchId') return (data.batches || []).filter((b) => b.classId === value.classId).sort(byOrder).map((b) => ({ id: b.id, label: b.name }));
    if (key === 'subjectId') {
      const batch = value.batchId && (data.batches || []).find((b) => b.id === value.batchId);
      return (data.subjects || [])
        .filter((s) => s.classId === value.classId && (!batch || (batch.subjectIds || []).includes(s.id)))
        .sort(byOrder).map((s) => ({ id: s.id, label: s.name }));
    }
    if (key === 'chapterId') return (data.chapters || []).filter((c) => c.subjectId === value.subjectId).sort(byOrder).map((c) => ({ id: c.id, label: `${c.number ? `Ch ${c.number}: ` : ''}${c.title}` }));
    return (data.topics || []).filter((t) => t.chapterId === value.chapterId).sort(byOrder).map((t) => ({ id: t.id, label: t.title }));
  };
  const set = (key, id) => {
    const next = { ...value };
    const order = LEVELS.map((l) => l.key);
    order.forEach((k, i) => {
      if (k === key) next[k] = id;
      else if (i > order.indexOf(key)) next[k] = '';
    });
    onChange(next);
  };
  return (
    <>
      {active.map((l, i) => {
        const prev = active.slice(0, i).reverse().find((x) => !x.filterOnly);
        const parentMissing = !!prev && !value[prev.key];
        const opts = parentMissing ? [] : options(l.key);
        const fid = `${idPrefix}-${l.key}`;
        const optional = l.optional || (optionalLevel && l.key === 'topicId');
        return (
          <Field key={l.key} id={fid} label={optionalLevel && l.key === 'topicId' ? 'Topic (optional)' : l.label} required={required && !allowAll && !optional} error={errors[l.key]}>
            <select id={fid} className="ap-input" value={value[l.key] || ''} disabled={parentMissing} onChange={(e) => set(l.key, e.target.value)} aria-invalid={!!errors[l.key]}>
              <option value="">{allowAll || optional ? `All ${PLURAL[l.key]}` : `Select ${l.label.toLowerCase()}`}</option>
              {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            {!parentMissing && !opts.length && l.key !== 'classId' && !optional && <small className="ap-muted">None yet. Add one first.</small>}
          </Field>
        );
      })}
    </>
  );
}

export function Pager({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <nav className="adm-pager" aria-label="Pages">
      <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span>Page {page} of {pages}</span>
      <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </nav>
  );
}

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { CLASSES, byOrder, statusLabel } from '../cms/model';

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

const LEVELS = [
  { key: 'classId', label: 'Class / exam' },
  { key: 'subjectId', label: 'Subject' },
  { key: 'chapterId', label: 'Chapter' },
  { key: 'topicId', label: 'Topic' },
];

/** Cascading class -> subject -> chapter -> topic selects. `levels` is how many to show. */
export function HierarchyPicker({ value, onChange, levels, data, allowAll, errors = {}, idPrefix = 'h', required }) {
  const options = (level) => {
    if (level === 0) return CLASSES.map((c) => ({ id: c.id, label: c.title }));
    if (level === 1) return (data.subjects || []).filter((s) => s.classId === value.classId).sort(byOrder).map((s) => ({ id: s.id, label: s.name }));
    if (level === 2) return (data.chapters || []).filter((c) => c.subjectId === value.subjectId).sort(byOrder).map((c) => ({ id: c.id, label: `${c.number ? `Ch ${c.number}: ` : ''}${c.title}` }));
    return (data.topics || []).filter((t) => t.chapterId === value.chapterId).sort(byOrder).map((t) => ({ id: t.id, label: t.title }));
  };
  const set = (level, id) => {
    const next = { ...value };
    LEVELS.forEach((l, i) => {
      if (i === level) next[l.key] = id;
      else if (i > level) next[l.key] = '';
    });
    onChange(next);
  };
  return (
    <>
      {LEVELS.slice(0, levels).map((l, i) => {
        const parentMissing = i > 0 && !value[LEVELS[i - 1].key];
        const opts = parentMissing ? [] : options(i);
        const fid = `${idPrefix}-${l.key}`;
        return (
          <Field key={l.key} id={fid} label={l.label} required={required && !allowAll} error={errors[l.key]}>
            <select id={fid} className="ap-input" value={value[l.key] || ''} disabled={parentMissing} onChange={(e) => set(i, e.target.value)} aria-invalid={!!errors[l.key]}>
              <option value="">{allowAll ? `All ${l.label.toLowerCase()}s` : `Select ${l.label.toLowerCase()}`}</option>
              {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            {!parentMissing && !opts.length && i > 0 && <small className="ap-muted">None yet. Add one first.</small>}
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

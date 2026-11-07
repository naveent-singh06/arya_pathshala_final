import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { CATEGORIES } from '../../data/categories';
import { subjectsIn } from '../../data/materials';

/** Class/exam + subject chips. The class/exam lives in the URL (?category=neet) so it can be linked. */
export function useCategorySubject() {
  const [params, setParams] = useSearchParams();
  const asked = params.get('category');
  const category = CATEGORIES.some((c) => c.id === asked) ? asked : 'all';
  const asSubject = params.get('subject');
  const subjects = subjectsIn(category === 'all' ? null : category);
  const subject = subjects.includes(asSubject) ? asSubject : 'All';
  const set = (next) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v === 'all' || v === 'All' ? p.delete(k) : p.set(k, v)));
    setParams(p, { replace: true });
  };
  return {
    category,
    subject,
    subjects,
    setCategory: (id) => set({ category: id, subject: 'All' }),
    setSubject: (s) => set({ subject: s }),
  };
}

export default function Filters({ filter }) {
  return (
    <div className="ap-filters">
      <div className="ap-row ap-row--wrap" role="group" aria-label="Class or exam">
        {[{ id: 'all', title: 'All' }, ...CATEGORIES].map((c) => (
          <button key={c.id} type="button" className="ap-chip" aria-pressed={filter.category === c.id} onClick={() => filter.setCategory(c.id)}>{c.title}</button>
        ))}
      </div>
      <div className="ap-row ap-row--wrap" role="group" aria-label="Subject">
        {filter.subjects.map((s) => (
          <button key={s} type="button" className="ap-chip" aria-pressed={filter.subject === s} onClick={() => filter.setSubject(s)}>{s}</button>
        ))}
      </div>
    </div>
  );
}

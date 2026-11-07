import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Languages, Info, Play, Calculator, FlaskConical, BookOpen, Dna, Atom } from 'lucide-react';
import { initials } from '../../data/teachers';
import { getCategory } from '../../data/categories';
import { courseTeachers, coursePath, totalLectures } from '../../data/courses';

export const accentStyle = (accent = 'brand') => ({
  '--accent': `var(--ap-${accent})`,
  '--accent-soft': `var(--ap-${accent}-soft)`,
});

export function DemoNote({ children }) {
  return (
    <div className="ap-demo-note" role="note">
      <Info size={18} aria-hidden="true" style={{ flex: '0 0 auto', marginTop: 2 }} />
      <span>{children}</span>
    </div>
  );
}

export function PageHead({ title, description, children }) {
  return (
    <header className="ap-pagehead">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </header>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="ap-empty ap-card">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Avatar({ teacher, size = 64 }) {
  const style = { ...accentStyle(teacher.accent), width: size, height: size, fontSize: size * 0.36 };
  if (teacher.photo) {
    return <img className="ap-avatar" style={style} src={teacher.photo} alt={teacher.name} />;
  }
  return (
    <span className="ap-avatar" style={style} role="img" aria-label={`${teacher.name} (photo not added yet)`}>
      {initials(teacher.name)}
    </span>
  );
}

export function ProgressBar({ percent, label }) {
  const value = Math.max(0, Math.min(100, percent || 0));
  return (
    <div className="ap-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label || 'Progress'}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

const SUBJECT_ICON = { Mathematics: Calculator, Science: FlaskConical, English: BookOpen, Biology: Dna, Physics: Atom, Chemistry: FlaskConical };

export function CourseThumb({ course }) {
  const Icon = SUBJECT_ICON[course.subjects[0].name] || BookOpen;
  const category = getCategory(course.categoryId);
  return (
    <div className="ap-thumb" style={accentStyle(course.accent)} aria-hidden="true">
      <Icon size={54} strokeWidth={1.5} />
      <span className="ap-thumb__tag">{category ? category.title : ''}</span>
    </div>
  );
}

export function CourseCard({ course }) {
  const category = getCategory(course.categoryId);
  const teachers = courseTeachers(course);
  return (
    <article className="ap-card ap-coursecard">
      <CourseThumb course={course} />
      <div className="ap-coursecard__body">
        <div className="ap-row ap-row--wrap">
          <span className="ap-badge">{category ? category.title : course.categoryId}</span>
          {course.isDemo && <span className="ap-badge ap-badge--demo">Demo content</span>}
        </div>
        <h3>{course.title}</h3>
        <p className="ap-muted">{course.subjects.map((s) => s.name).join(', ')}</p>
        <p className="ap-coursecard__teachers">Taught by {teachers.map((t) => t.name).join(', ')}</p>
        <ul className="ap-meta">
          <li>
            <Clock size={15} aria-hidden="true" /> {course.duration}
          </li>
          <li>
            <Languages size={15} aria-hidden="true" /> {course.language}
          </li>
          <li>
            <Play size={15} aria-hidden="true" /> {totalLectures(course)} lectures
          </li>
        </ul>
        <Link className="ap-btn ap-btn--primary ap-btn--sm" to={coursePath(course.id)}>
          View details<span className="ap-sr-only">: {course.title}</span>
        </Link>
      </div>
    </article>
  );
}

export function TeacherCard({ teacher }) {
  return (
    <article className="ap-card ap-teachercard" style={accentStyle(teacher.accent)}>
      <Avatar teacher={teacher} size={88} />
      <h3>{teacher.name}</h3>
      <span className="ap-badge ap-badge--subject">{teacher.subject}</span>
      <p>{teacher.intro}</p>
      <div className="ap-row ap-row--center ap-row--wrap">
        <Link className="ap-btn ap-btn--primary ap-btn--sm" to={`/teachers/${teacher.id}`}>
          View profile<span className="ap-sr-only"> of {teacher.name}</span>
        </Link>
        <Link className="ap-btn ap-btn--ghost ap-btn--sm" to={`/teachers/${teacher.id}?tab=lectures`}>
          View lectures<span className="ap-sr-only"> by {teacher.name}</span>
        </Link>
      </div>
    </article>
  );
}

export function Tabs({ tabs, active, onChange, label }) {
  const onKeyDown = (event) => {
    const i = tabs.findIndex((t) => t.id === active);
    let next = null;
    if (event.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
    if (event.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
    if (next) {
      event.preventDefault();
      onChange(next.id);
      const el = document.getElementById(`tab-${next.id}`);
      if (el) el.focus();
    }
  };
  return (
    <div className="ap-tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          aria-controls={`panel-${tab.id}`}
          tabIndex={active === tab.id ? 0 : -1}
          className="ap-tab"
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ id, children }) {
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} className="ap-tabpanel">
      {children}
    </div>
  );
}

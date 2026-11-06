import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CATEGORIES, getCategory } from '../data/categories';
import { COURSES, coursesInCategory } from '../data/courses';
import { CourseCard, EmptyState, DemoNote } from '../components/learn/shared';
import SiteFooter from '../components/learn/SiteFooter';
import NotFound from './NotFound';

export default function CourseListing() {
  const { categoryId } = useParams();
  const category = categoryId ? getCategory(categoryId) : null;
  const [subject, setSubject] = useState('All');
  const [query, setQuery] = useState('');

  const pool = useMemo(() => (category ? coursesInCategory(category.id) : COURSES), [category]);
  const subjects = useMemo(() => ['All', ...new Set(pool.flatMap((c) => c.subjects.map((s) => s.name)))], [pool]);

  // Changing category resets the filters, so a stale subject never hides every course.
  React.useEffect(() => {
    setSubject('All');
    setQuery('');
  }, [categoryId]);

  if (categoryId && !category) return <NotFound what="class or exam" />;

  const needle = query.trim().toLowerCase();
  const shown = pool.filter(
    (c) =>
      (subject === 'All' || c.subjects.some((s) => s.name === subject)) &&
      (!needle || `${c.title} ${c.subjects.map((s) => s.name).join(' ')}`.toLowerCase().includes(needle))
  );

  return (
    <div className="ap-scope ap-listing">
      <div className="ap-container ap-section">
        <header className="ap-pagehead">
          <div>
            <h1>{category ? `${category.title} courses` : 'All courses'}</h1>
            <p>{category ? category.description : 'Every course at Arya Pathshala, for Class 9, Class 10 and NEET.'}</p>
          </div>
        </header>

        <div className="ap-filters">
          <nav className="ap-row ap-row--wrap" aria-label="Class or exam">
            <Link to="/courses" className={`ap-chip ${!category ? 'ap-chip--on' : ''}`} aria-current={!category ? 'page' : undefined}>All</Link>
            {CATEGORIES.map((c) => (
              <Link key={c.id} to={`/courses/${c.id}`} className={`ap-chip ${category && category.id === c.id ? 'ap-chip--on' : ''}`} aria-current={category && category.id === c.id ? 'page' : undefined}>
                {c.title}
              </Link>
            ))}
          </nav>
          <div className="ap-row ap-row--wrap" role="group" aria-label="Subject">
            {subjects.map((s) => (
              <button key={s} type="button" className="ap-chip" aria-pressed={subject === s} onClick={() => setSubject(s)}>
                {s}
              </button>
            ))}
          </div>
          <label className="ap-search">
            <Search size={18} aria-hidden="true" />
            <span className="ap-sr-only">Search courses</span>
            <input className="ap-input" type="search" placeholder="Search courses" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>

        <DemoNote>These are sample courses that show how real courses will look. No lecture videos have been uploaded yet.</DemoNote>
        <p className="ap-muted ap-count" role="status">{shown.length} {shown.length === 1 ? 'course' : 'courses'} found</p>

        {shown.length ? (
          <div className="ap-grid-3">{shown.map((c) => <CourseCard key={c.id} course={c} />)}</div>
        ) : (
          <EmptyState
            title="No courses match"
            action={<button type="button" className="ap-btn ap-btn--primary ap-btn--sm" onClick={() => { setSubject('All'); setQuery(''); }}>Clear filters</button>}
          >
            Try another subject or a shorter search word.
          </EmptyState>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

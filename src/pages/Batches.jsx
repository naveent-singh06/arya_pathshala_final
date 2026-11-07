import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { coursesInCategory } from '../data/courses';
import { PageHead, DemoNote } from '../components/learn/shared';

// A "batch" here is simply the full-year course for a class or exam.
export default function Batches() {
  return (
    <>
      <PageHead title="Batches" description="Full-year batches for each class and exam." />
      <DemoNote>Sample batches. Start dates and seat booking need a backend and are not available yet.</DemoNote>
      <div className="ap-rows">
        {CATEGORIES.map((cat) => {
          const batch = coursesInCategory(cat.id)[0];
          if (!batch) return null;
          return (
            <div key={cat.id} className="ap-card ap-rowcard">
              <div className="ap-rowcard__main">
                <h3>{batch.title}</h3>
                <span className="ap-muted">{cat.title} · {batch.subjects.map((s) => s.name).join(', ')} · {batch.duration}</span>
              </div>
              <div className="ap-rowcard__actions">
                <Link className="ap-btn ap-btn--primary ap-btn--sm" to={`/course/${batch.id}`}>View batch<span className="ap-sr-only">: {batch.title}</span></Link>
                <Link className="ap-btn ap-btn--ghost ap-btn--sm" to={`/courses/${cat.id}`}>All {cat.title} courses</Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

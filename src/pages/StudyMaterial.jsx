import React from 'react';
import { Link } from 'react-router-dom';
import { chaptersFor } from '../data/materials';
import { getCategory } from '../data/categories';
import useTabParam from '../components/learn/useTabParam';
import Filters, { useCategorySubject } from '../components/learn/Filters';
import { PageHead, DemoNote, EmptyState, Tabs, TabPanel } from '../components/learn/shared';

const TABS = [
  { id: 'notes', label: 'Notes' },
  { id: 'pdfs', label: 'PDF resources' },
];

export default function StudyMaterial() {
  const filter = useCategorySubject();
  const [tab, setTab] = useTabParam(TABS.map((t) => t.id));
  const chapters = chaptersFor(filter.category === 'all' ? null : filter.category, filter.subject);

  return (
    <>
      <PageHead title="Notes and PDFs" description="Chapter notes and downloadable PDFs for Class 9, Class 10 and NEET." />
      <DemoNote>Demo material. Notes are chapter outlines that open inside the lecture pages. PDF files have not been uploaded yet, so those buttons are switched off until they are.</DemoNote>
      <Filters filter={filter} />
      <div className="ap-card ap-panel" style={{ gap: 0 }}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} label="Study material" />
        <TabPanel id={tab}>
          {chapters.length ? (
            <div className="ap-rows">
              {chapters.map((c) => (
                <div key={c.key} className="ap-card ap-rowcard">
                  <div className="ap-rowcard__main">
                    <h3>Chapter {c.index}: {c.title}</h3>
                    <span className="ap-muted">{getCategory(c.categoryId).title} · {c.subject} · {c.lectureCount} lectures</span>
                  </div>
                  <div className="ap-rowcard__actions">
                    {tab === 'notes' ? (
                      c.lecturePath ? <Link className="ap-btn ap-btn--primary ap-btn--sm" to={c.lecturePath}>Open chapter notes<span className="ap-sr-only">: {c.title}</span></Link> : null
                    ) : (
                      <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" disabled>PDF not uploaded yet</button>
                    )}
                    {c.dppId && <Link className="ap-btn ap-btn--ghost ap-btn--sm" to={`/practice/${c.dppId}`}>Chapter DPP<span className="ap-sr-only">: {c.title}</span></Link>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No chapters match">Choose a different class, exam or subject.</EmptyState>
          )}
        </TabPanel>
      </div>
      <div className="ap-row ap-row--wrap">
        <Link className="ap-btn ap-btn--ghost" to="/practice">DPP and practice questions</Link>
        <Link className="ap-btn ap-btn--ghost" to="/tests">Tests and quizzes</Link>
      </div>
    </>
  );
}

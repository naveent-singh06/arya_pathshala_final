import React from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { QUIZ_SETS, getQuizSet } from '../data/practice';
import { getCategory } from '../data/categories';
import { useLearn } from '../components/learn/LearnContext';
import useTabParam from '../components/learn/useTabParam';
import Filters, { useCategorySubject } from '../components/learn/Filters';
import QuizRunner from '../components/learn/QuizRunner';
import { PageHead, EmptyState, Tabs, TabPanel, DemoNote } from '../components/learn/shared';
import NotFound from './NotFound';

const TABS = [
  { id: 'dpp', label: 'Chapter-wise DPP' },
  { id: 'practice', label: 'Practice questions' },
];

function PracticeList() {
  const filter = useCategorySubject();
  const { state } = useLearn();
  const [tab, setTab] = useTabParam(TABS.map((t) => t.id));
  const sets = QUIZ_SETS.filter((s) => (filter.category === 'all' || s.categoryId === filter.category) && (filter.subject === 'All' || s.subject === filter.subject));
  const mode = tab === 'dpp' ? 'paper' : 'quick';
  return (
    <>
      <PageHead title="DPP and practice" description="Daily practice problems for each chapter. A DPP is a full set you submit once; practice questions give feedback after every answer." />
      <DemoNote>Sample questions with worked explanations. Only some chapters have a set so far. Scores are saved in this browser only.</DemoNote>
      <Filters filter={filter} />
      <div className="ap-card ap-panel" style={{ gap: 0 }}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} label="Practice type" />
        <TabPanel id={tab}>
          {sets.length ? (
            <div className="ap-rows">
              {sets.map((s) => {
                const result = state.results[s.id];
                return (
                  <div key={s.id} className="ap-card ap-rowcard">
                    <div className="ap-rowcard__main">
                      <h3>{s.title}</h3>
                      <span className="ap-muted">{getCategory(s.categoryId).title} · {s.subject} · {s.questions.length} questions</span>
                    </div>
                    {result && <span className="ap-badge ap-badge--ok">Best {result.best}%</span>}
                    <Link className="ap-btn ap-btn--primary ap-btn--sm" to={`/practice/${s.id}${mode === 'quick' ? '?mode=quick' : ''}`}>
                      {tab === 'dpp' ? 'Start DPP' : 'Start practice'}<span className="ap-sr-only">: {s.title}</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No sets for this choice yet">Try another subject or class. More chapters are added over time.</EmptyState>
          )}
        </TabPanel>
      </div>
    </>
  );
}

function PracticeSet({ setId }) {
  const [params] = useSearchParams();
  const set = getQuizSet(setId);
  if (!set) return <NotFound what="practice set" />;
  const quick = params.get('mode') === 'quick';
  return (
    <div className="ap-stack" style={{ gap: 18 }}>
      <nav className="ap-crumbs" aria-label="Breadcrumb"><Link to="/practice">DPP and practice</Link> / <span aria-current="page">{set.title}</span></nav>
      <PageHead title={set.title} description={`${getCategory(set.categoryId).title} · ${set.subject} · ${quick ? 'Practice questions, instant feedback' : 'DPP, submit when done'}`} />
      <QuizRunner key={`${set.id}-${quick}`} set={set} mode={quick ? 'practice' : 'paper'} backTo="/practice" backLabel="All DPPs" />
    </div>
  );
}

export default function Practice() {
  const { setId } = useParams();
  return setId ? <PracticeSet setId={setId} /> : <PracticeList />;
}

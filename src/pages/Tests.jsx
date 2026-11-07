import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { TESTS, getTest } from '../data/practice';
import { getCategory } from '../data/categories';
import { useLearn } from '../components/learn/LearnContext';
import QuizRunner from '../components/learn/QuizRunner';
import { PageHead, DemoNote } from '../components/learn/shared';
import NotFound from './NotFound';

function TestList() {
  const { state } = useLearn();
  return (
    <>
      <PageHead title="Tests and quizzes" description="A mixed quiz for each class or exam, built from questions across its chapters." />
      <DemoNote>Sample quizzes. Scheduled tests with timers and ranks need a backend and are not available yet. Scores are saved in this browser only.</DemoNote>
      <div className="ap-rows">
        {TESTS.map((t) => {
          const result = state.results[t.id];
          return (
            <div key={t.id} className="ap-card ap-rowcard">
              <div className="ap-rowcard__main">
                <h3>{t.title}</h3>
                <span className="ap-muted">{getCategory(t.categoryId).title} · {t.questions.length} questions · {t.chapter}</span>
              </div>
              {result && <span className="ap-badge ap-badge--ok">Last {result.correct}/{result.total}</span>}
              <Link className="ap-btn ap-btn--primary ap-btn--sm" to={`/tests/${t.id}`}>Take the quiz<span className="ap-sr-only">: {t.title}</span></Link>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function Tests() {
  const { testId } = useParams();
  if (!testId) return <TestList />;
  const test = getTest(testId);
  if (!test) return <NotFound what="quiz" />;
  return (
    <div className="ap-stack" style={{ gap: 18 }}>
      <nav className="ap-crumbs" aria-label="Breadcrumb"><Link to="/tests">Tests and quizzes</Link> / <span aria-current="page">{test.title}</span></nav>
      <PageHead title={test.title} description={`${test.questions.length} questions. Answer them all, then submit.`} />
      <QuizRunner key={test.id} set={test} mode="paper" backTo="/tests" backLabel="All quizzes" />
    </div>
  );
}

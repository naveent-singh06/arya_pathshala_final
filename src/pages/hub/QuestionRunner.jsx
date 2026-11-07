import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

/**
 * One question at a time with Previous / Next. A student picks an answer and presses Check;
 * the explanation then shows. At the end they see the topic score and can retry the wrong ones.
 */
export default function QuestionRunner({ questions, onFinish, attempts, last, idPrefix = 'q' }) {
  const [pool, setPool] = useState(questions);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState({});
  const [checked, setChecked] = useState({});
  const [done, setDone] = useState(false);
  const q = pool[Math.min(i, pool.length - 1)];
  const score = useMemo(() => pool.filter((x) => checked[x.id] && picked[x.id] === x.correctIndex).length, [pool, checked, picked]);
  const answered = pool.filter((x) => checked[x.id]).length;
  const wrong = pool.filter((x) => checked[x.id] && picked[x.id] !== x.correctIndex);

  const finish = () => {
    setDone(true);
    // Only a full-set run is saved as the topic score; a retry of wrong answers is practice only.
    if (pool.length === questions.length) onFinish(score, pool.length);
  };
  const reset = (next) => {
    setPool(next); setI(0); setPicked({}); setChecked({}); setDone(false);
  };

  if (done) {
    return (
      <div className="ap-card ap-score ap-stack" role="status" style={{ gap: 10 }}>
        <h2>You scored {score} out of {pool.length}</h2>
        <p className="ap-muted">{wrong.length ? `${wrong.length} to review.` : 'Every answer was correct. Well done!'}</p>
        <div className="ap-row ap-row--wrap">
          {wrong.length > 0 && <button type="button" className="ap-btn ap-btn--accent" onClick={() => reset(wrong)}><RotateCcw size={16} aria-hidden="true" /> Retry incorrect questions</button>}
          <button type="button" className="ap-btn ap-btn--ghost" onClick={() => reset(questions)}>Start again</button>
        </div>
      </div>
    );
  }

  const isChecked = !!checked[q.id];
  const chosen = picked[q.id];
  return (
    <div className="ap-stack" style={{ gap: 12 }}>
      {attempts > 0 && <p className="ap-muted">Attempts: {attempts}{last ? ` · Last score ${last.score}/${last.total}` : ''}</p>}
      <p className="ap-muted" aria-live="polite">Question {Math.min(i, pool.length - 1) + 1} of {pool.length} · {answered} answered</p>
      <fieldset className="ap-card ap-question">
        <legend><span className="ap-question__n">{i + 1}</span> {q.question}</legend>
        <div className="ap-options">
          {q.options.map((o, n) => {
            const cls = isChecked ? (n === q.correctIndex ? 'is-right' : chosen === n ? 'is-wrong' : '') : chosen === n ? 'is-chosen' : '';
            return (
              <label key={n} className={`ap-option ${cls}`}>
                <input type="radio" name={`${idPrefix}-${q.id}`} checked={chosen === n} disabled={isChecked} onChange={() => setPicked((a) => ({ ...a, [q.id]: n }))} />
                <span>{String.fromCharCode(65 + n)}. {o}</span>
              </label>
            );
          })}
        </div>
        {isChecked && <p className="ap-explain" role="status"><strong>{chosen === q.correctIndex ? 'Correct. ' : 'Not quite. '}</strong>{q.explanation || `The correct answer is ${String.fromCharCode(65 + q.correctIndex)}.`}</p>}
      </fieldset>
      <div className="ap-navrow">
        <button type="button" className="ap-btn ap-btn--ghost" disabled={i === 0} onClick={() => setI(i - 1)}><ChevronLeft size={18} aria-hidden="true" /> Previous</button>
        <button type="button" className="ap-btn ap-btn--accent" disabled={isChecked || chosen === undefined} onClick={() => { setChecked((c) => ({ ...c, [q.id]: true })); }}>Check answer</button>
        {i < pool.length - 1
          ? <button type="button" className="ap-btn ap-btn--primary" onClick={() => setI(i + 1)}>Next <ChevronRight size={18} aria-hidden="true" /></button>
          : <button type="button" className="ap-btn ap-btn--primary" disabled={answered === 0} onClick={finish}>Finish and see result</button>}
      </div>
    </div>
  );
}

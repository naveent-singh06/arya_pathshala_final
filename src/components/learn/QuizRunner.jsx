import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { scoreAnswers } from '../../data/practice';
import { useLearn } from './LearnContext';
import { DemoNote } from './shared';

/**
 * mode "paper": every question on one page, submit once, then review.
 * mode "practice": one question at a time with instant feedback.
 */
export default function QuizRunner({ set, mode = 'paper', backTo, backLabel }) {
  const { actions } = useLearn();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState({});
  const questions = set.questions;
  const result = scoreAnswers(questions, answers);

  const restart = () => {
    setAnswers({});
    setSubmitted(false);
    setIndex(0);
    setRevealed({});
  };

  const finish = () => {
    setSubmitted(true);
    actions.saveResult(set.id, result.correct, result.total, set.title);
  };

  const choose = (question, optionIndex) => {
    if (submitted || revealed[question.id]) return;
    setAnswers((a) => ({ ...a, [question.id]: optionIndex }));
    if (mode === 'practice') setRevealed((r) => ({ ...r, [question.id]: true }));
  };

  const renderQuestion = (question, number) => {
    const chosen = answers[question.id];
    const showAnswer = submitted || revealed[question.id];
    return (
      <fieldset key={question.id} className="ap-question">
        <legend>
          <span className="ap-question__n">Question {number} of {questions.length}</span>
          {question.text}
        </legend>
        <div className="ap-options">
          {question.options.map((option, i) => {
            const state = showAnswer ? (i === question.answer ? 'right' : i === chosen ? 'wrong' : '') : '';
            return (
              <label key={i} className={`ap-option ${chosen === i ? 'is-chosen' : ''} ${state ? `is-${state}` : ''}`}>
                <input type="radio" name={question.id} checked={chosen === i} onChange={() => choose(question, i)} disabled={showAnswer} />
                <span>{option}</span>
                {state === 'right' && <CheckCircle2 size={18} aria-label="Correct answer" />}
                {state === 'wrong' && <XCircle size={18} aria-label="Your answer, incorrect" />}
              </label>
            );
          })}
        </div>
        {showAnswer && (
          <p className="ap-explain" role="status">
            <strong>{chosen === question.answer ? 'Correct. ' : chosen === undefined ? 'Not answered. ' : 'Not quite. '}</strong>
            {question.explanation}
          </p>
        )}
      </fieldset>
    );
  };

  return (
    <div className="ap-quiz">
      <DemoNote>Sample questions written for this demo. Your score is saved in this browser only.</DemoNote>
      {submitted && (
        <div className="ap-card ap-score" role="status">
          <h2>
            You scored {result.correct} out of {result.total} ({result.percent}%)
          </h2>
          <p className="ap-muted">Read the explanations below, then try again or move on.</p>
          <div className="ap-row ap-row--wrap">
            <button type="button" className="ap-btn ap-btn--primary" onClick={restart}>
              Try again
            </button>
            {backTo && (
              <Link className="ap-btn ap-btn--ghost" to={backTo}>
                {backLabel || 'Back'}
              </Link>
            )}
            <Link className="ap-btn ap-btn--ghost" to="/tutor">
              Ask the AI Tutor
            </Link>
          </div>
        </div>
      )}

      {mode === 'paper' || submitted ? (
        <>
          {questions.map((q, i) => renderQuestion(q, i + 1))}
          {!submitted && (
            <div className="ap-row">
              <button type="button" className="ap-btn ap-btn--accent" onClick={finish}>
                Submit answers
              </button>
              <span className="ap-muted">
                {Object.keys(answers).length} of {questions.length} answered
              </span>
            </div>
          )}
        </>
      ) : (
        <>
          {renderQuestion(questions[index], index + 1)}
          <div className="ap-row ap-row--wrap">
            <button type="button" className="ap-btn ap-btn--ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}>
              Previous
            </button>
            {index < questions.length - 1 ? (
              <button type="button" className="ap-btn ap-btn--primary" onClick={() => setIndex(index + 1)}>
                Next question
              </button>
            ) : (
              <button type="button" className="ap-btn ap-btn--accent" onClick={finish}>
                See my score
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

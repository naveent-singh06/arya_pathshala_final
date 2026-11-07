import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound({ what = 'page' }) {
  return (
    <div className="ap-scope ap-container ap-notfound">
      <h1>We could not find that {what}</h1>
      <p>The link may be old or mistyped. Try one of these instead.</p>
      <div className="ap-row ap-row--wrap ap-row--center">
        <Link className="ap-btn ap-btn--primary" to="/courses">Browse courses</Link>
        <Link className="ap-btn ap-btn--ghost" to="/">Go to home</Link>
      </div>
    </div>
  );
}

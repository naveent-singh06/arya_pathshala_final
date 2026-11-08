import React from 'react';
import { Link } from 'react-router-dom';
import { MyBatches } from './MyLearning';
import useHubData from './useHubData';
import '../../styles/hub.css';

/** "My batches" block for the student dashboard, backed by the Study Hub data. Fails quietly into a link. */
export default function DashboardLearning() {
  const hub = useHubData();
  return (
    <section aria-labelledby="dash-hub" className="ap-stack" style={{ gap: 12 }}>
      <div className="ap-row ap-row--wrap" style={{ justifyContent: 'space-between' }}>
        <h2 id="dash-hub" style={{ fontSize: '1.3rem' }}>My batches &amp; Study Hub</h2>
        <Link className="ap-btn ap-btn--ghost ap-btn--sm" to="/hub">Open the Study Hub</Link>
      </div>
      {hub.status === 'loading' && <p role="status" className="ap-muted">Loading your batches…</p>}
      {hub.status === 'unconfigured' && <p className="ap-muted">Study Hub content is not connected on this website yet.</p>}
      {hub.status === 'error' && <p className="ap-muted">{hub.error} <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={hub.reload}>Try again</button></p>}
      {hub.status === 'ready' && <MyBatches hub={hub.value} compact />}
    </section>
  );
}

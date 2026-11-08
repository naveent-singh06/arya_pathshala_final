import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { HubContext } from './HubContext';
import useHubData from './useHubData';
import { DemoNote, EmptyState } from '../../components/learn/shared';

/** Loads the published content once for every Study Hub page, plus this student's own progress. */
export default function HubLayout() {
  const hub = useHubData();
  const { user } = hub.value;
  const prog = hub.value.progressError;

  if (hub.status === 'unconfigured') {
    return (
      <EmptyState title="The Study Hub is not connected yet" action={<Link className="ap-btn ap-btn--primary" to="/study">Open the sample courses</Link>}>
        This website has no database connection, so Study Hub content cannot load. The sample courses still work.
      </EmptyState>
    );
  }
  if (hub.status === 'loading') return <p role="status" className="ap-muted">Loading your courses…</p>;
  if (hub.status === 'error') {
    if (hub.code === 'permission-denied' && !user) {
      return <EmptyState title="Log in to open your courses" action={<Link className="ap-btn ap-btn--primary" to="/login">Log in</Link>}>Lectures, notes and practice are for signed-in students.</EmptyState>;
    }
    return (
      <EmptyState title="Your courses could not load" action={<button type="button" className="ap-btn ap-btn--primary" onClick={hub.reload}>Try again</button>}>{hub.error}{hub.code ? <small className="ap-muted" style={{ display: 'block', marginTop: 8 }}>Technical detail: {hub.code}</small> : null}</EmptyState>
    );
  }
  return (
    <HubContext.Provider value={hub.value}>
      {prog && <DemoNote>{prog}</DemoNote>}
      <Outlet />
    </HubContext.Provider>
  );
}

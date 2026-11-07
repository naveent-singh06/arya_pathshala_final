import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useContent } from '../../cms/hooks';
import { useHubProgress, useEnrollments } from '../../cms/userData';
import { useLearn } from '../../components/learn/LearnContext';
import { HubContext } from './HubContext';
import { DemoNote, EmptyState } from '../../components/learn/shared';

/** Loads the published content once for every Study Hub page, plus this student's own progress. */
export default function HubLayout() {
  const { user } = useLearn();
  const content = useContent({ admin: false });
  const prog = useHubProgress(user ? user.uid : null);
  const enr = useEnrollments(user ? user.uid : null);

  if (content.status === 'unconfigured') {
    return (
      <EmptyState title="The Study Hub is not connected yet" action={<Link className="ap-btn ap-btn--primary" to="/study">Open the sample courses</Link>}>
        This website has no database connection, so Study Hub content cannot load. The sample courses still work.
      </EmptyState>
    );
  }
  if (content.status === 'loading') return <p role="status" className="ap-muted">Loading the Study Hub…</p>;
  if (content.status === 'error') {
    if (content.code === 'permission-denied' && !user) {
      return <EmptyState title="Log in to open the Study Hub" action={<Link className="ap-btn ap-btn--primary" to="/login">Log in</Link>}>Lectures, notes and practice are for signed-in students.</EmptyState>;
    }
    return (
      <EmptyState title="The Study Hub could not load" action={<button type="button" className="ap-btn ap-btn--primary" onClick={content.reload}>Try again</button>}>{content.error}</EmptyState>
    );
  }
  return (
    <HubContext.Provider value={{ data: content.data, user, progress: prog.progress, progressActions: prog.actions, progressError: prog.error, enrolled: enr.enrolled, enroll: enr.enroll, leave: enr.leave }}>
      {prog.error && <DemoNote>{prog.error}</DemoNote>}
      <Outlet />
    </HubContext.Provider>
  );
}

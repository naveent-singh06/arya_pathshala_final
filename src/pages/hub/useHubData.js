import { useContent, useIsAdmin } from '../../cms/hooks';
import { useHubProgress, useEnrollments } from '../../cms/userData';
import { useLearn } from '../../components/learn/LearnContext';

/** Published content plus this student's own progress and joined batches, shared by the Hub, My Courses, Batches and the dashboard. */
export default function useHubData() {
  const { user } = useLearn();
  const content = useContent({ admin: false });
  const prog = useHubProgress(user ? user.uid : null);
  const enr = useEnrollments(user ? user.uid : null);
  const isAdmin = useIsAdmin();
  return {
    status: content.status, error: content.error, code: content.code, reload: content.reload,
    value: { data: content.data, user, isAdmin, progress: prog.progress, progressActions: prog.actions, progressError: prog.error, enrolled: enr.enrolled, enroll: enr.enroll, leave: enr.leave },
  };
}

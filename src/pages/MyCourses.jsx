import React from 'react';
import { PageHead } from '../components/learn/shared';
import { useHub } from './hub/HubContext';
import { MyBatches } from './hub/MyLearning';
import '../styles/hub.css';

/** My courses: the batches the student joined (real Firestore data, real progress) and the Study Hub entry points. */
export default function MyCourses() {
  const hub = useHub();
  return (
    <div className="ap-stack" style={{ gap: 16 }}>
      <PageHead title="My courses" description="Your batches, your progress and the next topic to study." />
      <MyBatches hub={hub} />
    </div>
  );
}

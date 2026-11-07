// Sample ("Demo") Study Hub content. Pure data: no network, no credentials.
// Lectures, notes and DPP files are NOT included because they need real YouTube / Google Drive
// links, which only the school can supply. Topics without them show "coming soon" to students.
const PUBLISHED = 'published';

function build() {
  const docs = []; // { collection, id, data }
  const add = (collection, id, data) => docs.push({ collection, id, data: { ...data, status: PUBLISHED, demo: true } });

  const classes = [
    { id: 'class-9', label: 'Class 9', subjects: [['Mathematics', 'Number Systems'], ['Science', 'Matter in Our Surroundings']] },
    { id: 'class-10', label: 'Class 10', subjects: [['Mathematics', 'Number Systems'], ['Science', 'Chemical Reactions and Equations']] },
    { id: 'neet', label: 'NEET', subjects: [['Biology', 'The Living World'], ['Physics', 'Units and Measurements'], ['Chemistry', 'Some Basic Concepts of Chemistry']] },
  ];
  const mathTopics = [
    ['Introduction to Number Systems', 'Easy'],
    ['Natural Numbers and Whole Numbers', 'Easy'],
    ['Integers', 'Easy'],
    ['Rational Numbers', 'Medium'],
    ['Irrational Numbers', 'Medium'],
    ['Real Numbers and the Number Line', 'Hard'],
  ];

  classes.forEach((c) => {
    const batchId = `demo-${c.id}-foundation`;
    const subjectIds = [];
    c.subjects.forEach(([subject, chapter], si) => {
      const sid = `demo-${c.id}-${subject.toLowerCase()}`;
      const cid = `${sid}-ch1`;
      subjectIds.push(sid);
      add('subjects', sid, { classId: c.id, name: `${subject} (Demo)`, description: 'Sample subject for testing the Study Hub.', imageUrl: '', order: si + 1 });
      add('chapters', cid, { classId: c.id, subjectId: sid, number: 1, title: `${chapter} (Demo)`, description: 'Sample chapter.', order: 1 });
      const isMath = subject === 'Mathematics';
      const topics = isMath ? mathTopics : [[`Introduction to ${chapter}`, 'Easy'], [`Key ideas of ${chapter}`, 'Medium']];
      topics.forEach(([title, difficulty], ti) => {
        const tid = `${cid}-t${ti + 1}`;
        add('topics', tid, { classId: c.id, subjectId: sid, chapterId: cid, title: `${title} (Demo)`, description: 'Sample topic. The lecture and notes have not been added yet.', difficulty, order: ti + 1 });
        if (c.id === 'class-10' && isMath && ti === 1) {
          add('questions', `${tid}-q1`, { classId: c.id, subjectId: sid, chapterId: cid, topicId: tid, type: 'mcq', set: 'practice', question: 'Demo question: which of these is a natural number?', options: ['0', '-3', '7', '1/2'], correctIndex: 2, explanation: 'Natural numbers are 1, 2, 3, ... so 7 is the only one.', difficulty: 'Easy', order: 1 });
          add('questions', `${tid}-q2`, { classId: c.id, subjectId: sid, chapterId: cid, topicId: tid, type: 'mcq', set: 'dpp', question: 'Demo DPP question: the smallest whole number is...', options: ['1', '0', '-1', '10'], correctIndex: 1, explanation: 'Whole numbers start from 0.', difficulty: 'Easy', order: 2 });
        }
      });
    });
    add('batches', batchId, { classId: c.id, name: `${c.label} Foundation Batch (Demo)`, description: 'Sample batch used to test the Study Hub. Replace it with your real batch.', session: '', duration: '', coverUrl: '', subjectIds, teacherIds: [], order: 1 });
  });
  return docs;
}

module.exports = { build };

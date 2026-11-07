import { subjectAccent } from './categories';
import { getTeacher } from './teachers';

// ---------------------------------------------------------------------------
// DEMO DATA. Every course, chapter and lecture below is a placeholder that shows how real
// content will look. No lecture videos or files have been uploaded yet: a lecture's
// `youtubeId` stays null until a real YouTube video ID is added (the player then embeds it).
// ---------------------------------------------------------------------------

const ch = (title, lectures = 3) => ({ title, lectures });

// Chapters taught for each subject, per category.
export const SYLLABUS = {
  'class-9': {
    Mathematics: [
      ch('Number Systems'),
      ch('Polynomials'),
      ch('Coordinate Geometry'),
      ch('Linear Equations in Two Variables'),
      ch('Lines and Angles'),
    ],
    Science: [
      ch('Matter in Our Surroundings'),
      ch('Atoms and Molecules'),
      ch('The Fundamental Unit of Life'),
      ch('Motion'),
      ch('Force and Laws of Motion'),
    ],
    English: [ch('Reading Comprehension', 2), ch('Tenses'), ch('Letter Writing', 2), ch('Prose and Poetry'), ch('Vocabulary Building', 2)],
  },
  'class-10': {
    Mathematics: [
      ch('Real Numbers'),
      ch('Polynomials'),
      ch('Pair of Linear Equations in Two Variables'),
      ch('Quadratic Equations'),
      ch('Introduction to Trigonometry'),
    ],
    Science: [
      ch('Chemical Reactions and Equations'),
      ch('Acids, Bases and Salts'),
      ch('Life Processes'),
      ch('Electricity'),
      ch('Light: Reflection and Refraction'),
    ],
    English: [ch('Reading Comprehension', 2), ch('Reported Speech'), ch('Formal Letter Writing', 2), ch('Prose and Poetry'), ch('Vocabulary Building', 2)],
  },
  neet: {
    Biology: [
      ch('The Living World', 2),
      ch('Cell: The Unit of Life'),
      ch('Biomolecules'),
      ch('Cell Cycle and Cell Division'),
      ch('Photosynthesis in Higher Plants'),
    ],
    Physics: [
      ch('Units and Measurements'),
      ch('Motion in a Straight Line'),
      ch('Laws of Motion'),
      ch('Work, Energy and Power'),
      ch('Current Electricity'),
    ],
    Chemistry: [
      ch('Some Basic Concepts of Chemistry'),
      ch('Structure of Atom'),
      ch('Chemical Bonding'),
      ch('Thermodynamics'),
      ch('Equilibrium'),
    ],
  },
};

// Which teacher takes each subject. Only the three starting teachers exist.
const TEACHER_FOR_SUBJECT = {
  Mathematics: 'navneet-bhaiya',
  English: 'pavan-bhaiya',
  Science: 'prem-bhaiya',
  Biology: 'prem-bhaiya',
  Physics: 'prem-bhaiya',
  Chemistry: 'prem-bhaiya',
};

const LECTURE_TITLES = ['Introduction and key ideas', 'Concepts explained', 'Solved examples'];

const COURSE_FEATURES = [
  'Recorded lectures, chapter by chapter',
  'Chapter notes and PDFs',
  'Chapter-wise DPP and practice questions',
  'Doubt solving with the AI Tutor',
];

const COURSE_DEFS = [
  {
    id: 'class-9-foundation',
    categoryId: 'class-9',
    title: 'Class 9 Foundation Batch',
    description: 'One course for Mathematics, Science and English in Class 9. Learn each chapter through lectures, then practise it with a DPP.',
    subjects: ['Mathematics', 'Science', 'English'],
    duration: '10 months',
    language: 'Hinglish',
  },
  {
    id: 'class-9-mathematics',
    categoryId: 'class-9',
    title: 'Class 9 Mathematics Course',
    description: 'A focused Mathematics course for Class 9, from Number Systems to Lines and Angles, with worked examples in every chapter.',
    subjects: ['Mathematics'],
    duration: '6 months',
    language: 'Hinglish',
  },
  {
    id: 'class-9-science',
    categoryId: 'class-9',
    title: 'Class 9 Science Course',
    description: 'Class 9 Science explained in simple Hindi, covering matter, the cell, motion and force.',
    subjects: ['Science'],
    duration: '6 months',
    language: 'Hindi',
  },
  {
    id: 'class-10-board-batch',
    categoryId: 'class-10',
    title: 'Class 10 Board Preparation Batch',
    description: 'Mathematics, Science and English for the Class 10 board year, with chapter-wise lectures and practice after each chapter.',
    subjects: ['Mathematics', 'Science', 'English'],
    duration: '10 months',
    language: 'Hinglish',
  },
  {
    id: 'class-10-mathematics',
    categoryId: 'class-10',
    title: 'Class 10 Mathematics Course',
    description: 'Class 10 Mathematics from Real Numbers to Trigonometry, with step-by-step solving in every lecture.',
    subjects: ['Mathematics'],
    duration: '6 months',
    language: 'Hinglish',
  },
  {
    id: 'class-10-english',
    categoryId: 'class-10',
    title: 'Class 10 English Course',
    description: 'Reading, grammar, letter writing and literature for Class 10 English.',
    subjects: ['English'],
    duration: '4 months',
    language: 'English',
  },
  {
    id: 'neet-foundation',
    categoryId: 'neet',
    title: 'NEET Foundation Course',
    description: 'Biology, Physics and Chemistry for NEET, taught chapter by chapter and followed by practice questions.',
    subjects: ['Biology', 'Physics', 'Chemistry'],
    duration: '12 months',
    language: 'Hinglish',
  },
  {
    id: 'neet-biology',
    categoryId: 'neet',
    title: 'NEET Biology Course',
    description: 'NEET Biology from The Living World to Photosynthesis, with a DPP for each chapter.',
    subjects: ['Biology'],
    duration: '6 months',
    language: 'Hindi',
  },
  {
    id: 'neet-practice',
    categoryId: 'neet',
    title: 'NEET Chapter-wise Practice Course',
    description: 'Revise Biology, Physics and Chemistry chapter by chapter, then test yourself with practice questions.',
    subjects: ['Biology', 'Physics', 'Chemistry'],
    duration: '3 months',
    language: 'English',
  },
];

export const slugify = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function buildCourse(def) {
  const subjects = def.subjects.map((name) => {
    const teacherId = TEACHER_FOR_SUBJECT[name];
    const slug = slugify(name);
    const chapters = SYLLABUS[def.categoryId][name].map((chapter, ci) => ({
      index: ci + 1,
      title: chapter.title,
      subject: name,
      lectures: Array.from({ length: chapter.lectures }, (_, li) => ({
        id: `${def.id}_${slug}_c${ci + 1}_l${li + 1}`,
        courseId: def.id,
        subject: name,
        teacherId,
        chapterIndex: ci + 1,
        chapterTitle: chapter.title,
        number: li + 1,
        title: `Lecture ${li + 1}: ${LECTURE_TITLES[li]}`,
        isFree: ci === 0 && li === 0, // the first lecture of each subject is the free demo lecture
        youtubeId: null, // set to a real YouTube video ID to embed it in the player
      })),
    }));
    return { name, slug, teacherId, accent: subjectAccent(name), chapters };
  });

  return {
    ...def,
    subjects,
    accent: subjects.length === 1 ? subjects[0].accent : 'brand',
    features: COURSE_FEATURES,
    isDemo: true,
  };
}

export const COURSES = COURSE_DEFS.map(buildCourse);

export const getCourse = (id) => COURSES.find((c) => c.id === id) || null;
export const coursesInCategory = (categoryId) => COURSES.filter((c) => c.categoryId === categoryId);
export const courseTeachers = (course) =>
  [...new Set(course.subjects.map((s) => s.teacherId))].map(getTeacher).filter(Boolean);

/** Every lecture of a course in teaching order, each with its position (`order`). */
export function courseLectures(course) {
  const list = [];
  course.subjects.forEach((subject) =>
    subject.chapters.forEach((chapter) => chapter.lectures.forEach((lecture) => list.push(lecture)))
  );
  return list.map((lecture, order) => ({ ...lecture, order }));
}

export function getLectureContext(courseId, lectureId) {
  const course = getCourse(courseId);
  if (!course) return null;
  const all = courseLectures(course);
  const index = all.findIndex((l) => l.id === lectureId);
  if (index < 0) return null;
  return {
    course,
    lecture: all[index],
    all,
    index,
    previous: index > 0 ? all[index - 1] : null,
    next: index < all.length - 1 ? all[index + 1] : null,
  };
}

export const teacherCourses = (teacherId) =>
  COURSES.filter((course) => course.subjects.some((s) => s.teacherId === teacherId));

/** All lectures taught by a teacher, across every course. */
export function teacherLectures(teacherId) {
  return teacherCourses(teacherId).flatMap((course) =>
    courseLectures(course)
      .filter((lecture) => lecture.teacherId === teacherId)
      .map((lecture) => ({ ...lecture, courseTitle: course.title }))
  );
}

export const coursePath = (courseId) => `/course/${courseId}`;
export const courseLecturesPath = (courseId) => `/course/${courseId}/lectures`;
export const lecturePath = (courseId, lectureId) => `/course/${courseId}/lecture/${lectureId}`;
export const totalLectures = (course) => courseLectures(course).length;

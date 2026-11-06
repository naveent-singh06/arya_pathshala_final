// The three exam/class categories shown in this phase. Add an entry here to add a category.
export const CATEGORIES = [
  {
    id: 'class-9',
    title: 'Class 9',
    description: 'Mathematics, Science and English for Class 9, with chapter-wise lectures, notes and practice.',
    audience: 'For students in Class 9',
    accent: 'science',
  },
  {
    id: 'class-10',
    title: 'Class 10',
    description: 'Board-year courses in Mathematics, Science and English with lectures, notes and practice papers.',
    audience: 'For students in Class 10',
    accent: 'maths',
  },
  {
    id: 'neet',
    title: 'NEET',
    description: 'Biology, Physics and Chemistry for NEET aspirants, taught chapter by chapter with practice.',
    audience: 'For NEET aspirants',
    accent: 'chemistry',
  },
];

export const getCategory = (id) => CATEGORIES.find((c) => c.id === id) || null;

// Colour family for each subject (the names map to --ap-<accent> variables in theme.css).
const SUBJECT_ACCENT = {
  Mathematics: 'maths',
  Science: 'science',
  English: 'english',
  Biology: 'science',
  Physics: 'physics',
  Chemistry: 'chemistry',
};

export const subjectAccent = (subject) => SUBJECT_ACCENT[subject] || 'maths';

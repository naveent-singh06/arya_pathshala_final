import { SYLLABUS, coursesInCategory, lecturePath } from './courses';
import { CATEGORIES } from './categories';
import { quizSetForChapter } from './practice';

// One row per chapter taught in a category: the base for Notes, PDFs and DPP lists.
// Nothing here is uploaded material. `pdfUploaded` is false everywhere until real files exist.
export const CHAPTERS = CATEGORIES.flatMap((category) => {
  const courses = coursesInCategory(category.id);
  return Object.entries(SYLLABUS[category.id]).flatMap(([subject, chapters]) =>
    chapters.map((chapter, i) => {
      const course = courses.find((c) => c.subjects.some((s) => s.name === subject));
      const first = course ? course.subjects.find((s) => s.name === subject).chapters[i].lectures[0] : null;
      const dpp = quizSetForChapter(category.id, subject, chapter.title);
      return {
        key: `${category.id}:${subject}:${i + 1}`,
        categoryId: category.id,
        subject,
        index: i + 1,
        title: chapter.title,
        lectureCount: chapter.lectures,
        lecturePath: first ? lecturePath(course.id, first.id) : null,
        dppId: dpp ? dpp.id : null,
        pdfUploaded: false,
      };
    })
  );
});

export const chaptersFor = (categoryId, subject) =>
  CHAPTERS.filter((c) => (!categoryId || c.categoryId === categoryId) && (!subject || subject === 'All' || c.subject === subject));

export const subjectsIn = (categoryId) => [
  'All',
  ...new Set(CHAPTERS.filter((c) => !categoryId || c.categoryId === categoryId).map((c) => c.subject)),
];

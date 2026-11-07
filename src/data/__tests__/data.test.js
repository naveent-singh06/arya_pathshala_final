import { CATEGORIES } from '../categories';
import { TEACHERS, getTeacher } from '../teachers';
import { COURSES, courseLectures, getLectureContext, teacherLectures } from '../courses';
import { QUIZ_SETS, TESTS, scoreAnswers } from '../practice';
import { CHAPTERS } from '../materials';
import { emptyState, enroll, markLectureDone, recordVisit, saveResult, courseProgress } from '../learnerState';
import { continueFor } from '../continueLearning';

describe('catalogue data', () => {
  test('exactly the three starting teachers', () => {
    expect(TEACHERS.map((t) => `${t.name}:${t.subject}`)).toEqual([
      'Navneet Bhaiya:Mathematics',
      'Pavan Bhaiya:English',
      'Prem Bhaiya:Science',
    ]);
    TEACHERS.forEach((t) => expect(t.photo).toBeNull());
  });

  test('exactly Class 9, Class 10 and NEET', () => {
    expect(CATEGORIES.map((c) => c.title)).toEqual(['Class 9', 'Class 10', 'NEET']);
  });

  test('every course belongs to a category and a known teacher, with unique lecture ids', () => {
    const ids = new Set();
    COURSES.forEach((course) => {
      expect(CATEGORIES.some((c) => c.id === course.categoryId)).toBe(true);
      course.subjects.forEach((s) => expect(getTeacher(s.teacherId)).not.toBeNull());
      courseLectures(course).forEach((l) => {
        expect(ids.has(l.id)).toBe(false);
        ids.add(l.id);
        expect(l.youtubeId).toBeNull();
      });
    });
  });

  test('lecture context links previous and next', () => {
    const course = COURSES[0];
    const all = courseLectures(course);
    const ctx = getLectureContext(course.id, all[1].id);
    expect(ctx.previous.id).toBe(all[0].id);
    expect(ctx.next.id).toBe(all[2].id);
    expect(getLectureContext(course.id, all[0].id).previous).toBeNull();
    expect(getLectureContext(course.id, 'nope')).toBeNull();
  });

  test('every teacher has lectures', () => {
    TEACHERS.forEach((t) => expect(teacherLectures(t.id).length).toBeGreaterThan(0));
  });

  test('quiz questions are well formed', () => {
    const ids = new Set();
    QUIZ_SETS.forEach((set) =>
      set.questions.forEach((q) => {
        expect(q.options).toHaveLength(4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(4);
        expect(new Set(q.options).size).toBe(4);
        expect(ids.has(q.id)).toBe(false);
        ids.add(q.id);
      })
    );
    TESTS.forEach((t) => expect(t.questions.length).toBeGreaterThan(0));
  });

  test('chapter DPP links point to real sets', () => {
    const setIds = new Set(QUIZ_SETS.map((s) => s.id));
    expect(CHAPTERS.filter((c) => c.dppId).every((c) => setIds.has(c.dppId))).toBe(true);
    expect(CHAPTERS.every((c) => c.pdfUploaded === false)).toBe(true);
  });
});

describe('scoring and learner state', () => {
  test('scoreAnswers', () => {
    const qs = [{ id: 'a', answer: 1 }, { id: 'b', answer: 0 }];
    expect(scoreAnswers(qs, { a: 1, b: 2 })).toEqual({ correct: 1, total: 2, percent: 50 });
    expect(scoreAnswers([], {})).toEqual({ correct: 0, total: 0, percent: 0 });
  });

  test('enroll, visit, complete and progress', () => {
    const course = COURSES[0];
    const lectures = courseLectures(course);
    let s = emptyState();
    s = enroll(s, course.id, course.title);
    expect(enroll(s, course.id)).toBe(s);
    s = recordVisit(s, course.id, lectures[0].id, lectures[0].title);
    s = markLectureDone(s, lectures[0].id, lectures[0].title);
    expect(courseProgress(s, lectures.map((l) => l.id)).done).toBe(1);
    const c = continueFor(s, course);
    expect(c.last.id).toBe(lectures[0].id);
    expect(c.next.id).toBe(lectures[1].id);
    expect(s.activity.length).toBe(3);
  });

  test('saveResult keeps the best score', () => {
    let s = saveResult(emptyState(), 'x', 3, 4);
    s = saveResult(s, 'x', 1, 4);
    expect(s.results.x.percent).toBe(25);
    expect(s.results.x.best).toBe(75);
  });
});

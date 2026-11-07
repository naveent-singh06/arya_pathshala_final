// Exactly three teachers to start with. To add a teacher later, append an object here and
// point a subject at it in courses.js. No page needs to change.
//
// `photo` is null on purpose: no real photographs have been supplied, so pages show a
// clean initials avatar. When a photo is available, set `photo` to its URL.
// `bioIsPlaceholder` makes the profile page say the full introduction is still to come.
export const TEACHERS = [
  {
    id: 'navneet-bhaiya',
    name: 'Navneet Bhaiya',
    subject: 'Mathematics',
    accent: 'maths',
    photo: null,
    intro: 'Teaches Mathematics for Class 9 and Class 10 at Arya Pathshala.',
    bioIsPlaceholder: true,
  },
  {
    id: 'pavan-bhaiya',
    name: 'Pavan Bhaiya',
    subject: 'English',
    accent: 'english',
    photo: null,
    intro: 'Teaches English for Class 9 and Class 10 at Arya Pathshala.',
    bioIsPlaceholder: true,
  },
  {
    id: 'prem-bhaiya',
    name: 'Prem Bhaiya',
    subject: 'Science',
    accent: 'science',
    photo: null,
    intro: 'Teaches Science for Class 9 and Class 10, and Biology, Physics and Chemistry for NEET.',
    bioIsPlaceholder: true,
  },
];

export const getTeacher = (id) => TEACHERS.find((t) => t.id === id) || null;

/** "Navneet Bhaiya" -> "NB" (used by the avatar placeholder). */
export function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

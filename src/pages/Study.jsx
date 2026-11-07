import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PlayCircle, FileText, ClipboardList, ListChecks, Users } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { PageHead } from '../components/learn/shared';

const SECTIONS = [
  { to: '/lectures', label: 'Lectures', text: 'Subject, chapter and lecture lists.', icon: PlayCircle },
  { to: '/study-material', label: 'Notes & PDFs', text: 'Chapter notes and PDF resources.', icon: FileText },
  { to: '/practice', label: 'DPP / Practice', text: 'Chapter-wise practice questions.', icon: ClipboardList },
  { to: '/tests', label: 'Tests & Quizzes', text: 'Mixed quizzes for each class or exam.', icon: ListChecks },
  { to: '/teachers', label: 'Teachers', text: 'Meet Navneet, Pavan and Prem Bhaiya.', icon: Users },
];

export default function Study() {
  return (
    <>
      <PageHead title="Study" description="Everything you need to learn, in one place." />
      <h2 style={{ marginBottom: 12, fontSize: '1.3rem' }}>Choose your class or exam</h2>
      <div className="ap-quicklinks" style={{ marginBottom: 28 }}>
        {CATEGORIES.map((c) => (
          <Link key={c.id} to={`/courses/${c.id}`} className="ap-card ap-quicklink"><BookOpen size={24} aria-hidden="true" />{c.title}</Link>
        ))}
      </div>
      <div className="ap-grid-3">
        {SECTIONS.map(({ to, label, text, icon: Icon }) => (
          <Link key={to} to={to} className="ap-card ap-quicklink"><Icon size={24} aria-hidden="true" /><span>{label}</span><span className="ap-muted" style={{ fontWeight: 400 }}>{text}</span></Link>
        ))}
      </div>
    </>
  );
}

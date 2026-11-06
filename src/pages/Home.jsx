import React from 'react';
import { Link } from 'react-router-dom';
import { Video, FileText, MessageCircleQuestion, Award, BookOpen, GraduationCap, Stethoscope, ArrowRight } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { TEACHERS } from '../data/teachers';
import { coursesInCategory } from '../data/courses';
import { TeacherCard, accentStyle } from '../components/learn/shared';
import SiteFooter from '../components/learn/SiteFooter';

const HIGHLIGHTS = [
  { icon: Video, title: 'Live & Recorded Lectures', text: 'Chapter-wise lectures you can watch again and again.' },
  { icon: FileText, title: 'Notes and Practice Papers', text: 'Notes, DPPs and quizzes for every chapter.' },
  { icon: MessageCircleQuestion, title: 'Doubt Solving', text: 'Ask the AI Tutor in English, Hindi or Hinglish.' },
  { icon: Award, title: 'Expert Teachers', text: 'Learn from Navneet, Pavan and Prem Bhaiya.' },
];

const CATEGORY_ICON = { 'class-9': BookOpen, 'class-10': GraduationCap, neet: Stethoscope };

// Original illustration (not a photograph): a teacher at a board and a student with a book.
function HeroArt() {
  return (
    <svg className="ap-hero__art" viewBox="0 0 520 420" role="img" aria-label="Illustration of a teacher at a board and a student studying">
      <rect x="20" y="30" width="480" height="330" rx="28" fill="#e8effb" />
      <circle cx="420" cy="90" r="44" fill="#f4a300" opacity="0.9" />
      <rect x="60" y="70" width="250" height="150" rx="14" fill="#0f459b" />
      <path d="M85 110h120M85 140h170M85 170h90" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.85" />
      <circle cx="270" cy="175" r="18" fill="none" stroke="#f4a300" strokeWidth="6" />
      <rect x="60" y="226" width="250" height="10" rx="5" fill="#0c2149" opacity="0.15" />
      {/* teacher */}
      <circle cx="372" cy="196" r="30" fill="#f2c9a5" />
      <path d="M334 186c4-26 56-26 62 0-14-10-48-10-62 0z" fill="#0c2149" />
      <path d="M322 360c0-60 22-120 50-120s50 60 50 120z" fill="#0c2149" />
      <path d="M352 244l20 30 20-30" fill="#fff" />
      {/* student */}
      <circle cx="170" cy="262" r="26" fill="#d9a77d" />
      <path d="M142 254c3-26 52-26 56 0-12-9-44-9-56 0z" fill="#0c2149" />
      <path d="M110 360c0-52 22-84 60-84s60 32 60 84z" fill="#0099ff" />
      <path d="M118 322l52 14 52-14v38h-104z" fill="#fff" />
      <path d="M118 322l52 14v24l-52-14zM222 322l-52 14v24l52-14z" fill="#f4a300" opacity="0.0" />
      <rect x="60" y="348" width="400" height="14" rx="7" fill="#0c2149" opacity="0.12" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="ap-scope ap-home">
      <section className="ap-hero">
        <div className="ap-container ap-hero__grid">
          <div className="ap-hero__text">
            <h1>Your Dreams, Our Guidance.</h1>
            <p>
              Arya Pathshala is an online learning platform for Class 9, Class 10 and NEET students. Watch chapter-wise lectures, practise with
              DPPs, and clear your doubts with an AI Tutor that explains in the language you are comfortable with.
            </p>
            <div className="ap-row ap-row--wrap">
              <Link to="/courses" className="ap-btn ap-btn--accent">
                Explore Courses <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/tutor" className="ap-btn ap-btn--ghost">Try the AI Tutor</Link>
            </div>
          </div>
          <HeroArt />
        </div>
      </section>

      <section className="ap-container ap-section" aria-labelledby="hl">
        <h2 id="hl" className="ap-sr-only">Why learn with Arya Pathshala</h2>
        <ul className="ap-highlights">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="ap-card">
              <span className="ap-highlights__icon"><Icon size={22} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="ap-container ap-section" aria-labelledby="cats">
        <div className="ap-section__head">
          <h2 id="cats">Choose your class or exam</h2>
          <p>Pick where you are studying. Each page lists its courses, subjects and teachers.</p>
        </div>
        <div className="ap-grid-3">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c.id];
            const count = coursesInCategory(c.id).length;
            return (
              <article key={c.id} className="ap-card ap-catcard" style={accentStyle(c.accent)}>
                <span className="ap-catcard__icon"><Icon size={30} aria-hidden="true" /></span>
                <h3>{c.title}</h3>
                <p>{c.description}</p>
                <p className="ap-muted">{count} courses</p>
                <Link to={`/courses/${c.id}`} className="ap-btn ap-btn--primary ap-btn--sm">
                  Explore Courses<span className="ap-sr-only"> for {c.title}</span>
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="ap-container ap-section" aria-labelledby="tch">
        <div className="ap-section__head">
          <h2 id="tch">Meet your teachers</h2>
          <p>Three teachers take every subject across the courses.</p>
        </div>
        <div className="ap-grid-3">
          {TEACHERS.map((t) => <TeacherCard key={t.id} teacher={t} />)}
        </div>
      </section>

      <section className="ap-container ap-section">
        <div className="ap-cta">
          <div>
            <h2>Stuck on a doubt?</h2>
            <p>Ask the AI Tutor. It explains step by step in Hindi, English or Hinglish, and says so when it is not sure.</p>
          </div>
          <Link to="/tutor" className="ap-btn ap-btn--accent">Open the AI Tutor</Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

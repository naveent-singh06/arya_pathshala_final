import React from 'react';
import { Link } from 'react-router-dom';
import { Video, FileText, MessageCircleQuestion, Award, BookOpen, GraduationCap, Stethoscope, ArrowRight } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { TEACHERS } from '../data/teachers';
import { coursesInCategory } from '../data/courses';
import { TeacherCard, accentStyle } from '../components/learn/shared';
import { ClassroomBackground } from '../components/learn/BrandBackground';
import SiteFooter from '../components/learn/SiteFooter';

const HIGHLIGHTS = [
  { icon: Video, title: 'Live & Recorded Lectures', text: 'Chapter-wise lectures you can watch again and again.' },
  { icon: FileText, title: 'Notes and Practice Papers', text: 'Notes, DPPs and quizzes for every chapter.' },
  { icon: MessageCircleQuestion, title: 'Doubt Solving', text: 'Ask the AI Tutor in English, Hindi or Hinglish.' },
  { icon: Award, title: 'Expert Teachers', text: 'Learn from Navneet, Pavan and Prem Bhaiya.' },
];

const CATEGORY_ICON = { 'class-9': BookOpen, 'class-10': GraduationCap, neet: Stethoscope };

export default function Home() {
  return (
    <ClassroomBackground className="ap-scope ap-home">
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
          <figure className="ap-hero__photo">
            <img
              src="/assets/arya-home-hero-image.jpg"
              srcSet="/assets/arya-home-hero-image-760.jpg 760w, /assets/arya-home-hero-image.jpg 1400w"
              sizes="(min-width: 900px) 46vw, 92vw"
              width="1400"
              height="788"
              alt="Smiling Arya Pathshala students in blue polo shirts giving a thumbs up in front of the Arya Pathshala board"
              fetchpriority="high"
              decoding="async"
            />
          </figure>
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
    </ClassroomBackground>
  );
}

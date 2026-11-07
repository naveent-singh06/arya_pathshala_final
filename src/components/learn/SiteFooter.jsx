import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../data/categories';
import { BrandMark } from '../Header/Header';
import SocialLinks from '../../cms/SocialLinks';
import '../../styles/hub.css';

export default function SiteFooter() {
  return (
    <footer className="ap-scope ap-footer">
      <div className="ap-container ap-footer__grid">
        <div>
          <Link to="/" className="ap-brand ap-brand--light">
            <BrandMark size={30} />
            <span>Arya Pathshala</span>
          </Link>
          <p>Your Dreams, Our Guidance.</p>
          <SocialLinks />
        </div>
        <div>
          <h4>Courses</h4>
          <ul>
            {CATEGORIES.map((c) => (
              <li key={c.id}><Link to={`/courses/${c.id}`}>{c.title}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Learn</h4>
          <ul>
            <li><Link to="/teachers">Teachers</Link></li>
            <li><Link to="/hub">Study Hub</Link></li>
            <li><Link to="/study-material">Study material</Link></li>
            <li><Link to="/practice">DPP and practice</Link></li>
            <li><Link to="/tutor">AI Tutor</Link></li>
          </ul>
        </div>
        <div>
          <h4>Help</h4>
          <ul>
            <li><Link to="/contact">Contact us</Link></li>
            <li><Link to="/login">Log in</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

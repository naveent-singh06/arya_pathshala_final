import React from 'react';
import { useLocation } from 'react-router-dom';
import { Atom, BookOpen, Braces, Brain, FlaskConical, Orbit, Sigma } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';

// A few small decorative symbols (decorative only). They sit at the far screen edges on wide
// screens, on the public pages, in the dark themes, and are hidden from assistive technology.
const SYMBOLS = [
  { key: 'sci', Icon: Atom, side: 'left', top: 20, delay: 0 },
  { key: 'math', Icon: Sigma, side: 'left', top: 44, delay: 1.4 },
  { key: 'code', Icon: Braces, side: 'left', top: 68, delay: 2.6 },
  { key: 'chem', Icon: FlaskConical, side: 'right', top: 16, delay: 0.8 },
  { key: 'ai', text: 'AI', side: 'right', top: 38, delay: 2 },
  { key: 'phy', Icon: Orbit, side: 'right', top: 58, delay: 3.2 },
  { key: 'brain', Icon: Brain, side: 'right', top: 78, delay: 1.1 },
  { key: 'learn', Icon: BookOpen, side: 'left', top: 86, delay: 3.8 },
];

const PAGES = ['/', '/login', '/register'];

export default function FloatingSymbols() {
  const { theme } = useTheme();
  const { pathname } = useLocation();
  if (theme === 'white-glass' || !PAGES.includes(pathname)) return null;
  return (
    <div className="ap-fsyms" aria-hidden="true">
      {SYMBOLS.map(({ key, Icon, text, side, top, delay }) => (
        <span key={key} className="ap-fsym" style={{ [side]: '1.6%', top: `${top}%`, animationDelay: `${delay}s` }}>
          {Icon ? <Icon size={20} /> : <b>{text}</b>}
        </span>
      ))}
    </div>
  );
}

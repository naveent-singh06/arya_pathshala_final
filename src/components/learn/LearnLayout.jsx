import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BookOpen, LayoutDashboard, GraduationCap, Layers, PlayCircle, Users, FileText, ClipboardList,
  ListChecks, BarChart3, Library, Sparkles, ChevronsLeft, ChevronsRight, Menu, X, Home, LogIn,
} from 'lucide-react';
import useAuthUser from '../Login/useAuthUser';
import { useLearnerState } from '../../data/learnerState';
import { LearnContext } from './LearnContext';
import { BrandMark } from '../Header/Header';

const ITEMS = [
  { to: '/hub', label: 'Study Hub', icon: Library, match: ['/hub'] },
  { to: '/study', label: 'Study', icon: BookOpen, match: ['/study', '/course'] },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, match: ['/dashboard'] },
  { to: '/my-courses', label: 'My Courses', icon: GraduationCap, match: ['/my-courses'] },
  { to: '/batches', label: 'Batches', icon: Layers, match: ['/batches'] },
  { to: '/lectures', label: 'Lectures', icon: PlayCircle, match: ['/lectures'] },
  { to: '/teachers', label: 'Teachers', icon: Users, match: ['/teachers'] },
  { to: '/study-material', label: 'Notes & PDFs', icon: FileText, match: ['/study-material'] },
  { to: '/practice', label: 'DPP / Practice', icon: ClipboardList, match: ['/practice'] },
  { to: '/tests', label: 'Tests & Quizzes', icon: ListChecks, match: ['/tests'] },
  { to: '/progress', label: 'Progress', icon: BarChart3, match: ['/progress'] },
  { to: '/tutor', label: 'AI Tutor', icon: Sparkles, match: ['/tutor'] },
];

// A course's lecture pages belong under "Lectures"; the course page itself under "Study".
function isActive(item, pathname) {
  if (/^\/course\/[^/]+\/lecture/.test(pathname)) return item.to === '/lectures';
  return item.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
}

const readCollapsed = () => {
  try {
    return window.localStorage.getItem('ap-sidebar-collapsed') === '1';
  } catch (e) {
    return false;
  }
};

export default function LearnLayout() {
  const user = useAuthUser();
  const [state, actions] = useLearnerState(user ? user.uid : null);
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      try {
        window.localStorage.setItem('ap-sidebar-collapsed', value ? '0' : '1');
      } catch (e) {
        /* ignore */
      }
      return !value;
    });
  };

  return (
    <LearnContext.Provider value={{ user, state, actions }}>
      <div className={`ap-scope ap-learn ${collapsed ? 'is-collapsed' : ''}`}>
        {drawer && <div className="ap-learn__scrim" onClick={() => setDrawer(false)} aria-hidden="true" />}
        <aside id="learn-sidebar" className={`ap-side ${drawer ? 'is-open' : ''}`} aria-label="Learning navigation">
          <div className="ap-side__top">
            <Link to="/" className="ap-brand" aria-label="Arya Pathshala home">
              <BrandMark size={44} />
              <span className="ap-side__label ap-side__brand">
                Arya Pathshala
                <small>Dreams Find Wings Here</small>
              </span>
            </Link>
            <button type="button" className="ap-iconbtn ap-side__close" onClick={() => setDrawer(false)} aria-label="Close menu">
              <X size={20} />
            </button>
          </div>
          <nav>
            <ul>
              {ITEMS.map(({ to, label, icon: Icon, ...item }) => {
                const active = isActive({ to, ...item }, pathname);
                return (
                  <li key={to}>
                    <NavLink to={to} className={`ap-side__link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined} title={collapsed ? label : undefined}>
                      <Icon size={20} aria-hidden="true" />
                      <span className="ap-side__label">{label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
          <button type="button" className="ap-side__collapse" onClick={toggleCollapsed} aria-pressed={collapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
            <span className="ap-side__label">Collapse</span>
          </button>
        </aside>

        <div className="ap-learn__main ap-brandbg">
          <div className="ap-topbar">
            <button type="button" className="ap-iconbtn ap-topbar__menu" onClick={() => setDrawer(true)} aria-label="Open menu" aria-expanded={drawer} aria-controls="learn-sidebar">
              <Menu size={22} />
            </button>
            <Link to="/" className="ap-btn ap-btn--ghost ap-btn--sm">
              <Home size={16} aria-hidden="true" /> Home
            </Link>
            <span className="ap-topbar__spacer" />
            {user ? (
              <Link to="/dashboard" className="ap-topbar__user">
                {user.displayName || user.email || 'Student'}
              </Link>
            ) : (
              <Link to="/login" className="ap-btn ap-btn--primary ap-btn--sm">
                <LogIn size={16} aria-hidden="true" /> Log in
              </Link>
            )}
          </div>
          <main className="ap-learn__content" id="main">
            <Outlet />
          </main>
        </div>
      </div>
    </LearnContext.Provider>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import { auth } from '../Login/firebase';
import { CATEGORIES } from '../../data/categories';
import defaultAvatar from './avatar-icon.png';

// The official Arya Pathshala logo. The artwork has a black background, so it is always shown
// as a square tile (original aspect ratio, never stretched) rather than on a light surface.
export function BrandMark({ size = 40 }) {
  return (
    <img
      className="ap-logo"
      src="/assets/arya-pathshala-logo.jpeg"
      width={size}
      height={size}
      alt=""
      decoding="async"
    />
  );
}

function Dropdown({ label, children, active }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="ap-dd" ref={ref}>
      <button type="button" className={`ap-nav__link ${active ? 'is-active' : ''}`} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>
        {label} <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && <div className="ap-dd__menu">{children}</div>}
    </div>
  );
}

const Header = ({ user }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);

  useEffect(() => setMenu(false), [pathname]);

  const handleLogout = async () => {
    if (auth) await auth.signOut();
    navigate('/login');
  };

  const categoryLinks = (list) =>
    list.map((c) => (
      <Link key={c.id} to={`/courses/${c.id}`} role="menuitem">
        {c.title}
      </Link>
    ));

  const nav = (
    <>
      <NavLink to="/" end className="ap-nav__link">Home</NavLink>
      <Dropdown label="All Courses" active={pathname.startsWith('/courses') && !pathname.endsWith('neet')}>
        <Link to="/courses" role="menuitem">All courses</Link>
        {categoryLinks(CATEGORIES)}
      </Dropdown>
      <Dropdown label="Classes" active={/\/courses\/class-/.test(pathname)}>
        {categoryLinks(CATEGORIES.filter((c) => c.id.startsWith('class-')))}
      </Dropdown>
      <NavLink to="/courses/neet" className="ap-nav__link">NEET</NavLink>
      <NavLink to="/teachers" className="ap-nav__link">Teachers</NavLink>
      <NavLink to="/study-material" className="ap-nav__link">Study Material</NavLink>
      <NavLink to="/tutor" className="ap-nav__link">AI Tutor</NavLink>
    </>
  );

  return (
    <header className="ap-scope ap-header">
      <div className="ap-container ap-header__bar">
        <Link to="/" className="ap-brand" aria-label="Arya Pathshala home">
          <BrandMark />
          <span>Arya Pathshala</span>
        </Link>
        <nav className="ap-nav ap-nav--desktop" aria-label="Main">{nav}</nav>
        <div className="ap-header__auth">
          {user ? (
            <>
              <Link to="/dashboard" className="ap-btn ap-btn--primary ap-btn--sm">
                <img src={user.photoURL || defaultAvatar} alt="" className="ap-header__pic" onError={(e) => (e.target.src = defaultAvatar)} />
                Dashboard
              </Link>
              <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm ap-hide-sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : user === undefined ? null : (
            <Link to="/login" className="ap-btn ap-btn--primary ap-btn--sm">Log in</Link>
          )}
          <button type="button" className="ap-iconbtn ap-header__burger" aria-expanded={menu} aria-controls="mobile-nav" aria-label={menu ? 'Close menu' : 'Open menu'} onClick={() => setMenu(!menu)}>
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {menu && (
        <nav id="mobile-nav" className="ap-nav ap-nav--mobile" aria-label="Main mobile">
          <NavLink to="/" end className="ap-nav__link">Home</NavLink>
          <Link to="/courses" className="ap-nav__link">All Courses</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={`/courses/${c.id}`} className="ap-nav__link ap-nav__link--sub">{c.title}</Link>
          ))}
          <NavLink to="/teachers" className="ap-nav__link">Teachers</NavLink>
          <NavLink to="/study-material" className="ap-nav__link">Study Material</NavLink>
          <NavLink to="/tutor" className="ap-nav__link">AI Tutor</NavLink>
          {user && (
            <button type="button" className="ap-nav__link ap-nav__btn" onClick={handleLogout}>Log out</button>
          )}
        </nav>
      )}
    </header>
  );
};

export default Header;

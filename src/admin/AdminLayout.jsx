import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Layers, BookOpen, ListTree, ListOrdered, PlayCircle, FileText, HelpCircle, Share2, Menu, X, Home, ShieldAlert, ExternalLink } from 'lucide-react';
import { useAdminStatus, useContent } from '../cms/hooks';
import { firebaseConfigError } from '../components/Login/firebase';
import { BrandMark } from '../components/Header/Header';
import { AdminContext } from './AdminContext';
import { Notice } from './ui';
import '../styles/admin.css';

const ITEMS = [
  { to: '/admin/content', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/content/subjects', label: 'Manage Subjects', icon: BookOpen },
  { to: '/admin/content/chapters', label: 'Manage Chapters', icon: ListTree },
  { to: '/admin/content/topics', label: 'Manage Topics', icon: ListOrdered },
  { to: '/admin/content/lectures', label: 'Manage Lectures', icon: PlayCircle },
  { to: '/admin/content/resources', label: 'Notes & PDFs', icon: FileText },
  { to: '/admin/content/questions', label: 'Practice Questions', icon: HelpCircle },
  { to: '/admin/content/socialLinks', label: 'Social Links & Contact', icon: Share2 },
];

function Gate({ title, children, action }) {
  return (
    <div className="ap-scope adm-gate ap-brandbg">
      <div className="ap-card adm-gate__box">
        <ShieldAlert size={40} aria-hidden="true" />
        <h1>{title}</h1>
        <p>{children}</p>
        {action}
      </div>
    </div>
  );
}

/** The portal shell. Content only mounts after the signed ID token proves the admin claim. */
export default function AdminLayout() {
  const admin = useAdminStatus();
  if (firebaseConfigError || admin.status === 'unconfigured') {
    return <Gate title="Admin portal is not available" action={<Link className="ap-btn ap-btn--ghost" to="/">Back to home</Link>}>Firebase is not configured for this deployment, so content cannot be loaded or saved.</Gate>;
  }
  if (admin.status === 'loading') return <Gate title="Checking your access…">One moment.</Gate>;
  if (admin.status === 'signedout') {
    return <Gate title="Sign in to continue" action={<Link className="ap-btn ap-btn--primary" to="/login">Log in</Link>}>The admin portal is only for Arya Pathshala administrators.</Gate>;
  }
  if (admin.status !== 'admin') {
    return <Gate title="Admins only" action={<Link className="ap-btn ap-btn--ghost" to="/dashboard">Go to your dashboard</Link>}>This account does not have admin access. Students cannot open or change content.</Gate>;
  }
  return <AdminShell user={admin.user} />;
}

function AdminShell({ user }) {
  const content = useContent({ admin: true });
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <AdminContext.Provider value={{ user, content }}>
      <div className="ap-scope ap-learn adm-shell">
        {drawer && <div className="ap-learn__scrim" onClick={() => setDrawer(false)} aria-hidden="true" />}
        <aside id="adm-sidebar" className={`ap-side ${drawer ? 'is-open' : ''}`} aria-label="Admin navigation">
          <div className="ap-side__top">
            <Link to="/" className="ap-brand" aria-label="Arya Pathshala home">
              <BrandMark size={44} />
              <span className="ap-side__label ap-side__brand">Arya Pathshala<small>Content admin</small></span>
            </Link>
            <button type="button" className="ap-iconbtn ap-side__close" onClick={() => setDrawer(false)} aria-label="Close menu"><X size={20} /></button>
          </div>
          <nav>
            <ul>
              {ITEMS.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink to={to} end={end} className={({ isActive }) => `ap-side__link ${isActive ? 'is-active' : ''}`}>
                    <Icon size={20} aria-hidden="true" /><span className="ap-side__label">{label}</span>
                  </NavLink>
                </li>
              ))}
              <li>
                <NavLink to="/hub" className="ap-side__link"><Layers size={20} aria-hidden="true" /><span className="ap-side__label">View student site <ExternalLink size={12} aria-hidden="true" /></span></NavLink>
              </li>
            </ul>
          </nav>
        </aside>
        <div className="ap-learn__main ap-brandbg">
          <div className="ap-topbar">
            <button type="button" className="ap-iconbtn ap-topbar__menu" onClick={() => setDrawer(true)} aria-label="Open menu" aria-expanded={drawer} aria-controls="adm-sidebar"><Menu size={22} /></button>
            <Link to="/" className="ap-btn ap-btn--ghost ap-btn--sm"><Home size={16} aria-hidden="true" /> Home</Link>
            <span className="ap-topbar__spacer" />
            <span className="ap-topbar__user">{user.email || 'Admin'}</span>
          </div>
          <main className="ap-learn__content" id="main">
            {content.status === 'loading' && <Notice>Loading content…</Notice>}
            {content.status === 'error' && <Notice kind="error">{content.error} <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={content.reload}>Try again</button></Notice>}
            <Outlet />
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from './AdminContext';
import { CLASSES } from '../cms/model';
import { visibleLinks } from '../cms/links';

const ROWS = [
  ['subjects', 'Subjects'], ['chapters', 'Chapters'], ['topics', 'Topics'], ['lectures', 'Lectures'],
  ['resources', 'Notes & PDFs'], ['questions', 'Practice questions'], ['socialLinks', 'Social links'],
];

export default function Overview() {
  const { content } = useAdmin();
  const { data } = content;
  const published = (list) => list.filter((x) => (x.status ? x.status === 'published' : x.active !== false)).length;
  const live = visibleLinks(data.socialLinks).length;
  return (
    <div className="ap-stack" style={{ gap: 18 }}>
      <header className="ap-pagehead"><div><h1>Content overview</h1><p>Everything you publish here appears on the student Study Hub straight away.</p></div></header>
      <div className="ap-stats">
        <div className="ap-stat"><strong>{CLASSES.length}</strong><span>Classes / exams</span></div>
        {ROWS.map(([k, label]) => (
          <div key={k} className="ap-stat"><strong>{(data[k] || []).length}</strong><span>{label}</span><small className="ap-muted">{published(data[k] || [])} {k === 'socialLinks' ? 'active' : 'published'}</small></div>
        ))}
      </div>
      <section className="ap-card ap-panel">
        <h2>Add a lecture with its notes in four steps</h2>
        <ol className="adm-steps">
          <li>Add the <Link to="/admin/content/subjects">subject</Link>, <Link to="/admin/content/chapters">chapter</Link> and <Link to="/admin/content/topics">topic</Link> (once).</li>
          <li>Open <Link to="/admin/content/lectures">Manage Lectures</Link>, pick the topic, paste the YouTube link and check the preview.</li>
          <li>Add the handwritten notes in <Link to="/admin/content/resources">Notes &amp; PDFs</Link> with a Google Drive link.</li>
          <li>Choose <strong>Publish</strong>. Students see it on the topic page immediately.</li>
        </ol>
      </section>
      {live === 0 && <p className="ap-muted">No social links are active yet. Add them in <Link to="/admin/content/socialLinks">Social Links &amp; Contact</Link> so they appear in the footer and Contact page.</p>}
      <p className="ap-muted">Classes / exams (Class 9, Class 10, NEET) are fixed in this version.</p>
    </div>
  );
}

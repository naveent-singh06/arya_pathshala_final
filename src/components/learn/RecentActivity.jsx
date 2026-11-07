import React from 'react';

const fmt = (at) => {
  try {
    return new Date(at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

export default function RecentActivity({ items, limit = 10 }) {
  if (!items || !items.length) return <p className="ap-muted">Nothing yet. Open a lecture or take a quiz and it will show up here.</p>;
  return (
    <ul className="ap-activity">
      {items.slice(0, limit).map((a, i) => (
        <li key={`${a.at}-${i}`}>
          <span>{a.text}</span>
          <time dateTime={new Date(a.at).toISOString()}>{fmt(a.at)}</time>
        </li>
      ))}
    </ul>
  );
}

import React from 'react';
import { Youtube, Instagram, Send, MessageCircle, Mail, LifeBuoy } from 'lucide-react';
import { useSocialLinks } from './hooks';
import { visibleLinks, PLATFORMS } from './links';

const ICONS = { youtube: Youtube, instagram: Instagram, telegram: Send, whatsapp: MessageCircle, email: Mail, support: LifeBuoy };

/** Active, valid links from the admin portal. Renders nothing when there are none. */
export default function SocialLinks({ withLabels = false, className = '' }) {
  const links = visibleLinks(useSocialLinks());
  if (!links.length) return null;
  return (
    <ul className={`ap-sociallinks ${className}`} aria-label="Social and contact links">
      {links.map((l) => {
        const Icon = ICONS[l.platform] || LifeBuoy;
        const name = l.label || (PLATFORMS.find((p) => p.id === l.platform) || {}).label;
        const external = !l.href.startsWith('mailto:');
        return (
          <li key={l.id}>
            <a href={l.href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} aria-label={name} title={l.description || name}>
              <Icon size={20} aria-hidden="true" />
              {withLabels && <span>{name}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

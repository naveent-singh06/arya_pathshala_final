// Validation for the social / contact links an admin enters.
export const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', kind: 'url' },
  { id: 'instagram', label: 'Instagram', kind: 'url' },
  { id: 'telegram', label: 'Telegram', kind: 'url' },
  { id: 'whatsapp', label: 'WhatsApp', kind: 'url' },
  { id: 'email', label: 'Email', kind: 'email' },
  { id: 'support', label: 'Contact / Support page', kind: 'url' },
];

const EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/;

/** Returns { ok, href, error }. Emails become mailto: links; everything else must be https. */
export function normalizeLink(platform, value) {
  const raw = String(value == null ? '' : value).trim();
  const p = PLATFORMS.find((x) => x.id === platform);
  if (!p) return { ok: false, error: 'Choose a platform.' };
  if (!raw) return { ok: false, error: 'Enter a link.' };
  if (p.kind === 'email') {
    const address = raw.replace(/^mailto:/i, '');
    return EMAIL.test(address) ? { ok: true, href: `mailto:${address}`, value: address } : { ok: false, error: 'Enter a valid email address.' };
  }
  let url;
  try {
    url = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch (e) {
    return { ok: false, error: 'This is not a valid link.' };
  }
  if (url.protocol !== 'https:') return { ok: false, error: 'Links must start with https://.' };
  if (!url.hostname.includes('.')) return { ok: false, error: 'This link has no valid website address.' };
  return { ok: true, href: url.href, value: url.href };
}

/** Public links worth showing: active and with a valid href. */
export function visibleLinks(links) {
  return (links || [])
    .filter((l) => l && l.active !== false)
    .map((l) => ({ ...l, check: normalizeLink(l.platform, l.url) }))
    .filter((l) => l.check.ok)
    .map((l) => ({ ...l, href: l.check.href }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

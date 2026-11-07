// YouTube link helpers. Videos are only ever embedded from YouTube; nothing is downloaded or re-hosted.
const ID = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be']);

/** Returns { ok: true, id } or { ok: false, error }. Accepts watch?v=, youtu.be/, /live/, /embed/ (and /shorts/). */
export function parseYouTube(input) {
  const raw = String(input == null ? '' : input).trim();
  if (!raw) return { ok: false, error: 'Paste a YouTube link.' };
  if (ID.test(raw)) return { ok: true, id: raw };
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch (e) {
    return { ok: false, error: 'This is not a valid link.' };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { ok: false, error: 'Only web links are allowed.' };
  const host = url.hostname.toLowerCase();
  if (!HOSTS.has(host)) return { ok: false, error: 'Only YouTube links are supported (youtube.com or youtu.be).' };
  const parts = url.pathname.split('/').filter(Boolean);
  let id = null;
  if (host === 'youtu.be') id = parts[0];
  else if (parts[0] === 'watch') id = url.searchParams.get('v');
  else if (['embed', 'live', 'shorts', 'v'].includes(parts[0])) id = parts[1];
  if (!id || !ID.test(id)) {
    return { ok: false, error: 'No video was found in this link. Use a watch, youtu.be, live or embed link to a single video.' };
  }
  return { ok: true, id };
}

export const youTubeEmbedUrl = (id) => `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
export const youTubeWatchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;
export const youTubeThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

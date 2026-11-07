// Google Drive link helpers. Files stay on the owner's Drive; only links are stored.
const ID = /^[A-Za-z0-9_-]{10,}$/;
const DRIVE_HOSTS = new Set(['drive.google.com', 'docs.google.com']);

/**
 * Normalizes a Drive share link. Returns { ok, id, viewUrl, previewUrl, downloadUrl } or { ok:false, error }.
 * Handles /file/d/ID/..., open?id=ID, uc?id=ID and docs.google.com/document|presentation|spreadsheet/d/ID.
 */
export function parseDrive(input) {
  const raw = String(input == null ? '' : input).trim();
  if (!raw) return { ok: false, error: 'Paste a Google Drive link.' };
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch (e) {
    return { ok: false, error: 'This is not a valid link.' };
  }
  if (url.protocol !== 'https:') return { ok: false, error: 'Use an https:// Google Drive link.' };
  const host = url.hostname.toLowerCase();
  if (!DRIVE_HOSTS.has(host)) return { ok: false, error: 'Only Google Drive links (drive.google.com) are supported.' };
  const m = url.pathname.match(/\/d\/([^/]+)/);
  const id = (m && m[1]) || url.searchParams.get('id');
  if (!id || !ID.test(id)) {
    return { ok: false, error: 'No file was found in this link. Open the file in Drive, choose Share, then Copy link.' };
  }
  if (/\/folders\//.test(url.pathname)) return { ok: false, error: 'This is a folder link. Share a link to the PDF file itself.' };
  const isDoc = host === 'docs.google.com';
  const kind = isDoc ? (url.pathname.split('/')[1] || 'document') : 'file';
  return {
    ok: true,
    id,
    kind,
    viewUrl: isDoc ? `https://docs.google.com/${kind}/d/${id}/edit` : `https://drive.google.com/file/d/${id}/view`,
    previewUrl: isDoc ? `https://docs.google.com/${kind}/d/${id}/preview` : `https://drive.google.com/file/d/${id}/preview`,
    downloadUrl: isDoc ? null : `https://drive.google.com/uc?export=download&id=${id}`,
  };
}

export const DRIVE_SHARING_HINT = 'Make sure your Google Drive file sharing permission allows students to view the document ("Anyone with the link" can view).';

// Four themes, all built from the same tokens (see src/styles/themes.css).
export const THEMES = [
  { id: 'white-glass', name: 'White Glass', note: 'Clean and bright', swatch: 'linear-gradient(135deg, #ffffff 0%, #cfe0ff 55%, #2457a7 100%)' },
  { id: 'midnight-dark', name: 'Midnight Dark', note: 'Deep navy, royal blue', swatch: 'linear-gradient(135deg, #0b1226 0%, #1d3f94 60%, #3b82f6 100%)' },
  { id: 'cosmic-night', name: 'Cosmic Night', note: 'Galaxy, purple and cyan', swatch: 'linear-gradient(135deg, #6d3fe0 0%, #3b6ff0 55%, #22d3ee 100%)' },
  { id: 'neon-aurora', name: 'Neon Aurora', note: 'Teal, cyan and violet', swatch: 'linear-gradient(135deg, #14b8a6 0%, #22d3ee 50%, #8b5cf6 100%)' },
];

export const DEFAULT_THEME = 'white-glass';
export const THEME_STORAGE_KEY = 'ap-theme';
export const isTheme = (id) => THEMES.some((t) => t.id === id);

export function readStoredTheme() {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : DEFAULT_THEME;
  } catch (e) {
    return DEFAULT_THEME;
  }
}

export function storeTheme(id) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch (e) {
    /* storage can be blocked (private window); the theme still applies for this visit */
  }
}

export function applyTheme(id) {
  if (typeof document !== 'undefined') document.documentElement.setAttribute('data-ap-theme', id);
}

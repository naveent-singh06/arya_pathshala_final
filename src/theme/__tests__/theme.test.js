import { THEMES, DEFAULT_THEME, THEME_STORAGE_KEY, applyTheme, isTheme, readStoredTheme, storeTheme } from '../themes';
import { intensityForPath, particleBudget, parseRgb } from '../../components/Galaxy/galaxyEngine';

describe('theme storage', () => {
  beforeEach(() => window.localStorage.clear());

  test('exactly the four requested themes, white glass first', () => {
    expect(THEMES.map((t) => t.id)).toEqual(['white-glass', 'midnight-dark', 'cosmic-night', 'neon-aurora']);
    expect(THEMES.map((t) => t.name)).toEqual(['White Glass', 'Midnight Dark', 'Cosmic Night', 'Neon Aurora']);
  });

  test('defaults to white glass and ignores unknown values', () => {
    expect(readStoredTheme()).toBe(DEFAULT_THEME);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'hot-pink');
    expect(readStoredTheme()).toBe(DEFAULT_THEME);
    expect(isTheme('hot-pink')).toBe(false);
  });

  test('a saved theme is restored and applied to <html>', () => {
    storeTheme('cosmic-night');
    expect(readStoredTheme()).toBe('cosmic-night');
    applyTheme('cosmic-night');
    expect(document.documentElement.getAttribute('data-ap-theme')).toBe('cosmic-night');
  });
});

describe('galaxy helpers', () => {
  test('background intensity follows the page', () => {
    expect(intensityForPath('/')).toBe(1);
    expect(intensityForPath('/dashboard')).toBeLessThan(intensityForPath('/'));
    expect(intensityForPath('/course/x/lecture/y')).toBeLessThan(intensityForPath('/course/x'));
    expect(intensityForPath('/practice/dpp-abc')).toBeLessThan(0.2);
    expect(intensityForPath('/tests/test-class-9')).toBeLessThan(0.2);
    expect(intensityForPath('/tutor')).toBeGreaterThan(intensityForPath('/course/x'));
  });

  test('fewer particles on phones and low-power devices', () => {
    const desktop = particleBudget({ width: 1440, height: 900 });
    const phone = particleBudget({ width: 390, height: 844 });
    const slow = particleBudget({ width: 1440, height: 900, lowPower: true });
    expect(phone).toBeLessThan(desktop);
    expect(slow).toBeLessThan(desktop);
    expect(phone).toBeGreaterThanOrEqual(24);
  });

  test('colour tokens parse with a fallback', () => {
    expect(parseRgb('167, 139, 250', [0, 0, 0])).toEqual([167, 139, 250]);
    expect(parseRgb('', [1, 2, 3])).toEqual([1, 2, 3]);
  });
});

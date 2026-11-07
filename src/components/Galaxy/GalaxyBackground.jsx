import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../theme/ThemeContext';
import { createGalaxy, intensityForPath, readPalette } from './galaxyEngine';

// One canvas for the whole site, mounted once above the routes. It never receives pointer events,
// so clicking, selecting text and scrolling are unaffected. All the animation lives in galaxyEngine.
export default function GalaxyBackground() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const { theme } = useTheme();
  const { pathname } = useLocation();

  useEffect(() => {
    const query = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const engine = createGalaxy(canvasRef.current, { reducedMotion: !!(query && query.matches) });
    engineRef.current = engine;
    const onChange = (event) => engine.setReducedMotion(event.matches);
    if (query && query.addEventListener) query.addEventListener('change', onChange);
    return () => {
      if (query && query.removeEventListener) query.removeEventListener('change', onChange);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) engineRef.current.setColors(readPalette());
  }, [theme]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.setIntensity(intensityForPath(pathname));
  }, [pathname]);

  return (
    <>
      <div className="ap-aurora" aria-hidden="true" />
      <canvas ref={canvasRef} className="ap-galaxy" aria-hidden="true" />
    </>
  );
}

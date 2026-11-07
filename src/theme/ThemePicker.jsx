import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Check, Palette, X } from 'lucide-react';
import { THEMES } from './themes';
import { useTheme } from './ThemeContext';

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const activeRef = useRef(null);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus && buttonRef.current) buttonRef.current.focus();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') close();
    };
    const onPointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) close(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    if (activeRef.current) activeRef.current.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, close]);

  // Arrow keys move between themes like a radio group.
  const onOptionKey = (event, index) => {
    const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!move) return;
    event.preventDefault();
    const next = THEMES[(index + move + THEMES.length) % THEMES.length];
    setTheme(next.id);
    const node = rootRef.current && rootRef.current.querySelector(`[data-theme-id="${next.id}"]`);
    if (node) node.focus();
  };

  const onTutor = pathname === '/tutor';

  return (
    <div ref={rootRef} className={`ap-theme${onTutor ? ' ap-theme--tutor' : ''}`}>
      <div
        id="ap-theme-panel"
        className={`ap-theme__panel${open ? ' is-open' : ''}`}
        role="dialog"
        aria-label="Choose your theme"
        aria-hidden={!open}
      >
        <div className="ap-theme__head">
          <h2>Choose Your Theme</h2>
          <button type="button" className="ap-theme__x" onClick={() => close()} aria-label="Close theme panel" tabIndex={open ? 0 : -1}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="ap-theme__grid" role="radiogroup" aria-label="Theme">
          {THEMES.map((t, i) => {
            const active = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                data-theme-id={t.id}
                ref={active ? activeRef : null}
                tabIndex={open && active ? 0 : -1}
                className={`ap-theme__opt${active ? ' is-active' : ''}`}
                onClick={() => setTheme(t.id)}
                onKeyDown={(e) => onOptionKey(e, i)}
              >
                <span className="ap-theme__swatch" style={{ background: t.swatch }}>
                  {active && <Check size={16} aria-hidden="true" />}
                </span>
                <span className="ap-theme__name">{t.name}</span>
                <span className="ap-theme__note">{t.note}</span>
              </button>
            );
          })}
        </div>
      </div>
      <button
        ref={buttonRef}
        type="button"
        className="ap-theme__btn"
        aria-expanded={open}
        aria-controls="ap-theme-panel"
        aria-label="Change theme"
        onClick={() => (open ? close(false) : setOpen(true))}
      >
        <Palette size={22} aria-hidden="true" />
      </button>
    </div>
  );
}

// Lightweight canvas "galaxy": drifting stars, thin network lines between nearby stars, and a
// cursor that gently pulls nearby stars, lights the space around it and leaves a short fading trail.
//
// Everything runs in one requestAnimationFrame loop with no React state. The loop stops while the
// tab is hidden, the particle count is sized to the screen, and it backs off by itself if frames
// are slow. With reduced motion it draws one still frame and never starts the loop.

const TAU = Math.PI * 2;

/** Pages differ in how much background they should show (1 = full strength). */
export function intensityForPath(pathname) {
  const path = pathname || '/';
  if (path === '/') return 1;
  if (path === '/login' || path === '/register') return 0.9;
  if (path === '/tutor') return 0.8;
  if (/^\/(practice|tests)\/./.test(path)) return 0.12; // an open quiz: minimal movement
  if (/^\/course\/[^/]+\/lecture\//.test(path)) return 0.22; // lecture player
  if (path === '/dashboard') return 0.7;
  if (path === '/practice' || path === '/tests' || path === '/study-material') return 0.4;
  return 0.5;
}

export function particleBudget({ width, height, lowPower = false }) {
  let count = Math.round((width * height) / 11000);
  count = Math.max(40, Math.min(count, 135));
  if (width < 700) count = Math.min(count, 44);
  if (lowPower) count = Math.round(count * 0.7);
  return Math.max(24, count);
}

/** "167, 139, 250" -> [167, 139, 250] (falls back when the token is missing). */
export function parseRgb(value, fallback) {
  const parts = String(value || '').split(',').map((n) => parseInt(n, 10));
  return parts.length === 3 && parts.every((n) => Number.isFinite(n)) ? parts : fallback;
}

export function readPalette() {
  const style = getComputedStyle(document.documentElement);
  return {
    a: parseRgb(style.getPropertyValue('--ap-particle-color'), [96, 165, 250]),
    b: parseRgb(style.getPropertyValue('--ap-particle-color-2'), [34, 211, 238]),
    warm: parseRgb(style.getPropertyValue('--ap-particle-warm'), [255, 190, 110]),
  };
}

function makeSprite(rgb) {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return c;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`);
  grad.addColorStop(0.22, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.55)`);
  grad.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

export function createGalaxy(canvas, { reducedMotion = false } = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { setColors() {}, setIntensity() {}, setReducedMotion() {}, destroy() {} };

  const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  const lowPower =
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4);

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let palette = readPalette();
  let sprites = [];
  let reduced = reducedMotion;
  let intensity = 1;
  let targetIntensity = 1;
  let raf = 0;
  let last = 0;
  let slowFrames = 0;
  let resizeTimer = 0;
  let destroyed = false;

  const mouse = { x: 0, y: 0, active: false, sx: 0, sy: 0, ox: 0, oy: 0 };
  const trail = [];
  const followers = [
    { x: 0, y: 0, k: 0.14, r: 2.4 },
    { x: 0, y: 0, k: 0.085, r: 2 },
    { x: 0, y: 0, k: 0.05, r: 1.6 },
  ];

  const rebuildSprites = () => {
    sprites = [makeSprite(palette.a), makeSprite(palette.b), makeSprite(palette.warm)];
  };

  const makeParticle = () => {
    const z = 0.3 + Math.random() * 0.7; // depth: far (small, slow) to near (larger, quicker)
    const angle = Math.random() * TAU;
    const speed = (5 + Math.random() * 11) * z;
    const pick = Math.random();
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      z,
      bvx: Math.cos(angle) * speed,
      bvy: Math.sin(angle) * speed,
      vx: 0,
      vy: 0,
      r: 0.5 + z * 1.5,
      tone: pick < 0.06 ? 2 : pick < 0.45 ? 1 : 0,
      phase: Math.random() * TAU,
      twinkle: 0.4 + Math.random() * 0.9,
    };
  };

  const fill = (count) => {
    particles = Array.from({ length: count }, makeParticle);
    particles.forEach((p) => {
      p.vx = p.bvx;
      p.vy = p.bvy;
    });
  };

  const resize = () => {
    const prevW = width;
    const prevH = height;
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1 : 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const budget = particleBudget({ width, height, lowPower });
    if (!particles.length || Math.abs(budget - particles.length) > 14) {
      fill(budget);
    } else if (prevW && prevH) {
      particles.forEach((p) => {
        p.x = (p.x / prevW) * width;
        p.y = (p.y / prevH) * height;
      });
    }
    if (reduced) drawFrame(0);
  };

  const linkDistance = () => Math.min(160, Math.max(100, width / 10));

  function drawFrame(dt) {
    ctx.clearRect(0, 0, width, height);
    const I = intensity;
    const cursorOn = mouse.active && !reduced && !coarse;
    const cursorPower = Math.min(1, I * 1.15 + 0.1);
    const L = linkDistance();
    const L2 = L * L;
    const [ar, ag, ab] = palette.a;
    const [br, bg, bb] = palette.b;

    // parallax offset follows the cursor very slightly
    const px = reduced || coarse ? 0 : mouse.ox;
    const py = reduced || coarse ? 0 : mouse.oy;

    // move
    if (dt > 0) {
      const R = 170;
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        // ease back toward the particle's own drift
        const ease = Math.min(1, dt * 1.6);
        p.vx += (p.bvx - p.vx) * ease;
        p.vy += (p.bvy - p.vy) * ease;
        if (cursorOn) {
          const dx = mouse.sx - p.x;
          const dy = mouse.sy - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R && d2 > 1) {
            const d = Math.sqrt(d2);
            const f = (1 - d / R) * cursorPower;
            const dir = d > 70 ? 1 : -1; // pull in gently, push back when too close
            p.vx += (dx / d) * f * 90 * dir * dt;
            p.vy += (dy / d) * f * 90 * dir * dt;
          }
        }
        p.x += p.vx * dt * (0.4 + I * 0.6);
        p.y += p.vy * dt * (0.4 + I * 0.6);
        if (p.x < -20) p.x = width + 20;
        else if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        else if (p.y > height + 20) p.y = -20;
      }
    }

    const time = performance.now() / 1000;

    // network lines
    ctx.lineCap = 'round';
    for (let i = 0; i < particles.length; i += 1) {
      const a = particles[i];
      const ax = a.x + px * a.z * 16;
      const ay = a.y + py * a.z * 16;
      for (let j = i + 1; j < particles.length; j += 1) {
        const b = particles[j];
        const dx = ax - (b.x + px * b.z * 16);
        const dy = ay - (b.y + py * b.z * 16);
        const d2 = dx * dx + dy * dy;
        if (d2 < L2) {
          const t = 1 - Math.sqrt(d2) / L;
          const alpha = t * 0.7 * I * (0.4 + 0.6 * Math.min(a.z, b.z)) + 0.01;
          const mix = (a.tone + b.tone) % 2 === 0;
          ctx.strokeStyle = mix ? `rgba(${ar}, ${ag}, ${ab}, ${alpha})` : `rgba(${br}, ${bg}, ${bb}, ${alpha})`;
          ctx.lineWidth = 0.6 + t * 0.9;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(b.x + px * b.z * 16, b.y + py * b.z * 16);
          ctx.stroke();
        }
      }
    }

    // lines from the cursor to the stars around it
    if (cursorOn) {
      const R = 150;
      ctx.lineWidth = 0.9;
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        const x = p.x + px * p.z * 16;
        const y = p.y + py * p.z * 16;
        const dx = x - mouse.sx;
        const dy = y - mouse.sy;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R) {
          const t = 1 - Math.sqrt(d2) / R;
          ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${t * 0.8 * cursorPower})`;
          ctx.beginPath();
          ctx.moveTo(mouse.sx, mouse.sy);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
    }

    // stars
    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      const tw = reduced ? 0.8 : 0.65 + 0.35 * Math.sin(time * p.twinkle + p.phase);
      const x = p.x + px * p.z * 16;
      const y = p.y + py * p.z * 16;
      let boost = 0;
      if (cursorOn) {
        const dx = x - mouse.sx;
        const dy = y - mouse.sy;
        const d2 = dx * dx + dy * dy;
        if (d2 < 22500) boost = (1 - Math.sqrt(d2) / 150) * cursorPower;
      }
      ctx.globalAlpha = Math.min(1, (0.5 + 0.5 * p.z) * tw * (0.35 + 0.65 * I) + boost * 0.5);
      const size = (p.r * 7 + boost * 10) * (1 + (p.tone === 2 ? 0.3 : 0));
      ctx.drawImage(sprites[p.tone], x - size / 2, y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;

    if (cursorOn) {
      // light around the cursor
      const r = 150;
      const g = ctx.createRadialGradient(mouse.sx, mouse.sy, 0, mouse.sx, mouse.sy, r);
      g.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, ${0.3 * cursorPower})`);
      g.addColorStop(1, `rgba(${ar}, ${ag}, ${ab}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(mouse.sx - r, mouse.sy - r, r * 2, r * 2);

      // short fading trail
      for (let i = 1; i < trail.length; i += 1) {
        const p0 = trail[i - 1];
        const p1 = trail[i];
        const life = Math.max(0, p1.life);
        ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${life * 0.75 * cursorPower})`;
        ctx.lineWidth = 0.6 + life * 2.6;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }

      // a few tiny followers with a smooth delay
      followers.forEach((f, idx) => {
        ctx.globalAlpha = (0.85 - idx * 0.2) * cursorPower;
        const s = f.r * 6;
        ctx.drawImage(sprites[idx === 1 ? 1 : 0], f.x - s / 2, f.y - s / 2, s, s);
      });
      ctx.globalAlpha = 1;
    }
  }

  const step = (now) => {
    raf = 0;
    if (destroyed || reduced || document.hidden) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;

    intensity += (targetIntensity - intensity) * Math.min(1, dt * 3);

    // smooth cursor, parallax and trail ageing
    mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 14);
    mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 14);
    mouse.ox += ((mouse.x / width - 0.5) * 2 * (mouse.active ? 1 : 0) - mouse.ox) * Math.min(1, dt * 2);
    mouse.oy += ((mouse.y / height - 0.5) * 2 * (mouse.active ? 1 : 0) - mouse.oy) * Math.min(1, dt * 2);
    followers.forEach((f) => {
      f.x += (mouse.sx - f.x) * f.k;
      f.y += (mouse.sy - f.y) * f.k;
    });
    for (let i = trail.length - 1; i >= 0; i -= 1) {
      trail[i].life -= dt * 2.2;
      if (trail[i].life <= 0) trail.splice(i, 1);
    }

    drawFrame(dt);

    // if frames are slow, quietly use fewer stars
    if (dt > 0.034) slowFrames += 1;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 90 && particles.length > 30) {
      particles.length = Math.round(particles.length * 0.8);
      slowFrames = 0;
    }

    raf = requestAnimationFrame(step);
  };

  const start = () => {
    if (!raf && !reduced && !destroyed && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(step);
    }
  };
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const onMove = (event) => {
    if (coarse || reduced) return;
    if (!mouse.active) {
      mouse.sx = event.clientX;
      mouse.sy = event.clientY;
      followers.forEach((f) => {
        f.x = event.clientX;
        f.y = event.clientY;
      });
    }
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    mouse.active = true;
    const lastPoint = trail[trail.length - 1];
    if (!lastPoint || Math.hypot(lastPoint.x - mouse.x, lastPoint.y - mouse.y) > 5) {
      trail.push({ x: mouse.x, y: mouse.y, life: 1 });
      if (trail.length > 16) trail.shift();
    }
  };
  const onLeave = () => {
    mouse.active = false;
  };
  const onVisibility = () => {
    if (document.hidden) stop();
    else start();
  };
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 150);
  };

  window.addEventListener('mousemove', onMove, { passive: true });
  document.documentElement.addEventListener('mouseleave', onLeave);
  window.addEventListener('blur', onLeave);
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);

  rebuildSprites();
  resize();
  start();

  return {
    setColors(next) {
      palette = next || readPalette();
      rebuildSprites();
      if (reduced) drawFrame(0);
    },
    setIntensity(value) {
      targetIntensity = value;
      if (reduced) {
        intensity = value;
        drawFrame(0);
      }
    },
    setReducedMotion(value) {
      if (value === reduced) return;
      reduced = value;
      if (reduced) {
        stop();
        trail.length = 0;
        mouse.active = false;
        drawFrame(0);
      } else {
        start();
      }
    },
    destroy() {
      destroyed = true;
      stop();
      window.clearTimeout(resizeTimer);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}

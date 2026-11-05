import { useCallback, useEffect, useRef, useState } from 'react';
import './pet.css';

// "Byte" — a desktop-pet cat that lives in the bottom-right corner of the whole portfolio (ROG-Omni style):
// it watches your cursor, wanders along the bottom edge, naps when you go quiet, reacts to petting and to the
// section you are reading, and can be picked up and dropped anywhere. Sprites: hero-cat-sheet.png
// (128px cells · rows: 0 right, 1 left, 2 front, 3 back · 8-frame walk · paws at y=121).
const MARGIN = 14, PAD = 8;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.random() * a.length | 0];
const PET_LINES = ['Mrrrp! ♥', 'Purr purr purr...', 'Byte approves this portfolio.', 'Meow? (translation: hire Aatheesh)', 'Feed me bugs. Harmless ones only.', '404: nap not found.', 'Press E near buildings on the island!', 'More pets. Less scrolling.'];
const SECTION_LINES = {
  top: "Welcome! Scroll down - there's a whole island to explore.",
  world: 'Walk with WASD. I will follow you in there too!',
  featured: 'Flip through the projects with the joysticks!',
  end: 'Say hi to Aatheesh - he replies fast.',
};
const SECTIONS = [['#top', 'top'], ['#world', 'world'], ['.featured-section', 'featured'], ['.end-card', 'end']];

export default function Pet() {
  const root = useRef(null), body = useRef(null), rot = useRef(null), sprite = useRef(null), bubbleEl = useRef(null);
  const st = useRef({ x: 0, y: 0, vy: 0, row: 2, col: 0, mode: 'idle', target: 0, tilt: 0, walkT: 0, lastAct: performance.now(), nextWander: performance.now() + 7000, lookWant: 2, lookSince: 0, mx: -9999, my: -9999, clicks: [], lastSay: 0, lastSection: '', drag: null, size: 92 });
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem('pet:off') === '1'; } catch { return false; } });
  const [bubble, setBubble] = useState(null);
  const [hearts, setHearts] = useState([]);
  const [asleep, setAsleep] = useState(false);
  const [hop, setHop] = useState(-1);
  const bTimer = useRef(0), say = useRef(() => {});

  say.current = useCallback((text, ms = 3600) => {
    const s = st.current; s.lastSay = performance.now();
    clearTimeout(bTimer.current); setBubble({ text, id: s.lastSay });
    bTimer.current = setTimeout(() => setBubble(null), ms);
  }, []);
  const love = useCallback(() => {
    const id = performance.now() + Math.random();
    setHearts((h) => [...h.slice(-5), { id, dx: rnd(-22, 22) }]);
    setTimeout(() => setHearts((h) => h.filter((q) => q.id !== id)), 1300);
  }, []);

  // keep the bubble inside the viewport
  useEffect(() => {
    const el = bubbleEl.current; if (!el || !bubble) return;
    el.style.setProperty('--nudge', '0px');
    const r = el.getBoundingClientRect(); let n = 0;
    if (r.left < 8) n = 8 - r.left; else if (r.right > innerWidth - 8) n = innerWidth - 8 - r.right;
    el.style.setProperty('--nudge', `${n}px`);
  }, [bubble]);

  useEffect(() => {
    if (hidden) return undefined;
    const s = st.current, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const measure = () => { s.size = root.current?.offsetWidth || 92; };
    measure();
    const range = () => ({ minX: -(innerWidth - MARGIN - s.size - PAD), minY: -(innerHeight - PAD - s.size - PAD) });
    const home = () => ({ cx: innerWidth - MARGIN - s.size / 2, cy: innerHeight - PAD - s.size * .42 });
    const act = () => { s.lastAct = performance.now(); };
    const wake = (t) => { if (s.mode === 'sleep') { s.mode = 'idle'; setAsleep(false); s.nextWander = performance.now() + 5000; if (t) say.current(t, 2600); } };

    const onMove = (e) => {
      s.mx = e.clientX; s.my = e.clientY; act();
      if (s.mode === 'sleep') { const h = home(), d = Math.hypot(e.clientX - (h.cx + s.x), e.clientY - (h.cy + s.y)); if (d < 150) wake('Mrrp? ...hello.'); }
    };
    const onAct = () => { act(); };
    addEventListener('pointermove', onMove, { passive: true }); addEventListener('keydown', onAct); addEventListener('scroll', onAct, { passive: true }); addEventListener('pointerdown', onAct);
    const onResize = () => { measure(); const r = range(); s.x = Math.max(r.minX, Math.min(0, s.x)); s.y = Math.max(r.minY, Math.min(0, s.y)); };
    addEventListener('resize', onResize);

    // react to the section being read
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting || en.intersectionRatio < .45) continue;
        const key = en.target.dataset.petKey, now = performance.now();
        if (key === s.lastSection || s.mode === 'sleep' || s.mode === 'drag') continue;
        s.lastSection = key;
        if (now - s.lastSay > 9000 && SECTION_LINES[key]) say.current(SECTION_LINES[key], 4200);
      }
    }, { threshold: [.45, .7] });
    for (const [sel, key] of SECTIONS) { const el = document.querySelector(sel); if (el) { el.dataset.petKey = key; io.observe(el); } }
    const hello = setTimeout(() => say.current("Hi! I'm Byte. Pet me, drag me, or just watch.", 4300), 1400);

    let raf = 0, last = performance.now(), cache = '';
    const startWander = (now) => {
      const r = range(), reach = Math.max(80, Math.min(300, -r.minX));
      let t = s.x < -30 && Math.random() < .45 ? 0 : -rnd(60, reach);
      if (Math.abs(t - s.x) < 50) t = s.x < -150 ? 0 : -rnd(120, reach);
      s.target = Math.max(r.minX, Math.min(0, t)); s.mode = 'walk'; s.nextWander = now + rnd(8000, 16000);
    };
    const loop = (now) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!document.hidden) {
        if (s.mode === 'walk') {
          const d = s.target - s.x;
          if (Math.abs(d) < 2) { s.x = s.target; s.mode = 'idle'; s.row = 2; if (Math.random() < .25) say.current(pick(['*stretches*', 'Zoomies!', 'Patrolling the portfolio.']), 2200); }
          else { s.x += Math.sign(d) * Math.min(Math.abs(d), 84 * dt); s.row = d > 0 ? 0 : 1; s.walkT += dt; }
        } else if (s.mode === 'idle') {
          if (!reduce && now > s.nextWander) startWander(now);
          else if (now - s.lastAct > 38000) { s.mode = 'sleep'; setAsleep(true); }
          // look toward the cursor (with a little hysteresis so it does not flicker)
          const h = home(), dx = s.mx - (h.cx + s.x), dy = s.my - (h.cy + s.y), dist = Math.hypot(dx, dy);
          const want = dist > 620 ? 2 : Math.abs(dx) > Math.abs(dy) * .9 ? (dx > 0 ? 0 : 1) : (dy > 0 ? 2 : 3);
          if (want !== s.lookWant) { s.lookWant = want; s.lookSince = now; } else if (now - s.lookSince > 260) s.row = want;
        } else if (s.mode === 'sleep') { s.row = 2; }
        else if (s.mode === 'fall') {
          s.vy += 1900 * dt; s.y += s.vy * dt; s.tilt *= .85;
          if (s.y >= 0) { s.y = 0; if (s.vy > 320) s.vy = -s.vy * .28; else { s.vy = 0; s.mode = 'idle'; s.tilt = 0; s.nextWander = now + 4000; } }
        }
        if (s.mode !== 'drag') s.tilt *= .9;
        const col = s.mode === 'walk' ? (Math.floor(s.walkT * 11) % 8) : s.mode === 'drag' ? (Math.floor(now / 85) % 8) : 0;
        const sig = `${s.x.toFixed(1)}|${s.y.toFixed(1)}|${s.row}|${col}|${s.tilt.toFixed(1)}|${s.mode}`;
        if (sig !== cache) {
          cache = sig;
          body.current.style.transform = `translate3d(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px,0)`;
          rot.current.style.transform = `rotate(${s.tilt.toFixed(1)}deg)`;
          sprite.current.style.backgroundPosition = `${col * 100 / 7}% ${s.row * 100 / 3}%`;
          root.current.dataset.mode = s.mode;
          root.current.style.setProperty('--lift', `${Math.min(1, -s.y / 120).toFixed(2)}`);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); clearTimeout(hello); io.disconnect(); removeEventListener('pointermove', onMove); removeEventListener('keydown', onAct); removeEventListener('scroll', onAct); removeEventListener('pointerdown', onAct); removeEventListener('resize', onResize); };
  }, [hidden]);

  // ---- pointer handling on the cat: click = pet, drag = pick up & drop ----
  const down = (e) => {
    const s = st.current; e.currentTarget.setPointerCapture?.(e.pointerId);
    s.drag = { sx: e.clientX, sy: e.clientY, x0: s.x, y0: s.y, moved: false, lastX: e.clientX, lastT: performance.now() };
  };
  const move = (e) => {
    const s = st.current, d = s.drag; if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) { d.moved = true; s.mode = 'drag'; setAsleep(false); say.current('Hey! Put me down... or keep going, whee!', 2200); }
    if (d.moved) {
      const minX = -(innerWidth - MARGIN - s.size - PAD), minY = -(innerHeight - PAD - s.size - PAD);
      s.x = Math.max(minX, Math.min(0, d.x0 + e.clientX - d.sx)); s.y = Math.max(minY, Math.min(0, d.y0 + e.clientY - d.sy)); s.row = 2;
      const now = performance.now(), v = (e.clientX - d.lastX) / Math.max(8, now - d.lastT) * 16; s.tilt = Math.max(-22, Math.min(22, s.tilt * .6 + v * 1.4)); d.lastX = e.clientX; d.lastT = now;
    }
  };
  const up = () => {
    const s = st.current, d = s.drag; s.drag = null; if (!d) return;
    if (d.moved) { s.mode = 'fall'; s.vy = 0; s.lastAct = performance.now(); return; }
    // plain click -> pet it
    const now = performance.now(); s.lastAct = now;
    s.clicks = [...s.clicks.filter((t) => now - t < 4000), now];
    if (s.mode === 'sleep') { s.mode = 'idle'; setAsleep(false); s.nextWander = now + 6000; say.current('Mrrp?! ...ok, pets accepted.', 2600); love(); }
    else if (s.clicks.length >= 6) { s.clicks = []; say.current("OK OK that's enough pets!! *dizzy*", 2800); s.tilt = 12; }
    else say.current(pick(PET_LINES), 2800);
    love(); setHop((h) => h + 1);
    if (s.mode === 'walk') { s.mode = 'idle'; s.target = s.x; s.nextWander = now + 5000; }
  };
  const hide = () => { setHidden(true); setBubble(null); try { localStorage.setItem('pet:off', '1'); } catch { /* storage unavailable */ } };
  const show = () => { setHidden(false); try { localStorage.removeItem('pet:off'); } catch { /* storage unavailable */ } };

  if (hidden) return <button className="pet-return" onClick={show} aria-label="Bring the desktop cat back" title="Bring Byte back">🐾</button>;
  return (
    <div className="pet" ref={root} data-mode="idle">
      <div className="pet-body" ref={body}>
        {bubble && <div className="pet-bubble" key={bubble.id} ref={bubbleEl} aria-hidden="true">{bubble.text}</div>}
        {hearts.map((h) => <span key={h.id} className="pet-heart" style={{ '--dx': `${h.dx}px` }} aria-hidden="true">♥</span>)}
        {asleep && <span className="pet-zzz" aria-hidden="true"><i>z</i><i>z</i><i>Z</i></span>}
        <div className="pet-shadow" />
        <div className={`pet-hopper${hop >= 0 ? ` hop-${hop % 2}` : ''}`}>
          <div className="pet-rot" ref={rot}><div className={`pet-sprite${asleep ? ' is-sleep' : ''}`} ref={sprite} /></div>
        </div>
        <button className="pet-hit" aria-label="Byte the cat. Click to pet, drag to move." onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
        <button className="pet-hide" onClick={hide} aria-label="Hide the desktop cat" title="Hide Byte">×</button>
      </div>
    </div>
  );
}

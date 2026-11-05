import { useEffect, useRef } from 'react';

const W = 1672, H = 941;
const POLY = [[590,232],[780,212],[900,212],[1010,222],[1180,250],[1290,285],[1370,330],[1440,300],[1478,285],[1500,320],[1440,360],[1430,420],[1445,500],[1395,580],[1315,660],[1240,700],[1190,800],[1100,860],[960,890],[820,900],[690,880],[580,840],[470,800],[400,735],[330,670],[270,600],[250,520],[250,440],[290,370],[360,320],[450,265]];
const ROCKS = [[465, 770, 48], [1150, 815, 48], [1235, 765, 34], [555, 815, 32]];   // [x, y, radius] obstacles
const PORTAL = { x: 1478, y: 300, r: 48, inX: 1490, inY: 215 };                      // trigger circle + where hero is pulled in
const SAGE = { cw: 248, ch: 304 };
const LEG = { down0: 77, down1: 77, up0: 73, up1: 75, right0: 62, right1: 67 }, SPLIT = 111;   // leg-gap x per sprite, waist y
const MC = { down: ['down0', 'down1'], up: ['up0', 'up1'], right: ['right0', 'right1'], left: ['right0', 'right1'] };

const inPoly = (x, y) => { let c = false; for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) { const [xi, yi] = POLY[i], [xj, yj] = POLY[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const free = (x, y) => inPoly(x, y) && inPoly(x - 12, y) && inPoly(x + 12, y) && !ROCKS.some(([rx, ry, rr]) => Math.hypot(x - rx, (y - ry) * 1.3) < rr);
const depth = (y) => 0.8 + 0.35 * Math.max(0, Math.min(1, (y - 220) / 680));

export default function Arcade({ onPortal, vw, vh }) {
  const cbRef = useRef(onPortal); cbRef.current = onPortal;
  const sz = useRef({ vw, vh }); sz.current = { vw, vh };
  const cv = useRef(null), keys = useRef({}), target = useRef(null);

  useEffect(() => {
    let raf, alive = true;
    const imgs = {};
    ['cave', 'hero-sheet', 'hero-cat-sheet', 'sage-atlas'].forEach((n) => { const i = new Image(); i.src = n === 'cave' ? '/assets/cave.jpg' : `/assets/${n}.png`; imgs[n] = i; });
    const ctx = cv.current.getContext('2d');
    const me = { x: 760, y: 610, dir: 'down', t: 0, mv: false }, cat = { x: 700, y: 625, flip: false, t: 0, row: 0, mv: false };
    const sage = { x: 860, y: 470, dir: 'down', t: 0, mv: false, wp: [[1010, 560], [1320, 410]], wi: 0, wait: 2.2, say: '' };
    let entering = 0, finished = false;

    const dn = (e) => { const k = e.key.toLowerCase(); if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) { keys.current[k] = true; target.current = null; e.preventDefault(); } };
    const up = (e) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up);
    const dpr = window.devicePixelRatio || 1; let last = performance.now(), time = 0;

    const loop = (now) => {
      if (!alive || !cv.current) return; raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
      const { vw, vh } = sz.current, c = cv.current;
      if (c.width !== Math.round(vw * dpr)) { c.width = Math.round(vw * dpr); c.height = Math.round(vh * dpr); c.style.width = vw + 'px'; c.style.height = vh + 'px'; }
      const k = keys.current;
      let dx = (k.d || k.arrowright ? 1 : 0) - (k.a || k.arrowleft ? 1 : 0), dy = (k.s || k.arrowdown ? 1 : 0) - (k.w || k.arrowup ? 1 : 0);

      if (entering) {                                   // pulled into the portal
        entering += dt; const f = Math.min(1, entering / 1.0);
        me.x += (PORTAL.inX - me.x) * Math.min(1, dt * 4); me.y += (PORTAL.inY - me.y) * Math.min(1, dt * 4); me.t += dt; me.mv = true; me.dir = 'up';
        if (f >= 1 && !finished) { finished = true; cbRef.current(); }
      } else {
        if (!dx && !dy && target.current) { const tx = target.current.x - me.x, ty = target.current.y - me.y, d = Math.hypot(tx, ty); if (d < 8) target.current = null; else { dx = tx / d; dy = ty / d; } }
        me.mv = !!(dx || dy);
        if (me.mv) {
          const m = Math.hypot(dx, dy); dx /= m; dy /= m; me.t += dt; const sp = 230 * dt * (0.85 + 0.2 * depth(me.y)); let moved = false;
          if (free(me.x + dx * sp, me.y)) { me.x += dx * sp; moved = true; } if (free(me.x, me.y + dy * sp * 0.8)) { me.y += dy * sp * 0.8; moved = true; }
          if (!moved) target.current = null;
          me.dir = Math.abs(dx) > Math.abs(dy) * 1.2 ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
          if (Math.hypot(me.x - PORTAL.x, me.y - PORTAL.y) < PORTAL.r) entering = 0.001;
        }
      }
      // cat follows
      const gx = me.x - (me.dir === 'right' ? 55 : me.dir === 'left' ? -55 : 0), gy = me.y + (me.dir === 'up' ? 45 : 14), f2 = 1 - Math.pow(0.03, dt);
      const ox = cat.x, oy = cat.y; cat.x += (gx - cat.x) * f2; cat.y += (gy - cat.y) * f2; const cdx = cat.x - ox, cdy = cat.y - oy; cat.mv = Math.hypot(cdx, cdy) > 0.25; if (cat.mv) { cat.t += dt; cat.row = Math.abs(cdx) > Math.abs(cdy) * 1.1 ? (cdx > 0 ? 0 : 1) : (cdy > 0 ? 2 : 3); }
      // sage AI
      if (sage.wait > 0) { sage.wait -= dt; sage.mv = false; sage.say = 'Follow me!'; }
      else if (sage.wi < sage.wp.length) {
        const [wx, wy] = sage.wp[sage.wi], ex = wx - sage.x, ey = wy - sage.y, d = Math.hypot(ex, ey); sage.say = '';
        if (d < 4) sage.wi++; else { sage.mv = true; sage.t += dt; sage.x += ex / d * 150 * dt; sage.y += ey / d * 150 * dt * 0.9; sage.dir = Math.abs(ex) > Math.abs(ey) ? (ex > 0 ? 'right' : 'left') : (ey > 0 ? 'down' : 'up'); }
      } else { sage.mv = false; sage.dir = 'right'; sage.say = Math.hypot(me.x - sage.x, me.y - sage.y) < 260 ? 'Step through!' : '...'; }

      // camera (cover; scrolls on narrow screens)
      const s = Math.max(vw / W, vh / H), kx = s * dpr;
      const cx = W * s <= vw ? 0 : Math.max(0, Math.min(W - vw / s, me.x - vw / s / 2)), cy = H * s <= vh ? 0 : Math.max(0, Math.min(H - vh / s, me.y - vh / s / 2));
      const offx = W * s < vw ? (vw / s - W) / 2 : 0, offy = H * s < vh ? (vh / s - H) / 2 : 0;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#050a07'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.setTransform(kx, 0, 0, kx, (-cx + offx) * kx, (-cy + offy) * kx); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      if (imgs.cave.complete) ctx.drawImage(imgs.cave, 0, 0, W, H);

      // actors, y-sorted. Walk = alternating poses + sway + soft step bob (no hopping)
      const sway = (t, amp) => ({ p: t * 8, rot: Math.sin(t * 8) * amp, bob: Math.abs(Math.sin(t * 8)) });
      const heroDraw = () => {
        // hero-sheet.png: 256px cells, rows down/left/right/up, cols 0-7 walk cycle, 8-11 idle (feet at y=246)
        const kk = depth(me.y) * (entering ? Math.max(0.12, 1 - entering * 0.9) : 1), D = 168 * kk;
        const row = { down: 0, left: 1, right: 2, up: 3 }[me.dir], col = me.mv ? Math.floor(me.t * 10) % 8 : 8 + Math.floor(time * 2.5) % 4, im = imgs['hero-sheet'];
        ctx.save(); ctx.globalAlpha = entering ? Math.max(0, 1 - entering * 0.9) : 1; ctx.translate(me.x, me.y);
        ctx.fillStyle = '#0007'; ctx.beginPath(); ctx.ellipse(0, 0, D * 0.12, D * 0.035, 0, 0, 7); ctx.fill();
        if (im.complete) { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(im, col * 256, row * 256, 256, 256, -D / 2, -D * 246 / 256, D, D); }
        ctx.restore();
      };
      const catDraw = () => {
        // hero-cat-sheet.png: 128px cells, rows right/left/front/back, 8-frame walk (paws on y=121)
        const kk = depth(cat.y), D = 70 * kk, moving = cat.mv && (me.mv || entering), im = imgs['hero-cat-sheet'];
        const col = moving ? Math.floor(cat.t * 11) % 8 : 0;
        ctx.save(); ctx.translate(cat.x, cat.y); ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.ellipse(0, 0, D * 0.3, D * 0.07, 0, 0, 7); ctx.fill();
        if (im.complete) { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(im, col * 128, cat.row * 128, 128, 128, -D / 2, -D * 121 / 128, D, D); }
        ctx.restore();
      };
      const sageDraw = () => {
        const kk = depth(sage.y), sh = 128 * kk, sw = sh * SAGE.cw / SAGE.ch, w = sway(sage.t, 0.035), fr = Math.floor(sage.t * 7);
        let row = 0, col = 0, flip = false;
        if (sage.dir === 'down') { [row, col] = sage.mv ? [[0, 0], [1, 0], [0, 1], [1, 1]][fr % 4] : [0, 0]; }
        else if (sage.dir === 'up') { row = 0; col = [3, 4, 5, 4][sage.mv ? fr % 4 : 0]; }
        else { row = 2; col = sage.mv ? fr % 6 : 0; flip = sage.dir === 'right'; }
        ctx.save(); ctx.translate(sage.x, sage.y); ctx.fillStyle = '#0007'; ctx.beginPath(); ctx.ellipse(0, 0, sw * 0.26, sw * 0.08, 0, 0, 7); ctx.fill();
        ctx.translate(0, -(sage.mv ? w.bob * 3 * kk : 0)); ctx.rotate(sage.mv ? w.rot * 0.6 : 0); if (flip) ctx.scale(-1, 1);
        if (imgs['sage-atlas'].complete) ctx.drawImage(imgs['sage-atlas'], col * SAGE.cw, row * SAGE.ch, SAGE.cw, SAGE.ch, -sw / 2, -sh * 0.95, sw, sh); ctx.restore();
        if (sage.say) { ctx.font = '13px "Press Start 2P", monospace'; const tw = ctx.measureText(sage.say).width + 16, bx = sage.x - tw / 2, by = sage.y - sh - 34; ctx.fillStyle = '#16120e'; ctx.fillRect(bx, by, tw, 26); ctx.strokeStyle = '#efe6c9'; ctx.lineWidth = 2; ctx.strokeRect(bx + 1, by + 1, tw - 2, 24); ctx.fillStyle = '#efe6c9'; ctx.fillText(sage.say, bx + 8, by + 18); }
      };
      [{ y: me.y, d: heroDraw }, { y: cat.y, d: catDraw }, { y: sage.y, d: sageDraw }].sort((a, b) => a.y - b.y).forEach((o) => o.d());

      // portal pulse + soft vignette
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(1490, 205, 0, 1490, 205, 170); g.addColorStop(0, '#b56bff'); g.addColorStop(1, '#0000'); ctx.globalAlpha = 0.28 + Math.sin(time * 3) * 0.1; ctx.fillStyle = g; ctx.fillRect(1320, 35, 340, 340); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); const vg = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.45, vw / 2, vh / 2, Math.max(vw, vh) * 0.8); vg.addColorStop(0, '#0000'); vg.addColorStop(1, '#0007'); ctx.fillStyle = vg; ctx.fillRect(0, 0, vw, vh);
      c._s = s; c._c = [cx - offx, cy - offy];
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  const press = (k, v) => () => { keys.current[k] = v; if (v) target.current = null; };
  const tap = (e) => { const c = cv.current, r = c.getBoundingClientRect(); target.current = { x: (e.clientX - r.left) / c._s + c._c[0], y: (e.clientY - r.top) / c._s + c._c[1] }; };
  return <>
    <canvas ref={cv} style={{ display: 'block', position: 'absolute', inset: 0 }} onPointerDown={tap} />
    <div className="dpad">{[['w', '▲', 'u'], ['a', '◀', 'l'], ['s', '▼', 'd'], ['d', '▶', 'r']].map(([k, g, c]) =>
      <button key={k} className={c} onPointerDown={press(k, true)} onPointerUp={press(k, false)} onPointerLeave={press(k, false)} onPointerCancel={press(k, false)}>{g}</button>)}</div>
  </>;
}

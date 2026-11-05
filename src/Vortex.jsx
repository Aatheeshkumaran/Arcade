import { useEffect, useRef } from 'react';

// Parallax "dive into the black hole": no spinning image. Layers sit at different depths and the camera
// flies forward — nebula zooms slowly, accretion ring + HUD rings rush past, asteroids whip by the lens,
// warp streaks fan out from the hole, and the hero gets sucked in. Ends in a flash.
const DURATION = 5, IW = 1672, IH = 941;
const SRC = { neb: ['/assets/vx-nebula.jpg', 850, 440], ring: ['/assets/vx-ring.png', 871, 467], hud: ['/assets/vx-hud.png', 835, 465], ast: ['/assets/vx-asteroids.png', 836, 470], hero: ['/assets/hero-down0.png'] };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ease = (t) => t * t * (3 - 2 * t);

export default function Vortex({ onDone }) {
  const cv = useRef(null), bar = useRef(null), pct = useRef(null), ui = useRef(null), cb = useRef(onDone); cb.current = onDone;

  useEffect(() => {
    const ctx = cv.current.getContext('2d'), im = {};
    Object.entries(SRC).forEach(([k, [src]]) => { const i = new Image(); i.src = src; im[k] = i; });
    const R = (a, b) => a + Math.random() * (b - a);
    const sparks = Array.from({ length: 260 }, () => ({ a: R(0, 6.283), z: R(0.05, 1), v: R(0.6, 1.5), h: Math.random() }));
    let raf, start = performance.now(), last = start, done = false;

    const loop = (now) => {
      if (!cv.current) return; raf = requestAnimationFrame(loop);
      const el = (now - start) / 1000, t = clamp(el / DURATION), dt = Math.min(0.05, (now - last) / 1000); last = now;
      const dpr = window.devicePixelRatio || 1, vw = window.innerWidth, vh = window.innerHeight, c = cv.current;
      if (c.width !== Math.round(vw * dpr)) { c.width = Math.round(vw * dpr); c.height = Math.round(vh * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = '#03010a'; ctx.fillRect(0, 0, vw, vh);

      const base = Math.max(vw / IW, vh / IH), ox = (vw - IW * base) / 2, oy = (vh - IH * base) / 2;
      const h0 = [ox + SRC.neb[1] * base, oy + SRC.neb[2] * base];
      const fx = h0[0] + (vw / 2 - h0[0]) * ease(t), fy = h0[1] + (vh / 2 - h0[1]) * ease(t);   // focus point: the hole drifts to centre
      const shake = t > 0.7 ? (t - 0.7) * 16 : 0, sx = Math.sin(el * 1.3) * 10 + (Math.random() - .5) * shake, sy = Math.cos(el * 1.1) * 6 + (Math.random() - .5) * shake;

      // draw one parallax layer, its "hole" pinned to the focus point; depth = how much it follows the camera sway
      const layer = (key, scale, alpha, mode, depthF, fl = [1, 1], off = [0, 0]) => {
        const img = im[key]; if (!img.complete || alpha <= 0.01) return;
        ctx.save(); ctx.globalAlpha = clamp(alpha); ctx.globalCompositeOperation = mode;
        ctx.translate(fx + sx * depthF + off[0] * base * scale, fy + sy * depthF + off[1] * base * scale); ctx.scale(base * scale * fl[0], base * scale * fl[1]);
        ctx.translate(-SRC[key][1], -SRC[key][2]); ctx.drawImage(img, 0, 0); ctx.restore();
      };

      layer('neb', 1 + 2.4 * ease(t), 1, 'source-over', 0.3);                                   // far: slow zoom
      const T = t * 1.0;
      let z = 1.05 - T; layer('ring', 0.8 / Math.max(z, .1), Math.min(1, (z - 0.1) / 0.25) * clamp(t * 6), 'lighter', 0.8);          // accretion ring rushes past
      z = 1.35 - T * 1.1; layer('hud', 0.95 / Math.max(z, .1), Math.min(1, (z - 0.12) / 0.3) * 0.85, 'lighter', 1.0);                // HUD rings expand and fade
      [[1.25, [1, 1], [0, 0]], [1.8, [-1, 1], [150, -40]], [2.5, [1, -1], [-170, 60]]].forEach(([z0, fl, off], i) => {            // asteroid fields at 3 depths
        const zz = z0 - t * 1.5; if (zz < 0.08) return;
        layer('ast', 0.95 / zz, Math.min(1, zz / 0.35) * clamp((3 - zz) / 0.9) * 0.95, 'source-over', 1.6 + i * 0.5, fl, off);
      });

      // warp streaks flying outward from the hole (camera moving forward)
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      const spd = 0.15 + 2.6 * t * t, rmax = Math.max(vw, vh);
      sparks.forEach((s) => {
        const z0 = s.z; s.z -= spd * s.v * dt * (0.4 + z0); if (s.z < 0.03) { s.z = 1; s.a = R(0, 6.283); return; }
        const r0 = 22 / z0, r1 = 22 / s.z; if (r1 > rmax) { s.z = 1; return; }
        ctx.strokeStyle = s.h > 0.5 ? `rgba(236,200,255,${.2 + .6 * t})` : `rgba(140,120,255,${.2 + .6 * t})`; ctx.lineWidth = 0.6 + 2.6 * (1 - s.z) * (0.4 + t);
        ctx.beginPath(); ctx.moveTo(fx + Math.cos(s.a) * r0, fy + Math.sin(s.a) * r0 * 0.8); ctx.lineTo(fx + Math.cos(s.a) * r1, fy + Math.sin(s.a) * r1 * 0.8); ctx.stroke();
      });

      // hero spirals into the hole
      const ht = clamp((t - 0.06) / 0.78);
      if (ht > 0 && ht < 1 && im.hero.complete) {
        const rr = (1 - ease(ht)) * Math.min(vw, vh) * 0.4, aa = -0.9 + ht * 8, sz = 14 + 150 * (1 - ht) ** 1.5;
        ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = clamp(ht * 6) * (1 - Math.max(0, ht - .86) * 7);
        ctx.translate(fx + Math.cos(aa) * rr, fy + Math.sin(aa) * rr * 0.78); ctx.rotate(ht * 10); ctx.drawImage(im.hero, -sz / 2, -sz / 2, sz, sz); ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      // the hole swallowing the frame, then the flash
      const core = ctx.createRadialGradient(fx, fy, 0, fx, fy, rmax * (0.06 + 0.95 * t * t * t));
      core.addColorStop(0, `rgba(0,0,0,${clamp(t * 1.8)})`); core.addColorStop(0.7, `rgba(8,0,26,${t * 0.55})`); core.addColorStop(1, '#0000'); ctx.fillStyle = core; ctx.fillRect(0, 0, vw, vh);
      const fl = t < 0.06 ? 0.9 * (1 - t / 0.06) : t > 0.9 ? (t - 0.9) / 0.1 : 0;
      if (fl) { ctx.fillStyle = t > 0.5 ? `rgba(238,220,255,${fl})` : `rgba(181,107,255,${fl})`; ctx.fillRect(0, 0, vw, vh); }

      if (bar.current) { const lit = Math.round(t * 25) / 25, edge = 22.65 + lit * 61.85; bar.current.style.clipPath = `inset(0 ${(100 - edge).toFixed(2)}% 0 0)`; }
      if (pct.current) pct.current.textContent = Math.round(t * 100) + '%';
      if (ui.current) ui.current.style.opacity = t > 0.82 ? Math.max(0, 1 - (t - 0.82) * 8) : 1;
      if (t >= 1 && !done) { done = true; cancelAnimationFrame(raf); cb.current(); }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <div style={{ position: 'fixed', inset: 0, background: '#03010a', zIndex: 60 }}>
    <canvas ref={cv} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    <div ref={ui} className="vx-ui"><div className="vx-bar"><img src="/assets/bar-empty.png" alt="" draggable="false" /><img ref={bar} className="vx-fill" src="/assets/bar-full.png" alt="" draggable="false" style={{ clipPath: 'inset(0 77.35% 0 0)' }} /><div className="vx-label"><span>LOADING AATHEESH.exe…</span><b ref={pct}>0%</b></div></div></div>
  </div>;
}

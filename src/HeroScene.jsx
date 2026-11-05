import { useEffect, useRef } from 'react';
import './hero-scene.css';

// Back → front. `d` is the parallax depth: how far (in % of the box width)
// the layer travels when the pointer reaches an edge. Bigger = closer to the viewer.
const LAYERS = [
  { id: 'sky',     d: 0.3 },
  { id: 'islands', d: 0.55 },
  { id: 'skyline', d: 0.85 },
  { id: 'bridge',  d: 1.15 },
  { id: 'wall',    d: 1.6 },
  { id: 'room',    d: 1.6 },
  { id: 'frame',   d: 1.6 },
  { id: 'desk',    d: 1.9 },
  { id: 'char',    d: 2.1 },
  { id: 'fx',      d: 1.9 },
  { id: 'fg',      d: 3.4 },
];

export default function HeroScene() {
  const box = useRef(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    // Parallax reacts to the pointer only — no idle motion. When the pointer
    // stops or leaves, the scene eases to rest and the animation loop shuts off.
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const set = () => {
      el.style.setProperty('--px', cx.toFixed(3));
      el.style.setProperty('--py', cy.toFixed(3));
    };
    const tick = () => {
      cx += (tx - cx) * 0.1;
      cy += (ty - cy) * 0.1;
      if (Math.abs(tx - cx) < 0.002 && Math.abs(ty - cy) < 0.002) {
        cx = tx; cy = ty; set(); raf = 0; return;
      }
      set();
      raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const move = (e) => {
      if (e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      kick();
    };
    const leave = () => { tx = 0; ty = 0; kick(); };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <div className="hero-art hero-scene" ref={box} role="img" aria-label="Pixel art night room: a developer coding at a triple-monitor desk in front of a neon floating city">
      <div className="scene-stack" aria-hidden="true">
        {LAYERS.map(({ id, d }) => (
          <div key={id} className={`scene-layer layer-${id}`} style={{ '--d': d }}>
            <img src={`/assets/hero/hero-${id}.webp`} alt="" draggable="false" decoding="async" />
          </div>
        ))}
        <div className="scene-vignette" />
      </div>
      <span className="floating-tag tag-code">{'< />'} CODE</span>
      <span className="floating-tag tag-idea">✦ IDEAS</span>
      <span className="floating-tag tag-build">BUILD_01</span>
      <div className="art-caption"><span>FIG. 001</span><span>THE BUILDER AT WORK</span></div>
    </div>
  );
}

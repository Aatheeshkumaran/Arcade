import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ExternalLink, Github } from 'lucide-react';
import './monitor.css';

const pad = (n) => String(n).padStart(2, '0');

// A retro CRT: the monitor never changes — joysticks (or arrow keys / swipe) switch the "channel", the screen
// flashes static, and the project shown inside changes. The picture flickers like an old tube every few seconds.
export default function ProjectMonitor({ projects, onOpen }) {
  const [idx, setIdx] = useState(0);
  const [tv, setTv] = useState('off');           // off → boot → idle ⇄ flicker / switch
  const [press, setPress] = useState('');        // which joystick is tilted
  const wrap = useRef(null), timers = useRef([]), busy = useRef(false), visible = useRef(false), booted = useRef(false), swipe = useRef(null);
  const n = projects.length, p = projects[idx];
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t; };

  const go = useCallback((to) => {
    if (busy.current || to === idx) return;
    busy.current = true; setTv('switch');
    later(() => setIdx(to), 190);
    later(() => { setTv('idle'); busy.current = false; }, 470);
  }, [idx]);
  const step = useCallback((d) => { setPress(d < 0 ? 'prev' : 'next'); later(() => setPress(''), 160); go((idx + d + n) % n); }, [go, idx, n]);

  useEffect(() => { projects.forEach((q) => { if (q.image) { const im = new Image(); im.src = q.image; } }); }, [projects]);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      if (e.isIntersecting && !booted.current) { booted.current = true; setTv('boot'); later(() => setTv('idle'), reduce ? 50 : 1000); }
    }, { threshold: .3 });
    io.observe(wrap.current);
    let t; const sched = () => { t = setTimeout(() => {
      if (!reduce && visible.current && !document.hidden && !busy.current) { setTv((v) => (v === 'idle' ? 'flicker' : v)); later(() => setTv((v) => (v === 'flicker' ? 'idle' : v)), 620); }
      sched();
    }, 5500 + Math.random() * 7500); };
    sched();
    return () => { io.disconnect(); clearTimeout(t); timers.current.forEach(clearTimeout); };
  }, []);

  const key = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(n - 1); }
    else if (e.key === 'Enter' && e.target === e.currentTarget) { e.preventDefault(); onOpen(p.id); }
  };
  const sDown = (e) => { swipe.current = e.clientX; };
  const sUp = (e) => { const s = swipe.current; swipe.current = null; if (s != null && Math.abs(e.clientX - s) > 60) step(e.clientX < s ? 1 : -1); };

  return (
    <div className="crt-rig" ref={wrap}>
      <div className="crt-case" tabIndex={0} role="group" aria-roledescription="carousel" aria-label={`Project monitor, project ${idx + 1} of ${n}. Use left and right arrow keys to change project.`} onKeyDown={key}>
        <div className="crt-screen" data-tv={tv} onPointerDown={sDown} onPointerUp={sUp}>
          <div className="crt-bg" aria-hidden="true"><i className="crt-cloud c1" /><i className="crt-cloud c2" /><i className="crt-cloud c3" /><i className="crt-ground" /></div>
          <div className="crt-content" key={p.id} aria-live="polite">
            <div className="crt-top"><span className="crt-tag">PROJECT {pad(idx + 1)} / {pad(n)}</span><span className="crt-status">{p.status}</span></div>
            <div className="crt-main">
              <div className="crt-copy">
                <h3 className="crt-title" data-t={p.title}><span>{p.title}</span></h3>
                <p className="crt-type">{p.type}</p>
                <p className="crt-desc">{p.description}</p>
                <p className="crt-details">{p.details}</p>
                <ul className="crt-stack">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>
                <div className="crt-actions">
                  <button className="crt-open" onClick={() => onOpen(p.id)}>OPEN PROJECT FILE <ArrowUpRight size={13} /></button>
                  {p.github && <a className="crt-link" href={p.github} target="_blank" rel="noreferrer"><Github size={13} /> CODE</a>}
                  {p.demo && <a className="crt-link" href={p.demo} target="_blank" rel="noreferrer"><ExternalLink size={13} /> LIVE</a>}
                </div>
              </div>
              <figure className="crt-shot">
                <div className="crt-shotimg">
                  {p.image ? <img src={p.image} alt={`Screenshot of ${p.title}`} style={{ objectPosition: p.focus || '50% 50%' }} decoding="async" draggable="false" /> : <span className="crt-shoticon" aria-hidden="true">{p.icon}</span>}
                  <i className="crt-shotlines" aria-hidden="true" />
                </div>
                <figcaption><span aria-hidden="true">{p.icon}</span>{p.id.toUpperCase()}.PNG</figcaption>
              </figure>
            </div>
            <p className="crt-prompt">◀ ▶ USE THE JOYSTICKS TO CHANGE PROJECT</p>
          </div>
          <div className="crt-static" aria-hidden="true" /><div className="crt-roll" aria-hidden="true" />
          <div className="crt-lines" aria-hidden="true" /><div className="crt-vig" aria-hidden="true" /><div className="crt-glare" aria-hidden="true" />
        </div>
        <div className="crt-deck">
          <button className={`joy joy-prev${press === 'prev' ? ' is-on' : ''}`} onClick={() => step(-1)} aria-label="Previous project"><span className="joy-lever"><i className="joy-ball" /><i className="joy-stick" /></span><i className="joy-base" /><em>◀ PREV</em></button>
          <div className="crt-meter">
            <span className="crt-led" aria-hidden="true" /><small>PROJECT-OS</small>
            <div className="crt-dots" role="tablist" aria-label="Choose project">{projects.map((q, i) => <button key={q.id} role="tab" aria-selected={i === idx} aria-label={`Project ${i + 1}: ${q.title}`} className={i === idx ? 'on' : ''} onClick={() => go(i)} />)}</div>
          </div>
          <button className={`joy joy-next${press === 'next' ? ' is-on' : ''}`} onClick={() => step(1)} aria-label="Next project"><span className="joy-lever"><i className="joy-ball" /><i className="joy-stick" /></span><i className="joy-base" /><em>NEXT ▶</em></button>
        </div>
      </div>
      <div className="crt-stand" aria-hidden="true" />
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import Arcade from './Arcade';
import Vortex from './Vortex';
import './intro.css';

const WORLD = { w: 1672, h: 655 };
const SPAWN = { x: 775, y: 545 };

const dialogue = [
  { text: "Oh, another developer, huh?", mood: "CURIOUS", glyph: "?", fx: "curious" },
  { text: "Name's Tech Sage. I've debugged stranger worlds than this.", mood: "EXPLAINING", glyph: "...", fx: "explaining" },
  { text: "Welcome to my little corner of the digital world.", mood: "WELCOME", glyph: "✦", fx: "happy" },
  { text: "Every project here has a story. Every bug has a lesson.", mood: "THINKING", glyph: "...", fx: "thinking" },
  { text: "A little patience, a clever spell, and a LOT of coffee.", mood: "COFFEE BREAK", glyph: "☕", fx: "sipping" },
  { text: "That portal leads to the portfolio. Walk in whenever you're ready.", mood: "SPELL READY", glyph: "✦", fx: "casting" },
];


function useViewport() {
  const get = () => ({ vw: window.innerWidth, vh: window.innerHeight });
  const [v, setV] = useState(get);
  useEffect(() => { const f = () => setV(get()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  return v;
}

export default function IntroSequence({ onFinish }) {
  const { vw, vh } = useViewport();
  const [phase, setPhase] = useState('dialogue'); // dialogue → switch → arcade → enter → warp
  const [line, setLine] = useState(0);
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);
  const [pulse, setPulse] = useState(0);
  const cur = dialogue[line];

  useEffect(() => {
    if (phase !== 'dialogue') return;
    setShown(''); setDone(false); let i = 0;
    const id = setInterval(() => { i++; setShown(cur.text.slice(0, i)); if (i >= cur.text.length) { clearInterval(id); setDone(true); } }, 28);
    return () => clearInterval(id);
  }, [line, phase]);

  const advance = useCallback(() => {
    if (phase !== 'dialogue') return;
    setPulse(p => p + 1);
    if (!done) { setShown(cur.text); setDone(true); }
    else if (line < dialogue.length - 1) setLine(l => l + 1);
    else setPhase('switch');
  }, [phase, done, line, cur]);

  useEffect(() => { if (phase === 'switch') { const t = setTimeout(() => setPhase('arcade'), 1900); return () => clearTimeout(t); } }, [phase]);
  useEffect(() => {
    const dn = (e) => { if (phase === 'dialogue' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); advance(); } };
    window.addEventListener('keydown', dn); return () => window.removeEventListener('keydown', dn);
  }, [phase, advance]);
  const onPortal = useCallback(() => setPhase('warp'), []);

  // dialogue-scene camera (static; the arcade map is its own canvas)
  const s = Math.max(vw / WORLD.w, (vh * 0.8) / WORLD.h);
  const camX = Math.max(0, Math.min(WORLD.w * s - vw, 760 * s - vw / 2));
  const top = (vh - WORLD.h * s) / 2;

  if (phase === 'warp') return <Vortex onDone={onFinish} />;

  const dlg = phase === 'dialogue';
  const arcade = phase === 'arcade';
  return <div className={`intro-root phase-${phase}`} onClick={dlg ? advance : undefined}>
    {!arcade && <>
      <div className="bar bar-top" /><div className="bar bar-bot" />
      <div className="world" style={{ width: WORLD.w, height: WORLD.h, top, transform: `translateX(${-camX}px) scale(${s})`, transformOrigin: '0 0' }}>
        <img className="world-bg" src="/assets/sanctuary.jpg" alt="" draggable="false" />
        <div className="portal-glow" style={{ left: 1500, top: 330 }} />
        <div className="actor" style={{ left: SPAWN.x - 72, top: SPAWN.y + 38, width: 70, height: 70 }}><img src="/assets/hero-cat.png" alt="" draggable="false" /></div>
        <div className="actor" style={{ left: SPAWN.x, top: SPAWN.y, width: 130, height: 130 }}><img src="/assets/hero-down0.png" alt="" draggable="false" /></div>
      </div>
      <div className="hud"><span><b>A</b> AATHEESH.exe <small>WORLD INITIALIZATION</small></span></div>
    </>}
    {arcade && <Arcade onPortal={onPortal} vw={vw} vh={vh} />}
    <button className="skip" onClick={(e) => { e.stopPropagation(); setPhase('warp'); }}>SKIP INTRO ↗</button>

    {dlg && <>
      <div className="sage-frame"><div className={`sage fx-${cur.fx}`} key={cur.fx + pulse}>
        <div className="sage-aura" />
        <img src="/assets/sage-portrait.png" alt="Tech Sage" draggable="false" />
        <div className="glyph">{cur.glyph}</div>
      </div></div>
      <div className="dlg">
        <div className="dlg-name">TECH SAGE <small>{cur.mood}</small></div>
        <p>{shown}<i className={done ? 'idle' : ''}>▌</i></p>
        <div className="dlg-foot"><span>{done ? (line < dialogue.length - 1 ? 'CLICK / SPACE TO CONTINUE' : 'CLICK TO START') : ''}</span><b>▼</b></div>
      </div>
    </>}

    {phase === 'switch' && <div className="switch"><div className="crt" /><div className="switch-card">▶ ARCADE MODE<small>PLAYER 1 — FIND THE PORTAL</small></div></div>}
    {phase === 'arcade' && <div className="objective">OBJECTIVE: <b>ENTER THE PORTAL</b><small>WASD / ARROWS / TAP TO MOVE</small></div>}
  </div>;
}

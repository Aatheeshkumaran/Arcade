import { useEffect, useRef, useState } from 'react';
import { createIsland } from './engine.js';
import './island.css';

// <IslandWorld locations={[{id,label,icon}]} onInteract={(id)=>...} paused={modalOpen} />
export default function IslandWorld({ locations, onInteract, paused = false }) {
  const canvas = useRef(null), eng = useRef(null), cb = useRef(onInteract);
  const [near, setNear] = useState(null);
  cb.current = onInteract;
  useEffect(() => {
    let dead = false;
    createIsland(canvas.current, { locations, onNearby: setNear, onInteract: (id) => cb.current?.(id) }).then((e) => { if (dead) e.destroy(); else { eng.current = e; e.setPaused(paused); } });
    return () => { dead = true; eng.current?.destroy(); eng.current = null; };
  }, [locations]);
  useEffect(() => { eng.current?.setPaused(paused); }, [paused]);
  const pad = (d) => ({ onPointerDown: () => eng.current?.press(d, true), onPointerUp: () => eng.current?.press(d, false), onPointerLeave: () => eng.current?.press(d, false), onPointerCancel: () => eng.current?.press(d, false) });
  return (
    <div className="isl">
      <div className="isl-top"><span><i className="isl-dot" /> WORLD MAP / COIMBATORE SERVER</span><span>MAP 01 — DEVELOPER ISLAND</span><span>STATUS: EXPLORABLE</span></div>
      <canvas ref={canvas} className="isl-canvas" tabIndex={0} aria-label="Explorable island map. Use WASD or arrow keys to walk, E to interact." />
      <div className="isl-bar">
        <div className="isl-near"><small>{near ? 'YOU ARE AT' : 'EXPLORING'}</small><strong>{near ? `${near.icon} ${near.label}` : 'Walk anywhere · talk to the Code Sage'}</strong></div>
        <div className="isl-pad">{[['↑', 'up'], ['←', 'left'], ['↓', 'down'], ['→', 'right']].map(([l, d]) => <button key={d} aria-label={`Move ${d}`} {...pad(d)}>{l}</button>)}</div>
        <button className="isl-act" disabled={!near} onClick={() => eng.current?.interact()}>INTERACT <kbd>E</kbd></button>
      </div>
      <div className="isl-help"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / arrows move</span><span>click or tap the map to walk</span><span><kbd>E</kbd> interact · talk</span></div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, BriefcaseBusiness, Check, ChevronDown, Code2, ExternalLink, Github, Heart, Keyboard, Mail, MapPin, Moon, RotateCcw, Sparkles, Sun, X } from 'lucide-react';
import IntroSequence from './Intro';
import HeroScene from './HeroScene';
import Pet from './Pet';
import ProjectMonitor from './ProjectMonitor';
import IslandWorld from './island/IslandWorld';
import { profile, skills, projects, achievements, experience } from './data';

const locations = [
  { id: 'about', label: 'PLAYER PROFILE', x: 16, y: 20, icon: '🧑🏻‍💻', color: 'mint', hint: 'Meet the developer' },
  { id: 'skills', label: 'SKILL ARCADE', x: 48, y: 13, icon: '🕹️', color: 'purple', hint: 'Inspect abilities' },
  { id: 'projects', label: 'PROJECT LAB', x: 75, y: 25, icon: '🧪', color: 'yellow', hint: 'Open project files' },
  { id: 'experience', label: 'WORKSHOP', x: 25, y: 62, icon: '🛠️', color: 'blue', hint: 'Work & experience' },
  { id: 'achievements', label: 'TROPHY ROOM', x: 62, y: 66, icon: '🏆', color: 'pink', hint: 'Unlocked achievements' },
  { id: 'contact', label: 'COMMS STATION', x: 83, y: 76, icon: '📡', color: 'mint', hint: 'Start a conversation' },
];

function PixelIcon({ children }) { return <span className="pixel-icon" aria-hidden="true">{children}</span>; }

function Modal({ active, onClose, onOpenProject }) {
  if (!active) return null;
  const title = locations.find((l) => l.id === active)?.label || active;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="modal pixel-panel" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-top"><span className="eyebrow">DATA UNLOCKED / {title}</span><button className="icon-button" onClick={onClose} aria-label="Close details"><X size={18}/></button></div>
      {active === 'about' && <><h2>PLAYER PROFILE<span className="accent">.</span></h2><p className="lead">{profile.intro}</p><div className="stat-grid"><div className="stat"><strong>09+</strong><span>PROJECTS</span></div><div className="stat"><strong>03</strong><span>AWARDS</span></div><div className="stat"><strong>04+</strong><span>YEARS LEARNING</span></div></div><p>I enjoy combining practical development with creative problem-solving — from building interfaces to experimenting with AI and connected devices.</p><div className="chips"><span>Full-stack development</span><span>AI experiments</span><span>UI/UX</span><span>IoT</span></div></>}
      {active === 'skills' && <><h2>SKILL ARCADE<span className="accent">.</span></h2><p className="muted">Tools and technologies I've worked with or explored.</p><div className="skill-groups">{skills.map((s) => <div className="skill-group" key={s.group}><h3>{s.group}</h3><div className="chips">{s.items.map((item) => <span key={item}>{item}</span>)}</div></div>)}</div></>}
      {active === 'projects' && <><h2>PROJECT LAB<span className="accent">.</span></h2><p className="muted">Choose a project to inspect its mission, stack, and available links.</p><div className="project-list">{projects.map((p) => <button className="project-row" key={p.id} onClick={() => onOpenProject(p.id)}><span className="project-emoji">{p.icon}</span><span className="project-row-copy"><strong>{p.title}</strong><small>{p.type}</small></span><span className="row-status">{p.status}</span><ArrowUpRight size={16}/></button>)}</div></>}
      {active?.startsWith('project:') && (() => { const p = projects.find((item) => item.id === active.slice(8)); if (!p) return null; return <><div className="project-detail-hero"><span>{p.icon}</span><div><span className="eyebrow">{p.type}</span><h2>{p.title}<span className="accent">.</span></h2></div></div>{p.image && <img className="project-shot" src={p.image} alt={`Screenshot of ${p.title}`} loading="lazy" style={{ objectPosition: p.focus || '50% 50%' }}/>}<p className="lead">{p.description}</p><p>{p.details}</p><h3 className="mini-heading">TECH STACK</h3><div className="chips">{p.stack.map((s) => <span key={s}>{s}</span>)}</div><div className="modal-actions">{p.github ? <a className="button primary" href={p.github} target="_blank" rel="noreferrer"><Github size={16}/> View repository <ArrowUpRight size={15}/></a> : <span className="muted small">Repository link to be added</span>}{p.demo && <a className="button" href={p.demo} target="_blank" rel="noreferrer">Live demo <ExternalLink size={15}/></a>}</div></>; })()}
      {active === 'experience' && <><h2>THE WORKSHOP<span className="accent">.</span></h2><p className="muted">Experience and learning milestones.</p><div className="timeline">{experience.map((e) => <div className="timeline-item" key={e.role}><span className="timeline-dot"/><small>{e.period}</small><h3>{e.role}</h3><strong>{e.company}</strong><p>{e.note}</p></div>)}</div><div className="education-card"><span>🎓</span><div><h3>B.E. — Computer Science</h3><p>Nehru Institute of Engineering & Technology · 2022–2026</p><small>CGPA: 7.4 (up to 7th semester, as listed in the current portfolio)</small></div></div></>}
      {active === 'achievements' && <><h2>TROPHY ROOM<span className="accent">.</span></h2><p className="muted">A few milestones collected along the way.</p><div className="achievement-list">{achievements.map((a) => <div className="achievement" key={a.title}><span className="trophy">🏆</span><div><small>{a.year} / UNLOCKED</small><h3>{a.title}</h3><p>{a.place}</p></div><Check size={17}/></div>)}</div></>}
      {active === 'contact' && <><h2>LET'S CONNECT<span className="accent">.</span></h2><p className="lead">Have a project, opportunity, or interesting problem? Let's talk.</p><div className="contact-cards"><a href={`mailto:${profile.email}`}><Mail size={18}/><span><small>EMAIL</small><strong>{profile.email}</strong></span><ArrowUpRight size={15}/></a><div><MapPin size={18}/><span><small>BASE</small><strong>{profile.location}</strong></span></div></div><div className="modal-actions"><a className="button primary" href={`mailto:${profile.email}`}>Send an email <ArrowUpRight size={15}/></a><a className="button" href={profile.github} target="_blank" rel="noreferrer"><Github size={16}/> GitHub</a><a className="button" href={profile.portfolio} target="_blank" rel="noreferrer">Current portfolio <ExternalLink size={15}/></a></div></>}
      <div className="modal-footer"><span>PRESS ESC TO CLOSE</span><span>PLAYER DATA / LOCAL BUILD</span></div>
    </section>
  </div>;
}

export default function App() {
  const [active, setActive] = useState(null);
  const [theme, setTheme] = useState('night');
  const [sound, setSound] = useState(false);
  const [toast, setToast] = useState('');
  const [showControls, setShowControls] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const finishIntro = useCallback(() => setIntroComplete(true), []);


  const interact = useCallback((id) => {
    setActive(id);
    setToast('');
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setActive(null); setShowControls(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { document.body.style.overflow = active ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [active]);


  if (!introComplete) return <IntroSequence onFinish={finishIntro} />;

  return <main className={`app theme-${theme}`}>
    <header className="topbar"><a className="brand" href="#top" aria-label="Aatheesh home"><span className="brand-mark">A</span><span>AATHEESH<span className="brand-dim">.exe</span><small>PLAYER ONE / DEVELOPER</small></span></a><div className="top-actions"><span className="online-pill"><span/> AVAILABLE FOR OPPORTUNITIES</span><button className="icon-button" onClick={() => setTheme(theme === 'night' ? 'day' : 'night')} aria-label="Toggle theme">{theme === 'night' ? <Sun size={17}/> : <Moon size={17}/>}</button><button className="icon-button" onClick={() => setShowControls(!showControls)} aria-label="Show controls"><Keyboard size={17}/></button><a className="button contact-top" href={`mailto:${profile.email}`}>CONTACT <ArrowUpRight size={14}/></a></div></header>

    <section className="hero" id="top"><div className="hero-copy"><div className="eyebrow"><span className="blink-square"/> PORTFOLIO BUILD 01.26 <span className="eyebrow-line"/></div><h1>HEY, I'M<br/><span>AATHEESH</span><i>.</i></h1><p className="hero-role">FULL-STACK DEVELOPER <span>×</span> CREATIVE BUILDER</p><p className="hero-intro">I build digital experiences with code, curiosity, and a little bit of pixel magic.</p><div className="hero-actions"><button className="button primary" onClick={() => interact('projects')}>EXPLORE PROJECTS <ArrowDown size={15}/></button><a className="button" href={profile.github} target="_blank" rel="noreferrer"><Github size={16}/> GITHUB <ArrowUpRight size={14}/></a></div><div className="hero-meta"><span><MapPin size={13}/> COIMBATORE, INDIA</span><span><span className="meta-dot"/> BUILDING THINGS THAT WORK</span></div></div>
      <HeroScene />
    </section>

    <section className="world-section" id="world"><div className="section-heading"><div><span className="eyebrow">INTERACTIVE PORTFOLIO / 01</span><h2>CHOOSE YOUR<br/><span className="accent">DESTINATION.</span></h2></div><p>Explore the map. Find a location.<br/>Interact to unlock the next part of my story.</p></div>
      <IslandWorld locations={locations} paused={!!active} onInteract={interact} />
    </section>

    <section className="featured-section"><div className="section-heading"><div><span className="eyebrow">SELECTED WORK / 02</span><h2>BUILT WITH<br/><span className="accent">CURIOSITY.</span></h2></div><button className="text-link" onClick={() => interact('projects')}>VIEW ALL PROJECTS <ArrowUpRight size={15}/></button></div><ProjectMonitor projects={projects} onOpen={(id) => interact(`project:${id}`)} /></section>

    <section className="end-card"><div className="end-pixel">✦</div><div><span className="eyebrow">QUEST AVAILABLE / 03</span><h2>GOT SOMETHING<br/>TO <span className="accent">BUILD?</span></h2><p>I'm always up for interesting ideas, meaningful projects, and conversations with people who love making things.</p></div><div className="end-actions"><a className="button primary" href={`mailto:${profile.email}`}><Mail size={16}/> START A CONVERSATION <ArrowUpRight size={15}/></a><a className="button" href={profile.github} target="_blank" rel="noreferrer"><Github size={16}/> FOLLOW THE CODE</a></div></section>

    <footer className="footer"><a className="brand footer-brand" href="#top"><span className="brand-mark">A</span><span>AATHEESH<span className="brand-dim">.exe</span><small>MADE WITH <Heart size={10} fill="currentColor"/> AND A FEW BUGS</small></span></a><span>© 2026 AATHEESH KUMARAN / PLAYER ONE</span><div><a href={profile.github} target="_blank" rel="noreferrer">GITHUB <ArrowUpRight size={12}/></a><a href={`mailto:${profile.email}`}>EMAIL <ArrowUpRight size={12}/></a></div></footer>

    {showControls && <div className="controls-popover pixel-panel"><button className="icon-button close-controls" onClick={() => setShowControls(false)} aria-label="Close controls"><X size={16}/></button><span className="eyebrow">HOW TO PLAY</span><h3>CONTROLS</h3><p><span className="keycap">W</span><span className="keycap">A</span><span className="keycap">S</span><span className="keycap">D</span> or arrow keys to move</p><p><span className="keycap">E</span> / <span className="keycap">ENTER</span> to interact nearby</p><p>Click any location to open it directly.</p></div>}
    {toast && <div className="toast"><Sparkles size={15}/>{toast}</div>}
    <Pet />
    <Modal active={active} onClose={() => setActive(null)} onOpenProject={(id) => setActive(`project:${id}`)}/>
  </main>;
}

import { createRoot } from 'react-dom/client';
import IslandWorld from './IslandWorld.jsx';
const locations = [
  { id: 'about', label: 'PLAYER PROFILE', icon: '🧑🏻‍💻' }, { id: 'skills', label: 'SKILL ARCADE', icon: '🕹️' },
  { id: 'projects', label: 'PROJECT LAB', icon: '🧪' }, { id: 'experience', label: 'WORKSHOP', icon: '🛠️' },
  { id: 'achievements', label: 'TROPHY ROOM', icon: '🏆' }, { id: 'contact', label: 'COMMS STATION', icon: '📡' },
];
createRoot(document.getElementById('root')).render(<IslandWorld locations={locations} onInteract={(id) => alert('open panel: ' + id)} />);

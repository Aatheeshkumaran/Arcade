export const profile = {
  name: 'Aatheesh Kumaran',
  handle: 'AATHEESH.exe',
  headline: 'Developer. Builder. Curious human.',
  intro: 'I turn ideas into useful digital experiences — from responsive interfaces to Python-powered applications and AI experiments.',
  location: 'Coimbatore, India',
  email: 'aatheesh1e@gmail.com',
  phone: '+91 89251 74341',
  github: 'https://github.com/Aatheeshkumaran',
  portfolio: 'https://aatheeshkumaran.github.io/dev_portfolio/',
  linkedin: 'https://www.linkedin.com/',
  resume: '#',
};

export const skills = [
  { group: 'Frontend', items: ['HTML', 'CSS', 'JavaScript', 'React', 'Bootstrap', 'Tailwind CSS'] },
  { group: 'Backend', items: ['Python', 'Django', 'FastAPI', 'REST APIs'] },
  { group: 'Data & Tools', items: ['MongoDB', 'SQL', 'Git', 'GitHub', 'Firebase'] },
  { group: 'Creative tech', items: ['UI/UX', 'Blender', 'Video editing', 'AI integration'] },
];

export const projects = [
  {
    id: 'jarvis', image: '/assets/projects/jarvis.webp', focus: '50% 45%', icon: '🤖', title: 'Jarvis AI', type: 'PERSONAL AI ASSISTANT', status: 'BUILT',
    description: 'A Python-based personal assistant exploring conversational AI, local execution, and desktop automation.',
    stack: ['Python', 'Hugging Face', 'HTML', 'CSS'],
    details: 'An experiment in making a personal desktop assistant feel approachable. The project explores natural-language interaction and connecting AI responses with useful local actions.',
    github: 'https://github.com/Aatheeshkumaran/jarvis_local-assistant.git', demo: ''
  },
  {
    id: 'testflow', image: '/assets/projects/testflow.webp', focus: '45% 40%', icon: '📊', title: 'TestFlow / EduPulse', type: 'STUDENT PROGRESS PLATFORM', status: 'IN PROGRESS',
    description: 'A mentor and management workflow for assessments, marks, student progress, and task tracking.',
    stack: ['Python', 'Django', 'SQLite', 'JavaScript'],
    details: 'Designed around practical education workflows: assessment scheduling, marks entry, progress visibility, mentor task tracking, and management-level oversight.',
    github: '', demo: ''
  },
  {
    id: 'childsafe', image: '/assets/projects/childsafe.webp', focus: '55% 55%', icon: '🛰️', title: 'Child Safety Monitor', type: 'IOT + CLOUD PROJECT', status: 'PROJECT',
    description: 'A child activity and safety monitoring concept using geofencing, sensors, and cloud-connected hardware.',
    stack: ['ESP32', 'GPS', 'AWS IoT', 'ThingSpeak'],
    details: 'A hybrid IoT concept using geofencing and sensor data to surface useful alerts. The system concept combines embedded hardware, cloud connectivity, and a monitoring interface.',
    github: '', demo: ''
  },
  {
    id: 'tracker', image: '/assets/projects/tracker.webp', focus: '50% 30%', icon: '🗂️', title: 'Personal Tracker', type: 'FRONTEND + DATA', status: 'BUILT',
    description: 'A personal tracking interface focused on organizing information and making progress easy to review.',
    stack: ['JavaScript', 'HTML', 'CSS', 'Database'],
    details: 'A UI-focused project from the portfolio collection. Add the exact repository, screenshots, and implementation details when you select the final version to showcase.',
    github: '', demo: ''
  },
  {
    id: 'commercial', image: '/assets/projects/commercial.webp', focus: '50% 25%', icon: '🏢', title: 'Business Landing Page', type: 'COMMERCIAL WEBSITE', status: 'DELIVERED',
    description: 'A responsive business landing page built to present a brand and its services clearly.',
    stack: ['HTML', 'CSS', 'JavaScript', 'Responsive UI'],
    details: 'Commercial-style web work focused on clear information hierarchy, responsive layout, and a polished visitor experience. Add the approved public link before publishing.',
    github: '', demo: ''
  },
  {
    id: 'mindflow', image: '/assets/projects/mindflow.webp', focus: '50% 50%', icon: '🧠', title: 'MindDesk', type: 'LOCAL AI WORKSPACE', status: 'BUILT',
    description: 'A calm thinking-partner chat app for brainstorming, writing, planning and learning, running on a local Ollama model.',
    stack: ['Ollama', 'Local LLM', 'Chat UI', 'Auth'],
    details: 'MindDesk is a private AI workspace: a conversation sidebar, model picker, Ollama connection status, guest or signed-in sessions, light and dark themes, and quick-start prompts. Prompts stay on the local model instead of going to a third-party service.',
    github: '', demo: ''
  },
];

export const achievements = [
  { year: '2025', title: '1st Prize — Website Development', place: 'Rathinam College of Arts & Science' },
  { year: '2025', title: '2nd Prize — Website Development', place: 'Nehru Institute of Technology' },
  { year: '—', title: '1st Prize — Billboard Designing', place: 'Jansons Institute of Technology' },
];

export const experience = [
  { period: 'DEC 2025 — JUN 2026', role: 'Python Full Stack Developer Intern', company: 'Career Ladder', note: 'Python, backend development, and full-stack project work.' },
  { period: 'JUN — AUG 2025', role: 'Frontend Developer', company: 'Frazon Digital Marketing', note: 'Frontend implementation and responsive web interfaces.' },
];

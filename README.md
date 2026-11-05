# AATHEESH.exe — Pixel-Art Developer Portfolio

A React + Vite interactive portfolio concept built around a pixel-art RPG map. Visitors can explore profile, skills, projects, experience, achievements, and contact information through clickable locations or keyboard movement.

## Run locally

Prerequisites: Node.js (current LTS recommended) and npm.

```bash
npm install
npm run dev
```

Open the local URL Vite prints in the terminal.

## Production build

```bash
npm run build
npm run preview
```

Vite writes the production files to `dist/`.

## Deploy

### Vercel
1. Push this project to a GitHub repository.
2. Import the repository into Vercel.
3. Framework preset: Vite (or let Vercel detect it).
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Deploy.

### Cloudflare Pages / Netlify
- Build command: `npm run build`
- Output directory: `dist`

## Personalize before publishing

Most portfolio content is in `src/data.js`:
- Confirm the internship dates/titles and education details.
- Replace placeholder or missing project repository/demo URLs.
- Replace the generic LinkedIn URL with your actual profile URL.
- Replace the resume `#` placeholder with a real hosted PDF URL or remove that link if not ready.
- Confirm that all project descriptions accurately reflect the work you want to show publicly.

The current contact email, GitHub profile, and existing portfolio URL were taken from the supplied portfolio page. Do not publish personal contact details if you prefer not to display them publicly.

## Controls
- Move: WASD or arrow keys.
- Interact with nearest location: E or Enter.
- Click a location to open it directly.
- Use the on-screen arrow buttons on mobile.
- Press Escape to close a panel.

## Notes
- This is a frontend-only portfolio. It does not require a backend.
- Google Fonts are loaded remotely; for fully offline operation, bundle the fonts locally.
- Project content is editable data, not a CMS. Add verified links and screenshots as the project evolves.


## Coffee Sage intro update
The intro now features the approved Coffee Sage character artwork as an unchanged transparent PNG overlay, an NPC/mentor dialogue sequence, a subtle idle float/glow, and the existing black-hole transition. Character asset: `public/assets/coffee-sage.png`.


## Tech Sage dynamic dialogue
The intro NPC is named Tech Sage. Each dialogue step has its own mood label, glyph, lighting accent, and entrance/idle animation (curious, explaining, happy, thinking, sipping coffee, teasing, proud, casting). The existing approved character artwork is preserved unchanged.

## Island world (standalone test, map: Pixel_Island_Developer_Hub_Map)
`npm run dev` then open `/island.html`. Code: `src/island/` (engine.js = canvas engine, IslandWorld.jsx = React wrapper). Assets: `public/assets/island/` (island.webp cutout, walk.png walkable-path mask).

## Island is now on the main page
`src/App.jsx` renders `<IslandWorld/>` in the "Choose your destination" section (old CSS map removed). Press E at any of the 6 zones to open its panel; the standalone test page is still at `/island.html`.
Characters come from `public/assets/hero-sheet.png`, `hero-cat-sheet.png`, `sage-atlas.png` (same sprites as the intro cave). Edit Code Sage lines in `SAGE_LINES` in `src/island/engine.js`.

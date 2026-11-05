// Island world engine — plain Canvas 2D, no dependencies. World space = island image pixels (1586x992).
const W = 1586, H = 992;
export const SPAWN = { x: 790, y: 545 };
export const SPOTS = { about:[407,309], skills:[795,240], projects:[1248,342], experience:[438,637], achievements:[1000,748], contact:[1360,595] };
// interaction zones [centre x, centre y, radius x, radius y]: stand anywhere inside a building's area and press E
const ZONES = { about:[430,255,200,125], skills:[795,195,200,125], projects:[1250,265,210,125], experience:[460,570,200,115], achievements:[1005,715,170,105], contact:[1370,515,180,115] };
const SAGE = { x: 722, y: 524 };   // Code Sage stands under the great tree
const SAGE_LINES = ['Welcome, traveller! I am the Code Sage.', "Six places hide Aatheesh's story. Walk up and press E.", 'The Project Lab holds his best builds.', 'Test his abilities at the Skill Arcade!', 'Want to reach him? Visit the Comms Station.'];
const TREES = [[380,90],[760,410],[1340,170],[1420,230],[1160,650],[540,60]];
const PETAL = ['#ff7ac8','#ffb0e0','#ff8a2a','#ffc04a'];
const rnd = (a, b) => a + Math.random() * (b - a);
// pixel-art cloud: union of ellipses on a 48x18 grid, 3-tone shaded, plus a matching shadow silhouette
function cloudSprite() {
  const w = 48, h = 24, on = Array.from({ length: h }, () => Array(w).fill(false));
  for (let k = 0, n = 4 + (Math.random() * 3 | 0); k < n; k++) { const cx = 9 + k * (30 / n) + rnd(-2, 2), cy = rnd(11, 14) - Math.sin(k / n * 3.14) * 3, rx = rnd(5.5, 9), ry = rx * .85;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) on[y][x] = true; }
  for (let x = 0; x < w; x++) for (let y = 17; y < h; y++) on[y][x] = false;       // flat-ish bottom
  const mk = (col) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (on[y][x]) { g.fillStyle = col ? col : !on[y - 1]?.[x] || !on[y - 2]?.[x] ? '#ffffff' : !on[y + 1]?.[x] ? '#a9c8e8' : !on[y + 2]?.[x] ? '#cfe3f6' : '#eaf4ff'; g.fillRect(x, y, 1, 1); }
    return c; };
  return { img: mk(), shd: mk('#02194a'), w, h };
}
const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

export async function createIsland(canvas, { base = '/assets/island/', sprites = '/assets/', locations = [], onNearby = () => {}, onInteract = () => {} } = {}) {
  const [land, walkImg, heroImg, catImg, sageImg] = await Promise.all([load(base + 'island.webp'), load(base + 'walk.png'), ...['hero-sheet', 'hero-cat-sheet', 'sage-atlas'].map((n) => load(`${sprites}${n}.png`).catch(() => null))]);
  const ctx = canvas.getContext('2d');
  // walk mask
  const mc = document.createElement('canvas'); mc.width = W; mc.height = H;
  const mx = mc.getContext('2d', { willReadFrequently: true }); mx.drawImage(walkImg, 0, 0);
  const md = mx.getImageData(0, 0, W, H).data;
  const walkable = (x, y) => x >= 0 && y >= 0 && x < W && y < H && md[((y | 0) * W + (x | 0)) * 4] > 128;
  const fits = (x, y) => walkable(x, y) && walkable(x - 5, y) && walkable(x + 5, y) && walkable(x, y - 3) && Math.hypot(x - SAGE.x, (y - SAGE.y) * 1.4) > 20;
  // direction pointing away from nearby walls (null when clear) — used to glide along them instead of snagging
  const wallNormal = (x, y) => { let nx = 0, ny = 0, hit = 0; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, c = Math.cos(a), sn = Math.sin(a); if (!fits(x + c * 11, y + sn * 11)) { nx -= c; ny -= sn; hit++; } } const l = Math.hypot(nx, ny); return hit && l > .01 ? [nx / l, ny / l] : null; };
  // soft shadow silhouette of the island
  const sh = document.createElement('canvas'); sh.width = W; sh.height = H;
  const sx = sh.getContext('2d'); sx.drawImage(land, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#031a44'; sx.fillRect(0, 0, W, H);
  // low-res water buffer
  const wb = document.createElement('canvas'); let wctx = wb.getContext('2d'), wimg = null;

  const spots = locations.map((l) => ({ ...l, x: SPOTS[l.id]?.[0] ?? 0, y: SPOTS[l.id]?.[1] ?? 0 })).filter((s) => s.x);
  const p = { x: SPAWN.x, y: SPAWN.y, dir: 'down', anim: 0, moving: false };
  const cat = { x: SPAWN.x - 40, y: SPAWN.y + 14, row: 2, anim: 0, mv: false }, say = { line: 0, chars: 0, hold: 0 };
  let target = null, stuckT = 0, visible = true, paused = false, dpr = 1, lastV = [0, 1];
  const cam = { x: SPAWN.x, y: SPAWN.y };
  const keys = new Set();
  let vw = 0, vh = 0, zoom = 1.2, t = 0, last = performance.now(), raf = 0, near = null, nextFlock = 2;
  const clouds = Array.from({ length: 5 }, (_, i) => ({ x: rnd(-300, W + 300), y: rnd(-100, H), s: rnd(3, 5), v: rnd(5, 11), ...cloudSprite() }));
  const flocks = [], petals = [];

  const resize = () => {
    const r = canvas.getBoundingClientRect(), d = dpr = Math.min(devicePixelRatio || 1, 2);
    vw = canvas.width = Math.max(320, r.width * d | 0); vh = canvas.height = Math.max(240, r.height * d | 0);
    zoom = Math.max(.55 * d, Math.min(vw / 950, vh / 620));          // fits the island to any canvas size; sprites scale with it
    wb.width = Math.ceil(vw / 4); wb.height = Math.ceil(vh / 4); wimg = wctx.createImageData(wb.width, wb.height);
  };
  const map = { arrowup:'up', w:'up', arrowdown:'down', s:'down', arrowleft:'left', a:'left', arrowright:'right', d:'right' };
  const kd = (e) => {
    if (!visible || paused || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    const k = e.key.toLowerCase();
    if (map[k]) { keys.add(map[k]); target = null; e.preventDefault(); }
    else if (k === 'e' || k === 'enter') talk();
  };
  const ku = (e) => { const k = map[e.key.toLowerCase()]; if (k) keys.delete(k); };
  const talk = () => { if (near) return onInteract(near.id); if (sageNear()) { const L = SAGE_LINES[say.line]; if (say.chars < L.length) say.chars = L.length; else { say.line = (say.line + 1) % SAGE_LINES.length; say.chars = 0; say.hold = 0; } } };
  const sageNear = () => Math.hypot(p.x - SAGE.x, (p.y - SAGE.y) * 1.3) < 240;
  const click = (e) => { const r = canvas.getBoundingClientRect(), k = canvas.width / r.width; target = { x: cam.x + ((e.clientX - r.left) * k - vw / 2) / zoom, y: cam.y + ((e.clientY - r.top) * k - vh / 2) / zoom + 20 }; };
  addEventListener('keydown', kd); addEventListener('keyup', ku); addEventListener('blur', () => keys.clear()); canvas.addEventListener('pointerdown', click);
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (!visible) keys.clear(); }, { threshold: .3 }); io.observe(canvas);
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  function update(dt) {
    t += dt;
    let dx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0), dy = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
    if (!dx && !dy && target) { const tx = target.x - p.x, ty = target.y - p.y, d = Math.hypot(tx, ty); if (d < 10) target = null; else { dx = tx / d; dy = ty / d; } }
    p.moving = !!(dx || dy);
    const tryMove = (a, b) => fits(p.x + a, p.y + b) && (p.x += a, p.y += b, true);
    if (!fits(p.x, p.y)) for (let r = 4; r < 80; r += 4) { let ok = false; for (let a = 0; a < 6.3 && !ok; a += .5) if (fits(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r)) { p.x += Math.cos(a) * r; p.y += Math.sin(a) * r; ok = true; } if (ok) break; }   // never stay inside a wall
    if (p.moving) {
      const n = Math.hypot(dx, dy), sp = 190 * (0.9 + 0.2 * p.y / H) * dt, mx = dx / n * sp, my = dy / n * sp * 0.85, ox = p.x, oy = p.y;
      if (!tryMove(mx, my)) {
        const nr = wallNormal(p.x + mx, p.y + my) || wallNormal(p.x, p.y); let ok = false;
        if (nr) { const dot = mx * nr[0] + my * nr[1]; if (dot < 0) { const sx = mx - dot * nr[0], sy = my - dot * nr[1], k = Math.min(1.7, Math.hypot(mx, my) / (Math.hypot(sx, sy) || 1)); ok = tryMove(sx * k, sy * k) || tryMove(sx, sy); } }   // slide along the wall
        if (!ok && !tryMove(mx, 0) && !tryMove(0, my)) for (const a of [.45, -.45, .9, -.9, 1.35, -1.35]) { const c = Math.cos(a), sn = Math.sin(a); if (tryMove(mx * c - my * sn, mx * sn + my * c)) break; }
      }
      const nr2 = wallNormal(p.x, p.y); if (nr2) tryMove(nr2[0] * 55 * dt, nr2[1] * 55 * dt);   // gentle push off walls = gliding down paths
      const moved = Math.hypot(p.x - ox, p.y - oy); if (target) { stuckT = moved < sp * .25 ? stuckT + dt : 0; if (stuckT > .4) { target = null; stuckT = 0; } }
      p.anim += dt; lastV = [dx / n, dy / n];
      if (Math.abs(dx) > Math.abs(dy) * 1.15) p.dir = dx > 0 ? 'right' : 'left'; else if (dy) p.dir = dy > 0 ? 'down' : 'up';
    } else p.anim = 0;
    // the cat trots after you, a little behind
    { const tx = p.x - lastV[0] * 46, ty = p.y - lastV[1] * 30 + 8, ex = tx - cat.x, ey = ty - cat.y, d = Math.hypot(ex, ey);
      if (d > 420) { cat.x = p.x - 30; cat.y = p.y + 10; }
      else if (d > 6) { const sp = Math.min(d * 3.4, 240) * dt, ax = ex / d * sp, ay = ey / d * sp * .85; if (walkable(cat.x + ax, cat.y)) cat.x += ax; if (walkable(cat.x, cat.y + ay)) cat.y += ay; cat.mv = true; cat.anim += dt; cat.row = Math.abs(ex) > Math.abs(ey) * 1.2 ? (ex > 0 ? 0 : 1) : (ey > 0 ? 2 : 3); } else cat.mv = false; }
    // Code Sage dialogue: types out while you are near, cycles lines, E skips ahead
    if (sageNear()) { const L = SAGE_LINES[say.line]; if (say.chars < L.length) { say.chars = Math.min(L.length, say.chars + dt * 30); say.hold = 0; } else if ((say.hold += dt) > 3) { say.line = (say.line + 1) % SAGE_LINES.length; say.chars = 0; say.hold = 0; } } else { say.chars = 0; say.hold = 0; }
    cam.x += (p.x - cam.x) * Math.min(1, dt * 5); cam.y += (p.y - 20 - cam.y) * Math.min(1, dt * 5);
    let best = null, bd = 1;
    for (const s of spots) { const z = ZONES[s.id]; if (!z) continue; const n = ((p.x - z[0]) / z[2]) ** 2 + ((p.y - z[1]) / z[3]) ** 2; if (n < bd) { bd = n; best = s; } }
    if (best?.id !== near?.id) { near = best; onNearby(near); }
    for (const c of clouds) { c.x += c.v * dt; if (c.x > W + 400) { c.x = -400; c.y = rnd(-100, H); } }
    nextFlock -= dt;
    if (nextFlock < 0) { nextFlock = rnd(9, 16); const y = rnd(0, H * 0.8), n = 4 + (Math.random() * 4 | 0); flocks.push({ x: -80, y, v: rnd(70, 110), birds: Array.from({ length: n }, (_, i) => ({ ox: -Math.ceil(i / 2) * 26, oy: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 14, ph: rnd(0, 6) })) }); }
    for (let i = flocks.length - 1; i >= 0; i--) { const f = flocks[i]; f.x += f.v * dt; f.y += Math.sin(t * .6 + i) * 6 * dt; if (f.x > W + 200) flocks.splice(i, 1); }
    if (petals.length < 38 && Math.random() < dt * 14) { const [tx, ty] = TREES[Math.random() * TREES.length | 0]; petals.push({ x: tx + rnd(-60, 60), y: ty + rnd(-10, 50), vy: rnd(14, 26), ph: rnd(0, 6), c: PETAL[Math.random() * 4 | 0], life: rnd(4, 8) }); }
    for (let i = petals.length - 1; i >= 0; i--) { const q = petals[i]; q.y += q.vy * dt; q.x += Math.sin(t * 1.6 + q.ph) * 14 * dt + 6 * dt; if ((q.life -= dt) < 0) petals.splice(i, 1); }
  }

  function drawWater() {
    const d = wimg.data, w = wb.width, h = wb.height, k = 4 / zoom, ox = cam.x - vw / 2 / zoom, oy = cam.y - vh / 2 / zoom;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const X = ox + i * k, Y = (oy + j * k) * 1.7;
      const v = (Math.sin(X * .05 + t * .9 + Math.sin(Y * .012 + t * .3) * 2) + Math.sin(Y * .035 - t * .7 + X * .012) + Math.sin((X + Y) * .026 + t * .45)) / 3;
      let r, g, b;
      if (v > .8) { r = 175; g = 238; b = 255; } else if (v > .38) { r = 30; g = 178; b = 245; } else if (v > -.2) { r = 6; g = 128; b = 226; } else { r = 4; g = 98; b = 200; }
      const o = (j * w + i) * 4; d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
    }
    wctx.putImageData(wimg, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(wb, 0, 0, vw, vh);
  }

  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const depth = (y) => .85 + .3 * y / H;
  const smooth = () => { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; };
  const rim = () => { ctx.shadowColor = 'rgba(255,240,205,.95)'; ctx.shadowBlur = 5; };   // soft light rim so dark sprites never vanish
  const shadow = (rx, ry, a = .35) => { ctx.fillStyle = `rgba(0,10,40,${a})`; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7); ctx.fill(); };
  function drawPlayer() {       // hero-sheet.png: 256px cells, rows down/left/right/up, cols 0-7 walk, 8-11 idle, feet at y=246
    const D = 108 * depth(p.y), row = { down: 0, left: 1, right: 2, up: 3 }[p.dir], col = p.moving ? Math.floor(p.anim * 10) % 8 : 8 + Math.floor(t * 2.5) % 4;
    ctx.save(); ctx.translate(p.x, p.y); shadow(D * .17, D * .05); if (heroImg) { smooth(); rim(); ctx.drawImage(heroImg, col * 256, row * 256, 256, 256, -D / 2, -D * 246 / 256, D, D); } ctx.restore(); ctx.shadowBlur = 0; ctx.imageSmoothingEnabled = false;
  }
  function drawCat() {          // hero-cat-sheet.png: 128px cells, rows right/left/front/back, 8-frame walk, paws at y=121
    const D = 66 * depth(cat.y), col = cat.mv ? Math.floor(cat.anim * 11) % 8 : 0;
    ctx.save(); ctx.translate(cat.x, cat.y); shadow(D * .3, D * .07, .3); if (catImg) { smooth(); rim(); ctx.drawImage(catImg, col * 128, cat.row * 128, 128, 128, -D / 2, -D * 121 / 128, D, D); } ctx.restore(); ctx.shadowBlur = 0; ctx.imageSmoothingEnabled = false;
  }
  const sageH = () => 92 * depth(SAGE.y);
  function drawSage() {         // sage-atlas.png: 248x304 cells; row0 = front/back, row2 = side (faces left)
    const sh = sageH(), sw = sh * 248 / 304, dx = p.x - SAGE.x, dy = p.y - SAGE.y, near = Math.hypot(dx, dy) < 330;
    let row = 0, col = 0, flip = false;
    if (near) { if (Math.abs(dx) > Math.abs(dy) * 1.3) { row = 2; flip = dx > 0; } else if (dy < 0) col = 3; }
    ctx.save(); ctx.translate(SAGE.x, SAGE.y); shadow(sw * .3, sw * .09, .4); ctx.translate(0, Math.sin(t * 2) * 1.2); ctx.rotate(Math.sin(t * 1.3) * .012); if (flip) ctx.scale(-1, 1);
    if (sageImg) { smooth(); ctx.drawImage(sageImg, col * 248, row * 304, 248, 304, -sw / 2, -sh * .95, sw, sh); } ctx.restore(); ctx.imageSmoothingEnabled = false;
    if (!sageNear()) { const by = SAGE.y - sh - 16 - Math.abs(Math.sin(t * 3)) * 5; px(SAGE.x - 3, by, 6, 14, '#10141c'); px(SAGE.x - 3, by + 17, 6, 6, '#10141c'); px(SAGE.x - 1.5, by + 2, 3, 10, '#ffd23f'); px(SAGE.x - 1.5, by + 18.5, 3, 3, '#ffd23f'); }   // "!" beacon until you approach
  }
  function drawBubble() {       // screen-space pixel dialogue bubble above the sage, scales with the canvas
    if (!sageNear()) return;
    const L = SAGE_LINES[say.line], fs = Math.round(Math.max(9 * dpr, Math.min(16 * dpr, 10.5 * zoom))), pad = fs * .9, lh = fs * 1.7;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = `${fs}px "Press Start 2P", ui-monospace, monospace`; ctx.textBaseline = 'top';
    const maxW = Math.min(vw * .78, fs * 22), words = L.split(' '), lines = []; let cur = '';
    for (const w of words) { const tr = cur ? cur + ' ' + w : w; if (ctx.measureText(tr).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tr; } lines.push(cur);
    const bw = Math.ceil(Math.max(...lines.map((l) => ctx.measureText(l).width), ctx.measureText('CODE SAGE').width)) + pad * 2, bh = lines.length * lh + pad * 2 + fs * 1.5, bd = Math.max(2, fs / 5 | 0);
    let X = Math.round((SAGE.x - cam.x) * zoom + vw / 2), Y = Math.round((SAGE.y - sageH() * .98 - cam.y) * zoom + vh / 2) - bh - fs * 1.2;
    const bx = Math.max(6, Math.min(vw - bw - 6, X - bw / 2)) | 0, by = Math.max(6, Y) | 0;
    ctx.fillStyle = '#02194a'; ctx.fillRect(bx + bd, by + bd, bw, bh);                                   // hard drop shadow
    ctx.fillStyle = '#efe6c9'; ctx.fillRect(bx, by, bw, bh); ctx.fillStyle = '#16120e'; ctx.fillRect(bx + bd, by + bd, bw - bd * 2, bh - bd * 2);
    ctx.fillStyle = '#16120e'; ctx.fillRect(X - fs * .6, by + bh - 1, fs * 1.2, fs * .6); ctx.fillStyle = '#efe6c9'; ctx.fillRect(X - fs * .6, by + bh + fs * .6 - 1, fs * 1.2, bd);   // pixel tail
    ctx.fillStyle = '#b6f25b'; ctx.font = `${Math.round(fs * .75)}px "Press Start 2P", ui-monospace, monospace`; ctx.fillText('CODE SAGE', bx + pad, by + pad);
    ctx.font = `${fs}px "Press Start 2P", ui-monospace, monospace`; ctx.fillStyle = '#efe6c9'; let left = Math.floor(say.chars);
    lines.forEach((l, i) => { const shown = l.slice(0, Math.max(0, left)); left -= l.length + 1; ctx.fillText(shown, bx + pad, by + pad + fs * 1.5 + i * lh); });
    if (say.chars >= L.length && Math.sin(t * 6) > 0) { ctx.fillStyle = '#b6f25b'; ctx.fillRect(bx + bw - pad - fs * .5, by + bh - pad - fs * .6, fs * .5, fs * .5); }   // "next" blink
    ctx.restore();
  }
  function drawCloud(c, shadow) {
    const w = c.w * c.s, d = Math.hypot(c.x + w / 2 - p.x, c.y + c.h * c.s / 2 - p.y);
    const a = shadow ? .13 : .6 * Math.min(1, Math.max(.12, d / (w * .55) - .55));   // fades out when it drifts over the player
    ctx.globalAlpha = a; ctx.drawImage(shadow ? c.shd : c.img, Math.round(c.x + (shadow ? 70 : 0)), Math.round(c.y + (shadow ? 110 : 0)), w, c.h * c.s); ctx.globalAlpha = 1;
  }
  function drawBird(x, y, ph) {
    const up = Math.sin(t * 9 + ph) > 0, c = '#fff';
    px(x + 5, y + 20, 8, 3, 'rgba(0,20,60,.25)');
    px(x - 3, y, 6, 3, c); px(x + 3, y - 1, 3, 3, c); px(x + 6, y + 0, 2, 1.5, '#ffb030');
    if (up) { px(x - 8, y - 5, 5, 3, c); px(x - 3, y - 3, 4, 3, c); } else { px(x - 8, y + 3, 5, 3, c); px(x - 3, y + 2, 4, 3, c); }
  }
  function drawSpot(s) {
    const q = near?.id === s.id, pul = Math.sin(t * 3 + s.x) * .5 + .5;
    ctx.strokeStyle = q ? '#b6f25b' : 'rgba(255,255,255,.45)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(s.x, s.y, 30 + pul * 4, 12 + pul * 2, 0, 0, 7); ctx.stroke();
    if (q) { ctx.fillStyle = 'rgba(182,242,91,.18)'; ctx.fill(); const z = ZONES[s.id]; ctx.setLineDash([10, 8]); ctx.strokeStyle = 'rgba(182,242,91,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(z[0], z[1], z[2], z[3], 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    const by = s.y - 64 - (q ? Math.abs(Math.sin(t * 6)) * 8 : Math.sin(t * 2.5) * 3), c = q ? '#b6f25b' : '#ffffff';   // bobbing pixel arrow
    px(s.x - 9, by, 18, 4, '#10141c'); px(s.x - 6, by + 4, 12, 4, '#10141c'); px(s.x - 3, by + 8, 6, 4, '#10141c');
    px(s.x - 6, by + 1, 12, 2, c); px(s.x - 3, by + 4, 6, 2, c);
  }
  function drawLabel() {
    if (!near) return;
    const f = Math.round(14 * zoom / 1.5), X = Math.round((near.x - cam.x) * zoom + vw / 2), Y = Math.round((near.y - cam.y) * zoom + vh / 2 - 92 * zoom);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = `700 ${f}px "Press Start 2P", ui-monospace, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = Math.ceil(ctx.measureText('PRESS E').width) + f * 2.4, h = f * 2.4, b = Math.max(2, f / 4 | 0), x = X - w / 2 | 0, y = Y - h;
    ctx.fillStyle = '#02194a'; ctx.fillRect(x + b, y + b, w, h);                      // hard drop shadow
    ctx.fillStyle = '#b6f25b'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#10141c'; ctx.fillRect(x + b, y + b, w - b * 2, h - b * 2);
    ctx.fillStyle = '#ffffff'; ctx.fillText('PRESS E', X, y + h * .5); ctx.restore();
  }

  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!visible) return void (raf = requestAnimationFrame(frame));                        // off-screen: sleep
    update(dt);
    ctx.setTransform(1, 0, 0, 1, 0, 0); drawWater();
    ctx.setTransform(zoom, 0, 0, zoom, vw / 2 - cam.x * zoom, vh / 2 - cam.y * zoom); ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = .3; ctx.drawImage(sh, 5, 9); ctx.globalAlpha = 1; ctx.drawImage(land, 0, 0);
    for (const c of clouds) drawCloud(c, true);
    for (const d of [...spots.map((s) => ({ y: s.y, f: () => drawSpot(s) })), { y: p.y, f: drawPlayer }, { y: cat.y, f: drawCat }, { y: SAGE.y, f: drawSage }].sort((a, b) => a.y - b.y)) d.f();
    for (const q of petals) { ctx.globalAlpha = Math.min(1, q.life); px(q.x, q.y, 4, 3, q.c); } ctx.globalAlpha = 1;
    for (const c of clouds) drawCloud(c, false);
    for (const f of flocks) for (const b of f.birds) drawBird(f.x + b.ox, f.y + b.oy, b.ph);
    // dusk vignette
    ctx.setTransform(1, 0, 0, 1, 0, 0); const g = ctx.createRadialGradient(vw / 2, vh / 2, vh * .35, vw / 2, vh / 2, vh * .95); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(4,10,30,.5)'); ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
    drawLabel(); drawBubble(); raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return {
    press: (d, on) => (on ? keys.add(d) : keys.delete(d)),
    interact: () => talk(),
    setPaused: (v) => { paused = v; if (v) keys.clear(); },
    setPos: (x, y) => { p.x = x; p.y = y; },
    nearId: () => near?.id || null,
    pos: () => ({ x: p.x, y: p.y }),
    catPos: () => ({ x: cat.x, y: cat.y, mv: cat.mv, row: cat.row }),
    goTo: (id) => { const s = spots.find((q) => q.id === id); if (s) { p.x = s.x; p.y = s.y + 28; } },
    reset: () => { p.x = SPAWN.x; p.y = SPAWN.y; cat.x = p.x - 40; cat.y = p.y + 14; target = null; },
    destroy: () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); canvas.removeEventListener('pointerdown', click); removeEventListener('keydown', kd); removeEventListener('keyup', ku); },
  };
}

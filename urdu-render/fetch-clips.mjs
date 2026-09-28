// Fetch RELATED stock clips per narration phrase: Pexels first (HD), Pixabay fallback.
// Licenses: Pexels/Pixabay are free for commercial use, no attribution required.
//   node fetch-clips.mjs --script episodes/salt.json   → clips/<slug>/p01.mp4 ...
//   node fetch-clips.mjs                               → legacy tea-demo pool
// Writes CREDITS.txt beside the clips.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

// .env convenience (repo root or local dir; .env is gitignored — never commit keys)
for (const f of [path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env'), path.join(process.cwd(), '.env')]) {
  try {
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  } catch (e) { /* file missing — try next */ }
}

const PEXELS_KEY = (process.env.PEXELS_KEY || '').trim();
const PIXABAY_KEY = (process.env.PIXABAY_KEY || '').trim();
if (!PEXELS_KEY || !PIXABAY_KEY) {
  console.error('Missing PEXELS_KEY / PIXABAY_KEY (set in repo-root .env or env vars).');
  process.exit(1);
}

// legacy tea-demo pool (no-arg mode)
const QUERIES = {
  1: 'chinese tea ceremony teapot', 2: 'tea leaves closeup green', 3: 'pouring tea cup steam',
  4: 'antique world map vintage', 5: 'camel caravan desert', 6: 'sailing ship ocean waves',
  7: 'old harbour ship vintage', 8: 'tea plantation workers picking', 9: 'tea cup steam hot drink',
  10: 'people drinking tea cafe', 11: 'tea garden plantation rows hills', 12: 'chai tea cup indian',
  13: 'stormy ocean dark clouds', 14: 'dark ocean waves night', 15: 'green leaves rainforest dark',
  16: 'tea leaves macro dark', 17: 'tea mountains china mist', 18: 'tea leaves processing',
  19: 'cargo ship port containers', 20: 'ship storm waves',
};

const scriptArgIdx = process.argv.indexOf('--script');
let JOBS, creditsFile;
if (scriptArgIdx !== -1 && process.argv[scriptArgIdx + 1]) {
  const sp = process.argv[scriptArgIdx + 1];
  const ep = JSON.parse(fs.readFileSync(path.resolve(sp), 'utf8'));
  const slug = ep.slug || path.basename(sp, '.json');
  const outDir = path.join('public', 'clips', slug);
  fs.mkdirSync(outDir, { recursive: true });
  if (!ep.phrases.every(p => p.q)) { console.error('FAIL: every phrase needs a "q" clip query'); process.exit(1); }
  JOBS = ep.phrases.map((p, i) => ({ idx: i + 1, query: p.q, file: path.join(outDir, 'p' + String(i + 1).padStart(2, '0') + '.mp4') }));
  creditsFile = path.join(outDir, 'CREDITS.txt');
} else {
  JOBS = Object.entries(QUERIES).map(([idx, query]) => ({ idx: +idx, query, file: `public/clips/p${String(idx).padStart(2, '0')}.mp4` }));
  creditsFile = 'public/clips/CREDITS.txt';
}
const existing = fs.existsSync(creditsFile) ? fs.readFileSync(creditsFile, 'utf8').split('\n').filter(l => l.trim() && !/^p\d+/.test(l)) : [];

async function pexels(query) {
  const r = await fetch('https://api.pexels.com/videos/search?query=' + encodeURIComponent(query) + '&per_page=10&orientation=landscape',
    { headers: { Authorization: PEXELS_KEY }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error('pexels HTTP ' + r.status);
  const j = await r.json();
  const out = [];
  for (const v of j.videos || []) {
    // smallest file ≥1080w — 1080p keeps CI downloads + Remotion frame extraction fast
    const files = (v.video_files || []).filter(f => f.file_type === 'video/mp4' && f.width >= 1080).sort((a, b) => a.width - b.width);
    if (files.length) out.push({ url: files[0].link, w: files[0].width, h: files[0].height, dur: v.duration, by: v.user?.name });
  }
  return out;
}
async function pixabay(query) {
  const r = await fetch('https://pixabay.com/api/videos/?key=' + PIXABAY_KEY + '&q=' + encodeURIComponent(query) + '&video_type=film&per_page=10',
    { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error('pixabay HTTP ' + r.status);
  const j = await r.json();
  const out = [];
  for (const v of j.hits || []) {
    const f = v.videos?.large || v.videos?.medium;
    if (f?.url) out.push({ url: f.url, w: f.width, h: f.height, dur: v.duration, by: v.user });
  }
  return out;
}

for (const { idx, query, file } of JOBS) {
  if (fs.existsSync(file) && fs.statSync(file).size > 300000) { console.log('keep', file); continue; }
  let done = false;
  for (const src of [pexels, pixabay]) {
    if (done) break;
    try {
      const cands = await src(query);
      for (const c of cands) {
        if (c.dur && c.dur < 4) continue;
        try {
          const d = await fetch(c.url, { signal: AbortSignal.timeout(120000) });
          if (!d.ok) continue;
          const buf = Buffer.from(await d.arrayBuffer());
          if (buf.length < 400000) continue;
          fs.writeFileSync(file, buf);
          existing.push(`p${String(idx).padStart(2, '0')}.mp4 — "${query}" via ${src === pexels ? 'Pexels' : 'Pixabay'} — creator: ${c.by || 'unknown'} — ${c.w}x${c.h}`);
          console.log('OK', file, '<-', query, `[${src === pexels ? 'Pexels' : 'Pixabay'} ${c.w}x${c.h} ${c.dur}s]`, Math.round(buf.length / 1048576) + 'MB');
          done = true; break;
        } catch { continue; }
      }
    } catch (e) { console.log('ERR', file, src.name, String(e).slice(0, 70)); }
  }
  if (!done) console.log('MISS', file, '(' + query + ') — build will fall back to a still');
  await new Promise(res => setTimeout(res, 900));
}
fs.writeFileSync(creditsFile, existing.join('\n') + '\n');
console.log('done');

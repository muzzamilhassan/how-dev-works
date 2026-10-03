// Build a documentary episode from a script JSON — self-contained (no quarry-render).
//   node build-episode.mjs --script episodes/salt.json [--voice ur-PK-AsadNeural] [--out out.mp4]
// Script schema (see episodes/salt.json):
//   slug, voice?, rate?, titleCard? {clip, headline, era}, endCard? {headline, era},
//   phrases: [{ text, q (clip search), headline?, era?, zoom? (+1/-1) }]
// Pipeline: TTS (python tts.py, edge-tts) → clips (fetch-clips.mjs --script, Pexels/Pixabay)
//           → props.json → `npx remotion render DocShort` (concurrency 1 — parallel
//           OffthreadVideo extraction races to black frames).
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(HERE, 'public');
const argVal = (name, def) => {
  const i = process.argv.indexOf('--' + name);
  return (i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) ? process.argv[i + 1] : def;
};
const log = (m) => console.log('[episode] ' + m);

const scriptPath = argVal('script');
if (!scriptPath || !fs.existsSync(scriptPath)) { console.error('FAIL: --script <file> required'); process.exit(1); }
const S = JSON.parse(fs.readFileSync(path.resolve(scriptPath), 'utf8'));
const slug = S.slug || path.basename(scriptPath, '.json');
const VOICE = argVal('voice', '') || S.voice || 'ur-PK-AsadNeural';
const RATE = S.rate || '-2%';
const OUT = path.resolve(argVal('out', path.join(HERE, '..', 'out', 'urdu-episodes', slug + '.mp4')));

// ---------------- TTS ----------------
const work = path.join(PUB, 'audio-' + slug);
fs.mkdirSync(work, { recursive: true });
fs.writeFileSync(path.join(work, 'tts-input.json'), JSON.stringify(S.phrases.map((p, i) => ({ i: i + 1, text: p.text }))));
log('TTS: ' + VOICE + ', rate ' + RATE + ', ' + S.phrases.length + ' phrases');
const py = spawnSync('python', [path.join(HERE, 'tts.py'), work], { stdio: 'inherit' });
if (py.status !== 0) { console.error('FAIL: TTS'); process.exit(1); }
const durs = JSON.parse(fs.readFileSync(path.join(work, 'tts-durations.json'), 'utf8'));
const byI = new Map(durs.map(d => [d.i, d]));

// ---------------- clips ----------------
const missing = [];
S.phrases.forEach((p, i) => {
  const f = path.join(PUB, 'clips', slug, 'p' + String(i + 1).padStart(2, '0') + '.mp4');
  if (!fs.existsSync(f) || fs.statSync(f).size < 300000) missing.push(i + 1);
});
if (missing.length) { console.error('FAIL: missing clips for phrases ' + missing.join(',') + ' — run fetch-clips.mjs --script ' + scriptPath); process.exit(1); }

// ---------------- scenes (cold open FIRST — no title card before the hook) ----------------
// Long narration phrases become sequential caption chunks (≤ ~72 chars each, timed by
// word boundaries) so nothing renders as a 3-4 line subtitle wall.
const chunkCaptions = (text, ms, words) => {
  if (!words || words.length < 3) return [{ text, t0: 0, t1: ms + 300 }];
  const chunks = [];
  let line = [], lineStart = 0;
  for (let i = 0; i < words.length; i++) {
    line.push(words[i].w);
    const len = line.join(' ').length;
    const nextW = words[i + 1] ? words[i + 1].w.length + 1 : 0;
    if (len + nextW > 72 || i === words.length - 1) {
      const end = words[i].s + words[i].d;
      chunks.push({ text: line.join(' '), t0: lineStart, t1: end });
      line = []; lineStart = end;
    }
  }
  if (chunks.length) chunks[chunks.length - 1].t1 = ms + 300;
  return chunks;
};

const scenes = [];
let cur = 0;
const push = (s) => { scenes.push({ ...s, start: Math.round(cur * 100) / 100 }); cur += s.dur; };
S.phrases.forEach((p, i) => {
  const ms = byI.get(i + 1)?.ms || 4200;
  const dur = Math.max(ms / 1000 + 0.7, 2.4);
  push({
    video: 'clips/' + slug + '/p' + String(i + 1).padStart(2, '0') + '.mp4',
    headline: p.headline || '', era: p.era || '',
    dur: Math.round(dur * 100) / 100,
    audio: 'audio-' + slug + '/beat-' + String(i + 1).padStart(2, '0') + '.mp3',
    captions: chunkCaptions(p.text, ms, byI.get(i + 1)?.words),
    zoomDir: p.zoom || (i % 2 === 0 ? 1 : -1),
  });
  if (i + 1 === (S.hookLines || 2) && S.titleCard) {   // title sting lands AFTER the hook
    push({ video: S.titleCard.clip || 'clips/' + slug + '/p01.mp4', headline: S.titleCard.headline, era: S.titleCard.era || '', dur: 2.6, audio: null, captions: [], zoomDir: -1 });
  }
});
if (S.endCard) push({ video: scenes[scenes.length - 1].video, headline: S.endCard.headline, era: S.endCard.era || '', dur: 3.2, audio: null, captions: [], zoomDir: -1 });
const totalS = Math.round((cur + 0.4) * 100) / 100;
log('timeline: ' + scenes.length + ' scenes, ' + totalS + 's, avg cut ' + Math.round(totalS / scenes.length * 10) / 10 + 's');

// ---------------- props + render ----------------
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(path.join(PUB, 'props-' + slug + '.json'), JSON.stringify({
  scenes, totalMs: totalS * 1000, fps: 30, music: 'audio/music.mp3',
}, null, 2));
const spawnOpts = { stdio: 'inherit', shell: process.platform === 'win32', cwd: HERE };
const propsFile = path.join(PUB, 'props-' + slug + '.json');
const ensure = spawnSync('npx', ['remotion', 'browser', 'ensure'], spawnOpts);
if (ensure.status !== 0) { console.error('FAIL: browser ensure'); process.exit(1); }
// Master = DocWide, LANDSCAPE 1920x1080 (long documentaries are 16:9 — user
// decision 2026-10-03; vertical episodes read as Reels/Shorts on YouTube).
const r = spawnSync('npx', ['remotion', 'render', 'remotion/index.ts', 'DocWide', OUT,
  `--props=${propsFile}`, '--concurrency=1', '--timeout=240000', '--port=3495', '--crf=21'], spawnOpts);
if (r.status !== 0) { console.error('FAIL: render'); process.exit(1); }
// Promo Shorts stay VERTICAL 9:16 for the Shorts feed — a landscape master
// can't be ffmpeg-cut into 9:16, so re-render each short natively from the
// same timeline via the DocShort composition (--frames keeps absolute audio).
const FPS = 30;
for (const [n, sh] of (S.shorts || []).entries()) {
  const out = path.resolve(HERE, '..', 'out', 'urdu-episodes', `${slug}-short-${String(n + 1).padStart(2, '0')}.mp4`);
  const a = Math.round(sh.start * FPS), b = Math.round(sh.end * FPS);
  log(`short ${n + 1}: native vertical render frames ${a}-${b} (${sh.end - sh.start}s)`);
  const rs = spawnSync('npx', ['remotion', 'render', 'remotion/index.ts', 'DocShort', out,
    `--props=${propsFile}`, `--frames=${a}-${b}`, '--concurrency=1', '--timeout=240000', '--port=3495', '--crf=21'], spawnOpts);
  if (rs.status !== 0) { console.error('FAIL: short render ' + (n + 1)); process.exit(1); }
}
log('DONE: ' + OUT + ' (' + (fs.statSync(OUT).size / 1048576).toFixed(1) + ' MB, ' + totalS + 's, voice ' + VOICE + ')');

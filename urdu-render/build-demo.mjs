// Build the Urdu documentary demo v4 — BREATH-LEVEL editing:
// narration is split into breath phrases (3-6s); every phrase gets its own RELATED
// stock clip (Pexels/Pixabay, fetched by fetch-clips.mjs) + the phrase as a subtitle.
// Headlines/era chips are ENGLISH in Archivo Black; subtitles are Urdu (Naskh).
//   node build-demo.mjs        (DOC_VOICE to switch narrator)
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const QR = process.env.QR_DIR || path.join(ROOT, '..', 'quarry-render');
const PUB = path.join(HERE, 'public');
const OUT = path.join(ROOT, 'out', 'urdu-doc-demo');
const WINGET_FF = 'C:/Users/Revnix/AppData/Local/Microsoft/WinGet/Packages/yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-N-125875-g5d4d3bdc61-win64-gpl/bin';
const VOICE = process.env.DOC_VOICE || 'ur-PK-UzmaNeural';
const RATE = process.env.DOC_RATE || '-2%';
const log = (m) => console.log('[doc-demo] ' + m);
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opts });
const runTTS = (beats, dir, voice, rate) => {
  fs.mkdirSync(path.join(dir, 'audio'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'tts-input.json'), JSON.stringify(beats));
  const env = { ...process.env, EXPLAINER_VOICE: voice, EXPLAINER_RATE: rate, EXPLAINER_FFMPEG: ffdir ? path.join(ffdir, 'ffmpeg.exe') : 'ffmpeg', EXPLAINER_FFPROBE: ffdir ? path.join(ffdir, 'ffprobe.exe') : 'ffprobe' };
  const t = sh('python', [path.join(QR, 'explainer', 'edge_batch.py'), path.join(dir, 'tts-input.json')], { stdio: 'inherit', env });
  if (t.status !== 0) throw new Error('TTS failed');
  return JSON.parse(fs.readFileSync(path.join(dir, 'tts-durations.json'), 'utf8'));
};
const ffdir = fs.existsSync(WINGET_FF) ? WINGET_FF : '';

// ---------------- script: one SENTENCE per clip (Pexels, related) ----------------
const P = [
  { text: 'چین میں کہا جاتا ہے کہ شہنشاہ شن نونگ کے ابلتے پانی میں چائے کے پتے گر گئے اور ایک خوشگوار خوشبو پھیل گئی۔', clip: 'clips/s01-china-ceremony.mp4', fb: 'images/hd-china-tea.jpg', headline: 'A LEAF, A LEGEND', era: '800 AD — CHINA', zoom: 1 },
  { text: 'یوں پانی کے بعد دنیا کا سب سے مقبول مشروب وجود میں آیا، جس نے آنے والی صدیوں میں سلطنتوں کی قسمت بدل دی۔', clip: 'clips/s02-steam-cup.mp4', fb: 'images/07-chai-cup.jpg', headline: 'THE DRINK THAT BUILT EMPIRES', zoom: -1 },
  { text: 'چائے چین کے پہاڑوں سے ریشم راستے ہوتی ہوئی تبت اور منگولیا پہنچی۔', clip: 'clips/s03-caravan.mp4', fb: 'images/03-silk-road.jpg', headline: 'THE JOURNEY', era: 'THE SILK ROAD', zoom: 1 },
  { text: 'سترھویں صدی میں یورپی تجارتی جہازوں نے اسے یورپ پہنچایا۔', clip: 'clips/s04-sailing-ship.mp4', fb: 'images/04-clipper.jpg', zoom: -1 },
  { text: 'برطانوی ایسٹ انڈیا کمپنی نے اسے اپنی کرنسی بنا لیا اور برصغیر میں چائے کے باغات لگا کر دنیا کی سب سے بڑی چائے انڈسٹری کھڑی کر دی۔', clip: 'clips/s05-plantation-aerial.mp4', fb: 'images/hd-plantation.jpg', zoom: 1 },
  { text: 'آج پانی کے بعد سب سے زیادہ پینے والی چیز چائے ہے۔ روزانہ دنیا بھر میں اربوں کپ چائے پیا جاتا ہے۔', clip: 'clips/s06-pouring-tea.mp4', fb: 'images/06-plantation.jpg', headline: "THE WORLD'S #1 DRINK", era: 'TODAY', zoom: -1 },
  { text: 'چین اور بھارت سب سے بڑے پیداکار ہیں، جبکہ پاکستانی فی کس استعمال میں دنیا میں سرفہرست ہیں اور اربوں ڈالر کی چائے ہر سال درآمد کرتے ہیں۔', clip: 'clips/s08-garden-rows.mp4', fb: 'images/10-tea-garden.jpg', zoom: 1 },
  { text: 'چین نے جب برطانوی افیون قبول کرنے سے انکار کیا تو چائے کی منڈی پر قبضے کے لیے جنگ چھڑ گئی۔', clip: 'clips/s10-stormy-sea.mp4', fb: 'images/05-opium-war.jpg', headline: 'THE WAR FOR TEA', era: '1839 — OPIUM WARS', zoom: -1 },
  { text: 'ایسٹ انڈیا کمپنی نے چین میں افیون سمگل کی اور افیون کی جنگیں چھڑ گئیں۔', clip: 'clips/s07-drinking-tea.mp4', fb: 'images/04-clipper.jpg', zoom: 1 },
  { text: 'رابرٹ فورچن جیسے جاسوس چائے کے پودے چرا کر لے گئے۔', clip: 'clips/s11-leaves-macro.mp4', fb: 'images/09-botanical.jpg', zoom: -1 },
  { text: 'ایک پتے کے لیے جاسوسی، جنگ اور غلامی، سب کچھ ہوا۔', clip: 'clips/s09-chai.mp4', fb: 'images/01-tea-leaves.jpg', headline: 'THE PRICE OF A LEAF', zoom: 1 },
];

// ---------------- TTS per phrase ----------------
log('TTS: ' + VOICE + ', rate ' + RATE + ', ' + P.length + ' breath phrases');
const beats = P.map((s, i) => ({ i: i + 1, text: s.text }));
const durs = runTTS(beats, path.join(PUB, 'audio'), VOICE, RATE);
const byI = new Map(durs.map(d => [d.i, d]));

// ---------------- scenes ----------------
const titleDur = 3.2, endDur = 4.4;
const scenes = [{ video: 'clips/tea-3.mp4', headline: 'THE HISTORY OF TEA', era: 'A DOCUMENTARY FILM', start: 0, dur: titleDur, audio: null, captions: [], zoomDir: 1 }];
let cur = titleDur;
P.forEach((s, idx) => {
  const ms = byI.get(idx + 1)?.ms || 4200;
  const dur = Math.max(ms / 1000 + 0.7, 2.4);   // breath-length cuts: 3-6s typically
  const hasClip = s.clip && fs.existsSync(path.join(PUB, s.clip)) && fs.statSync(path.join(PUB, s.clip)).size > 300000;
  if (!hasClip) log('no clip for phrase ' + (idx + 1) + ' — using still fallback');
  scenes.push({
    video: hasClip ? s.clip : null, image: hasClip ? null : s.fb,
    headline: s.headline, era: s.era,
    start: Math.round(cur * 100) / 100, dur: Math.round(dur * 100) / 100,
    audio: `audio/audio/beat-${String(idx + 1).padStart(2, '0')}.mp3`,
    captions: [{ text: s.text, t0: 0, t1: ms + 300 }],
    zoomDir: s.zoom,
  });
  cur += dur;
});
scenes.push({ headline: 'NOW YOU KNOW', era: 'FOLLOW FOR MORE', start: Math.round(cur * 100) / 100, dur: endDur, audio: null, captions: [], zoomDir: -1 });
const totalS = Math.round((cur + endDur + 0.4) * 100) / 100;
log('timeline: ' + scenes.length + ' scenes, ' + totalS + 's total, avg cut ' + Math.round(totalS / scenes.length * 10) / 10 + 's');

// ---------------- music ----------------
let music = null;
try {
  const ALL = JSON.parse(fs.readFileSync(path.join(QR, 'longvideo', 'approved-music.json'), 'utf8'));
  const pool = ALL.filter(m => ['Deliberate Thought', 'Cut Trance'].includes(m.title));
  const mod = await import(pathToFileURL(path.join(QR, 'music-engine.mjs')).href);
  const track = await mod.pickApprovedTrack((pool.length ? pool : ALL).map(m => m.title));
  if (track) { fs.copyFileSync(track.file, path.join(PUB, 'audio', 'music.mp3')); music = 'audio/music.mp3'; log('music: "' + track.title + '"'); }
} catch (e) { log('music skipped: ' + String(e.message || e).slice(0, 80)); }

// ---------------- props + render ----------------
fs.writeFileSync(path.join(PUB, 'props.json'), JSON.stringify({ scenes, totalMs: totalS * 1000, fps: 30, music }, null, 2));
log('props written');
const spawnOpts = { stdio: 'inherit', shell: process.platform === 'win32', cwd: HERE };
const ensure = sh('npx', ['remotion', 'browser', 'ensure'], spawnOpts);
if (ensure.status !== 0) { console.error('browser ensure failed'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });
const outMp4 = path.join(OUT, 'urdu-doc-demo.mp4');
// concurrency MUST stay 1: parallel OffthreadVideo extraction races to black frames
const args = ['remotion', 'render', 'remotion/index.ts', 'DocShort', outMp4, `--props=${path.join(PUB, 'props.json')}`, `--concurrency=1`, '--timeout=240000', '--port=3494', '--crf=21'];
let r = sh('npx', args, spawnOpts);
if (r.status !== 0) { console.error('render failed'); process.exit(1); }
log('DONE: ' + outMp4 + ' (' + (fs.statSync(outMp4).size / 1048576).toFixed(1) + ' MB, ' + totalS + 's, voice ' + VOICE + ')');

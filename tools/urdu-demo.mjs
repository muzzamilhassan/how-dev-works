// LOCAL DEMO — Urdu documentary short, rendered with the quarry-render engine's own
// parts (edge-tts + approved music + Remotion TechVideo composition) driven from here.
// Nothing in quarry-render is modified; nothing is pushed anywhere.
//   node tools/urdu-demo.mjs
// Output: out/urdu-demo/urdu-tea-demo.mp4
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');   // repo root (tools/..)
const QR = process.env.QR_DIR || path.join(ROOT, '..', 'quarry-render');
const EXPL = path.join(QR, 'explainer');
const PUB = path.join(EXPL, 'public');
const WORK = path.join(ROOT, 'out', 'urdu-demo');
const WINGET_FF = 'C:/Users/Revnix/AppData/Local/Microsoft/WinGet/Packages/yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-N-125875-g5d4d3bdc61-win64-gpl/bin';
const log = (m) => console.log('[urdu-demo] ' + m);
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opts });

if (!fs.existsSync(path.join(QR, 'explainer', 'package.json'))) {
  console.error('quarry-render not found at ' + QR + ' (set QR_DIR)'); process.exit(1);
}

// ---------------- the Urdu documentary script (hand-written) ----------------
const SCENES = [
  { t: 'title', headline: 'چائے کی تاریخ', sub: 'ایک پتہ جس نے دنیا بدل دی', text: '' },
  {
    t: 'statement', label: '800 عیسوی — چین', headline: 'ایک پتہ، ایک افسانہ', sub: 'ہزاروں سال پرانا مشروب',
    text: 'چین میں کہا جاتا ہے کہ شہنشاہ شن نونگ کے ابلتے پانی میں چائے کے پتے گر گئے اور ایک خوشگوار خوشبو پھیل گئی۔ یوں پانی کے بعد دنیا کا سب سے مقبول مشروب وجود میں آیا، جس نے آنے والی صدیوں میں سلطنتوں کی قسمت بدل دی۔'
  },
  {
    t: 'steps', label: 'چائے کا سفر',
    items: ['چین — پیدائش', 'ریشم راستہ — تبت و منگولیا', 'یورپ — تجارتی جہاز', 'برصغیر — چائے کے باغات'],
    text: 'چائے چین کے پہاڑوں سے ریشم راستے ہوتی ہوئی تبت اور منگولیا پہنچی۔ سترھویں صدی میں یورپی تجارتی جہازوں نے اسے یورپ پہنچایا۔ برطانوی ایسٹ انڈیا کمپنی نے اسے اپنی کرنسی بنا لیا اور برصغیر میں چائے کے باغات لگا کر دنیا کی سب سے بڑی چائے انڈسٹری کھڑی کر دی۔'
  },
  {
    t: 'bars', label: 'آج کی چائے',
    bars: [
      { label: 'چین', text: 'سب سے بڑا پیداکار', v: 10 },
      { label: 'بھارت', text: 'دوسرا نمبر', v: 8 },
      { label: 'پاکستان', text: 'فی کس صارف', v: 9 },
      { label: 'برطانیہ', text: 'چائے کی ثقافت', v: 5 }
    ],
    caption: 'پانی کے بعد دنیا کا نمبر 1 مشروب',
    text: 'آج پانی کے بعد سب سے زیادہ پینے والی چیز چائے ہے۔ روزانہ دنیا بھر میں اربوں کپ چائے پیا جاتا ہے۔ چین اور بھارت سب سے بڑے پیداکار ہیں، جبکہ پاکستانی فی کس استعمال میں دنیا میں سرفہرست ہیں اور اربوں ڈالر کی چائے ہر سال درآمد کرتے ہیں۔'
  },
  {
    t: 'clash', label: 'چائے کے لیے جنگ', a: 'ایسٹ انڈیا کمپنی', b: 'چنگ خاندان', value: 1839, warn: 'افیون کی جنگیں',
    text: 'چین نے جب برطانوی افیون قبول کرنے سے انکار کیا تو چائے کی منڈی پر قبضے کے لیے جنگ چھڑ گئی۔ ایسٹ انڈیا کمپنی نے چین میں افیون سمگل کی اور افیون کی جنگیں چھڑ گئیں۔ رابرٹ فورچن جیسے جاسوس چائے کے پودے چرا کر لے گئے۔ ایک پتے کے لیے جاسوسی، جنگ اور غلامی، سب کچھ ہوا۔'
  },
  { t: 'end', headline: 'اب آپ جانتے ہیں۔', sub: 'فالو کریں', text: '' }
];

// ---------------- TTS (engine's own edge_batch.py, Urdu voice) ----------------
const ttsDir = path.join(PUB, 'tech-audio');
fs.mkdirSync(path.join(ttsDir, 'audio'), { recursive: true });
for (const f of fs.readdirSync(ttsDir)) if (f.startsWith('beat-') || f === 'tts-input.json' || f === 'tts-durations.json') fs.rmSync(path.join(ttsDir, f), { force: true });
const spoken = SCENES.map((s, i) => ({ i, text: s.text || '' })).filter(s => s.text.trim());
fs.writeFileSync(path.join(ttsDir, 'tts-input.json'), JSON.stringify(spoken));
log('TTS: ' + spoken.length + ' beats, voice ur-PK-AsadNeural');
const ffdir = fs.existsSync(WINGET_FF) ? WINGET_FF : '';
const tts = sh('python', [path.join(EXPL, 'edge_batch.py'), path.join(ttsDir, 'tts-input.json')], {
  stdio: 'inherit',
  env: { ...process.env, EXPLAINER_VOICE: 'ur-PK-AsadNeural', EXPLAINER_RATE: '+0%', EXPLAINER_FFMPEG: ffdir ? path.join(ffdir, 'ffmpeg.exe') : 'ffmpeg', EXPLAINER_FFPROBE: ffdir ? path.join(ffdir, 'ffprobe.exe') : 'ffprobe' }
});
if (tts.status !== 0) { console.error('TTS failed'); process.exit(1); }
const durs = JSON.parse(fs.readFileSync(path.join(ttsDir, 'tts-durations.json'), 'utf8'));
const byI = new Map(durs.map(d => [d.i, d]));

// ---------------- timing (same rules as make-tech-video) ----------------
const starts = [], dursArr = [];
let cur = 0;
SCENES.forEach((s, i) => {
  const narr = byI.get(i)?.ms || 0;
  const dur = s.t === 'title' ? 2.8 : s.t === 'end' ? 4.0 : Math.max(narr / 1000 + 1.4, 4.5);
  starts.push(Math.round(cur * 100) / 100);
  dursArr.push(Math.round(dur * 100) / 100);
  cur += dur;
});
const totalS = Math.round((cur + 0.6) * 100) / 100;
log('timeline: ' + SCENES.length + ' scenes, ' + totalS + 's');

// ---------------- music (engine's approved calm-tech pool) ----------------
let music = null;
try {
  const { pickApprovedTrack } = await import(pathToFileURL(path.join(QR, 'music-engine.mjs')).href);
  const ALL = JSON.parse(fs.readFileSync(path.join(QR, 'longvideo', 'approved-music.json'), 'utf8'));
  const pool = ALL.filter(m => ['Deliberate Thought', 'Cut Trance'].includes(m.title));
  const track = await pickApprovedTrack((pool.length ? pool : ALL).map(m => m.title));
  if (track) { fs.copyFileSync(track.file, path.join(ttsDir, 'music.mp3')); music = 'tech-audio/music.mp3'; log('music: "' + track.title + '"'); }
} catch (e) { log('music skipped: ' + String(e.message || e).slice(0, 80)); }

// ---------------- props ----------------
const buildWords = (ws) => (ws || []).map(w => ({ w: w.w, t0: Math.round(w.s * 1000), t1: Math.round((w.s + w.d) * 1000) }));
const props = {
  scenes: SCENES, starts, durs: dursArr, fps: 30,
  sceneWords: SCENES.map((s, i) => buildWords(byI.get(i)?.words)),
  sceneAudio: SCENES.map((s, i) => (s.text || '').trim() && fs.existsSync(path.join(ttsDir, 'audio', `beat-${String(i).padStart(2, '0')}.mp3`)) ? `tech-audio/audio/beat-${String(i).padStart(2, '0')}.mp3` : null),
  music
};
const propsPath = path.join(PUB, 'tech-video-urdu-demo.json');
fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));
log('props written');

// ---------------- render ----------------
const spawnOpts = { stdio: 'inherit', shell: process.platform === 'win32', cwd: EXPL };
const ensure = sh('npx', ['remotion', 'browser', 'ensure'], spawnOpts);
if (ensure.status !== 0) { console.error('browser ensure failed'); process.exit(1); }
fs.mkdirSync(WORK, { recursive: true });
const outMp4 = path.join(WORK, 'urdu-tea-demo.mp4');
const args = (c) => ['remotion', 'render', 'remotion/index.ts', 'TechVideo', outMp4, `--props=${propsPath}`, `--concurrency=${c}`, '--timeout=240000', '--port=3493'];
let r = sh('npx', args(3), spawnOpts);
if (r.status !== 0) r = sh('npx', args(2), spawnOpts);
if (r.status !== 0) { console.error('render failed'); process.exit(1); }
log('DONE: ' + outMp4 + ' (' + (fs.statSync(outMp4).size / 1048576).toFixed(1) + ' MB, ' + totalS + 's)');

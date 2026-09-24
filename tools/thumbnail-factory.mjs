// How Dev Works — thumbnail factory (photo-poster system).
// Renders 1280x720 thumbnails from real CC0 photos + crisp poster typography
// (flat colors only; the one shadow is a hard zero-blur offset, per brand law).
// Skins: tech (dark + cyan, full-bleed photo) and urdu (sepia + oxblood, framed photo + Nastaliq).
// Photos: assets/thumb-photos (CC0/public-domain ONLY — never publisher images, never daily.dev).
// Fonts:  assets/fonts (OFL). No network access at render time.
//
// Usage:
//   node tools/thumbnail-factory.mjs --title "How HTTPS Actually Works" --out branding/t.png
//   node tools/thumbnail-factory.mjs --niche urdu --title "..." --eng "HISTORY OF" --word "SALT" \
//        --hook "وہ سفید دانہ جو سونے سے بھی قیمتی تھا" --out urdu-render/t.png
// Auto mode derives headline/accent/chip/background from the title; every piece is overrideable
// (--line1 --accent --line2 --sub --chip --eyebrow --bg --size).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const FONTS = path.join(ROOT, 'assets', 'fonts');
const PHOTOS = path.join(ROOT, 'assets', 'thumb-photos');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return (v === undefined || v.startsWith('--')) ? true : v;
}
const TITLE = String(arg('title', 'How Dev Works'));
const NICHE = String(arg('niche', 'tech')).toLowerCase();
const OUT = String(arg('out', 'branding/thumbnail-out.png'));
const BG = arg('bg', '') ? String(arg('bg')) : null;

// ---------- copy derivation (auto mode) ----------
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

function pickPhoto(pool, seed) {
  const avail = pool.filter(f => fs.existsSync(path.join(PHOTOS, f)));
  if (!avail.length) return null;
  return avail[hash(seed) % avail.length];
}

function deriveTech(title) {
  // punch line = part of the topic before any "|" / "—" / " - " descriptor tail
  const main = (String(title).split(/\s*[|—]\s*|\s+-\s+/)[0] || title).trim();
  const words = main.toUpperCase().split(/\s+/).filter(Boolean);
  // accent: an acronym/digit token as written in the original title (HTTPS, V8, DNS),
  // else a high-voltage keyword, else the last word
  const orig = main.split(/\s+/);
  let idx = orig.findIndex(w => { const c = w.replace(/[^A-Za-z0-9]/g, ''); return c.length >= 2 && c === c.toUpperCase() && /[A-Z0-9]/.test(c); });
  if (idx < 0) idx = words.findIndex(w => ['ACTUALLY', 'REALLY', 'SLOW', 'FAST'].includes(w));
  if (idx < 0) idx = words.length - 1;
  // wrap into <=3 lines that fit 800px at the largest size that works (Anton ~0.5em/char)
  const maxW = 800, lines = [];
  let size = 132;
  for (; size >= 72; size -= 6) {
    const perLine = Math.floor(maxW / (0.5 * size));
    const wl = [];
    let cur = '';
    for (const w of words) {
      const cand = cur ? cur + ' ' + w : w;
      if (cand.length <= perLine) cur = cand;
      else { if (cur) wl.push(cur); cur = w; }
    }
    if (cur) wl.push(cur);
    if (wl.length <= 3 && wl.every(l => l.length <= perLine)) { lines.push(...wl); break; }
    lines.length = 0;
  }
  if (!lines.length) { lines.push(words.join(' ').slice(0, 22)); }
  const chip =
    /database|sql|query|index|postgres|mysql/i.test(title) ? 'DATABASES' :
    /javascript|js\b|v8|node|typescript|promise|event loop/i.test(title) ? 'JAVASCRIPT' :
    /docker|kubernetes|container|devops|deploy|ci\/cd/i.test(title) ? 'DEVOPS' :
    /https|tls|ssl|encrypt|security|auth/i.test(title) ? 'SECURITY' :
    /memory|garbage|ram|heap/i.test(title) ? 'MEMORY' :
    /dns|http|network|tcp|url|udp/i.test(title) ? 'NETWORKING' : 'HOW DEV WORKS';
  return { lines, accentIdx: Math.min(idx, lines.reduce((n, l) => n + l.split(' ').length, 0) - 1), chip };
}

// ---------- shared template ----------
const F = (n) => `url('file:///${FONTS.split(path.sep).join('/')}/${n}')`;
const FONT_CSS = `
@font-face { font-family:'Anton'; src:${F('anton.woff2')} format('woff2'); }
@font-face { font-family:'Bebas'; src:${F('bebas.woff2')} format('woff2'); }
@font-face { font-family:'InterB'; src:${F('inter-black.woff2')} format('woff2'); font-weight:900; }
@font-face { font-family:'Nastaliq'; src:${F('nastaliq.woff2')} format('woff2'); }
@font-face { font-family:'Naskh'; src:${F('naskh-bold.woff2')} format('woff2'); }
* { margin:0; padding:0; box-sizing:border-box; }
html,body { width:1280px; height:720px; overflow:hidden; }
.stage { position:relative; width:1280px; height:720px; overflow:hidden; background:#070A10; }
`;

// head-wrapped accent: color the accent word inside the assembled lines
function withAccent(lines, accentIdx) {
  let n = 0;
  return lines.map(l => l.split(' ').map(w => {
    const hit = n === accentIdx; n++;
    return hit ? `<span>${w}</span>` : w;
  }).join(' ')).join('<br>');
}

function techTemplate({ img, chip, eyebrow, linesHtml, size, sub }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${FONT_CSS}
.photo{position:absolute;inset:0;background:url('file:///${img.split(path.sep).join('/')}') center/cover no-repeat;
  filter:contrast(1.07) saturate(1.08) brightness(0.92);}
.shade{position:absolute;inset:0;background:
  linear-gradient(76deg, rgba(6,9,15,0.96) 0%, rgba(6,9,15,0.86) 30%, rgba(6,9,15,0.42) 58%, rgba(6,9,15,0.10) 78%, rgba(6,9,15,0.30) 100%),
  linear-gradient(0deg, rgba(6,9,15,0.88) 0%, rgba(6,9,15,0.25) 30%, rgba(6,9,15,0) 55%),
  linear-gradient(180deg, rgba(6,9,15,0.55) 0%, rgba(6,9,15,0) 22%);}
.glowedge{position:absolute;left:0;top:0;bottom:0;width:10px;background:linear-gradient(180deg,#22D3EE,#0E7490 70%,#164E63);}
.chip{position:absolute;left:72px;top:56px;display:flex;align-items:center;gap:12px;background:rgba(8,14,22,0.82);
  border:1.5px solid rgba(34,211,238,0.4);border-radius:999px;padding:11px 26px;
  font:900 23px InterB;letter-spacing:5px;color:#A5F3FC;}
.chip i{width:12px;height:12px;border-radius:50%;background:#22D3EE;box-shadow:0 0 14px #22D3EE;}
.txt{position:absolute;left:72px;bottom:64px;right:400px;}
.eyebrow{font:900 26px InterB;letter-spacing:7px;color:#7DD3FC;margin-bottom:14px;}
h1{font-family:Anton;font-size:${size}px;line-height:0.98;color:#F7FAFD;letter-spacing:1px;
  text-shadow:6px 6px 0 rgba(4,8,14,0.5);}
h1 span{color:#22D3EE;text-shadow:6px 6px 0 rgba(4,8,14,0.5);}
.sub{margin-top:20px;font:900 31px InterB;color:#D7E2ED;}
.brand{position:absolute;right:56px;bottom:48px;font:900 24px InterB;letter-spacing:5px;color:#8FD9EA;}
</style></head><body><div class="stage">
<div class="photo"></div><div class="shade"></div><div class="glowedge"></div>
<div class="chip"><i></i>${chip}</div>
<div class="txt">
  <div class="eyebrow">${eyebrow}</div>
  <h1>${linesHtml}</h1>
  ${sub ? `<div class="sub">${sub}</div>` : ''}
</div>
<div class="brand">&gt;_ HOWDEVWORKS</div>
</div></body></html>`;
}

// ---------- urdu skin (framed PD photo + Nastaliq hook) ----------
const paperTexture = `
<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
  <filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>
  <feColorMatrix values="0 0 0 0 0.24  0 0 0 0 0.18  0 0 0 0 0.10  0 0 0 0.55 0"/></filter>
  <rect width="1280" height="720" filter="url(#p)"/>
</svg>`;

function urduTemplate({ img, eng, word, hook, wordSize = 148 }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${FONT_CSS}
.stage{background:#E8DCC3;}
.photo{position:absolute;right:70px;top:130px;width:480px;height:460px;object-fit:cover;border:6px solid rgba(63,43,18,0.9);
  outline:3px solid rgba(214,184,126,0.7);outline-offset:-12px;filter:sepia(0.55) saturate(0.8) contrast(1.05) brightness(0.96);
  box-shadow:0 16px 30px rgba(20,10,0,0.5);}
.shade{position:absolute;inset:0;background:linear-gradient(90deg, rgba(46,28,10,0.86) 0%, rgba(46,28,10,0.72) 34%, rgba(46,28,10,0.12) 62%, rgba(46,28,10,0.25) 100%);}
.paper{position:absolute;inset:0;mix-blend-mode:multiply;opacity:0.5;}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at center, transparent 42%, rgba(24,14,3,0.62) 100%);}
.frame{position:absolute;inset:22px;border:5px solid rgba(63,43,18,0.85);outline:2px solid rgba(214,184,126,0.65);outline-offset:-14px;}
.txt{position:absolute;left:76px;top:64px;width:620px;}
.over{font-family:Bebas;color:#F2E3C2;font-size:64px;letter-spacing:10px;text-shadow:3px 3px 0 rgba(20,10,0,0.6);}
.word{font-family:Anton;color:#8E2321;font-size:${wordSize}px;line-height:0.95;letter-spacing:2px;margin-top:2px;
  text-shadow:5px 5px 0 rgba(28,17,3,0.5);}
.orn{display:flex;align-items:center;gap:14px;margin:26px 0 10px;}
.orn .l{height:3px;width:130px;background:#D6B87E;}
.orn .d{width:12px;height:12px;background:#8E2321;transform:rotate(45deg);}
.hook{font-family:Nastaliq;color:#F7ECD4;font-size:52px;line-height:2.35;direction:rtl;text-align:right;width:600px;
  text-shadow:3px 3px 0 rgba(28,17,3,0.55);}
.badge{position:absolute;right:52px;top:44px;background:rgba(38,22,6,0.82);border:2px solid #D6B87E;color:#EFDDBC;
  font-family:Naskh;font-size:30px;padding:8px 22px;border-radius:999px;direction:rtl;}
</style></head><body><div class="stage">
<img class="photo" src="file:///${img.split(path.sep).join('/')}"/>
<div class="shade"></div><div class="paper">${paperTexture}</div><div class="vig"></div><div class="frame"></div>
<div class="txt">
  <div class="over">${eng}</div>
  <div class="word">${word}</div>
  <div class="orn"><div class="l"></div><div class="d"></div><div class="l"></div></div>
  <div class="hook">${hook}</div>
</div>
<div class="badge">اردو دستاویزی سلسلہ</div>
</div></body></html>`;
}

// ---------- build spec ----------
let html;
if (NICHE === 'urdu') {
  const img = BG ? path.join(PHOTOS, BG) : null;
  if (!img || !fs.existsSync(img)) { console.error('FAIL: urdu skin needs an existing --bg <file in assets/thumb-photos>'); process.exit(1); }
  html = urduTemplate({
    img,
    eng: String(arg('eng', 'HISTORY OF')),
    word: String(arg('word', TITLE.split(/[|—]/)[0].trim().toUpperCase().split(/\s+/).slice(-1)[0] || 'HISTORY')),
    hook: String(arg('hook', TITLE)),
    wordSize: parseInt(arg('size', '148'), 10) || 148,
  });
} else {
  const pool = fs.existsSync(PHOTOS) ? fs.readdirSync(PHOTOS).filter(f => f.startsWith('tech-') && /\.jpe?g$/i.test(f)) : [];
  const imgFile = BG ?? pickPhoto(pool, TITLE);
  if (!imgFile) { console.error('FAIL: no photo in assets/thumb-photos (tech-*.jpg)'); process.exit(1); }
  const img = path.join(PHOTOS, imgFile);
  const d = deriveTech(TITLE);
  const line1 = arg('line1'), accent = arg('accent'), line2 = arg('line2');
  let linesHtml, size;
  if (typeof line1 === 'string' && line1) {
    size = parseInt(arg('size', '116'), 10) || 116;
    linesHtml = `${line1} <span>${accent ?? ''}</span>` + (line2 ? `<br>${line2}` : '');
  } else {
    // fold accent word into the derived lines
    const wordsAll = d.lines.join(' ').split(' ');
    const acc = wordsAll[d.accentIdx] ?? wordsAll[wordsAll.length - 1];
    const htmlLines = withAccent(d.lines, d.accentIdx);
    linesHtml = htmlLines;
    // shrink for 3-liners
    size = d.lines.length >= 3 ? 96 : (d.lines.some(l => l.length > 14) ? 108 : 122);
  }
  html = techTemplate({
    img,
    chip: String(arg('chip', d.chip)),
    eyebrow: String(arg('eyebrow', 'HOW DEV WORKS')),
    linesHtml,
    size,
    sub: arg('sub', '') ? String(arg('sub')) : '',
  });
}

// ---------- render ----------
const chromeCandidates = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean).find(p => { try { return fs.existsSync(p); } catch { return false; } });
if (!chromeCandidates) { console.error('FAIL: no Chrome/Edge found (set CHROME_PATH)'); process.exit(1); }

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const absOut = path.resolve(OUT);
const tmp = absOut.replace(/\.png$/, '') + '.html';
fs.writeFileSync(tmp, html);
const browser = await puppeteer.launch({ executablePath: chromeCandidates, headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb', '--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
await page.goto('file:///' + tmp.split(path.sep).join('/'), { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 200));
await page.screenshot({ path: OUT });
await browser.close();
fs.rmSync(tmp, { force: true });
console.log('OK: wrote', OUT, '(' + Math.round(fs.statSync(OUT).size / 1024) + 'KB) — "' + TITLE + '"');

// Sealed Histories — channel branding renderer (English brand, Urdu/Hindi storytelling).
// Renders avatar-800, banner-2560x1440, watermark-150 (transparent) via headless Chrome.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url)))); // repo root
const FONTS = path.join(ROOT, 'assets', 'fonts');
const HERE = path.dirname(fileURLToPath(import.meta.url));

const F = (n) => `url('file:///${FONTS.split(path.sep).join('/')}')`.replace('/fonts', '/' + n).replace('file:///C:/Users/Revnix/Documents/how-dev-works/assets', 'file:///C:/Users/Revnix/Documents/how-dev-works/assets');
const FF = (n) => `url('file:///${(FONTS + path.sep + n).split(path.sep).join('/')}')`;
const FONT_CSS = `
@font-face { font-family:'Anton'; src:${FF('anton.woff2')} format('woff2'); }
@font-face { font-family:'InterB'; src:${FF('inter-black.woff2')} format('woff2'); font-weight:900; }
@font-face { font-family:'Nastaliq'; src:${FF('nastaliq.woff2')} format('woff2'); }
@font-face { font-family:'Deva'; src:${FF('devanagari.woff2')} format('woff2'); }
@font-face { font-family:'Beng'; src:${FF('bengali.woff2')} format('woff2'); }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'InterB', sans-serif; }
`;

const WALNUT = '#2A1A0B', CREAM = '#F2E3C2', BRASS = '#D6B87E', OXBLOOD = '#8E2321', WAXDARK = '#5E1412';

const noise = `
<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="9"/>
  <feColorMatrix values="0 0 0 0 0.85  0 0 0 0 0.74  0 0 0 0 0.52  0 0 0 0.30 0"/></filter>
  <rect width="100%" height="100%" filter="url(#p)"/>
</svg>`;

// red wax seal with embossed H — used at all sizes
function seal(size) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="wax" cx="0.36" cy="0.3" r="0.95">
      <stop offset="0" stop-color="#B03E36"/><stop offset="0.55" stop-color="${OXBLOOD}"/><stop offset="1" stop-color="#4A0F0C"/>
    </radialGradient>
    <filter id="waxEdge" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="3" seed="4" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="14"/>
    </filter>
  </defs>
  <g filter="url(#waxEdge)">
    <circle cx="100" cy="100" r="88" fill="url(#wax)"/>
    <circle cx="100" cy="100" r="88" fill="none" stroke="#3A0C09" stroke-width="3" opacity="0.5"/>
  </g>
  <ellipse cx="72" cy="58" rx="34" ry="20" fill="#D96A5C" opacity="0.33" transform="rotate(-18 72 58)"/>
  <text x="100" y="138" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="108"
    fill="${WAXDARK}" style="text-shadow:none">H</text>
  <text x="98" y="136" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="108"
    fill="#A34A40" opacity="0.85">H</text>
</svg>`;
}

function banner() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${FONT_CSS}
.stage{width:2560px;height:1440px;position:relative;overflow:hidden;
  background:radial-gradient(1400px 900px at 50% 42%, #3A2410 0%, ${WALNUT} 62%, #1C1006 100%);}
.paper{position:absolute;inset:0;mix-blend-mode:screen;opacity:0.35;}
.frame{position:absolute;inset:56px;border:6px solid rgba(214,184,126,0.5);outline:2px solid rgba(214,184,126,0.28);outline-offset:18px;}
.safe{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:1546px;height:423px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}
.name{font-family:'Anton';font-size:148px;line-height:1;color:${CREAM};letter-spacing:4px;
  text-shadow:7px 7px 0 rgba(16,9,2,0.55);}
.name b{color:#E08A80;font-weight:normal;}
.tag{font-weight:900;font-size:35px;color:#E7D6B4;margin-top:22px;}
.langs{margin-top:16px;font-size:38px;color:${CREAM};display:flex;align-items:center;gap:26px;}
.langs .dot{width:9px;height:9px;border-radius:50%;background:${BRASS};}
.sealmark{position:absolute;top:30px;right:64px;}
</style></head><body><div class="stage">
<div class="paper">${noise}</div>
<div class="frame"></div>
<div class="sealmark">${seal(84)}</div>
<div class="safe">
  <div class="name">SEALED <b>HISTORIES</b></div>
  <div class="tag">History you'll never forget — told in Urdu &amp; Hindi</div>
  <div class="langs"><span style="font-family:'Nastaliq'">اردو</span><span class="dot"></span><span style="font-family:'Deva'">हिंदी</span><span class="dot"></span><span style="font-family:'Beng'">বাংলা</span></div>
</div>
</div></body></html>`;
}

function avatar() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${FONT_CSS}
.stage{width:800px;height:800px;position:relative;overflow:hidden;
  background:radial-gradient(560px 560px at 50% 44%, #3A2410 0%, ${WALNUT} 60%, #19100A 100%);}
.paper{position:absolute;inset:0;mix-blend-mode:screen;opacity:0.3;}
.ring{position:absolute;inset:40px;border-radius:50%;border:9px solid rgba(214,184,126,0.8);}
.ring2{position:absolute;inset:62px;border-radius:50%;border:3px solid rgba(214,184,126,0.35);}
.seal{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);filter:drop-shadow(0 14px 26px rgba(0,0,0,0.55));}
</style></head><body><div class="stage">
<div class="paper">${noise}</div>
<div class="ring"></div><div class="ring2"></div>
<div class="seal">${seal(470)}</div>
</div></body></html>`;
}

function watermark() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${FONT_CSS}
.stage{width:150px;height:150px;position:relative;display:flex;align-items:center;justify-content:center;}
.seal{filter:drop-shadow(2px 2px 0 rgba(0,0,0,0.55));}
</style></head><body><div class="stage"><div class="seal">${seal(140)}</div></div></body></html>`;
}

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
  .find(p => { try { return fs.existsSync(p); } catch { return false; } });

const jobs = [
  ['avatar-800.png', avatar(), 800, 800, false],
  ['banner-2560x1440.png', banner(), 2560, 1440, false],
  ['watermark-150.png', watermark(), 150, 150, true],
];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb', '--hide-scrollbars'] });
for (const [name, html, w, h, transparent] of jobs) {
  const file = path.join(HERE, name + '.html');
  fs.writeFileSync(file, html);
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto('file:///' + file.split(path.sep).join('/'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 250));
  await page.screenshot({ path: path.join(HERE, name), omitBackground: transparent });
  await page.close();
  fs.rmSync(file, { force: true });
  console.log('wrote', name, '(' + Math.round(fs.statSync(path.join(HERE, name)).size / 1024) + 'KB)');
}
await browser.close();

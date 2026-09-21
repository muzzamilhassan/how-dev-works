// Data-driven thumbnail generator — premium typography edition.
// Renders SVG (Archivo Black headline + JetBrains Mono tags on the brand dark
// gradient) and rasterizes with sharp. Fonts ship in assets/fonts (OFL).
//   node tools/make-thumbnail.mjs --title "How Git Actually Works" --out branding/t.png
//   node tools/make-thumbnail.mjs --title "..." --out ... --vertical   (1080x1920 Short card)
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function argv(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return (v === undefined || v.startsWith('--')) ? true : v;
}
const TITLE = String(argv('title', 'How Dev Works'));
const OUT = String(argv('out', 'branding/thumbnail-out.png'));
const VERTICAL = argv('vertical') === true || argv('vertical') === 'true';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The brand pattern is "How X ACTUALLY Works" — the keyword line gets the accent color.
const words = TITLE.toUpperCase().split(/\s+/).filter(Boolean);
const KW = words.includes('ACTUALLY') ? 'ACTUALLY' : (words.includes('WORKS') ? 'WORKS' : words[words.length - 1]);

// wrap into <=maxLines lines estimated to fit maxW at the largest size that works
function layout(titleUpper, maxW, maxLines) {
  const CHAR = 0.68; // Archivo Black caps average advance in em — conservative
  for (let size = 150; size >= 64; size -= 4) {
    const wl = [];
    let cur = '';
    for (const w of titleUpper.split(' ')) {
      const cand = cur ? cur + ' ' + w : w;
      if (cand.length * CHAR * size <= maxW) cur = cand;
      else { if (cur) wl.push(cur); cur = w; }
    }
    if (cur) wl.push(cur);
    if (wl.length <= maxLines && wl.every(l => l.length * CHAR * size <= maxW)) return { lines: wl, size };
  }
  return { lines: [titleUpper.slice(0, 18)], size: 64 };
}

// the channel glyph ">_" as an SVG fragment (chevron + underscore), brand mark
function glyph(cx, cy, scale, color) {
  const A = [cx - 32 * scale, cy - 32 * scale], M = [cx, cy], B = [cx - 32 * scale, cy + 32 * scale];
  const t = 11 * scale;
  return `<path d="M ${A[0]} ${A[1]} L ${M[0]} ${M[1]} L ${B[0]} ${B[1]}" fill="none" stroke="${color}" stroke-width="${t}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<rect x="${cx + 10 * scale}" y="${cy + 20 * scale}" width="${22 * scale}" height="${12 * scale}" rx="${3 * scale}" fill="${color}"/>`;
}

function buildSvg() {
  const W = VERTICAL ? 1080 : 1280, H = VERTICAL ? 1920 : 720;
  const maxW = VERTICAL ? 950 : 1130, maxLines = VERTICAL ? 4 : 3;
  const { lines, size } = layout(words.join(' '), maxW, maxLines);
  const lh = Math.round(size * 1.08);
  const blockH = lines.length * lh;
  // long thumbnails reserve ~190px below the headline for the accent bar + tag row
  const top = VERTICAL ? (H - blockH) / 2 - 60 : Math.max(34, (H - blockH - 190) / 2);
  const x0 = VERTICAL ? W / 2 : 70;

  const headLines = lines.map((ln, i) => {
    const y = top + lh * i + size * 0.82;
    const fill = ln.includes(KW) ? '#22D3EE' : '#F1F5F9';
    const anchor = VERTICAL ? 'text-anchor="middle"' : '';
    return `<text x="${x0}" y="${y}" ${anchor} font-family="Archivo Black" font-size="${size}" fill="${fill}">${esc(ln)}</text>`;
  }).join('\n');

  const barY = top + blockH + Math.round(size * 0.35);
  const bar = VERTICAL
    ? `<rect x="${W / 2 - 170}" y="${barY}" width="340" height="12" rx="6" fill="#22D3EE"/>`
    : `<rect x="72" y="${barY}" width="240" height="12" rx="6" fill="#22D3EE"/>`;

  const tag = VERTICAL
    ? `<text x="${W / 2}" y="1790" text-anchor="middle" font-family="JetBrains Mono" font-size="34" fill="#8B949E" letter-spacing="6">@HOWDEVWORKS</text>`
    : `<text x="72" y="${barY + 78}" font-family="JetBrains Mono" font-size="34" fill="#8B949E" letter-spacing="6">DEEP DIVE · HOWDEVWORKS</text>`;

  const mark = VERTICAL
    ? glyph(W / 2, top - 130, 0.72, '#22D3EE')
    : glyph(1140, 130, 0.85, '#22D3EE');

  const brackets = VERTICAL
    ? `<path d="M 70 90 h 56 M 70 90 v 110 M ${W - 70} 90 h -56 M ${W - 70} 90 v 110 M 70 ${H - 90} h 56 M 70 ${H - 90} v -110 M ${W - 70} ${H - 90} h -56 M ${W - 70} ${H - 90} v -110" stroke="#1C2531" stroke-width="12" fill="none"/>`
    : `<path d="M 46 40 h 52 M 46 40 v 86 M ${W - 46} 40 h -52 M ${W - 46} 40 v 86 M 46 ${H - 40} h 52 M 46 ${H - 40} v -86 M ${W - 46} ${H - 40} h -52 M ${W - 46} ${H - 40} v -86" stroke="#1C2531" stroke-width="10" fill="none"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#131B26"/><stop offset="1" stop-color="#0D1117"/>
    </linearGradient>
    <radialGradient id="glow" cx="${VERTICAL ? 0.5 : 0.82}" cy="${VERTICAL ? 0.18 : 0.2}" r="${VERTICAL ? 0.75 : 0.85}">
      <stop offset="0" stop-color="#22D3EE" stop-opacity="0.13"/><stop offset="1" stop-color="#22D3EE" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${brackets}
  ${mark}
  ${headLines}
  ${bar}
  ${tag}
</svg>`;
}

const svg = Buffer.from(buildSvg());
await sharp(svg).png({ compressionLevel: 9 }).toFile(OUT);
console.log('wrote', OUT, '(' + fs.statSync(OUT).size + ' bytes)');

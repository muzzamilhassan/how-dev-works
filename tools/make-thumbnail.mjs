// Data-driven thumbnail generator (dependency-free, same engine as make-branding.mjs).
//   node tools/make-thumbnail.mjs --title "How Git Actually Works" --out branding/t.png
//   node tools/make-thumbnail.mjs --title "..." --out ... --vertical   (1080x1920 Short card)
// Long: 1280x720, auto-wrapped pixel headline (<=3 lines), accent bar, ">_" glyph, decor.
// Vertical: 1080x1920 brand card — used as the FIRST FRAME of a Short so YouTube's
// auto-thumbnail and the in-app frame picker land on the branded card.
import zlib from 'zlib';
import fs from 'fs';

function argv(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return (v === undefined || v.startsWith('--')) ? true : v;
}
const TITLE = String(argv('title', 'How Dev Works'));
const OUT = String(argv('out', 'branding/thumbnail-out.png'));
const VERTICAL = argv('vertical') === true || argv('vertical') === 'true';

const BG = [13, 17, 23], CYAN = [34, 211, 238], WHITE = [230, 237, 243], GRAY = [139, 148, 158], DIM = [26, 33, 43];
// accent picked deterministically from the title so every video gets a stable color
const ACCENTS = [[34, 211, 238], [253, 224, 71], [248, 113, 113], [52, 211, 153], [192, 132, 252]];
const ACCENT = ACCENTS[[...TITLE].reduce((a, c) => a + c.charCodeAt(0), 0) % ACCENTS.length];

function crc32(buf) {
  const table = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = table[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
class Canvas {
  constructor(w, h) { this.w = w; this.h = h; this.raw = Buffer.alloc(h * (1 + w * 4)); }
  set(x, y, [r, g, b], a = 255) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const o = y * (1 + this.w * 4) + 1 + x * 4;
    this.raw[o] = r; this.raw[o + 1] = g; this.raw[o + 2] = b; this.raw[o + 3] = a;
  }
  fill(x0, y0, x1, y1, c) {
    for (let y = Math.round(y0); y <= Math.round(y1); y++)
      for (let x = Math.round(x0); x <= Math.round(x1); x++) this.set(x, y, c);
  }
  rounded(x0, y0, x1, y1, rad, c) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const cx = Math.min(Math.max(x, x0 + rad), x1 - rad);
      const cy = Math.min(Math.max(y, y0 + rad), y1 - rad);
      if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad) this.set(x, y, c);
    }
  }
  seg([x1, y1], [x2, y2], t, c) {
    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy || 1;
    const r = t / 2;
    for (let y = Math.min(y1, y2) - r; y <= Math.max(y1, y2) + r; y++)
      for (let x = Math.min(x1, x2) - r; x <= Math.max(x1, x2) + r; x++) {
        let u = ((x - x1) * dx + (y - y1) * dy) / L2;
        u = Math.max(0, Math.min(1, u));
        if ((x - (x1 + u * dx)) ** 2 + (y - (y1 + u * dy)) ** 2 <= r * r) this.set(x, y, c);
      }
  }
  write(file) {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0); ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8; ihdr[9] = 6;
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(this.raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0))
    ]);
    fs.writeFileSync(file, png);
    console.log('wrote', file, '(' + png.length + ' bytes)');
  }
}

const F = {
  A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110',
  C: '01110 10001 10000 10000 10000 10001 01110', D: '11100 10010 10001 10001 10001 10010 11100',
  E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001',
  I: '11111 00100 00100 00100 00100 00100 11111', J: '00111 00010 00010 00010 00010 10010 01100',
  K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 11001 10101 10011 10001 10001 10001',
  O: '01110 10001 10001 10001 10001 10001 01110', P: '11110 10001 10001 11110 10000 10000 10000',
  Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100',
  U: '10001 10001 10001 10001 10001 10001 01110', V: '10001 10001 10001 10001 10001 01010 00100',
  W: '10001 10001 10001 10101 10101 11011 10001', X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
  '0': '01110 10001 10011 10101 11001 10001 01110', '1': '00100 01100 00100 00100 00100 00100 01110',
  '2': '01110 10001 00001 00010 00100 01000 11111', '3': '11111 00010 00100 00010 00001 10001 01110',
  '4': '00010 00110 01010 10010 11111 00010 00010', '5': '11111 10000 11110 00001 00001 10001 01110',
  '6': '00110 01000 10000 11110 10001 10001 01110', '7': '11111 00001 00010 00100 01000 01000 01000',
  '8': '01110 10001 10001 01110 10001 10001 01110', '9': '01110 10001 10001 01111 00001 00010 01100',
  '.': '00000 00000 00000 00000 00000 01100 01100', ',': '00000 00000 00000 00000 01100 01100 00100',
  '!': '00100 00100 00100 00100 00100 00000 00100', '?': '01110 10001 00001 00010 00100 00000 00100',
  '-': '00000 00000 00000 11111 00000 00000 00000', ':': '00000 01100 01100 00000 01100 01100 00000',
  '>': '01000 00100 00010 00001 00010 00100 01000', '_': '00000 00000 00000 00000 00000 00000 11111',
  '[': '01110 01000 01000 01000 01000 01000 01110', ']': '01110 00010 00010 00010 00010 00010 01110',
  '@': '01110 10001 10111 10101 10110 10000 01111',
  ' ': '00000 00000 00000 00000 00000 00000 00000'
};
for (const k in F) F[k] = F[k].split(' ');
function text(cv, str, x, y, s, c) {
  for (const ch of str.toUpperCase()) {
    const g = F[ch] || F['?'];
    for (let ry = 0; ry < 7; ry++) for (let rx = 0; rx < 5; rx++)
      if (g[ry][rx] === '1') cv.fill(x + rx * s, y + ry * s, x + rx * s + s - 1, y + ry * s + s - 1, c);
    x += 6 * s;
  }
}
const lineWidth = (str, s) => str.length * 6 * s - s;

// wrap the title into <=3 lines whose width fits maxW at the largest possible scale
function layout(title, maxW, maxLines) {
  for (let s = 20; s >= 6; s--) {
    const words = title.toUpperCase().split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
      const cand = cur ? cur + ' ' + w : w;
      if (lineWidth(cand, s) <= maxW) cur = cand;
      else { if (cur) lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    if (lines.length <= maxLines && lines.every(l => lineWidth(l, s) <= maxW)) return { lines, s };
  }
  return { lines: [title.toUpperCase().slice(0, 20)], s: 6 };
}

function glyph(cv, x, y, s, c) {
  const A = [x + 32 * s, y + 28 * s], M = [x + 64 * s, y + 60 * s], B = [x + 32 * s, y + 92 * s];
  cv.seg(A, M, 11 * s, c); cv.seg(M, B, 11 * s, c);
  cv.fill(x + 74 * s, y + 80 * s, x + 96 * s, y + 92 * s, c);
}

if (VERTICAL) {
  // 1080x1920 Short card: logo glyph, big title, accent bar, handle
  const cv = new Canvas(1080, 1920);
  cv.fill(0, 0, 1079, 1919, BG);
  text(cv, '[', 60, 80, 16, DIM);
  text(cv, ']', 1080 - 60 - lineWidth(']', 16), 80, 16, DIM);
  text(cv, ']', 60, 1920 - 80 - 7 * 16, 16, DIM);
  text(cv, '[', 1080 - 60 - lineWidth('[', 16), 1920 - 80 - 7 * 16, 16, DIM);
  glyph(cv, 1080 / 2 - 45, 380, 0.75, CYAN);
  const { lines, s } = layout(TITLE, 940, 4);
  const lh = 7 * s + Math.round(s * 0.9);
  const blockH = lines.length * lh;
  let y = (1920 - blockH) / 2 - 40;
  for (const ln of lines) { text(cv, ln, (1080 - lineWidth(ln, s)) / 2, y, s, WHITE); y += lh; }
  cv.rounded(1080 / 2 - 170, y + 20, 1080 / 2 + 170, y + 32, 6, CYAN);
  text(cv, '@HOWDEVWORKS', (1080 - lineWidth('@HOWDEVWORKS', 4)) / 2, 1770, 4, GRAY);
  cv.write(OUT);
} else {
  // 1280x720 long-form thumbnail
  const cv = new Canvas(1280, 720);
  cv.fill(0, 0, 1279, 719, BG);
  text(cv, '[', 50, 50, 12, DIM);
  text(cv, ']', 1280 - 50 - lineWidth(']', 12), 50, 12, DIM);
  text(cv, ']', 50, 720 - 50 - 7 * 12, 12, DIM);
  text(cv, '[', 1280 - 50 - lineWidth('[', 12), 720 - 50 - 7 * 12, 12, DIM);
  glyph(cv, 1050, 60, 1.4, CYAN);
  const { lines, s } = layout(TITLE, 860, 3);
  const lh = 7 * s + Math.round(s * 0.8);
  let y = (720 - lines.length * lh - 60) / 2;
  for (const ln of lines) { text(cv, ln, 80, y, s, WHITE); y += lh; }
  cv.rounded(80, y + 8, 80 + 240, y + 20, 6, ACCENT);
  text(cv, 'DEEP DIVE', 80, y + 44, 5, GRAY);
  cv.write(OUT);
}

// Channel branding asset generator — dependency-free PNG writer + 5x7 pixel font.
// Outputs into branding/:
//   profile-800.png        channel avatar (800x800)
//   banner-2560x1440.png   channel art (safe area 1546x423 centered)
//   watermark-150.png      video watermark (transparent)
//   thumbnail-git.png      ready-to-use thumbnail for the Git video (1280x720)
// Run: node tools/make-branding.mjs
import zlib from 'zlib';
import fs from 'fs';

const BG = [13, 17, 23];      // #0D1117
const CYAN = [34, 211, 238];  // #22D3EE
const WHITE = [230, 237, 243];// #E6EDF3
const GRAY = [139, 148, 158]; // #8B949E
const DIM = [26, 33, 43];     // #1A212B decor
const LINE = [48, 54, 61];    // #30363D

// ---------- tiny PNG writer ----------
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
  constructor(w, h) {
    this.w = w; this.h = h;
    this.raw = Buffer.alloc(h * (1 + w * 4)); // filter 0 + RGBA
  }
  set(x, y, [r, g, b], a = 255) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const o = y * (1 + this.w * 4) + 1 + x * 4;
    this.raw[o] = r; this.raw[o + 1] = g; this.raw[o + 2] = b; this.raw[o + 3] = a;
  }
  fill(x0, y0, x1, y1, c, a = 255) {
    for (let y = Math.round(y0); y <= Math.round(y1); y++)
      for (let x = Math.round(x0); x <= Math.round(x1); x++) this.set(x, y, c, a);
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
  circle(cx, cy, r, c, ring) {
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d <= r * r && (!ring || d >= (r - ring) ** 2)) this.set(x, y, c);
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

// ---------- 5x7 pixel font ----------
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
  return x;
}
const width = (str, s) => str.length * 6 * s - s;

// glyph used by logo/watermark: ">_" as vector shapes (smoother than font at big sizes)
function glyph(cv, x, y, s, c) { // s = scale of the 120-unit logo design
  const A = [x + 32 * s, y + 28 * s], M = [x + 64 * s, y + 60 * s], B = [x + 32 * s, y + 92 * s];
  cv.seg(A, M, 11 * s, c); cv.seg(M, B, 11 * s, c);
  cv.fill(x + 74 * s, y + 80 * s, x + 96 * s, y + 92 * s, c);
}

fs.mkdirSync('branding', { recursive: true });

// ---------- 1. profile picture 800x800 ----------
{
  const cv = new Canvas(800, 800);
  cv.rounded(0, 0, 799, 799, 160, BG);
  glyph(cv, 0, 0, 800 / 120, CYAN);
  cv.write('branding/profile-800.png');
}

// ---------- 2. watermark 150x150 (transparent) ----------
{
  const cv = new Canvas(150, 150);
  glyph(cv, 0, 0, 150 / 120, CYAN);
  cv.write('branding/watermark-150.png');
}

// ---------- 3. banner 2560x1440 (safe area 1546x423 centered: x 507..2053, y 508..931) ----------
{
  const cv = new Canvas(2560, 1440);
  cv.fill(0, 0, 2559, 1439, BG);
  // corner brackets as decor (outside safe area — visible on TV only)
  text(cv, '[', 90, 110, 34, DIM);
  text(cv, ']', 2560 - 90 - width(']', 34), 110, 34, DIM);
  text(cv, ']', 90, 1440 - 110 - 7 * 34, 34, DIM);
  text(cv, '[', 2560 - 90 - width('[', 34), 1440 - 110 - 7 * 34, 34, DIM);
  // title: >_ HOW DEV WORKS
  const title = 'HOW DEV WORKS', s = 10, gap = 2 * s;
  const total = 2 * 6 * s + gap + width(title, s);
  const x0 = (2560 - total) / 2, ty = 605;
  text(cv, '>_', x0, ty, s, CYAN);
  text(cv, title, x0 + 2 * 6 * s + gap, ty, s, WHITE);
  // accent bar
  cv.rounded(2560 / 2 - 230, 715, 2560 / 2 + 230, 729, 7, CYAN);
  // tagline
  const tag = 'SOFTWARE, EXPLAINED.', ts = 5;
  text(cv, tag, (2560 - width(tag, ts)) / 2, 775, ts, GRAY);
  cv.write('branding/banner-2560x1440.png');
}

// ---------- 4. thumbnail for the Git video 1280x720 ----------
{
  const cv = new Canvas(1280, 720);
  cv.fill(0, 0, 1279, 719, BG);
  // headline
  text(cv, 'HOW GIT', 80, 90, 12, WHITE);
  text(cv, 'ACTUALLY', 80, 200, 12, WHITE);
  text(cv, 'WORKS', 80, 310, 12, CYAN);
  cv.rounded(80, 440, 300, 452, 6, CYAN);
  // badge
  cv.rounded(80, 500, 80 + width('DEEP DIVE', 4) + 30, 500 + 7 * 4 + 24, 8, LINE);
  text(cv, 'DEEP DIVE', 106, 516, 4, CYAN);
  // git graph, right side
  cv.seg([790, 380], [1200, 380], 12, LINE);            // trunk
  cv.seg([940, 380], [940, 200], 12, LINE);             // branch up
  cv.seg([940, 200], [1150, 200], 12, LINE);            // branch line
  cv.circle(860, 380, 30, CYAN);
  cv.circle(1040, 380, 30, WHITE);
  cv.circle(1180, 380, 30, CYAN);
  cv.circle(1150, 200, 26, GRAY);
  cv.circle(940, 200, 14, BG, 0);                        // corner joint
  cv.write('branding/thumbnail-git.png');
}
console.log('done');

// Generates the channel logo: dark rounded square (#0D1117) + cyan (#22D3EE) ">_" terminal
// glyph, 120x120 RGBA PNG — matches the BRANDING.md visual identity. No dependencies.
// Run: node tools/make-logo.mjs  →  branding/logo-120.png
import zlib from 'zlib';
import fs from 'fs';

const S = 120, R = 24;                  // image size, corner radius
const BG = [13, 17, 23], FG = [34, 211, 238];
const raw = Buffer.alloc(S * (1 + S * 4)); // PNG filter byte 0 + RGBA rows

function set(x, y, c, a) {
  const o = y * (1 + S * 4) + 1 + x * 4;
  raw[o] = c[0]; raw[o + 1] = c[1]; raw[o + 2] = c[2]; raw[o + 3] = a;
}
function inRounded(x, y) {
  const cx = Math.min(Math.max(x, R), S - 1 - R);
  const cy = Math.min(Math.max(y, R), S - 1 - R);
  return (x - cx) ** 2 + (y - cy) ** 2 <= R * R;
}
function inSeg(px, py, [x1, y1], [x2, y2], t) {
  const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy;
  let u = L2 ? ((px - x1) * dx + (py - y1) * dy) / L2 : 0;
  u = Math.max(0, Math.min(1, u));
  const qx = x1 + u * dx, qy = y1 + u * dy;
  return (px - qx) ** 2 + (py - qy) ** 2 <= (t / 2) ** 2;
}
const A = [32, 28], M = [64, 60], B = [32, 92], T = 11;   // chevron + stroke width
for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    if (!inRounded(x, y)) { set(x, y, [0, 0, 0], 0); continue; }
    const glyph = inSeg(x, y, A, M, T) || inSeg(x, y, M, B, T)
      || (x >= 74 && x <= 96 && y >= 80 && y <= 92);      // the underscore
    set(x, y, glyph ? FG : BG, 255);
  }
}

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
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8; ihdr[9] = 6;                                // 8-bit RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
]);
fs.mkdirSync('branding', { recursive: true });
fs.writeFileSync('branding/logo-120.png', png);
console.log('wrote branding/logo-120.png (' + png.length + ' bytes)');

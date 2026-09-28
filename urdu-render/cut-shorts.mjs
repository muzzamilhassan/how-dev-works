// Cut promo Shorts from a rendered episode, using the script's shorts[] defs:
//   "shorts": [{ "start": 0, "end": 24, "title": "...", "tags": "a,b" }]
// → out/urdu-episodes/<slug>-short-01.mp4 ...
//   node cut-shorts.mjs --script episodes/salt.json
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const i = process.argv.indexOf('--script');
const sp = i !== -1 ? process.argv[i + 1] : '';
if (!sp) { console.error('FAIL: --script required'); process.exit(1); }
const S = JSON.parse(fs.readFileSync(path.resolve(sp), 'utf8'));
const slug = S.slug || path.basename(sp, '.json');
if (!S.shorts || !S.shorts.length) { console.log('[shorts] none defined'); process.exit(0); }
const ffmpeg = process.env.FFMPEG || 'ffmpeg';

for (const [n, sh] of S.shorts.entries()) {
  const src = path.join(ROOT, 'out', 'urdu-episodes', slug + '.mp4');
  const out = path.join(ROOT, 'out', 'urdu-episodes', `${slug}-short-${String(n + 1).padStart(2, '0')}.mp4`);
  const r = spawnSync(ffmpeg, ['-y', '-v', 'error', '-ss', String(sh.start), '-t', String(sh.end - sh.start),
    '-i', src, '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', out],
    { stdio: 'inherit' });
  if (r.status !== 0) { console.error('FAIL: short ' + (n + 1)); process.exit(1); }
  console.log('[shorts] wrote', out);
}

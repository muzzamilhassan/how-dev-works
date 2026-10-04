// tech-render make — one command per episode:
//   node make.mjs specs/<id>.json            → TTS + timeline + shape-check → props.json
//   node make.mjs specs/<id>.json --render   → + muted Remotion render + ffmpeg premix/mux → out/<id>.mp4
//
// Why muted render + manual mux: Remotion's audio mixer needs more RAM than a busy
// dev machine (or a shared runner) can spare; silent jpeg render at low concurrency
// is the proven-robust path, and the narration mix is trivially exact with adelay.
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const specFile = process.argv[2];
const RENDER = process.argv.includes('--render');
if (!specFile || !fs.existsSync(specFile)) {
  console.error('usage: node make.mjs specs/<id>.json [--render]');
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
  if (r.status !== 0) {
    console.error(`[make] FAILED: ${cmd} ${args.join(' ')} (exit ${r.status})`);
    process.exit(r.status || 1);
  }
}

// 1. TTS input from spec narration
fs.mkdirSync('public/tts', { recursive: true });
fs.writeFileSync(
  path.join('tts', 'tts-input.json'),
  JSON.stringify(spec.beats.map((b, i) => ({ i, text: b.text })), null, 2)
);

// 2. synthesize (sequential beats — edge-tts rate-limits parallel streams)
run('python', ['tts/tts.py', 'public/tts'], {
  env: { ...process.env, TTS_VOICE: spec.voice || 'en-US-GuyNeural', TTS_RATE: spec.rate || '+6%' },
});

// 3. absolute timeline: lead + cumsum(ms + gap)
const dur = JSON.parse(fs.readFileSync('public/tts/tts-durations.json', 'utf8'));
let t = spec.leadMs ?? 300;
const beats = dur.map((b) => {
  const o = { i: b.i, startMs: t, ms: b.ms, words: b.words };
  t += b.ms + (spec.gapMs ?? 350);
  return o;
});
fs.writeFileSync('props.json', JSON.stringify({ spec, beats, totalMs: t, fps: spec.fps || 30 }, null, 2));
console.log(`[make] props.json: ${beats.length} beats, total ${(t / 1000).toFixed(1)}s`);

// 4. shape-check — bad spec never reaches the renderer
run('node', ['check-spec.mjs', specFile]);

if (!RENDER) {
  console.log('[make] prep done (add --render to render the video)');
  process.exit(0);
}

// 5. muted render — jpeg intermediates + low concurrency = robust under memory pressure
const port = 4700 + Math.floor(Math.random() * 90);
const conc = process.env.CONCURRENCY || '1';
const silent = `out/${spec.id}-silent.mp4`;
run('npx', [
  'remotion', 'render', 'remotion/index.ts', 'DiagramExplainer', silent,
  '--props=props.json', `--port=${port}`, `--concurrency=${conc}`, '--image-format=jpeg', '--muted',
]);

// 6. premix narration at exact beat offsets, then mux.
// Filtergraph passes through a script FILE (never argv): on Windows shell:true
// would parse "|" as a pipe. Newer ffmpeg (8+) removed -filter_complex_script in
// favor of -/filter_complex — try both, old builds accept the first, new the second.
const narration = `out/${spec.id}-narration.wav`;
const afx = `out/${spec.id}-afx.txt`;
fs.writeFileSync(
  afx,
  beats.map((b, i) => `[${i}]adelay=${b.startMs}|${b.startMs}[a${i}]`).join(';') +
    ';' +
    beats.map((b, i) => `[a${i}]`).join('') +
    `amix=inputs=${beats.length}:normalize=0[out]`
);
const premix = (flag) =>
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error',
    ...beats.flatMap((b, i) => ['-i', `public/tts/beat-0${b.i}.mp3`]),
    flag, afx, '-map', '[out]', '-ar', '44100', narration],
    { stdio: 'inherit', shell: process.platform === 'win32' });
const rScript = premix('-filter_complex_script');
if (rScript.status !== 0) {
  console.log('[make] -filter_complex_script unavailable (ffmpeg 8+?) — trying -/filter_complex');
  const rNew = premix('-/filter_complex');
  if (rNew.status !== 0) {
    console.error('[make] FAILED: narration premix');
    process.exit(rNew.status || 1);
  }
}
const final = `out/${spec.id}.mp4`;
run('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', narration,
  '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', final]);
const durOut = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', final], { encoding: 'utf8' });
console.log(`[make] DONE ${final} (${(parseFloat(durOut.stdout) || 0).toFixed(1)}s)`);

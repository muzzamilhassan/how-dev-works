// Reads public/tts/tts-durations.json (from tts.py) and writes props.json —
// the absolute timeline the composition renders against: each beat starts at
// cumsum(previous + 350ms gap), with a 300ms lead-in.
import { readFileSync, writeFileSync } from "node:fs";

const GAP = 350;
const LEAD = 300;

const dur = JSON.parse(readFileSync("public/tts/tts-durations.json", "utf8"));
let t = LEAD;
const beats = dur.map((b) => {
  const o = { i: b.i, startMs: t, ms: b.ms, words: b.words };
  t += b.ms + GAP;
  return o;
});
writeFileSync(
  "props.json",
  JSON.stringify({ fps: 30, beats, totalMs: t }, null, 2)
);
console.log(`props.json: ${beats.length} beats, total ${t} ms`);

// Queue picker for the scheduled Urdu lane — writes GITHUB_ENV for the workflow.
// Reads state/urdu-queue.json { queue: [scriptPath...], done: [scriptPath...] },
// picks the first queued-but-not-done script. Scheduled runs MUST publish (that is
// the point of the cron); manual dispatches keep their explicit inputs.
//   node pick-episode.mjs <inputScript> <inputUpload> <inputPrivacy>
import fs from 'fs';

const [inpScript, inpUpload, inpPrivacy] = process.argv.slice(2);
const env = (k, v) => { fs.appendFileSync(process.env.GITHUB_ENV, `${k}=${v}\n`); };

if (inpScript) {
  env('SCRIPT', inpScript);
  env('UPLOAD', inpUpload === 'true' ? 'true' : 'false');
  env('PRIVACY', inpPrivacy || 'public');
  env('SKIP', 'false');
  console.log('[pick] manual dispatch:', inpScript, 'upload=' + env.UPLOAD);
  process.exit(0);
}

const qFile = 'state/urdu-queue.json';
let q = { queue: [], done: [] };
try { q = JSON.parse(fs.readFileSync(qFile, 'utf8')); } catch { /* start empty */ }
const done = new Set(q.done || []);
const next = (q.queue || []).find(s => !done.has(s));
if (!next) {
  env('SKIP', 'true');
  console.log('[pick] queue empty — nothing to publish');
  process.exit(0);
}
env('SCRIPT', next);
env('UPLOAD', 'true');        // scheduled runs publish — that is the cron's job
env('PRIVACY', 'public');
env('SKIP', 'false');
console.log('[pick] next from queue:', next);

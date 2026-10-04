// tech-render shape-check — a bad spec never reaches the renderer.
// usage: node check-spec.mjs specs/<id>.json   (exit 1 on errors, warnings allowed)
import fs from 'fs';

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error('[check] no spec file given');
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [];
const warns = [];
const W = 1920;
const H = 1080;
const COLORS = ['cyan', 'amber', 'green', 'violet', 'red'];
const nBeats = (spec.beats || []).length;

// narration
if (!Array.isArray(spec.beats) || nBeats < 2 || nBeats > 60) errors.push('beats: need 2–60 narration beats');
(spec.beats || []).forEach((b, i) => {
  if (!b.text || b.text.length < 5 || b.text.length > 400) errors.push(`beats[${i}].text: 5–400 chars`);
});

// accents + colors
(spec.accentPerBeat || []).forEach((c, i) => {
  if (!COLORS.includes(c)) errors.push(`accentPerBeat[${i}]: "${c}" not in ${COLORS.join('/')}`);
});
const useColor = (where, c) => { if (c && !COLORS.includes(c)) errors.push(`${where}: color "${c}" not in ${COLORS.join('/')}`); };

// beat references valid
const checkBeat = (where, b) => {
  if (!Number.isInteger(b) || b < 0 || b >= nBeats) errors.push(`${where}: beat ${b} out of range (0–${nBeats - 1})`);
};
(spec.headlines || []).forEach((h, i) => checkBeat(`headlines[${i}]`, h.beat));
(spec.badges || []).forEach((b, i) => checkBeat(`badges[${i}]`, b.beat));
if (spec.hook) checkBeat('hook', spec.hook.beat);
if (spec.takeawaysBeat) checkBeat('takeawaysBeat', spec.takeawaysBeat);

// panels: bounds, unique ids, overlap warnings
const ids = new Set();
const rects = [];
(spec.panels || []).forEach((p, i) => {
  const w = `panels[${i}](${p.id})`;
  if (ids.has(p.id)) errors.push(`${w}: duplicate id`);
  ids.add(p.id);
  if (!p.title || p.title.length > 40) errors.push(`${w}: title 1–40 chars`);
  checkBeat(w, p.beat);
  for (const [k, max] of [['x', W], ['y', H]]) {
    const v = p[k];
    if (typeof v !== 'number' || v < 0 || v > max) errors.push(`${w}: ${k}=${v} outside 0–${max}`);
  }
  for (const [k, max] of [['w', W], ['h', H]]) {
    const v = p[k];
    if (typeof v !== 'number' || v < 60 || v > max) errors.push(`${w}: ${k}=${v} implausible (60–${max})`);
  }
  if (p.x + p.w > W) errors.push(`${w}: x+w=${p.x + p.w} overflows width`);
  if (p.y + p.h > H - 140) warns.push(`${w}: y+h=${p.y + p.h} enters caption band (keep above y≈940)`);
  rects.push({ id: p.id, ...p });
  useColor(w, p.color);
});
for (let i = 0; i < rects.length; i++)
  for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    const ov = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    if (ov) warns.push(`panels overlap: ${a.id} ↔ ${b.id}`);
  }

// edges: path shape, bounds of labels
(spec.edges || []).forEach((e, i) => {
  const w = `edges[${i}](${e.id})`;
  if (typeof e.path !== 'string' || !e.path.trim().startsWith('M ')) errors.push(`${w}: path must start "M x y ..."`);
  if (e.id && ids.has(e.id) && spec.panels.some((p) => p.id === e.id)) warns.push(`${w}: edge id collides with panel id`);
  checkBeat(w, e.beat);
  useColor(w, e.color);
  if (e.label && (typeof e.lx !== 'number' || typeof e.ly !== 'number')) warns.push(`${w}: label without lx/ly → chip lands at 0,0`);
  if (typeof e.lx === 'number' && (e.lx < 0 || e.lx > W)) errors.push(`${w}: lx out of range`);
  if (typeof e.ly === 'number' && (e.ly < 0 || e.ly > H)) errors.push(`${w}: ly out of range`);
});

// takeaways + outro
(spec.takeaways || []).forEach((t, i) => {
  if (!t.t || t.t.length > 70) errors.push(`takeaways[${i}].t: 1–70 chars`);
  useColor(`takeaways[${i}]`, t.color);
});
if (spec.outro && spec.outro.length > 70) errors.push('outro: max 70 chars');

// headline parts
(spec.headlines || []).forEach((h, i) => {
  if (!h.parts?.length) errors.push(`headlines[${i}]: parts[] needed`);
  h.parts?.forEach((p) => { if (typeof p.t !== 'string' || p.t.length > 60) errors.push(`headlines[${i}] part too long`); });
});

for (const w of warns) console.log('[check] WARN: ' + w);
if (errors.length) {
  for (const e of errors) console.error('[check] ERROR: ' + e);
  console.error(`[check] ${spec.id || file}: ${errors.length} error(s) — fix the spec`);
  process.exit(1);
}
console.log(`[check] ${spec.id || file}: OK (${warns.length} warning(s))`);

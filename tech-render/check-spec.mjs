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
  if (p.rows !== undefined) {
    if (!Array.isArray(p.rows) || p.rows.length > 4) errors.push(`${w}: rows max 4`);
    (p.rows || []).forEach((r, ri) => { if (typeof r !== 'string' || r.length > 24) errors.push(`${w}: row ${ri} max 24 chars`); });
  }
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
  if (e.flow && !/^[MLC\s\d.-]+$/.test(e.path)) errors.push(`${w}: flow path must be pure M/L/C commands`);
  if (e.dots !== undefined && (!Number.isInteger(e.dots) || e.dots < 1 || e.dots > 6)) errors.push(`${w}: dots 1–6`);
});

// counters (odometer chips)
(spec.counters || []).forEach((c, i) => {
  const w = `counters[${i}](${c.label})`;
  checkBeat(w, c.beat);
  useColor(w, c.color);
  if (!c.label || c.label.length > 24) errors.push(`${w}: label 1–24 chars`);
  if (!Number.isInteger(c.from) || !Number.isInteger(c.to) || c.from >= c.to) errors.push(`${w}: from < to (integers)`);
  if (typeof c.x !== 'number' || c.x < 0 || c.x > W) errors.push(`${w}: x out of range`);
  if (typeof c.y !== 'number' || c.y < 0 || c.y > H - 140) errors.push(`${w}: y out of range (caption band)`);
  rects.push({ id: 'counter:' + (c.label || i), x: c.x, y: c.y, w: c.w ?? 240, h: 64 });
});

// terminals (typing windows)
(spec.terminals || []).forEach((t, i) => {
  const w = `terminals[${i}](${t.title})`;
  checkBeat(w, t.beat);
  useColor(w, t.color);
  if (!t.title || t.title.length > 30) errors.push(`${w}: title 1–30 chars`);
  if (!Array.isArray(t.lines) || !t.lines.length || t.lines.length > 5) errors.push(`${w}: 1–5 lines`);
  (t.lines || []).forEach((ln, li) => { if (typeof ln !== 'string' || ln.length > 44) errors.push(`${w}: line ${li} max 44 chars`); });
  if (typeof t.x !== 'number' || t.x < 0 || t.x + t.w > W) errors.push(`${w}: x/w overflow width`);
  if (typeof t.y !== 'number' || t.y < 0 || t.y + (t.h ?? 130) > H - 140) errors.push(`${w}: y/h enters caption band`);
  rects.push({ id: 'terminal:' + (t.title || i), x: t.x, y: t.y, w: t.w, h: t.h ?? 130 });
});

// selectors (highlight walks options)
(spec.selectors || []).forEach((s, i) => {
  const w = `selectors[${i}](${s.title || i})`;
  checkBeat(w, s.beat);
  useColor(w, s.color);
  if (!Array.isArray(s.options) || s.options.length < 2 || s.options.length > 5) errors.push(`${w}: 2–5 options`);
  (s.options || []).forEach((o, oi) => { if (typeof o !== 'string' || o.length > 16) errors.push(`${w}: option ${oi} max 16 chars`); });
  if (typeof s.x !== 'number' || s.x < 0 || s.x + s.w > W) errors.push(`${w}: x/w overflow width`);
  if (typeof s.y !== 'number' || s.y < 0 || s.y > H - 140) errors.push(`${w}: y out of range (caption band)`);
  rects.push({ id: 'selector:' + (s.title || i), x: s.x, y: s.y, w: s.w, h: s.title ? 92 : 62 });
});
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

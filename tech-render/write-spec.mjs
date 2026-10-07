// tech-render write-spec — topic → episode spec via LLM, gated by check-spec.
//   node write-spec.mjs --topic "Why Is My Query Slow?" [--longform] [--out specs/x.json]
// Keys (free tiers both): GROQ_API_KEY (default) or GEMINI_API_KEY.
// House style baked from docs/research/2026-10-04-diagram-channel-automation-research.md:
// evergreen DB/SQL internals, X-vs-Y / N-laws / how-X-works-internally hooks,
// one idea per beat, concrete numbers, no version-specific frameworks.
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const arg = (name, def) => {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return (v === undefined || v.startsWith('--')) ? true : v;
};
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
const today = new Date().toISOString().slice(0, 10);

const topic = typeof arg('topic', '') === 'string' ? arg('topic', '').trim() : '';
const longform = arg('longform') === true || arg('longform') === 'true';
const outArg = typeof arg('out', '') === 'string' ? arg('out', '').trim() : '';
const waveNote = typeof arg('wave-note', '') === 'string' ? arg('wave-note', '').trim() : '';
if (!topic) { console.error('[write-spec] --topic required'); process.exit(1); }
if (arg('longform') === true && typeof arg('longform') === 'boolean') { /* bare --longform ok */ }

const GROQ = (process.env.GROQ_API_KEY || '').trim();
const GEM = (process.env.GEMINI_API_KEY || '').trim();
if (!GROQ && !GEM) {
  console.error('[write-spec] missing key: set GROQ_API_KEY (console.groq.com, free) or GEMINI_API_KEY (aistudio.google.com, free)');
  console.error('[write-spec] local: export GROQ_API_KEY=... · Actions: gh secret set GROQ_API_KEY');
  process.exit(1);
}

// longform target must stay within check-spec's hard cap (2–60 beats) or every
// generation that obeys the prompt fails validation and burns the repair rounds
const BEAT_TARGET = longform ? '50-60' : '8-12';
const DUR_TARGET = longform ? '5.5-7.5 minutes (>= 300s is the publish law)' : '30-60 seconds';

const SCHEMA_RULES = `
Return ONLY valid minified-or-pretty JSON (no markdown fences, no commentary) with EXACTLY this shape:
{
 "id": "<ISO-date>-<slug>", "title": "<video title, <=90 chars>", "longform": ${longform},
 "voice": "en-US-GuyNeural", "rate": "+6%",
 "accentPerBeat": ["cyan|amber|green|violet|red", ...one per beat],
 "hook": { "beat": 0, "text": "<SQL or command line, <=44 chars>" },
 "badges": [{ "t": "01 · WORD", "beat": 1, "color": "cyan" } ], "badgeFadeBeat": <beat>,
 "headlines": [{ "beat": <int>, "parts": [{ "t": "plain " }, { "t": "TINTED", "tint": true }] } ],
 "panels": [{ "id": "kebab-id", "title": "UPPER TITLE", "sub": "mono detail", "badge": "01",
              "x": 0, "y": 0, "w": 240, "h": 100, "beat": <int>, "db": false, "color": "cyan" } ],
 "edges": [{ "id": "e-id", "path": "M x y L x y", "beat": <int>, "color": "green",
             "label": "<=10 chars", "lx": 0, "ly": 0, "dash": false, "pulse": true } ],
 "takeaways": [{ "t": "<=55 chars", "color": "green" } ],
 "takeawaysBeat": <int = last beat index>,
 "outro": "<=55 chars payoff line>",
 "beats": [{ "i": 0, "text": "narration sentence" } ]
}`;

const STYLE_RULES = `
HOUSE LAW (from channel research — never violate):
- Niche: database / SQL internals, evergreen. No framework versions, no news, no hype words.
- Hook formats that work: "X vs Y", "N laws/rules of X", "How X works internally", a concrete number ("one row in a billion").
- beats[]: ONE idea per beat, 6-20 spoken words each, direct sentences, NO em-dashes, NO "imagine", NO "let's dive in". ${BEAT_TARGET} beats total → target duration ${DUR_TARGET}.
- Chapter arc: hook (beat 0) → the pain/problem → mechanism built piece by piece → the number/proof → why it matters → takeaways (last beat).
- accentPerBeat: chapter = color. Change color only when the chapter changes. Use red only for the "wrong way / pain" chapter.
- headlines: only at chapter starts (max 8); ONE keyword tinted per headline; headline text <= 48 chars total.
- badges: 3-6 job chips, all at beat 1, words like "01 · POOL". badgeFadeBeat = the beat the first diagram panel appears.
- hook.text: a short real SQL/command that IS the topic (e.g. "SELECT * FROM users WHERE id = 42;").
- panels: 6-22 total. Canvas is 1920x1080. Panels 200-300 wide, 90-115 tall.
  LAYOUT LAW: left third = the outside world/client/table; center-right = the mechanism built chapter by chapter;
  chips/facts go far right (x 1580-1820). NOTHING below y=920 (captions live there).
  Panels pop on the beat where narration names them — panel.beat must match the sentence that introduces it.
- edges: 4-24. Paths are absolute SVG: "M x y L x y" or "M x y C x1 y1 x2 y2 x y".
  Draw structure edges in the beat the structure appears; the ONE edge being discussed gets "pulse": true on its own beat.
  Every edge with a label needs lx,ly near its midpoint. Return/ack edges may curve over the top (control points y≈200-260).
- takeaways: EXACTLY 3, each <= 55 chars, each with a color.
- outro: <= 55 chars, the payoff.
- ids: unique across panels and edges. Colors only: cyan amber green violet red.`;

const FEWSHOT = `
EXAMPLE (trimmed — real spec had 8 beats; yours follows the same shape):
{"id":"2026-10-05-btree","title":"Why Databases Love B-Trees","longform":false,"voice":"en-US-GuyNeural","rate":"+6%",
 "accentPerBeat":["cyan","red","cyan","amber","amber","green","violet","green"],
 "hook":{"beat":0,"text":"SELECT * FROM users WHERE id = 42;"},
 "badges":[{"t":"01 · SCAN","beat":1,"color":"red"},{"t":"02 · TREE","beat":1,"color":"cyan"},{"t":"03 · ROOT","beat":1,"color":"amber"},{"t":"04 · LEAF","beat":1,"color":"amber"},{"t":"05 · ROW","beat":1,"color":"green"}],"badgeFadeBeat":2,
 "headlines":[{"beat":0,"parts":[{"t":"Find "},{"t":"one row","tint":true},{"t":" in a billion."}]},{"beat":3,"parts":[{"t":"Start at the "},{"t":"root.","tint":true}]}],
 "panels":[{"id":"heap","title":"TABLE HEAP","sub":"1,000,000,000 rows","x":110,"y":450,"w":270,"h":110,"beat":1,"db":true,"color":"red"},
           {"id":"root","badge":"01","title":"ROOT PAGE","sub":"17 · 35 · 78","x":1130,"y":260,"w":250,"h":100,"beat":2,"color":"cyan"},
           {"id":"leaf2","title":"LEAF β","sub":"rows 17–77","x":1070,"y":630,"w":200,"h":95,"beat":2,"db":true,"color":"cyan"}],
 "edges":[{"id":"scan","path":"M 300 560 C 320 640 180 640 195 562","beat":1,"color":"red","dash":true,"label":"scan all","lx":245,"ly":700},
          {"id":"q1","path":"M 1290 330 C 1360 380 1395 400 1400 450","beat":3,"color":"amber","pulse":true,"label":"42 > 35 →","lx":1495,"ly":402}],
 "takeaways":[{"t":"every page ≈ 500 sorted keys","color":"green"},{"t":"depth ≈ log₅₀₀(N) → 3–4 hops","color":"amber"},{"t":"one lookup, always fast","color":"cyan"}],
 "takeawaysBeat":7,"outro":"a billion rows, four hops",
 "beats":[{"i":0,"text":"You ask for one user, by id. Somewhere inside a billion rows."},{"i":1,"text":"Without an index, the database scans the whole table. Row, by row, by row."}]}`;

async function callLLM(messages) {
  if (GROQ) {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + GROQ },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages, temperature: 0.4, max_tokens: 16384
      })
    });
    if (!r.ok) throw new Error('groq ' + r.status + ': ' + (await r.text()).slice(0, 200));
    return (await r.json()).choices[0].message.content;
  }
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' +
    (process.env.GEMINI_MODEL || 'gemini-2.5-flash') + ':generateContent?key=' + GEM, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { temperature: 0.4, maxOutputTokens: 32768 }
    })
  });
  if (!r.ok) throw new Error('gemini ' + r.status + ': ' + (await r.text()).slice(0, 200));
  return (await r.json()).candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
}

function parseJSONLoose(text) {
  const t = String(text).replace(/```json|```/g, '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  return JSON.parse(t.slice(a, b + 1));
}

async function generate(topic, priorErrors, priorSpecFile) {
  const user = [
    waveNote ? 'TREND CONTEXT:\n' + waveNote + '\nHook rule for waves: ride the attention, teach the evergreen machine underneath.' : '',
    priorSpecFile
      ? 'Your previous JSON for this topic failed validation. Here it is — fix ONLY these errors and return the FULL corrected JSON:\n' + priorErrors
      : '',
    'TOPIC: ' + topic,
    'TARGET: ' + (longform ? 'longform YouTube episode' : 'short demo episode'),
    priorSpecFile ? '\nPREVIOUS JSON:\n' + fs.readFileSync(priorSpecFile, 'utf8').slice(0, 24000) : ''
  ].filter(Boolean).join('\n\n');
  return callLLM([
    { role: 'system', content: 'You are a senior engineer + YouTube scriptwriter for a diagram-animation channel.\n' + STYLE_RULES + '\n' + SCHEMA_RULES + '\n' + FEWSHOT },
    { role: 'user', content: user }
  ]);
}

// ---------- main
const specPath = outArg || path.join('specs', `${today}-${slug(topic)}.json`);
let errors = null;
let spec = null;
for (let attempt = 0; attempt < 3; attempt++) {
  process.stdout.write(`[write-spec] generating (attempt ${attempt + 1})...\n`);
  const raw = await generate(topic, errors, attempt > 0 ? specPath : null);
  try {
    spec = parseJSONLoose(raw);
  } catch (e) {
    errors = 'JSON parse error: ' + e.message;
    console.error('[write-spec] ' + errors);
    continue;
  }
  spec.id = spec.id || `${today}-${slug(topic)}`;
  spec.voice = spec.voice || 'en-US-GuyNeural';
  spec.rate = spec.rate || '+6%';
  if (waveNote) spec.waveNote = waveNote;
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
  const chk = spawnSync('node', ['check-spec.mjs', specPath], { encoding: 'utf8', shell: process.platform === 'win32' });
  if (chk.status === 0) {
    console.log((chk.stdout || '').trim());
    break;
  }
  errors = (chk.stderr || '') + (chk.stdout || '');
  console.error('[write-spec] check failed — feeding errors back for repair:\n' + errors.trim().slice(0, 600));
  spec = null;
}
if (!spec) { console.error('[write-spec] spec still failing after retries'); process.exit(1); }

// register in the ledger (publish-diagram picks status:"new")
const INDEX = path.join('specs', 'index.json');
const idx = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
if (!idx.specs.find((s) => s.file === specPath.replace(/\\/g, '/').replace(/^specs\//, 'specs/'))) {
  idx.specs.unshift({
    file: specPath.replace(/\\/g, '/'),
    topic,
    status: 'new',
    longform: spec.longform === true,
    generated: new Date().toISOString()
  });
  idx.updated = new Date().toISOString();
  fs.writeFileSync(INDEX, JSON.stringify(idx, null, 2));
}
console.log(`[write-spec] DONE ${specPath} — "${spec.title}" (${(spec.beats || []).length} beats, longform=${spec.longform === true})`);

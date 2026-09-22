// YouTube search-phrase research for metadata SEO.
// Harvests REAL user queries from YouTube's public autocomplete endpoint
// (suggestqueries.google.com, ds=yt — the dropdown you see when typing in
// YouTube search). No API key, no quota; ~4 requests per video.
//   research(topic) -> { title, searchPhrase, tags, suggestions }
//   CLI: node tools/yt-research.mjs --topic "How Git Actually Works"
// Non-English and navigational (other channels') queries are filtered out.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ENDPOINT = 'https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl=en&q=';
// non-English targeting + navigational brand queries — never titles, never tags
const DROP = /in (hindi|tamil|telugu|urdu|bengali|punjabi|malayalam|marathi|kannada|arabic|spanish|french|german|portuguese|russian|turkish|indonesian|korean|japanese|chinese|urdu)|computerphile|fireship|vsauce|khan academy/i;
const STOP = new Set(['how', 'does', 'do', 'the', 'a', 'an', 'actually', 'work', 'works', 'working', 'what', 'is', 'in', 'to', 'of', 'and', 'vs', 'for', 'with', 'you', 'really', 'it', 'its', 'are', 'why']);
const LANG_RE = /[^a-z0-9 ]/g;

function topicWords(t) {
  return t.toLowerCase().replace(LANG_RE, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
}
async function fetchSuggest(q) {
  const res = await fetch(ENDPOINT + encodeURIComponent(q.toLowerCase()), { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error('suggest HTTP ' + res.status);
  const j = await res.json();
  return Array.isArray(j?.[1]) ? j[1].map(String) : [];
}
function seeds(topic) {
  const t = topic.trim();
  const core = t.replace(/^how\s+(does|do|to)\s+/i, '').replace(/\s+actually\s+/i, ' ').replace(/\s+(work|works)\s*$/i, '').trim();
  // long conversational topics ("What Really Happens When You ...") — strip intensifiers
  const compressed = t.replace(/what really happens when/i, 'what happens when').replace(/\b(really|actually|just)\b\s*/gi, '').replace(/\s+/g, ' ').trim();
  const s = [t, compressed, t + ' explained'];
  if (core && core.length > 2) s.push(`how does ${core} work`, `what is ${core}`, `${core} explained`);
  return [...new Set(s.map(x => x.toLowerCase()))].filter(x => x.length >= 4 && x.length <= 90);
}
export async function research(topic) {
  const tw = topicWords(topic);
  const out = new Map(); // lower -> original casing
  for (const q of seeds(topic)) {
    try {
      for (const s of await fetchSuggest(q)) {
        const k = s.toLowerCase();
        if (!out.has(k) && s.length <= 90 && !DROP.test(s)) out.set(k, s);
      }
    } catch { /* one seed failing is fine */ }
  }
  // keep only queries that share enough of the topic's subject words (no drift)
  const kept = [...out.entries()].filter(([, s]) => {
    const sw = new Set(topicWords(s));
    const hit = tw.filter(w => sw.has(w)).length;
    return tw.length === 0 || hit >= Math.max(1, Math.ceil(tw.length / 2));
  }).map(([, s]) => s);

  // title: best brand-pattern phrase among kept candidates + the topic itself
  const score = (s) => {
    const l = s.toLowerCase();
    let v = 0;
    if (l.startsWith('how ')) v += 2;
    if (/\b(work|works|working)\b/.test(l)) v += 2;
    if (/\b(explained)\b/.test(l)) v += 1;
    if (s.length >= 30 && s.length <= 70) v += 3; else if (s.length <= 85) v += 1;
    v += 4 * (tw.filter(w => l.includes(w)).length / Math.max(tw.length, 1));
    if (/\b(beginners?|tutorial|course|free|download|2024|2025)\b/.test(l)) v -= 2;
    return v;
  };
  const candidates = [...new Set([topic.trim(), ...kept])];
  const best = candidates.slice().sort((a, b) => score(b) - score(a))[0];
  // The brand topic is usually the best title already (proper case, brand pattern).
  // A suggestion only replaces it when the topic lacks a question pattern AND the
  // suggestion clearly wins — rendered in sentence case (autocomplete is lowercase).
  const hasPattern = /^(how|what|why|when)\b/i.test(topic.trim());
  let title = topic.trim();
  if (!hasPattern && best !== topic.trim() && score(best) >= score(topic.trim()) + 2) {
    title = best.charAt(0).toUpperCase() + best.slice(1);
  }
  const searchPhrase = kept.length ? kept.sort((a, b) => score(b) - score(a))[0] : topic.trim();

  // tags: real queries + brand terms, <=15 items, <=500 chars total (YouTube limits)
  const brand = ['how dev works', topic.trim(), 'programming explained', 'software engineering'];
  const tags = [];
  let total = 0;
  for (const t of [...kept, ...brand]) {
    const tt = t.trim();
    if (tags.some(x => x.toLowerCase() === tt.toLowerCase())) continue;
    if (tt.length > 60 || total + tt.length > 490 || tags.length >= 15) continue;
    tags.push(tt); total += tt.length + 1;
  }
  return {
    title: title.slice(0, 100),
    searchPhrase,
    tags,
    suggestions: kept
  };
}

// CLI
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const i = process.argv.indexOf('--topic');
  const topic = i > 0 ? process.argv[i + 1] : 'How Git Actually Works';
  const r = await research(topic);
  console.log(JSON.stringify(r, null, 2));
}

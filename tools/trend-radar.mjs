// Trend radar — detect dev-world search waves and surface them for the channel.
// Strategy (see BRANDING/roadmap): never chase the news itself; explain the thing
// the news made people curious about. This scanner:
//   1. Hacker News front page (Algolia API) — points = dev-world attention
//   2. YouTube mostPopular in Education (27) + Science&Tech (28) — official API
// Stories that are ALREADY explainer-shaped ("How X...", "Why Y...", "Inside Z")
// get injected into the topic bank as `wave` topics (72h expiry, top priority).
// Everything else noteworthy goes to the phone as a wave suggestion only.
//   node tools/trend-radar.mjs   (workflow: trend-radar.yml, daily)
import fs from 'fs';

const BANK_FILE = 'state/tech-topic-bank.json';
const WAVE_HOURS = 72;          // reactive waves decay fast
const HN_MIN_POINTS = 120;      // front-page attention worth riding
const MAX_INJECT = 2;           // never flood the bank with waves

const log = (m) => console.log('[radar] ' + m);

function loadBank() {
  try { const b = JSON.parse(fs.readFileSync(BANK_FILE, 'utf8')); if (Array.isArray(b.topics)) return b; } catch { }
  return { updated: null, topics: [] };
}
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const overlapsBank = (bank, title) => {
  const t = norm(title);
  return bank.topics.some(b => {
    const bt = norm(b.title);
    return bt === t || (bt.length > 12 && t.length > 12 && (bt.includes(t) || t.includes(bt)));
  });
};
const explainerShaped = (title) =>
  /^(how|why|what|inside|under the hood|the hidden|the truth)\b/i.test(title) || /\b(actually works|under the hood|really works)\b/i.test(title);
const devRelevant = (title) =>
  /\b(code|coding|program|developer|software|database|api|server|javascript|typescript|python|rust|golang|git|linux|browser|compiler|framework|cloud|dns|https|ssl|outage|breach|open source|ai model|llm|engine|runtime|docker|kubernetes)\b/i.test(title);

async function hnFrontPage() {
  const res = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30', { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error('HN HTTP ' + res.status);
  const j = await res.json();
  return (j.hits || []).filter(h => h.title && h.points).map(h => ({
    source: 'HN', title: h.title.replace(/^(Show|Launch) HN:\s*/i, '').trim(),
    points: h.points, comments: h.num_comments || 0, url: h.url || ('https://news.ycombinator.com/item?id=' + h.objectID)
  })).filter(h => devRelevant(h.title));
}

async function ytTrending() {
  try {
    const { google } = await import('googleapis');
    const oauth = new google.auth.OAuth2(process.env.YOUTUBE_CLIENT_ID, process.env.YOUTUBE_CLIENT_SECRET);
    oauth.setCredentials({ refresh_token: process.env.TECH_YT_REFRESH_TOKEN });
    const yt = google.youtube({ version: 'v3', auth: oauth });
    const out = [];
    for (const cat of ['27', '28']) {
      const r = await yt.videos.list({ part: 'snippet', chart: 'mostPopular', videoCategoryId: cat, regionCode: 'US', maxResults: 15 });
      for (const v of r.data.items || []) {
        const t = v.snippet?.title;
        if (t && devRelevant(t)) out.push({ source: 'YT-' + (cat === '27' ? 'edu' : 'tech'), title: t, points: 0, comments: 0, url: 'https://youtube.com/watch?v=' + v.id });
      }
    }
    return out;
  } catch (e) { log('YT trending skipped: ' + String(e.message || e).slice(0, 80)); return []; }
}

function notify(title, body) {
  const t = (process.env.NTFY_TOPIC || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!t) return;
  fetch('https://ntfy.sh/' + t, { method: 'POST', headers: { 'Title': title, 'Tags': 'rotating_light' }, body }).catch(() => {});
}

const bank = loadBank();
const before = bank.topics.length;

// --- HN: explainer-shaped stories become wave topics; the rest are suggestions
const hn = await hnFrontPage();
log('HN dev-relevant front-page stories: ' + hn.length);
const hot = hn.filter(h => h.points >= HN_MIN_POINTS).sort((a, b) => b.points - a.points);
const injected = [];
for (const h of hot) {
  if (injected.length >= MAX_INJECT) break;
  if (overlapsBank(bank, h.title)) continue;
  if (!explainerShaped(h.title)) {
    log('SUGGESTION (not auto-injected): "' + h.title + '" [' + h.points + ' pts] — shape it into a topic manually if it fits.');
    continue;
  }
  const expires = new Date(Date.now() + WAVE_HOURS * 3600 * 1000).toISOString();
  bank.topics.push({
    id: 'wave-' + new Date().toISOString().slice(0, 10) + '-' + (injected.length + 1),
    title: h.title.slice(0, 90), url: h.url, source: 'HN front page',
    tags: [], score: 600 + injected.length, addedAt: new Date().toISOString().slice(0, 10),
    status: 'new', wave: true, expires
  });
  injected.push(h);
  log('WAVE injected: "' + h.title + '" [' + h.points + ' pts, expires ' + expires.slice(0, 10) + ']');
}

// --- YouTube trending (Education/Tech): awareness only, never auto-injected
const yt = await ytTrending();
log('YT trending dev-relevant titles: ' + yt.length);

// --- prune expired waves while we're here
const live = [];
for (const t of bank.topics) {
  if (t.wave && t.expires && new Date(t.expires) < new Date()) { log('wave expired, dropped: "' + t.title + '"'); continue; }
  live.push(t);
}
bank.topics = live;
bank.updated = new Date().toISOString();

if (bank.topics.length !== before || injected.length) {
  fs.mkdirSync('state', { recursive: true });
  fs.writeFileSync(BANK_FILE, JSON.stringify(bank, null, 2));
  log('bank saved: ' + bank.topics.length + ' topics');
}
if (injected.length) {
  notify('How Dev Works - WAVE', injected.map(h => '🚨 ' + h.title + ' (' + h.points + ' pts)').join('\n') + '\n\nNext publish rides this wave.');
} else {
  log('no waves today — evergreen queue continues');
}

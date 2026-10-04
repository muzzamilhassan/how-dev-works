// Trend radar — detect dev-world search waves and surface them for the channel.
// Strategy (see BRANDING/roadmap): never chase the news itself; explain the thing
// the news made people curious about. This scanner:
//   1. Hacker News front page (Algolia API) — points = dev-world attention
//   2. daily.dev latest feed (public GraphQL) — dev-native aggregator attention
//   3. Reddit top/week over 6 tech subs (official OAuth; skipped without secrets)
//   4. Google Trends daily RSS — catch-net for search-side waves HN misses
//   5. Techmeme + GitHub Trending RSS — awareness/suggestions only
//   6. Google News amplifier — promotes an existing bank topic to a wave when
//      its keyword spikes vs the previous week ("the news made my evergreen urgent")
//   7. YouTube mostPopular in Education (27) + Science&Tech (28) — official API
// Stories that are ALREADY explainer-shaped get injected into the topic bank as
// `wave` topics (72h expiry, top priority, max 2/day across sources 1–4).
// Everything else noteworthy goes to the phone as a suggestion only.
// Source rationale + endpoint verification: docs/research/2026-09-23-hot-topics-and-trend-platforms.md
//   node tools/trend-radar.mjs   (workflow: trend-radar.yml, daily; also run
//   fresh inside publish-diagram.yml right before every diagram episode)
import fs from 'fs';

const BANK_FILE = process.env.RADAR_BANK_FILE || 'state/tech-topic-bank.json';
const WAVE_HOURS = 72;          // reactive waves decay fast
const HN_MIN_POINTS = 120;      // front-page attention worth riding
const DAILYDEV_MIN_UPVOTES = 120; // daily.dev community upvotes worth riding (keyless latest feed)
const REDDIT_MIN_UPS = 1500;    // r/top?t=week upvotes worth riding
const TRENDS_WAVE_MIN = 50000;  // approx_traffic needed to inject a trend
const TRENDS_SUGGEST_MIN = 2000;// approx_traffic worth even suggesting
const AMP_MIN_RECENT = 40;      // amplifier: articles on keyword, last 7d...
const AMP_SPIKE = 1.6;          // ...and >=1.6x the previous 7d (raw counts saturate at 100)
const AMP_MAX = 1;              // max amplifier promotions/day
const AMP_MAX_QUERIES = 15;     // politeness cap on Google News queries
const MAX_INJECT = 2;           // never flood the bank with waves
const MAX_SUGGEST = 6;          // suggestions in the daily phone push

const UA = 'how-dev-works-radar/1.0 (GitHub Actions; topic research)';
const log = (m) => console.log('[radar] ' + m);

function loadBank() {
  try { const b = JSON.parse(fs.readFileSync(BANK_FILE, 'utf8')); if (Array.isArray(b.topics)) return b; } catch { }
  log('WARNING: ' + BANK_FILE + ' missing/corrupt — starting with an empty bank');
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

// --- tiny zero-dep RSS toolkit (Google/Techmeme/GitHubNews feeds all differ slightly)
const decode = (s) => String(s || '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const stripTags = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const pickField = (block, tag) => {
  const m = block.match(new RegExp('<' + tag + '(?:\\s[^>]*)?>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</' + tag + '>'));
  return m ? decode(m[1]).trim() : '';
};
const parseItems = (xml, cap) => {
  const out = [];
  const re = /<item>([\s\S]*?)<\/item>/g; let m;
  while ((m = re.exec(xml)) !== null && out.length < cap) {
    const b = m[1];
    out.push({ title: pickField(b, 'title'), link: pickField(b, 'link'), description: decode(stripTags(pickField(b, 'description'))), approx: pickField(b, 'ht:approx_traffic') });
  }
  return out.filter(i => i.title);
};
const parseTraffic = (s) => {   // "1,000+" | "50K+" | "2M+" -> number
  const m = String(s || '').replace(/,/g, '').match(/^([\d.]+)\s*([KM])?/i);
  if (!m) return 0;
  const mult = m[2] && m[2].toUpperCase() === 'M' ? 1e6 : m[2] && m[2].toUpperCase() === 'K' ? 1e3 : 1;
  return Math.round(parseFloat(m[1]) * mult);
};
async function fetchText(url, timeoutMs = 12000) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.text();
}

async function hnFrontPage() {
  const res = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30', { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error('HN HTTP ' + res.status);
  const j = await res.json();
  return (j.hits || []).filter(h => h.title && h.points).map(h => ({
    source: 'HN', title: h.title.replace(/^(Show|Launch) HN:\s*/i, '').trim(),
    points: h.points, comments: h.num_comments || 0, url: h.url || ('https://news.ycombinator.com/item?id=' + h.objectID)
  })).filter(h => devRelevant(h.title));
}

async function dailyDevTop() {
  // public keyless feed: { latest: Post[] } — verified 2026-10-04 (introspection
  // is disabled; `feed` needs auth, `latest` does not)
  try {
    const res = await fetch('https://api.daily.dev/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
      body: JSON.stringify({ query: '{ latest { title permalink numUpvotes source { name } } }' }),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    return ((j.data || {}).latest || []).filter(p => p.title && p.permalink).map(p => ({
      source: 'daily.dev', title: p.title, points: p.numUpvotes || 0,
      url: p.permalink, srcName: (p.source && p.source.name) || ''
    })).filter(h => devRelevant(h.title));
  } catch (e) { log('daily.dev skipped: ' + String(e.message || e).slice(0, 80)); return []; }
}

async function redditTopWeek() {
  const id = process.env.REDDIT_CLIENT_ID, secret = process.env.REDDIT_CLIENT_SECRET;
  const user = process.env.REDDIT_USERNAME, pass = process.env.REDDIT_PASSWORD;
  if (!id || !secret || !user || !pass) { log('Reddit skipped: set REDDIT_CLIENT_ID/SECRET/USERNAME/PASSWORD secrets'); return []; }
  try {
    const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(id + ':' + secret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA
      },
      body: new URLSearchParams({ grant_type: 'password', username: user, password: pass }),
      signal: AbortSignal.timeout(10000)
    });
    if (!tokenRes.ok) throw new Error('token HTTP ' + tokenRes.status);
    const { access_token: token } = await tokenRes.json();
    const out = [];
    for (const sub of ['programming', 'technology', 'Futurology', 'singularity', 'hardware', 'gadgets']) {
      const res = await fetch('https://oauth.reddit.com/r/' + sub + '/top?t=week&limit=25', {
        headers: { Authorization: 'Bearer ' + token, 'User-Agent': UA }, signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error('r/' + sub + ' HTTP ' + res.status);
      for (const c of (await res.json()).data?.children || []) {
        const d = c.data || {};
        if (d.stickied || !d.title) continue;
        if (devRelevant(d.title)) out.push({ source: 'Reddit r/' + sub, title: d.title, points: d.ups || 0, url: 'https://reddit.com' + (d.permalink || '') });
      }
    }
    return out;
  } catch (e) { log('Reddit skipped: ' + String(e.message || e).slice(0, 80)); return []; }
}

async function trendsRss() {
  try {
    const xml = await fetchText('https://trends.google.com/trending/rss?geo=US');
    return parseItems(xml, 20).map(it => ({ source: 'Trends', title: it.title, approx: it.approx, traffic: parseTraffic(it.approx) }))
      .filter(t => devRelevant(t.title));
  } catch (e) { log('Trends RSS skipped: ' + String(e.message || e).slice(0, 80)); return []; }
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

async function techmeme() {
  try {
    const xml = await fetchText('https://www.techmeme.com/feed.xml');
    return parseItems(xml, 15).map((it, i) => ({ source: 'Techmeme', rank: i + 1, title: it.title }))
      .filter(t => devRelevant(t.title));
  } catch (e) { log('Techmeme skipped: ' + String(e.message || e).slice(0, 80)); return []; }
}

async function ghTrending() {
  try {
    const xml = await fetchText('https://mshibanami.github.io/GitHubTrendingRSS/daily/all.xml');
    return parseItems(xml, 12).map(it => ({ source: 'GitHub', title: it.title + (it.description ? ' — ' + it.description.slice(0, 110) : ''), url: it.link }))
      .filter(t => devRelevant(t.title));
  } catch (e) { log('GitHub trending skipped: ' + String(e.message || e).slice(0, 80)); return []; }
}

// Google News amplifier: for each open bank topic, count news on its most
// distinctive tag this week vs last week; a spike means the news made people
// curious about exactly what the topic explains. Raw counts saturate at 100
// and generic tags false-positive ("v8" cars, municipal "garbage collection"),
// so the week-over-week ratio is the real gate.
const GENERIC_TAGS = new Set(['ai', 'app', 'web', 'code', 'dev', 'os', 'ui', 'api']);
const newsCount = async (q, extra) => {
  const xml = await fetchText('https://news.google.com/rss/search?q=' + encodeURIComponent(q + ' ' + extra) + '&hl=en-US&gl=US&ceid=US:en');
  return (xml.match(/<item>/g) || []).length;
};
async function newsAmplifier(bank) {
  const candidates = bank.topics
    .filter(t => !t.wave && t.status === 'new' && Array.isArray(t.tags) && t.tags.length)
    .sort((a, b) => b.score - a.score).slice(0, AMP_MAX_QUERIES);
  log('amplifier checking ' + candidates.length + ' open topics');
  const day = 864e5, now = Date.now();
  const fmt = (t) => new Date(t).toISOString().slice(0, 10);
  const recentFrom = fmt(now - 7 * day), prevFrom = fmt(now - 14 * day), prevTo = fmt(now - 8 * day);
  const promoted = [];
  for (const t of candidates) {
    if (promoted.length >= AMP_MAX) break;
    const kw = (t.tags || []).filter(x => x && x.length >= 3 && !GENERIC_TAGS.has(x.toLowerCase()))
      .sort((a, b) => a.length - b.length)[0];
    if (!kw) continue;
    try {
      const recent = await newsCount(kw, 'after:' + recentFrom);
      if (recent < AMP_MIN_RECENT) { log('amp "' + kw + '": 7d=' + recent + ' (< ' + AMP_MIN_RECENT + ', skip)'); continue; }
      const prev = await newsCount(kw, 'after:' + prevFrom + ' before:' + prevTo);
      const spike = recent / Math.max(1, prev);
      log('amp "' + kw + '": 7d=' + recent + ' prev=' + prev + ' (' + spike.toFixed(1) + 'x)');
      if (spike < AMP_SPIKE) continue;
      t.wave = true;
      t.expires = new Date(now + WAVE_HOURS * 3600 * 1000).toISOString();
      t.waveFrom = 'news amplifier: "' + kw + '" ' + recent + ' articles this week (' + spike.toFixed(1) + 'x prev week)';
      promoted.push({ title: t.title, kw, recent, spike });
      log('AMPLIFIED: "' + t.title + '" — "' + kw + '" at ' + recent + ' articles (' + spike.toFixed(1) + 'x prev week)');
    } catch (e) { log('amplifier query failed for "' + kw + '": ' + String(e.message || e).slice(0, 60)); }
  }
  return promoted;
}

function notify(title, body) {
  const t = (process.env.NTFY_TOPIC || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!t) return;
  fetch('https://ntfy.sh/' + t, { method: 'POST', headers: { 'Title': title, 'Tags': 'rotating_light' }, body }).catch(() => {});
}

const bank = loadBank();
const before = bank.topics.length;
const suggestions = [];
const seen = new Set();
const suggest = (src, title, heat) => {
  const key = norm(title);
  if (!key || seen.has(key)) return;
  seen.add(key);
  suggestions.push('[' + src + '] ' + title + (heat ? ' (' + heat + ')' : ''));
};

// --- shared wave injection (HN first pick, then Reddit, then Trends)
const injected = [];
function injectWave(item) {
  const expires = new Date(Date.now() + WAVE_HOURS * 3600 * 1000).toISOString();
  bank.topics.push({
    id: 'wave-' + new Date().toISOString().slice(0, 10) + '-' + (injected.length + 1),
    title: item.title.slice(0, 90), url: item.url || '', source: item.source,
    tags: [], score: 600 + injected.length, addedAt: new Date().toISOString().slice(0, 10),
    status: 'new', wave: true, expires
  });
  injected.push(item);
  log('WAVE injected: "' + item.title + '" [' + item.source + ', ' + item.heat + ', expires ' + expires.slice(0, 10) + ']');
}

// --- 1. HN: explainer-shaped stories become wave topics; the rest are suggestions
const hn = await hnFrontPage();
log('HN dev-relevant front-page stories: ' + hn.length);
const hot = hn.filter(h => h.points >= HN_MIN_POINTS).sort((a, b) => b.points - a.points);
for (const h of hot) {
  if (injected.length >= MAX_INJECT) break;
  if (overlapsBank(bank, h.title)) continue;
  h.heat = h.points + ' pts';
  if (!explainerShaped(h.title)) {
    log('SUGGESTION (not auto-injected): "' + h.title + '" [' + h.points + ' pts] — shape it into a topic manually if it fits.');
    suggest(h.source, h.title, h.heat);
    continue;
  }
  injectWave(h);
}

// --- 1b. daily.dev latest — dev-native aggregator attention (keyless)
const dd = await dailyDevTop();
log('daily.dev dev-relevant posts: ' + dd.length);
const ddHot = dd.filter(h => h.points >= DAILYDEV_MIN_UPVOTES).sort((a, b) => b.points - a.points);
for (const d of ddHot) {
  if (injected.length >= MAX_INJECT) break;
  if (overlapsBank(bank, d.title)) continue;
  d.heat = d.points + ' ups' + (d.srcName ? ' · ' + d.srcName : '');
  if (!explainerShaped(d.title)) { suggest(d.source, d.title, d.heat); continue; }
  injectWave(d);
}

// --- 2. Reddit top/week (needs REDDIT_* secrets; silently skipped otherwise)
const reddit = await redditTopWeek();
log('Reddit top/week dev-relevant posts: ' + reddit.length);
const redditHot = reddit.filter(r => r.points >= REDDIT_MIN_UPS).sort((a, b) => b.points - a.points);
for (const r of redditHot) {
  if (injected.length >= MAX_INJECT) break;
  if (overlapsBank(bank, r.title)) continue;
  r.heat = r.points + ' ups';
  if (!explainerShaped(r.title)) { suggest(r.source, r.title, r.heat); continue; }
  injectWave(r);
}

// --- 3. Google Trends daily RSS: catch-net for search-side waves HN misses
const trends = await trendsRss();
log('Trends dev-relevant terms: ' + trends.length);
for (const t of trends.sort((a, b) => b.traffic - a.traffic)) {
  if (t.traffic < TRENDS_SUGGEST_MIN) continue;
  t.heat = t.approx + ' searches';
  if (injected.length < MAX_INJECT && t.traffic >= TRENDS_WAVE_MIN && explainerShaped(t.title) && !overlapsBank(bank, t.title)) { injectWave(t); continue; }
  suggest(t.source, t.title, t.heat);
}

// --- 4. Techmeme + GitHub trending: awareness only, never injected
const tm = await techmeme();
log('Techmeme dev-relevant top stories: ' + tm.length);
for (const t of tm) if (suggestions.length < 12) suggest(t.source + ' #' + t.rank, t.title, '');
const gh = await ghTrending();
log('GitHub trending dev-relevant repos: ' + gh.length);
for (const g of gh.slice(0, 4)) if (suggestions.length < 12) suggest(g.source, g.title, '');

// --- 5. amplifier: promote existing bank topics whose keyword is spiking in the news
const promoted = await newsAmplifier(bank);

// --- 6. YouTube trending (Education/Tech): awareness only, never auto-injected
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

if (bank.topics.length !== before || injected.length || promoted.length) {
  fs.mkdirSync('state', { recursive: true });
  fs.writeFileSync(BANK_FILE, JSON.stringify(bank, null, 2));
  log('bank saved: ' + bank.topics.length + ' topics');
}

// --- one consolidated daily phone push: waves, promotions, then suggestions
const lines = [];
lines.push(...injected.map(h => '🚨 WAVE: ' + h.title + ' (' + h.heat + ')'));
lines.push(...promoted.map(p => '📣 AMPLIFIED: ' + p.title + ' — "' + p.kw + '" ' + p.recent + ' articles, ' + p.spike.toFixed(1) + 'x'));
lines.push(...suggestions.slice(0, MAX_SUGGEST).map(s => '💡 ' + s));
if (lines.length) {
  console.log('[radar] daily push:\n' + lines.map(l => '  ' + l).join('\n'));
  notify('How Dev Works - Trend Radar', lines.join('\n') + (injected.length ? '\n\nNext publish rides this wave.' : ''));
} else {
  log('no waves today — evergreen queue continues');
}

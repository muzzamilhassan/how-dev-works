// Scrape YouTube search results: who else ranks in this niche?
// Usage: node search-scrape.mjs "query"
const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
  cookie: 'CONSENT=YES+cb.20240101-00-p0.en+FX+000; SOCS=CAI',
};
function deepFind(obj, key, out = []) {
  if (!obj || typeof obj !== 'object') return out;
  if (Array.isArray(obj)) { for (const v of obj) deepFind(v, key, out); return out; }
  for (const [k, v] of Object.entries(obj)) {
    if (k === key) out.push(v);
    deepFind(v, key, out);
  }
  return out;
}
const q = encodeURIComponent(process.argv[2] ?? 'history documentary hindi');
const r = await fetch(`https://www.youtube.com/results?search_query=${q}`, { headers: HEADERS });
const html = await r.text();
const m = html.match(/var ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s);
const data = JSON.parse(m[1]);
const rows = deepFind(data, 'videoRenderer').slice(0, 20).map(v => ({
  id: v.videoId,
  title: v.title?.runs?.[0]?.text,
  channel: v.ownerText?.runs?.[0]?.text,
  channelId: v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId,
  channelVerified: !!deepFind(v.ownerText, 'verifiedBadge').length,
  views: v.viewCountText?.simpleText ?? v.shortViewCountText?.simpleText,
  when: v.publishedTimeText?.simpleText,
  length: v.lengthText?.simpleText,
}));
console.log(JSON.stringify(rows, null, 2));

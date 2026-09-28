// Channel probe: pulls raw data straight from YouTube pages (no API key needed).
// Usage: node probe-channel.mjs <handle> [moreHandles...]
const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
  cookie: 'CONSENT=YES+cb.20240101-00-p0.en+FX+000; SOCS=CAI',
};

async function getPage(url) {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
  return r.text();
}

function extractInitialData(html) {
  const m = html.match(/var ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s)
    || html.match(/window\["ytInitialData"\]\s*=\s*(\{.+?\});/s);
  return m ? JSON.parse(m[1]) : null;
}

function deepFind(obj, key, out = []) {
  if (!obj || typeof obj !== 'object') return out;
  if (Array.isArray(obj)) { for (const v of obj) deepFind(v, key, out); return out; }
  for (const [k, v] of Object.entries(obj)) {
    if (k === key) out.push(v);
    deepFind(v, key, out);
  }
  return out;
}

function parseCount(s) {
  if (!s) return null;
  const t = String(s).replace(/views|subscribers|videos|watching/i, '').trim();
  const m = t.match(/^([\d.,]+)\s*([KM]?)/i);
  if (!m) return null;
  let n = parseFloat(m[1].replace(/,/g, ''));
  if (/K/i.test(m[2] || '')) n *= 1e3;
  if (/M/i.test(m[2] || '')) n *= 1e6;
  return Math.round(n);
}

function parseVids(data) {
  let vids = deepFind(data, 'videoRenderer').map(r => ({
    id: r.videoId,
    title: r.title?.runs?.[0]?.text ?? null,
    views: r.viewCountText?.simpleText ?? null,
    viewCount: parseCount(r.viewCountText?.simpleText),
    when: r.publishedTimeText?.simpleText ?? null,
    length: r.lengthText?.simpleText ?? null,
  }));
  if (!vids.length) {
    for (const l of deepFind(data, 'lockupViewModel')) {
      try {
        const parts = [];
        for (const row of l.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows ?? []) {
          for (const p of row.metadataParts ?? []) if (p.text?.content) parts.push(p.text.content);
        }
        vids.push({
          id: l.contentId,
          title: l.metadata?.lockupMetadataViewModel?.title?.content ?? null,
          views: parts.find(p => /view/i.test(p)) ?? null,
          viewCount: parseCount(parts.find(p => /view/i.test(p))),
          when: parts.find(p => /ago/i.test(p)) ?? null,
          length: parts.find(p => /:/i.test(p)) ?? null,
        });
      } catch { /* skip malformed */ }
    }
  }
  return vids;
}

async function probeHandle(handle) {
  const out = { handle };
  const base = handle.startsWith('UC') ? `https://www.youtube.com/channel/${handle}` : `https://www.youtube.com/@${handle}`;
  try {
    const aboutHtml = await getPage(`${base}/about`);
    const adata = extractInitialData(aboutHtml);
    const vm = deepFind(adata, 'aboutChannelViewModel')[0] ?? {};
    out.channelId = deepFind(adata, 'externalId')[0] ?? deepFind(adata, 'channelId')[0] ?? null;
    out.about = {
      title: vm.title ?? null,
      description: vm.description ?? null,
      country: vm.country ?? null,
      joined: vm.joinedDateText?.content ?? null,
      subscribersRaw: vm.subscriberCountText ?? null,
      subscribers: parseCount(vm.subscriberCountText),
      videoCountRaw: vm.videoCountText ?? null,
      videoCount: parseCount(vm.videoCountText),
      channelViewsRaw: vm.viewCountText ?? null,
      channelViews: parseCount(vm.viewCountText),
      links: (vm.links ?? []).map(l => l.channelExternalLinkViewModel?.title?.content + ' -> ' + l.channelExternalLinkViewModel?.link?.content),
    };
  } catch (e) { out.aboutError = String(e.message); }

  try {
    const vidHtml = await getPage(`${base}/videos`);
    const vdata = extractInitialData(vidHtml);
    out.channelId = out.channelId ?? deepFind(vdata, 'externalId')[0] ?? null;
    out.videos = parseVids(vdata);
    // tabs present (videos / shorts / live / playlists)
    out.tabs = deepFind(vdata, 'tabRenderer').map(t => t.title).filter(Boolean);
  } catch (e) { out.videosError = String(e.message); }

  if (out.channelId) {
    try {
      const rss = await getPage(`https://www.youtube.com/feeds/videos.xml?channel_id=${out.channelId}`);
      out.rss = [...rss.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => {
        const e = m[1];
        return {
          id: e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? null,
          title: e.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? null,
          published: e.match(/<published>([^<]+)<\/published>/)?.[1] ?? null,
          views: parseInt(e.match(/<media:statistics views="(\d+)"/)?.[1] ?? '0', 10),
        };
      });
    } catch (e) { out.rssError = String(e.message); }
  }
  return out;
}

const handles = process.argv.slice(2);
const results = [];
for (const h of handles) {
  try { results.push(await probeHandle(h)); }
  catch (e) { results.push({ handle: h, fatal: String(e.message) }); }
}
console.log(JSON.stringify(results, null, 2));

// Watch-page forensics: length, likes, comments, description, category, AI flags.
// Usage: node watch-probe.mjs <videoId> [moreIds...]
const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
  cookie: 'CONSENT=YES+cb.20240101-00-p0.en+FX+000; SOCS=CAI',
};

async function getJsonFromHtml(url, varName, re) {
  const r = await fetch(url, { headers: HEADERS });
  const html = await r.text();
  const m = html.match(re);
  return { html, data: m ? JSON.parse(m[1]) : null };
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

async function innerTube(body) {
  const r = await fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false', {
    method: 'POST',
    headers: { ...HEADERS, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return await r.json();
}

async function probeVideo(id) {
  const out = { id };
  try {
    const { html, data: pr } = await getJsonFromHtml(
      `https://www.youtube.com/watch?v=${id}`,
      'ytInitialPlayerResponse',
      /ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|<\/script>)/s
    );
    const vd = pr?.videoDetails ?? {};
    const mf = deepFind(pr, 'videoPrimaryInfoRenderer')[0] ?? {};
    out.video = {
      title: vd.title,
      author: vd.author,
      channelId: vd.channelId,
      lengthSeconds: vd.lengthSeconds,
      minutes: vd.lengthSeconds ? (parseInt(vd.lengthSeconds, 10) / 60).toFixed(1) : null,
      viewCount: vd.viewCount,
      keywords: vd.keywords ?? [],
      category: deepFind(pr, 'category')[0] ?? null,
      publishDate: deepFind(pr, 'publishDate')[0] ?? null,
      uploadDate: deepFind(pr, 'uploadDate')[0] ?? null,
    };
    // likes: multiple fallback regexes on raw html
    const likeMatch = html.match(/"likeCount":"?([\d,]+)"?/)
      ?? html.match(/like this video along with ([\d,.]+) (?:other people|others)/i)
      ?? html.match(/"accessibilityText":"?([\d,.]+)\s*likes"?/i);
    out.likesRaw = likeMatch ? likeMatch[1] : null;
    const commentMatch = html.match(/"commentCount":\{"simpleText":"([\d,]+)"\}/)
      ?? html.match(/"commentCount":\{"content":"([\d,]+)"\}/)
      ?? html.match(/([\d,.]+[KM]?) Comments/i);
    out.commentsRaw = commentMatch ? commentMatch[1] : null;
    out.description = (vd.shortDescription ?? '').slice(0, 1200);
    // AI / synthetic content disclosures
    out.syntheticFlags = [...new Set((html.match(/"[^"]*synthetic[^"]*"/gi) ?? []).concat(html.match(/"[^"]*altered[^"]*"/gi) ?? []))].slice(0, 5);
    out.chapters = deepFind(pr, 'chapterRenderer').map(c => c.chapterRenderer?.title?.simpleText).filter(Boolean).slice(0, 15);

    // comments via innertube
    try {
      const next = await innerTube({ context: { client: { clientName: 'WEB', clientVersion: '2.20240901.00.00', hl: 'en', gl: 'US' } }, videoId: id });
      const sections = deepFind(next, 'itemSectionRenderer').filter(s => s.itemSectionRenderer?.sectionIdentifier === 'comment-item-section');
      const contToken = deepFind(sections[0] ?? {}, 'continuationCommand')[0]?.token;
      if (contToken) {
        const cpage = await innerTube({ context: { client: { clientName: 'WEB', clientVersion: '2.20240901.00.00', hl: 'en', gl: 'US' } }, continuation: contToken });
        const payloads = deepFind(cpage, 'commentEntityPayload').map(p => ({
          author: p.properties?.author?.displayName,
          when: p.properties?.publishedTime,
          likes: p.toolbar?.likeCountNotliked,
          text: (p.properties?.content?.content ?? '').slice(0, 160),
        }));
        out.commentSample = payloads.slice(0, 15);
        out.commentCountSeen = payloads.length;
      } else {
        out.commentSample = 'no comment section token found';
      }
    } catch (e) { out.commentError = String(e.message); }
  } catch (e) { out.error = String(e.message); }
  return out;
}

const ids = process.argv.slice(2);
const results = [];
for (const id of ids) results.push(await probeVideo(id));
console.log(JSON.stringify(results, null, 2));

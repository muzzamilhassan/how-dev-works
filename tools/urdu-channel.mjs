// Urdu channel lane — YouTube Data API tools for the Sealed Histories channel
// (Google account muzzamilhassandev@gmail.com). Fully separate from the tech lane:
// reads URDU_YT_REFRESH_TOKEN, never TECH_YT_REFRESH_TOKEN. The OAuth client
// (YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET) is shared with the tech lane — the
// account split happens on the consent screen, not in the keys. Setup:
// docs/urdu-youtube-automation.md
//
//   node tools/urdu-channel.mjs whoami                 → which channel the token hits + stats
//   node tools/urdu-channel.mjs uploads [--max 10]     → recent uploads (id, title, privacy)
//   node tools/urdu-channel.mjs upload --file out/urdu-demo/urdu-tea-demo.mp4 \
//        --title "عنوان" [--desc "..."] [--tags "a,b"] [--privacy private|public|unlisted] \
//        [--publish-at 2026-10-01T09:30:00Z] [--thumb assets/x.png] [--kids]
import fs from 'fs';
import { google } from 'googleapis';

// .env convenience (gitignored) — same loader as tools/get-refresh-token.mjs
try {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch (e) { /* no .env, env vars only */ }

const clientId = (process.env.YOUTUBE_CLIENT_ID || '').trim();
const clientSecret = (process.env.YOUTUBE_CLIENT_SECRET || '').trim();
const refresh = (process.env.URDU_YT_REFRESH_TOKEN || '').trim();
if (!clientId || !clientSecret || !refresh) {
  console.error('Missing YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / URDU_YT_REFRESH_TOKEN (env or .env).');
  console.error('Mint the Urdu token with: node tools/get-refresh-token.mjs --name URDU_YT_REFRESH_TOKEN --label "@SealedHistories"');
  process.exit(1);
}

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return (v === undefined || v.startsWith('--')) ? true : v;
}

const oauth = new google.auth.OAuth2(clientId, clientSecret);
oauth.setCredentials({ refresh_token: refresh });
const youtube = google.youtube({ version: 'v3', auth: oauth });

async function myChannel() {
  const r = await youtube.channels.list({ part: 'snippet,statistics,contentDetails', mine: true });
  return r.data.items && r.data.items[0];
}

const cmd = process.argv[2] || 'whoami';

if (cmd === 'whoami') {
  const ch = await myChannel();
  if (!ch) {
    console.error('Token works but this Google identity has no YouTube channel yet.');
    console.error('Create the channel first — see docs/urdu-youtube-automation.md step 1.');
    process.exit(1);
  }
  console.log('channel : ' + ch.snippet.title + (ch.snippet.customUrl ? ' (' + ch.snippet.customUrl + ')' : ''));
  console.log('id      : ' + ch.id);
  console.log('subs    : ' + (ch.statistics.subscriberCount || 'hidden'));
  console.log('views   : ' + (ch.statistics.viewCount || '0') + '  videos: ' + (ch.statistics.videoCount || '0'));
  if (ch.snippet.title === 'How Dev Works') {
    console.error('WRONG LANE: this token points at the tech channel. Re-mint it signed in as');
    console.error('muzzamilhassandev@gmail.com and pick the Sealed Histories identity on the consent screen.');
    process.exit(1);
  }
} else if (cmd === 'uploads') {
  const ch = await myChannel();
  if (!ch) { console.error('no channel on this token'); process.exit(1); }
  const up = ch.contentDetails.relatedPlaylists.uploads;
  const r = await youtube.playlistItems.list({ part: 'snippet,status', playlistId: up, maxResults: Math.min(Number(arg('max', 10)), 50) });
  for (const it of r.data.items || []) {
    console.log((it.snippet.resourceId.videoId || '') + '  [' + (it.status.privacyStatus || '?') + ']  ' + it.snippet.title);
  }
} else if (cmd === 'upload') {
  const file = arg('file');
  const title = arg('title');
  if (file === true || !file || !title || title === true) {
    console.error('usage: upload --file <video> --title "<title>" [--desc] [--tags] [--privacy] [--publish-at] [--thumb] [--kids]');
    process.exit(1);
  }
  if (!fs.existsSync(file)) { console.error('no such file: ' + file); process.exit(1); }
  let privacy = String(arg('privacy', 'private'));
  const publishAt = arg('publish-at');
  // YouTube rule: publishAt only means anything while the video is private
  if (publishAt && publishAt !== true) privacy = 'private';
  const desc = arg('desc', '') === true ? '' : String(arg('desc', ''));
  const tags = (arg('tags', '') === true ? '' : String(arg('tags', ''))).split(',').map(s => s.trim()).filter(Boolean);
  const res = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title: String(title),
        description: desc,
        tags: tags.length ? tags : undefined,
        defaultLanguage: 'ur',
        defaultAudioLanguage: 'ur'
      },
      status: {
        privacyStatus: privacy,
        publishAt: publishAt && publishAt !== true ? publishAt : undefined,
        selfDeclaredMadeForKids: arg('kids') === true
      }
    },
    media: { body: fs.createReadStream(file) }
  }, { onUploadProgress: evt => {
    if (!evt.total) return;
    const pct = Math.floor((evt.bytesRead / evt.total) * 100);
    if (pct % 10 === 0) process.stdout.write('\rupload ' + pct + '%  ');
  }});
  const videoId = res.data.id;
  console.log('\nUPLOADED: https://youtube.com/watch?v=' + videoId + '  (privacy ' + privacy +
    (publishAt && publishAt !== true ? ', public at ' + publishAt : '') + ')');
  const thumb = arg('thumb');
  if (thumb && thumb !== true) {
    if (!fs.existsSync(thumb)) { console.error('thumb not found, skipped: ' + thumb); process.exit(1); }
    await youtube.thumbnails.set({ videoId, media: { body: fs.createReadStream(thumb) } });
    console.log('THUMB SET: ' + thumb);
  }
} else {
  console.error('unknown command: ' + cmd + ' (whoami | uploads | upload)');
  process.exit(1);
}

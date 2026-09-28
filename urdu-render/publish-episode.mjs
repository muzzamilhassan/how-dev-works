// Publish a rendered episode + its promo Shorts to The Sealed Histories.
//   node publish-episode.mjs --script episodes/salt.json [--privacy public]
// Reads yt metadata from the script JSON; video files from out/urdu-episodes/.
// Creds: URDU_YT_REFRESH_TOKEN + YOUTUBE_CLIENT_ID/SECRET (env or repo-root .env).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

for (const f of [path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env'), path.join(process.cwd(), '.env')]) {
  try {
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  } catch (e) { /* try next */ }
}

const arg = (name, def) => {
  const i = process.argv.indexOf('--' + name);
  const v = i !== -1 ? process.argv[i + 1] : undefined;
  return (v === undefined || v?.startsWith('--')) ? def : v;
};
const sp = arg('script');
const PRIVACY = arg('privacy', 'public');
if (!sp) { console.error('FAIL: --script required'); process.exit(1); }
const S = JSON.parse(fs.readFileSync(path.resolve(sp), 'utf8'));
const slug = S.slug || path.basename(sp, '.json');
const clientId = (process.env.YOUTUBE_CLIENT_ID || '').trim();
const clientSecret = (process.env.YOUTUBE_CLIENT_SECRET || '').trim();
const refresh = (process.env.URDU_YT_REFRESH_TOKEN || '').trim();
if (!clientId || !clientSecret || !refresh) { console.error('FAIL: missing URDU_YT_REFRESH_TOKEN / YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET'); process.exit(1); }

const oauth = new google.auth.OAuth2(clientId, clientSecret);
oauth.setCredentials({ refresh_token: refresh });
const youtube = google.youtube({ version: 'v3', auth: oauth });

async function upload(file, title, desc, tags) {
  const res = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: { title, description: desc || '', tags: tags?.length ? tags : undefined, defaultLanguage: 'ur', defaultAudioLanguage: 'ur' },
      status: { privacyStatus: PRIVACY, selfDeclaredMadeForKids: false },
    },
    media: { body: fs.createReadStream(file) },
  }, { onUploadProgress: e => { if (!e.total) return; const p = Math.floor(e.bytesRead / e.total * 100); if (p % 25 === 0) process.stdout.write(p + '% '); } });
  console.log('\nUPLOADED:', 'https://youtube.com/watch?v=' + res.data.id, '[' + path.basename(file) + ']');
  return res.data.id;
}

const links = [];
const epFile = path.join(ROOT, 'out', 'urdu-episodes', slug + '.mp4');
links.push(await upload(epFile, S.yt.title, S.yt.desc, S.yt.tags));
for (const [n, sh] of (S.shorts || []).entries()) {
  const f = path.join(ROOT, 'out', 'urdu-episodes', `${slug}-short-${String(n + 1).padStart(2, '0')}.mp4`);
  if (!fs.existsSync(f)) { console.error('WARN: short missing, skipped:', f); continue; }
  links.push(await upload(f, sh.title, S.yt.title, (sh.tags || '').split(',').map(x => x.trim()).filter(Boolean)));
}
fs.writeFileSync(path.join(ROOT, 'out', 'urdu-episodes', slug + '-links.txt'), links.join('\n') + '\n');
console.log('ALL PUBLISHED (' + PRIVACY + '):\n' + links.join('\n'));

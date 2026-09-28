// One-time helper: get a YouTube API refresh token for the How Dev Works channel.
// Needs YOUTUBE_CLIENT_ID + YOUTUBE_CLIENT_SECRET (same values as the repo secrets) in
// env or a local .env file. One-time `npm install googleapis` first.
//   node tools/get-refresh-token.mjs
// 1) open the printed URL in a browser signed in to the Google account that owns @HowDevWorks
//    (brand channel → pick that channel identity on the consent screen)
// 2) click Allow — the code comes back to localhost automatically
// 3) save it:  gh secret set TECH_YT_REFRESH_TOKEN   (paste when prompted)
// If Google shows redirect_uri_mismatch: add http://localhost:4100 to the OAuth client's
// Authorized redirect URIs in Google Cloud Console and re-run.
import http from 'http';
import fs from 'fs';
import { google } from 'googleapis';

// .env convenience (gitignored)
try {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch (e) { /* no .env, env vars only */ }

const clientId = (process.env.YOUTUBE_CLIENT_ID || '').trim();
const clientSecret = (process.env.YOUTUBE_CLIENT_SECRET || '').trim();
if (!clientId || !clientSecret) {
  console.error('Missing YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET (set in env or .env).');
  process.exit(1);
}

const PORT = 4100;
// --name / --label: mint a token for another lane (e.g. the Urdu channel) with the same
// OAuth client. The account split happens on the consent screen — sign in there with the
// Google account that owns the target channel and pick that channel's identity.
//   node tools/get-refresh-token.mjs --name URDU_YT_REFRESH_TOKEN --label "@SealedHistories"
const argVal = (name, def) => {
  const i = process.argv.indexOf('--' + name);
  return (i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) ? process.argv[i + 1] : def;
};
const secretName = argVal('name', 'TECH_YT_REFRESH_TOKEN');
const channelLabel = argVal('label', '@HowDevWorks');
const redirectUri = argVal('redirect', 'http://localhost:4100');
const oauth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
const url = oauth.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/youtube']   // upload + thumbnails + playlists
});

console.log('\n1) Open this URL in a browser signed in to the Google account that owns ' + channelLabel + ':\n');
console.log(url);
console.log('\n   (redirect_uri_mismatch? in Google Cloud Console → the OAuth client → Redirect URIs,');
console.log('    add BOTH  http://localhost:4100  and  http://127.0.0.1:4100 , or pass --redirect http://127.0.0.1:4100)\n');

const code = await new Promise((resolve, reject) => {
  const server = http.createServer((req, res) => {
    const q = new URL(req.url, 'http://localhost:' + PORT).searchParams;
    server.close();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    if (q.get('error')) { res.end('Denied: ' + q.get('error')); reject(new Error(q.get('error'))); return; }
    res.end('<h2>Token received — you can close this tab.</h2>');
    resolve(q.get('code'));
  });
  server.listen(PORT, () => console.log('2) Waiting for approval on http://localhost:' + PORT + ' ...'));
});

const { tokens } = await oauth.getToken(code);
if (!tokens.refresh_token) {
  console.error('No refresh_token returned — re-run and make sure you click Allow.');
  process.exit(1);
}
console.log('\nREFRESH TOKEN (copy this):\n');
console.log(tokens.refresh_token);
console.log('\nSave it as the repo secret ' + secretName + ':');
console.log('  gh secret set ' + secretName + ' -R muzzamilhassan/how-dev-works   (paste when prompted)');
console.log('  or github.com → repo → Settings → Secrets and variables → Actions → New repository secret');
console.log('  (for the local Urdu lane: put it in .env as ' + secretName + '=...)');

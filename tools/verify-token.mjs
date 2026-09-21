// Validates TECH_YT_REFRESH_TOKEN without uploading: prints which channel the token
// belongs to (channels.list, 1 quota unit). Runs on GitHub via the
// "Verify YouTube token" workflow — nothing to run locally.
import { google } from 'googleapis';

const clientId = (process.env.YOUTUBE_CLIENT_ID || '').trim();
const clientSecret = (process.env.YOUTUBE_CLIENT_SECRET || '').trim();
const refresh = (process.env.TECH_YT_REFRESH_TOKEN || '').trim();
if (!clientId || !clientSecret || !refresh) {
  console.error('FAIL: missing YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / TECH_YT_REFRESH_TOKEN secrets');
  process.exit(1);
}
try {
  const oauth = new google.auth.OAuth2(clientId, clientSecret);
  oauth.setCredentials({ refresh_token: refresh });
  const youtube = google.youtube({ version: 'v3', auth: oauth });
  const r = await youtube.channels.list({ part: 'snippet', mine: true });
  const ch = r.data.items && r.data.items[0];
  if (!ch) {
    console.error('FAIL: token works but this Google identity has no YouTube channel');
    process.exit(1);
  }
  console.log('OK: token valid — uploads will go to: ' + ch.snippet.title +
    (ch.snippet.customUrl ? ' (' + ch.snippet.customUrl + ')' : '') +
    ' — channel id ' + ch.id);
  if (ch.snippet.title !== 'How Dev Works') {
    console.log('WARN: channel title is not "How Dev Works" — you may have authorized the wrong Google identity.');
  }
} catch (e) {
  console.error('FAIL: ' + (e.message || e));
  process.exit(1);
}

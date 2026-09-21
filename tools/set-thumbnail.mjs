// Manually (re)set a video's custom thumbnail via the YouTube API.
// Runs on GitHub via the "Set thumbnail" workflow. Env:
//   YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / TECH_YT_REFRESH_TOKEN (repo secrets)
//   INPUT_VIDEO_ID, THUMB_FILE (workflow inputs)
import fs from 'fs';
import { google } from 'googleapis';

const clientId = (process.env.YOUTUBE_CLIENT_ID || '').trim();
const clientSecret = (process.env.YOUTUBE_CLIENT_SECRET || '').trim();
const refresh = (process.env.TECH_YT_REFRESH_TOKEN || '').trim();
const videoId = (process.env.INPUT_VIDEO_ID || '').trim();
const file = (process.env.THUMB_FILE || '').trim();
if (!videoId || !file || !fs.existsSync(file)) {
  console.error('FAIL: need INPUT_VIDEO_ID and a readable THUMB_FILE');
  process.exit(1);
}
try {
  const oauth = new google.auth.OAuth2(clientId, clientSecret);
  oauth.setCredentials({ refresh_token: refresh });
  const youtube = google.youtube({ version: 'v3', auth: oauth });
  await youtube.thumbnails.set({ videoId, media: { body: fs.createReadStream(file) } });
  console.log('OK: thumbnail set on https://youtube.com/watch?v=' + videoId);
} catch (e) {
  const msg = String(e?.message || e);
  console.error('FAIL: ' + msg.slice(0, 200));
  if (/forbidden|unauthorized|verification/i.test(msg)) {
    console.error('HINT: custom thumbnails need a phone-verified channel — visit youtube.com/verify, then re-run.');
  }
  process.exit(1);
}

// Permanently delete one of the channel's own videos via the YouTube API.
// For retracting wrong-content uploads (e.g. a video that carried the old fallback script).
// Runs on GitHub via the "Delete video" workflow. Env:
//   YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / TECH_YT_REFRESH_TOKEN (repo secrets)
//   INPUT_VIDEO_ID, CONFIRM (must be exactly DELETE)
import { google } from 'googleapis';

const clientId = (process.env.YOUTUBE_CLIENT_ID || '').trim();
const clientSecret = (process.env.YOUTUBE_CLIENT_SECRET || '').trim();
const refresh = (process.env.TECH_YT_REFRESH_TOKEN || '').trim();
const videoId = (process.env.INPUT_VIDEO_ID || '').trim();
const confirm = (process.env.CONFIRM || '').trim();
if (!videoId || confirm !== 'DELETE') {
  console.error('FAIL: need INPUT_VIDEO_ID and CONFIRM exactly "DELETE" — this is permanent');
  process.exit(1);
}
try {
  const oauth = new google.auth.OAuth2(clientId, clientSecret);
  oauth.setCredentials({ refresh_token: refresh });
  const youtube = google.youtube({ version: 'v3', auth: oauth });
  await youtube.videos.delete({ id: videoId });
  console.log('OK: deleted https://youtube.com/watch?v=' + videoId);
} catch (e) {
  console.error('FAIL: ' + String(e?.message || e).slice(0, 200));
  process.exit(1);
}

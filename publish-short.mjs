// How Dev Works — SHORTS lane (runs entirely in this repo; quarry-render is untouched).
// The render engine already ships a short script mode: dispatching tech-video.yml with
// minutes=1 makes it write a 60-100s punchy script (6-7 scenes, 30fps). This lane:
//   dispatch (minutes=1) -> wait -> download -> ffmpeg vertical repack (1080x1920,
//   brand overlay) -> upload PUBLIC immediately -> ledger state/shorts-published.json.
// Idempotent by artifact id, same discipline as the long lane.
//   node publish-short.mjs                -> auto-pick topic (promo for latest long video)
//   node publish-short.mjs --topic "..."  -> named short
//   node publish-short.mjs --test         -> full chain incl. vertical repack, NO upload
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { google } from 'googleapis';

const RENDER_REPO = 'muzzamilhassan/quarry-render';
const RENDER_WORKFLOW = 'tech-video.yml';           // same workflow — minutes=1 switches it to short scripts
const ARTIFACT_NAME = 'tech-video';
const BANK_FILE = 'state/tech-topic-bank.json';
const SHORTS_FILE = 'state/shorts-published.json';
const MIN_DUR = 20, MAX_DUR = 180;                  // Shorts window (YouTube allows <=180s)
const BRAND_BG = '0x0D1117', BRAND_CYAN = '0x22D3EE';

function log(m) { console.log('[short] ' + m); }
function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return (v === undefined || v.startsWith('--')) ? true : v;
}
function sh(cmd, args) { const r = spawnSync(cmd, args, { encoding: 'utf8' }); return { status: r.status, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim() }; }
function gh(args) { const r = sh('gh', args); if (r.status !== 0) throw new Error('gh ' + args.join(' ') + ' failed: ' + r.stderr.slice(0, 200)); return r.stdout; }
function ghJson(args) { try { return JSON.parse(gh(args)); } catch { return null; } }
function loadJson(f, d) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } }
function saveJson(f, d) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(d, null, 2)); }

function dispatchShort(topic) {
  // fallback=false: shorts rely on the engine's short-script AI prompt (the long
  // curated fallback would render long-form; the duration guard below rejects that).
  gh(['workflow', 'run', RENDER_WORKFLOW, '-R', RENDER_REPO,
    '-f', 'topic=' + topic, '-f', 'minutes=1', '-f', 'fallback=false', '-f', 'voice=']);
  log('Short render dispatched: "' + topic + '" (minutes=1 script mode)');
}

function findRun(afterMs) {
  const runs = ghJson(['run', 'list', '-R', RENDER_REPO, '-w', RENDER_WORKFLOW, '--status', 'success', '--limit', '5', '--json', 'databaseId,createdAt']) || [];
  for (const r of runs) if (new Date(r.createdAt).getTime() >= afterMs) return r;
  return null;
}
function artifactFor(runId) {
  const j = ghJson(['api', 'repos/' + RENDER_REPO + '/actions/runs/' + runId + '/artifacts', '--jq', '.artifacts']) || [];
  return j.find(a => a.name === ARTIFACT_NAME) || null;
}
function waitForRender(startedMs, minutes) {
  const deadline = Date.now() + minutes * 60 * 1000;
  while (Date.now() < deadline) {
    const run = findRun(startedMs);
    if (run) {
      const art = artifactFor(run.databaseId);
      if (art) return { run, art };
      log('Run ' + run.databaseId + ' succeeded, artifact not ready yet...');
    }
    process.stdout.write('[short] waiting for render (' + Math.round((deadline - Date.now()) / 60000) + ' min left)\r');
    spawnSync('sleep', ['60']);
  }
  throw new Error('render did not finish in time');
}
function downloadArtifact(runId) {
  const inbox = 'inbox/short-' + runId;
  fs.rmSync(inbox, { recursive: true, force: true });
  fs.mkdirSync(inbox, { recursive: true });
  gh(['run', 'download', String(runId), '-R', RENDER_REPO, '-n', ARTIFACT_NAME, '-D', inbox]);
  const f = path.join(inbox, fs.readdirSync(inbox).find(f => f.endsWith('.mp4')));
  if (!f || !fs.existsSync(f)) throw new Error('no mp4 in artifact');
  return f;
}
function durationSec(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  const d = parseFloat((r.stdout || '').trim());
  return isFinite(d) ? Math.round(d) : 0;
}

// Landscape 1920x1080 -> vertical 1080x1920: explainer strip centered on the brand
// background, logo + channel name up top, handle at the bottom. cardPng (a generated
// 1080x1920 title card) is overlaid on the FIRST ~0.8s: YouTube Shorts can't take
// custom thumbnail uploads, so the branded card becomes the video's first frame —
// that's what the auto-thumbnail and the in-app frame picker land on.
function makeVertical(inFile, outFile, cardPng) {
  const wm = path.join('branding', 'watermark-150.png');
  const font = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  const filter = [
    '[0:v]scale=1080:-2,setsar=1[vid]',
    `color=c=${BRAND_BG}:s=1080x1920:r=30[bg]`,
    '[bg][vid]overlay=0:656[base]',
    '[1:v]scale=110:110[wm]',
    '[base][wm]overlay=(W-w)/2:110[v1]',
    `[v1]drawtext=fontfile=${font}:text='HOW DEV WORKS':fontcolor=${BRAND_CYAN}:fontsize=44:x=(w-text_w)/2:y=250[v2]`,
    `[v2]drawtext=fontfile=${font}:text='@HowDevWorks':fontcolor=0x8B949E:fontsize=34:x=(w-text_w)/2:y=1810[v3]`,
    '[2:v]scale=1080:1920[card]',
    "[v3][card]overlay=0:0:enable='lte(t,0.8)'"
  ].join(';');
  const r = spawnSync('ffmpeg', ['-y', '-i', inFile, '-i', wm, '-i', cardPng,
    '-filter_complex', filter,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', outFile], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('ffmpeg vertical repack failed: ' + (r.stderr || '').slice(-300));
}

function pickTopic(bank, explicit) {
  if (explicit) return explicit;
  // Shorts promote the channel: default to the most recent PUBLISHED long video
  // (the 60-second version of it). No bank topic is consumed.
  const used = bank.topics.filter(t => t.status === 'used')
    .sort((a, b) => String(b.addedAt || '').localeCompare(String(a.addedAt || '')));
  if (used.length) return used[0].title;
  const idea = bank.topics.filter(t => t.status === 'new')
    .sort((a, b) => (b.curated ? 1 : 0) - (a.curated ? 1 : 0) || b.score - a.score)[0];
  return idea ? idea.title : null;
}

function buildDescription(topic) {
  return topic + ' — the whole idea in under two minutes. No hype, no fluff: just the machine, opened up.\n\n'
    + 'New deep-dive every week, shorts in between. Subscribe and finally see the whole machine.\n\n'
    + '#shorts #programming #softwareengineering #explained\n'
    + '📧 Business: muzzamilhassan302@gmail.com\n';
}

async function uploadYouTube(videoFile, topic) {
  const clientId = (process.env.YOUTUBE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.YOUTUBE_CLIENT_SECRET || '').trim();
  const refresh = (process.env.TECH_YT_REFRESH_TOKEN || '').trim();
  if (!clientId || !clientSecret || !refresh) throw new Error('missing YouTube secrets');
  const oauth = new google.auth.OAuth2(clientId, clientSecret);
  oauth.setCredentials({ refresh_token: refresh });
  const youtube = google.youtube({ version: 'v3', auth: oauth });
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: topic.slice(0, 100),
        description: buildDescription(topic),
        tags: ['shorts', 'programming', 'software engineering', 'explained', 'how it works'].slice(0, 15),
        categoryId: '27'
      },
      status: { privacyStatus: 'public', selfDeclaredMadeForKids: false }  // Shorts go live immediately
    },
    media: { body: fs.createReadStream(videoFile) }
  });
  return res.data.id;
}

function notify(title, body) {
  const t = (process.env.NTFY_TOPIC || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!t) return;
  fetch('https://ntfy.sh/' + t, { method: 'POST', headers: { 'Title': title, 'Tags': 'clapper' }, body }).catch(() => {});
}

async function main() {
  const isTest = arg('test') === true || arg('test') === 'true';
  const tArg = arg('topic', '');
  const topicArg = typeof tArg === 'string' && tArg.trim() ? tArg.trim() : (process.env.INPUT_TOPIC || '').trim();

  const shorts = loadJson(SHORTS_FILE, { uploads: [] });
  const publishedIds = shorts.uploads.map(u => String(u.artifactId));

  const bank = loadJson(BANK_FILE, { topics: [] });
  const topic = pickTopic(bank, topicArg);
  if (!topic) {
    log('GAP: no topic for short (empty bank).');
    notify('How Dev Works - GAP', 'Shorts run skipped: nothing to make a short about.');
    return;
  }
  log('Topic: ' + topic);

  const startedMs = Date.now();
  dispatchShort(topic);
  const { run, art } = waitForRender(startedMs, 45);
  if (publishedIds.includes(String(art.id))) { log('Artifact already published — done.'); return; }

  log('Downloading artifact ' + art.id + ' (run ' + run.databaseId + ')...');
  const inFile = downloadArtifact(run.databaseId);
  const dur = durationSec(inFile);
  log('Rendered: ' + dur + 's, ' + Math.round(fs.statSync(inFile).size / 1048576) + ' MB');
  if (dur < MIN_DUR || dur > MAX_DUR) {
    log('GAP: render is ' + dur + 's (window ' + MIN_DUR + '-' + MAX_DUR + 's) — likely fell back to long script. NOT publishing.');
    notify('How Dev Works - GAP', 'Short "' + topic + '" came out ' + dur + 's — outside Shorts window, not published.');
    return;
  }

  const outDir = path.dirname(inFile);
  const verticalFile = path.join(outDir, 'vertical.mp4');
  const cardPng = path.join(outDir, 'card.png');
  const g = spawnSync('node', [path.join('tools', 'make-thumbnail.mjs'), '--title', topic, '--out', cardPng, '--vertical'], { encoding: 'utf8' });
  if (g.status !== 0) throw new Error('title-card generator failed: ' + (g.stderr || '').slice(-140));
  log('Repacking to vertical 1080x1920 (branded first frame)...');
  makeVertical(inFile, verticalFile, cardPng);
  const vDur = durationSec(verticalFile);
  log('Vertical ready: ' + vDur + 's, ' + Math.round(fs.statSync(verticalFile).size / 1048576) + ' MB');
  if (vDur < MIN_DUR || vDur > MAX_DUR) throw new Error('vertical repack changed duration to ' + vDur + 's — refusing upload');
  if (isTest) { log('TEST mode — render + guard + vertical repack verified, upload skipped.'); return; }

  const videoId = await uploadYouTube(verticalFile, topic);
  log('SHORT LIVE: https://youtube.com/shorts/' + videoId);

  shorts.uploads.push({
    date: new Date().toISOString().slice(0, 10),
    title: topic, videoId, artifactId: art.id, runId: run.databaseId
  });
  saveJson(SHORTS_FILE, shorts);
  notify('How Dev Works - SHORT live', topic + '\nhttps://youtube.com/shorts/' + videoId);
}

main().catch(e => { log('FAIL: ' + (e.message || e)); notify('How Dev Works - SHORTS FAILED', String(e.message || e).slice(0, 180)); process.exit(1); });

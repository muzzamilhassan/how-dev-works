// How Dev Works — publish pipeline (single channel, single command).
// Modes:
//   node publish.mjs --topic "How Git Actually Works"   → dispatch render, wait, download, upload
//   node publish.mjs                                    → upload any rendered-but-unpublished video;
//                                                         if none, auto-pick top idea from topic bank
//   node publish.mjs --test                             → full chain but NO YouTube upload (safe)
// Idempotent: a rendered artifact (by artifact id) is never uploaded twice (state/published.json).
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { google } from 'googleapis';

const RENDER_REPO = 'muzzamilhassan/quarry-render';
const RENDER_WORKFLOW = 'tech-video.yml';
const ARTIFACT_NAME = 'tech-video';
const BANK_FILE = 'state/tech-topic-bank.json';
const PENDING_FILE = 'state/pending-renders.json';
const PUBLISHED_FILE = 'state/published.json';
const MIN_DURATION_SEC = 300;      // shorter renders are test renders — never publish
const SLOTS_UTC = [                // Tue + Fri 23:30 UTC = 19:30 ET (US prime evening)
  { dow: 2, h: 23, m: 30 },
  { dow: 5, h: 23, m: 30 }
];

function log(m) { console.log('[publish] ' + m); }
function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return (v === undefined || v.startsWith('--')) ? true : v;
}

function sh(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', env: process.env });
  return { status: r.status, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim() };
}
function gh(args) {
  const r = sh('gh', args);
  if (r.status !== 0) throw new Error('gh ' + args.join(' ') + ' failed: ' + r.stderr.slice(0, 200));
  return r.stdout;
}
function ghJson(args) { try { return JSON.parse(gh(args)); } catch (e) { return null; } }
function loadJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; } }
function saveJson(file, data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

function nextSlotUTC() {
  const now = new Date(Date.now() + 2 * 3600 * 1000); // must be ≥2h out (YouTube rule)
  for (let d = 0; d < 14; d++) {
    const t = new Date(now.getTime() + d * 24 * 3600 * 1000);
    for (const s of SLOTS_UTC) {
      if (t.getUTCDay() !== s.dow) continue;
      const slot = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), s.h, s.m));
      if (slot > now) return slot.toISOString();
    }
  }
  return new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
}

function dispatchRender(topic, minutes, fallback) {
  gh(['workflow', 'run', RENDER_WORKFLOW, '-R', RENDER_REPO,
    '-f', 'topic=' + topic, '-f', 'minutes=' + minutes,
    '-f', 'fallback=' + fallback, '-f', 'voice=']);
  log('Render dispatched to ' + RENDER_REPO + ': "' + topic + '"');
}

// newest successful render run that we haven't handled yet
function findRun(createdAfterMs) {
  const runs = ghJson(['run', 'list', '-R', RENDER_REPO, '-w', RENDER_WORKFLOW,
    '--status', 'success', '--limit', '5', '--json', 'databaseId,createdAt']) || [];
  for (const r of runs) {
    if (new Date(r.createdAt).getTime() >= createdAfterMs) return r;
  }
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
      log('Run ' + run.databaseId + ' succeeded but artifact not ready yet...');
    }
    process.stdout.write('[publish] waiting for render (' + Math.round((deadline - Date.now()) / 60000) + ' min left)\r');
    spawnSync('sleep', ['60']);
  }
  throw new Error('render did not finish in time');
}

function downloadArtifact(runId, artId) {
  const inbox = 'inbox/run-' + runId;
  fs.rmSync(inbox, { recursive: true, force: true });
  fs.mkdirSync(inbox, { recursive: true });
  gh(['run', 'download', String(runId), '-R', RENDER_REPO, '-n', ARTIFACT_NAME, '-D', inbox]);
  const files = fs.readdirSync(inbox);
  const videoFile = path.join(inbox, files.find(f => f.endsWith('.mp4')));
  if (!videoFile || !fs.existsSync(videoFile)) throw new Error('no mp4 in artifact');
  return videoFile;
}

function durationSec(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'csv=p=0', file], { encoding: 'utf8' });
  return Math.round(parseFloat((r.stdout || '0').trim()));
}

function buildDescription(topic) {
  return topic + ' — explained in one calm, visual deep-dive. No hype, no fluff: just the machine, opened up.\n\n'
    + 'WHAT YOU GET\n'
    + '• One system explained end to end — what really happens, step by step\n'
    + '• Clean dark-mode animations of the parts you never see\n'
    + '• Evergreen knowledge — this video will not expire\n\n'
    + 'New deep-dive every week. Subscribe and finally see the whole machine.\n\n'
    + '📧 Business: muzzamilhassan302@gmail.com\n';
}

async function uploadYouTube(videoFile, topic, tags) {
  const clientId = (process.env.YOUTUBE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.YOUTUBE_CLIENT_SECRET || '').trim();
  const refresh = (process.env.TECH_YT_REFRESH_TOKEN || '').trim();
  if (!clientId || !clientSecret || !refresh) throw new Error('missing TECH_YT_REFRESH_TOKEN / YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET');
  const oauth = new google.auth.OAuth2(clientId, clientSecret);
  oauth.setCredentials({ refresh_token: refresh });
  const youtube = google.youtube({ version: 'v3', auth: oauth });
  const publishAt = nextSlotUTC();
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: topic.slice(0, 100),
        description: buildDescription(topic),
        tags: (tags && tags.length ? tags : ['programming', 'software engineering', 'explained', 'how it works']).slice(0, 15),
        categoryId: '27'
      },
      status: { privacyStatus: 'private', publishAt, selfDeclaredMadeForKids: false }
    },
    media: { body: fs.createReadStream(videoFile) }
  });
  return { videoId: res.data.id, publishAt };
}

function notify(title, body) {
  const topic = (process.env.NTFY_TOPIC || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!topic) return;
  fetch('https://ntfy.sh/' + topic, {
    method: 'POST',
    headers: { 'Title': title, 'Tags': 'clapper' },
    body: body
  }).catch(() => {});
}

async function main() {
  const isTest = arg('test') === true || arg('test') === 'true';
  const skipWaiting = arg('skip-waiting') === true || arg('skip-waiting') === 'true';
  const nameWaiting = arg('name-waiting') === true || arg('name-waiting') === 'true';
  // topic travels via INPUT_TOPIC env (shell-safe); --topic argv kept for local runs
  let topicArg = arg('topic', '');
  if (typeof topicArg !== 'string' || !topicArg.trim()) topicArg = (process.env.INPUT_TOPIC || '').trim();
  const minutes = arg('minutes', '10');
  const fallback = arg('fallback', 'true');

  const published = loadJson(PUBLISHED_FILE, { uploads: [] });
  const pending = loadJson(PENDING_FILE, { renders: [] });
  const publishedIds = published.uploads.map(u => String(u.artifactId));

  // 1. already-rendered video waiting? upload it first (self-heal for failed upload runs)
  let chosen = null;
  if (!skipWaiting) {
    const runs = ghJson(['run', 'list', '-R', RENDER_REPO, '-w', RENDER_WORKFLOW,
      '--status', 'success', '--limit', '5', '--json', 'databaseId,createdAt']) || [];
    for (const r of runs) {
      const art = artifactFor(r.databaseId);
      if (!art) continue;
      if (publishedIds.includes(String(art.id))) continue;
      const pend = pending.renders.find(p => String(p.runId) === String(r.databaseId));
      let t = (pend && pend.topic) || '';
      if (!t && nameWaiting && topicArg) {
        t = topicArg; // explicit naming flow: name_waiting=true names the newest waiting render
        log('Naming waiting run ' + r.databaseId + ' as "' + t + '"');
      }
      if (!t) {
        log('GAP: waiting run ' + r.databaseId + ' has no topic name — name it via Publish input `topic`.');
        continue;
      }
      chosen = { run: r, art, topic: t };
      break;
    }
  }

  // 2. nothing waiting → get a topic and render
  if (!chosen) {
    let topic = typeof topicArg === 'string' && topicArg.trim() ? topicArg.trim() : '';
    if (!topic) {
      const bank = loadJson(BANK_FILE, { topics: [] });
      const idea = bank.topics.filter(t => t.status === 'new').sort((a, b) => b.score - a.score)[0];
      if (!idea) { log('Nothing waiting and no open ideas in the bank — done.'); return; }
      topic = idea.title;
      log('Auto-picked from bank [' + idea.score + ']: ' + topic);
    }
    const startedMs = Date.now();
    dispatchRender(topic, minutes, fallback);
    const { run, art } = waitForRender(startedMs, 55);
    pending.renders.push({ runId: run.databaseId, topic, dispatchedAt: new Date().toISOString() });
    saveJson(PENDING_FILE, pending);
    chosen = { run, art, topic };
  } else {
    log('Found waiting render: run ' + chosen.run.databaseId + ' → "' + chosen.topic + '"');
  }

  if (publishedIds.includes(String(chosen.art.id))) { log('Artifact already published — done.'); return; }

  // 3. download + validate
  log('Downloading artifact ' + chosen.art.id + ' (run ' + chosen.run.databaseId + ')...');
  const videoFile = downloadArtifact(chosen.run.databaseId, chosen.art.id);
  const dur = durationSec(videoFile);
  log('Video: ' + chosen.topic + ' — ' + dur + 's, ' + Math.round(fs.statSync(videoFile).size / 1048576) + ' MB');
  if (isTest) { log('TEST mode — skipping YouTube upload. Chain OK.'); return; }
  if (dur < MIN_DURATION_SEC) { log('GAP: render is ' + dur + 's (< ' + MIN_DURATION_SEC + ') — treating as test render, NOT publishing.'); return; }

  // 4. upload
  const bank = loadJson(BANK_FILE, { topics: [] });
  const matched = bank.topics.find(t => t.title === chosen.topic);
  const { videoId, publishAt } = await uploadYouTube(videoFile, chosen.topic, matched ? matched.tags : null);
  log('UPLOADED: https://youtube.com/watch?v=' + videoId + ' (goes public ' + publishAt + ')');

  // 5. state + notify
  published.uploads.push({
    date: new Date().toISOString().slice(0, 10),
    title: chosen.topic, videoId, publishAt,
    artifactId: chosen.art.id, runId: chosen.run.databaseId
  });
  saveJson(PUBLISHED_FILE, published);
  if (matched) {
    matched.status = 'used';
    matched.videoId = videoId;
    saveJson(BANK_FILE, bank);
  }
  pending.renders = pending.renders.filter(p => String(p.runId) !== String(chosen.run.databaseId));
  saveJson(PENDING_FILE, pending);
  notify('How Dev Works - scheduled', chosen.topic + '\nPublic ' + publishAt + '\nhttps://youtube.com/watch?v=' + videoId);
}

main().catch(e => { log('FAIL: ' + (e.message || e)); process.exit(1); });

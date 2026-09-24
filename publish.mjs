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
import { research } from './tools/yt-research.mjs';

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
  const d = parseFloat((r.stdout || '').trim());
  if (!isFinite(d) || d <= 0) log('WARN: ffprobe said "' + (r.stdout || '').trim() + '" stderr: ' + (r.stderr || r.error || 'none').slice(0, 120));
  return isFinite(d) ? Math.round(d) : 0;
}

function buildDescription(topic, phrase) {
  return (phrase || topic) + ' — explained in one calm, visual deep-dive. No hype, no fluff: just the machine, opened up.\n\n'
    + 'WHAT YOU GET\n'
    + '• One system explained end to end — what really happens, step by step\n'
    + '• Clean dark-mode animations of the parts you never see\n'
    + '• Evergreen knowledge — this video will not expire\n\n'
    + 'New deep-dive every week. Subscribe and finally see the whole machine.\n\n'
    + '📧 Business: muzzamilhassan302@gmail.com\n';
}

async function uploadYouTube(videoFile, topic, bankTags, meta) {
  const clientId = (process.env.YOUTUBE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.YOUTUBE_CLIENT_SECRET || '').trim();
  const refresh = (process.env.TECH_YT_REFRESH_TOKEN || '').trim();
  if (!clientId || !clientSecret || !refresh) throw new Error('missing TECH_YT_REFRESH_TOKEN / YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET');
  const oauth = new google.auth.OAuth2(clientId, clientSecret);
  oauth.setCredentials({ refresh_token: refresh });
  const youtube = google.youtube({ version: 'v3', auth: oauth });
  const publishAt = nextSlotUTC();
  // metadata SEO: title/description/tags come from autocomplete research when it ran,
  // falling back to the topic + bank tags + defaults
  const title = (meta?.title || topic).slice(0, 100);
  const tags = (meta?.tags?.length ? meta.tags : (bankTags && bankTags.length ? bankTags : ['programming', 'software engineering', 'explained', 'how it works'])).slice(0, 15);
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title,
        description: buildDescription(topic, meta?.searchPhrase),
        tags,
        categoryId: '27'
      },
      status: { privacyStatus: 'private', publishAt, selfDeclaredMadeForKids: false }
    },
    media: { body: fs.createReadStream(videoFile) }
  });
  return { videoId: res.data.id, publishAt, title, youtube };
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
  // scheduled runs pass empty inputs -> arg() returns booleans; normalize before dispatch
  const minutesArg = arg('minutes', '10');
  const minutes = (typeof minutesArg === 'string' && /^\d+$/.test(minutesArg.trim())) ? minutesArg.trim() : '10';
  const fallback = arg('fallback', 'true') === 'false' ? 'false' : 'true';

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
        notify('How Dev Works - GAP', 'Run ' + r.databaseId + ' rendered but has no topic name — publish skipped it. Name it via Publish inputs topic + name_waiting.');
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
      // waves (fresh, unexpired) outrank curated outrank regular — trend windows are short
      const now = Date.now();
      const waveRank = (t) => (t.wave && (!t.expires || new Date(t.expires) > now) ? 1 : 0);
      const idea = bank.topics.filter(t => t.status === 'new')
        .sort((a, b) => waveRank(b) - waveRank(a)
          || (b.curated ? 1 : 0) - (a.curated ? 1 : 0)
          || b.score - a.score)[0];
      if (!idea) {
        log('Nothing waiting and no open ideas in the bank — done.');
        notify('How Dev Works - GAP', 'Nothing to publish: no waiting render, no open ideas in the topic bank.');
        return;
      }
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

  // 2.5 Never-Forget metaphor brief — MANDATORY hook + analogy map + beats, saved to
  // state/scripts/ (committed with state) and the hook pushed to the phone. Non-fatal.
  try {
    const slug = chosen.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
    const briefPath = path.join('state', 'scripts', `${new Date().toISOString().slice(0, 10)}-${slug}.md`);
    const g = spawnSync('node', ['tools/metaphor-script.mjs', '--topic', chosen.topic, '--out', briefPath], { encoding: 'utf8' });
    if (g.status !== 0) throw new Error((g.stderr || '').slice(-120));
    const hook = (g.stdout || '').split('\n').find(l => l.startsWith('- PRIMARY:'));
    if (hook) notify('How Dev Works - hook ready', chosen.topic + '\n' + hook.replace('- PRIMARY: ', ''));
    log('Metaphor brief: ' + briefPath);
  } catch (e) {
    log('WARN metaphor brief failed (non-fatal): ' + String(e.message || e).slice(0, 120));
  }

  // 3. download + validate
  log('Downloading artifact ' + chosen.art.id + ' (run ' + chosen.run.databaseId + ')...');
  const videoFile = downloadArtifact(chosen.run.databaseId, chosen.art.id);
  const dur = durationSec(videoFile);
  log('Video: ' + chosen.topic + ' — ' + dur + 's, ' + Math.round(fs.statSync(videoFile).size / 1048576) + ' MB');
  if (isTest) { log('TEST mode — skipping YouTube upload. Chain OK.'); return; }
  if (dur < MIN_DURATION_SEC) {
    log('GAP: render is ' + dur + 's (< ' + MIN_DURATION_SEC + ') — treating as test render, NOT publishing.');
    notify('How Dev Works - GAP', chosen.topic + ' rendered only ' + dur + 's — not published. Re-render with fallback=true.');
    return;
  }

  // 4. metadata research (real YouTube search phrasing) + upload
  const bank = loadJson(BANK_FILE, { topics: [] });
  const matched = bank.topics.find(t => t.title === chosen.topic);
  let meta = null;
  try {
    meta = await research(chosen.topic);
    log('research: title="' + meta.title + '" · phrase="' + meta.searchPhrase + '" · ' + meta.tags.length + ' tags');
  } catch (e) {
    log('WARN research failed (using topic as-is): ' + String(e.message || e).slice(0, 100));
  }
  const { videoId, publishAt, title: usedTitle, youtube } = await uploadYouTube(videoFile, chosen.topic, matched ? matched.tags : null, meta);
  log('UPLOADED: https://youtube.com/watch?v=' + videoId + ' (goes public ' + publishAt + ')');

  // 4b. thumbnail — photo-poster factory (tools/thumbnail-factory.mjs), attached via API (non-fatal:
  // fails cleanly if the channel is not phone-verified at youtube.com/verify)
  try {
    const thumbPng = path.join('inbox', 'thumb-' + videoId + '.png');
    const g = spawnSync('node', [path.join('tools', 'thumbnail-factory.mjs'), '--title', (meta?.title || chosen.topic), '--out', thumbPng], { encoding: 'utf8' });
    if (g.status !== 0) throw new Error('generator failed: ' + (g.stderr || '').slice(-140));
    await youtube.thumbnails.set({ videoId, media: { body: fs.createReadStream(thumbPng) } });
    log('Thumbnail attached.');
  } catch (e) {
    log('WARN: thumbnail not attached: ' + String(e.message || e).slice(0, 140));
    notify('How Dev Works - thumbnail', 'Thumbnail failed for "' + chosen.topic + '" — verify the channel at youtube.com/verify, then run the Set thumbnail workflow.');
  }

  // 5. state + notify
  published.uploads.push({
    date: new Date().toISOString().slice(0, 10),
    title: usedTitle, topic: chosen.topic, videoId, publishAt,
    searchPhrase: meta?.searchPhrase || '', tags: (meta?.tags || []).slice(0, 10),
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

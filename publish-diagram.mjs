// How Dev Works — diagram-style publish pipeline (tech-render lane).
//   node publish-diagram.mjs                       → pick first status:"new" spec from specs/index.json
//   node publish-diagram.mjs --topic "Why ..."     → match a spec by topic
//   node publish-diagram.mjs --spec specs/x.json   → explicit spec
//   node publish-diagram.mjs --test                → render + validate ONLY (no upload)
//
// Renders IN THIS REPO (no cross-repo dispatch): spec → TTS → muted render → premix/mux
// → upload → thumbnail → state. LAW kept: longform:false specs never upload (the
// channel's 300s minimum stands; demo-length specs run the chain in test mode).
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { google } from 'googleapis';
import { research } from './tools/yt-research.mjs';

const INDEX_FILE = 'tech-render/specs/index.json';
const IDEAS_FILE = 'tech-render/specs/topic-ideas.json';
const PUBLISHED_FILE = 'state/published.json';
const BANK_FILE = 'state/tech-topic-bank.json';
const MIN_DURATION_SEC = 300;

function log(m) { console.log('[publish-diagram] ' + m); }
function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return (v === undefined || v.startsWith('--')) ? true : v;
}
function loadJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; } }
function saveJson(file, data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', env: process.env, shell: process.platform === 'win32', ...opts });
  return { status: r.status, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim() };
}
function durationSec(file) {
  const r = sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  const d = parseFloat(r.stdout);
  return isFinite(d) ? Math.round(d) : 0;
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
function nextSlotUTC() {
  const SLOTS_UTC = [{ dow: 2, h: 23, m: 30 }, { dow: 5, h: 23, m: 30 }];
  const now = new Date(Date.now() + 2 * 3600 * 1000);
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
function buildDescription(topic, phrase) {
  return (phrase || topic) + ' — explained in one calm, visual deep-dive. No hype, no fluff: just the machine, opened up.\n\n'
    + 'WHAT YOU GET\n• One system explained end to end — what really happens, step by step\n'
    + '• Clean dark-mode animated diagrams of the parts you never see\n'
    + '• Evergreen knowledge — this video will not expire\n\n'
    + 'New deep-dive every week. Subscribe and finally see the whole machine.\n\n'
    + '📧 Business: muzzamilhassandev@gmail.com\n';
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
  const title = (meta?.title || topic).slice(0, 100);
  const tags = (meta?.tags?.length ? meta.tags : (bankTags && bankTags.length ? bankTags : ['programming', 'software engineering', 'explained', 'how it works'])).slice(0, 15);
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: { title, description: buildDescription(topic, meta?.searchPhrase), tags, categoryId: '27' },
      status: { privacyStatus: 'private', publishAt, selfDeclaredMadeForKids: false }
    },
    media: { body: fs.createReadStream(videoFile) }
  });
  return { videoId: res.data.id, publishAt, title, youtube };
}

function markIdeaUsed(topic, status = 'used') {
  const ideas = loadJson(IDEAS_FILE, { ideas: [] });
  const idea = ideas.ideas.find((i) => (i.topic || '').toLowerCase() === (topic || '').toLowerCase());
  if (idea) { idea.status = status; ideas.updated = new Date().toISOString(); saveJson(IDEAS_FILE, ideas); }
}

async function main() {
  const isTest = arg('test') === true || arg('test') === 'true';
  const isDemo = arg('demo') === true || arg('demo') === 'true';
  const forceTest = isTest || isDemo; // demo specs are chain-tests by law
  // topic travels via INPUT_TOPIC env (shell-safe); --topic argv kept for local runs
  let topicArg = arg('topic', '');
  if (typeof topicArg !== 'string' || !topicArg.trim()) topicArg = (process.env.INPUT_TOPIC || '').trim();
  const specArg = (typeof arg('spec', '') === 'string' ? arg('spec', '') : '').trim();

  const index = loadJson(INDEX_FILE, { specs: [] });

  // AUTO mode (default): fresh trend research wins FIRST. A live wave from the
  // radar's shared bank (72h expiry, same precedence as publish.mjs) beats the
  // static evergreen list — "the news made people curious, we explain the thing."
  let autoTopic = false;
  let waveNote = '';
  if (!specArg && !topicArg) {
    const bank = loadJson(BANK_FILE, { topics: [] });
    const now = Date.now();
    const wave = bank.topics.find((t) => t.status === 'new' && t.wave && (!t.expires || new Date(t.expires).getTime() > now));
    if (wave) {
      topicArg = wave.title;
      waveNote = 'TREND CONTEXT (why now): "' + wave.title + '" is riding a wave right now'
        + (wave.source ? ' — spotted via ' + wave.source : '')
        + (wave.waveFrom ? ' (' + wave.waveFrom + ')' : '')
        + '. Open the video by connecting to this live attention in the first sentences, then settle into the evergreen explanation.';
      log('WAVE picked from trend radar: ' + topicArg);
    }
  }
  if (!specArg && !topicArg) {
    const ideas = loadJson(IDEAS_FILE, { ideas: [] });
    const idea = ideas.ideas.find((i) => i.status === 'new');
    if (!idea) {
      log('No new topic ideas left in tech-render/specs/topic-ideas.json — done.');
      notify('How Dev Works - GAP', 'publish-diagram: topic-ideas.json exhausted.');
      return;
    }
    topicArg = idea.topic;
    autoTopic = true;
    log('Auto-picked topic [' + idea.id + ']: ' + topicArg);
  }

  let entry = null;
  if (specArg) entry = index.specs.find((s) => s.file.replace(/^.*specs[\\/]/, '') === specArg.replace(/^.*specs[\\/]/, ''));
  if (!entry && topicArg) entry = index.specs.find((s) => (s.topic || '').toLowerCase() === topicArg.toLowerCase() && s.status === 'new');
  if (!entry && !topicArg) entry = index.specs.find((s) => s.status === 'new');

  // topic named (or auto-picked) but no spec yet → the AI writes it (needs GROQ_API_KEY / GEMINI_API_KEY)
  if (!entry && topicArg) {
    log('No spec for "' + topicArg + '" — generating with write-spec (' + (isDemo ? 'demo' : 'longform') + ')...');
    const wargs = ['write-spec.mjs', '--topic', topicArg];
    if (waveNote) wargs.push('--wave-note', waveNote);
    if (!isDemo) wargs.push('--longform');
    const w = sh('node', wargs, { cwd: 'tech-render', stdio: 'inherit' });
    if (w.status !== 0) {
      notify('How Dev Works - GAP', 'write-spec failed for "' + topicArg + '" — check GROQ_API_KEY / GEMINI_API_KEY.');
      throw new Error('write-spec failed');
    }
    const fresh = loadJson(INDEX_FILE, { specs: [] });
    entry = fresh.specs.find((s) => (s.topic || '').toLowerCase() === topicArg.toLowerCase() && s.status === 'new')
         || fresh.specs.find((s) => s.status === 'new');
    if (!entry) throw new Error('write-spec did not register a spec');
  }
  if (!entry) {
    log('No status:"new" spec in specs/index.json — write or generate a spec first. Done.');
    notify('How Dev Works - GAP', 'publish-diagram: no new spec in tech-render/specs/index.json.');
    return;
  }
  const specFile = entry.file.startsWith('specs/') ? `tech-render/${entry.file}` : entry.file;
  const spec = loadJson(specFile, null);
  if (!spec) throw new Error('spec unreadable: ' + specFile);
  log(`Spec: ${spec.id} — "${entry.topic}" (longform: ${!!spec.longform})`);

  // mark rendering immediately so a re-run can't double-render
  entry.status = 'rendering';
  saveJson(INDEX_FILE, index);

  // render in-repo (muted jpeg + premix/mux — the robust path)
  const r = sh('node', ['make.mjs', entry.file, '--render'], { cwd: 'tech-render', stdio: 'inherit' });
  if (r.status !== 0) { entry.status = 'new'; saveJson(INDEX_FILE, index); throw new Error('render failed'); }
  const videoFile = path.join('tech-render', 'out', `${spec.id}.mp4`);
  const dur = durationSec(videoFile);
  log(`Rendered: ${spec.id} — ${dur}s`);

  const longform = spec.longform === true && dur >= MIN_DURATION_SEC;
  if (!longform || forceTest) {
    log(longform ? 'TEST mode — skipping upload. Chain OK.' :
      `Not uploading: ${dur}s < ${MIN_DURATION_SEC}s or longform:false — demo/test render (chain validated, YouTube untouched).`);
    entry.status = 'done';
    entry.rendered = { at: new Date().toISOString(), dur };
    saveJson(INDEX_FILE, index);
    markIdeaUsed(entry.topic, 'tested');
    notify('How Dev Works - diagram render', `${entry.topic}\n${dur}s (test mode, not uploaded)`);
    return;
  }

  // metadata research + upload + thumbnail + state (same law as publish.mjs)
  const published = loadJson(PUBLISHED_FILE, { uploads: [] });
  const bank = loadJson(BANK_FILE, { topics: [] });
  const matched = bank.topics.find((t) => t.title === entry.topic);
  let meta = null;
  try {
    meta = await research(entry.topic);
    log('research: title="' + meta.title + '" · ' + meta.tags.length + ' tags');
  } catch (e) {
    log('WARN research failed (using topic as-is): ' + String(e.message || e).slice(0, 100));
  }
  const { videoId, publishAt, title: usedTitle, youtube } = await uploadYouTube(videoFile, entry.topic, matched ? matched.tags : null, meta);
  log('UPLOADED: https://youtube.com/watch?v=' + videoId + ' (goes public ' + publishAt + ')');
  try {
    const thumbPng = path.join('inbox', 'thumb-' + videoId + '.png');
    const g = sh('node', [path.join('tools', 'thumbnail-factory.mjs'), '--title', (meta?.title || entry.topic), '--out', thumbPng]);
    if (g.status !== 0) throw new Error('generator failed: ' + (g.stderr || '').slice(-140));
    await youtube.thumbnails.set({ videoId, media: { body: fs.createReadStream(thumbPng) } });
    log('Thumbnail attached.');
  } catch (e) {
    log('WARN: thumbnail not attached: ' + String(e.message || e).slice(0, 140));
    notify('How Dev Works - thumbnail', 'Thumbnail failed for "' + entry.topic + '" — set it via the Set thumbnail workflow.');
  }
  published.uploads.push({
    date: new Date().toISOString().slice(0, 10),
    title: usedTitle, topic: entry.topic, videoId, publishAt, style: 'diagram',
    searchPhrase: meta?.searchPhrase || '', tags: (meta?.tags || []).slice(0, 10),
    spec: entry.file
  });
  saveJson(PUBLISHED_FILE, published);
  if (matched) { matched.status = 'used'; matched.videoId = videoId; saveJson(BANK_FILE, bank); }
  entry.status = 'done';
  entry.rendered = { at: new Date().toISOString(), dur, videoId };
  saveJson(INDEX_FILE, index);
  markIdeaUsed(entry.topic);
  notify('How Dev Works - scheduled', entry.topic + '\nPublic ' + publishAt + '\nhttps://youtube.com/watch?v=' + videoId);
}

main().catch((e) => { log('FAIL: ' + (e.message || e)); process.exit(1); });

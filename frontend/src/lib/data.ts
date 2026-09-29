/*
 * Demo dataset for the Scriptorium control room, modeled on the real
 * how-dev-works pipeline: The Sealed Histories (Urdu documentary lane,
 * Mon/Thu 06:00 PKT cron) plus the CloudXBerry tech lane. Numbers are
 * plausible placeholders until the yt-analytics scope is wired up.
 */

export type EpisodeStatus = "published" | "queued" | "rendering" | "unlisted" | "draft";
export type Format = "episode" | "short";

export interface Episode {
  id: string;
  code: string;
  title: string;
  titleUr?: string;
  status: EpisodeStatus;
  format: Format;
  videoId?: string;
  scheduledFor?: string; // ISO
  publishedAt?: string; // ISO
  durationSec?: number;
  words?: number;
  hue: number; // placeholder-poster hue
  stage?: string;
  progress?: number; // 0-100 for the lane's current work
  checklist?: { label: string; done: boolean }[];
  notes?: string;
}

export const episodes: Episode[] = [
  {
    id: "salt-ep1",
    code: "UR-E01",
    title: "Salt: The Mineral That Built Empires",
    titleUr: "نمک — وہ معدنیہ جس نے سلطنتیں بنائیں",
    status: "published",
    format: "episode",
    videoId: "adOoXt_6Opk",
    publishedAt: "2026-09-28T06:30:00+05:00",
    durationSec: 512,
    words: 1980,
    hue: 24,
    notes: "Cold open, question hook, three re-hooks, salt-harvest payoff, loop back to open.",
  },
  {
    id: "salt-s1",
    code: "UR-S01",
    title: "The Salt Road That Fed Empires",
    titleUr: "وہ نمک کا راستہ جس نے سلطنتیں کھلائیں",
    status: "published",
    format: "short",
    videoId: "nvpEvh6GJaM",
    publishedAt: "2026-09-28T07:10:00+05:00",
    durationSec: 41,
    hue: 32,
  },
  {
    id: "salt-s2",
    code: "UR-S02",
    title: "Why Wars Were Fought Over Salt",
    titleUr: "نمک کے لیے کیوں لڑی گئیں جنگیں",
    status: "published",
    format: "short",
    videoId: "BYf_G3IuRC8",
    publishedAt: "2026-09-28T07:12:00+05:00",
    durationSec: 38,
    hue: 12,
  },
  {
    id: "tea-v4",
    code: "UR-E02-D",
    title: "Tea — demo cut v4",
    status: "unlisted",
    format: "episode",
    videoId: "sox662ooMVg",
    publishedAt: "2026-09-26T14:02:00+05:00",
    durationSec: 486,
    hue: 96,
    notes: "Unlisted render test. Thumbnail held until the channel passes youtube.com/verify.",
  },
  {
    id: "silk-ep3",
    code: "UR-E03",
    title: "Silk: Threads That Bought Cities",
    titleUr: "ریشم — وہ دھاگے جس نے شہر خریدے",
    status: "rendering",
    format: "episode",
    scheduledFor: "2026-10-01T06:00:00+05:00",
    durationSec: 540,
    words: 2110,
    hue: 320,
    stage: "Voicing · tts.py chunk 14/22",
    progress: 62,
    checklist: [
      { label: "Script locked (retention pass)", done: true },
      { label: "Clip sourcing — fetch-clips --script", done: true },
      { label: "Voiceover (tts.py)", done: false },
      { label: "Render 16:9 + DocShort 9:16", done: false },
      { label: "Thumbnail factory", done: false },
      { label: "Publish + Shorts cut", done: false },
    ],
  },
  {
    id: "tea-ep2",
    code: "UR-E02",
    title: "Tea: The Leaf That Ruled the World",
    titleUr: "چائے — وہ پتّا جس نے دنیا پر حکومت کی",
    status: "queued",
    format: "episode",
    scheduledFor: "2026-10-05T06:00:00+05:00",
    durationSec: 528,
    words: 2044,
    hue: 110,
    checklist: [
      { label: "Script locked (retention pass)", done: true },
      { label: "Clip sourcing — fetch-clips --script", done: true },
      { label: "Voiceover (tts.py)", done: true },
      { label: "Render 16:9 + DocShort 9:16", done: true },
      { label: "Thumbnail factory", done: true },
      { label: "Publish + Shorts cut", done: false },
    ],
  },
  {
    id: "obsidian-ep4",
    code: "UR-E04",
    title: "Obsidian: The First Scalpel",
    titleUr: "آبسیدین — پہلا جراحی کا چاقو",
    status: "draft",
    format: "episode",
    words: 1420,
    hue: 260,
    notes: "Draft at 1,420 words — needs a stronger payoff before it enters the queue.",
  },
  {
    id: "saffron-ep5",
    code: "UR-E05",
    title: "Saffron: Worth More Than Gold",
    titleUr: "زعفران — سونے سے بھی قیمتی",
    status: "draft",
    format: "episode",
    words: 380,
    hue: 48,
  },
  {
    id: "salt-s3",
    code: "UR-S03",
    title: "The Salary Was Salt",
    titleUr: "تنخواہ نمک تھی",
    status: "queued",
    format: "short",
    scheduledFor: "2026-10-01T07:00:00+05:00",
    durationSec: 35,
    hue: 16,
  },
];

export interface Workflow {
  id: string;
  name: string;
  file: string;
  schedule: string;
  cron: string;
  lane: string;
}

export const workflows: Workflow[] = [
  {
    id: "urdu-publish",
    name: "Urdu lane · render & publish",
    file: "urdu-publish.yml",
    schedule: "Mon & Thu · 06:00 PKT",
    cron: "0 1 * * 1,4",
    lane: "The Sealed Histories",
  },
  {
    id: "shorts-cut",
    name: "Promo Shorts cutter",
    file: "urdu-shortcuts.yml",
    schedule: "After episode render",
    cron: "workflow_dispatch",
    lane: "The Sealed Histories",
  },
  {
    id: "thumbnail-factory",
    name: "Thumbnail factory",
    file: "thumbnail-factory.yml",
    schedule: "On demand",
    cron: "workflow_dispatch",
    lane: "Both lanes",
  },
  {
    id: "tech-lane",
    name: "Tech lane · CloudXBerry",
    file: "tech-publish.yml",
    schedule: "Tue · 15:00 PKT",
    cron: "0 10 * * 2",
    lane: "CloudXBerry",
  },
];

export type RunStatus = "success" | "failed" | "in_progress" | "queued";

export interface Run {
  id: number;
  workflowId: string;
  trigger: "schedule" | "workflow_dispatch" | "push";
  status: RunStatus;
  startedAt: string;
  durationSec: number;
  actor: string;
}

export const runs: Run[] = [
  { id: 842, workflowId: "urdu-publish", trigger: "schedule", status: "success", startedAt: "2026-09-28T01:02:11Z", durationSec: 1493, actor: "cron" },
  { id: 841, workflowId: "shorts-cut", trigger: "workflow_dispatch", status: "success", startedAt: "2026-09-28T01:41:36Z", durationSec: 486, actor: "muzzamilhassan" },
  { id: 840, workflowId: "thumbnail-factory", trigger: "workflow_dispatch", status: "success", startedAt: "2026-09-26T09:22:04Z", durationSec: 212, actor: "muzzamilhassan" },
  { id: 839, workflowId: "tech-lane", trigger: "schedule", status: "queued", startedAt: "2026-09-29T10:00:00Z", durationSec: 0, actor: "cron" },
  { id: 838, workflowId: "urdu-publish", trigger: "schedule", status: "success", startedAt: "2026-09-24T01:01:58Z", durationSec: 1611, actor: "cron" },
  { id: 837, workflowId: "urdu-publish", trigger: "schedule", status: "failed", startedAt: "2026-09-21T01:00:41Z", durationSec: 372, actor: "cron" },
  { id: 836, workflowId: "urdu-publish", trigger: "schedule", status: "success", startedAt: "2026-09-17T01:02:20Z", durationSec: 1544, actor: "cron" },
];

export const runLog: { t: string; line: string; kind: "ok" | "info" | "warn" | "err" | "dim" }[] = [
  { t: "00:00:01", line: "Triggered by schedule · 0 1 * * 1,4 (Mon/Thu 06:00 PKT)", kind: "dim" },
  { t: "00:00:03", line: "Run actions/checkout@v4 — picking next queued episode from state/urdu-queue.json", kind: "info" },
  { t: "00:00:05", line: "→ queued: UR-E01 “Salt: The Mineral That Built Empires”", kind: "ok" },
  { t: "00:00:09", line: "python3 tools/tts.py — 22 chunks, voice=ur-PK-narrator, rate=+0%", kind: "info" },
  { t: "00:11:42", line: "voiceover.wav written · 8:32 · loudness −14 LUFS", kind: "ok" },
  { t: "00:11:44", line: "node tools/fetch-clips --script script.lock.md — 9/12 queries matched", kind: "info" },
  { t: "00:14:03", line: "⚠ “salt pans aerial” → re-matched to salt-harvesting footage (dandi clip)", kind: "warn" },
  { t: "00:18:26", line: "node tools/build-episode.mjs — 1920×1080 master, sequential caption chunks ≤72 chars", kind: "info" },
  { t: "00:21:10", line: "DocShort 9:16 render — Shorts-safe layout, era chip font swapped (Nastaliq tofu fix)", kind: "ok" },
  { t: "00:23:58", line: "thumbnail factory — photo-poster v2, CC0 archive photo + flat text", kind: "ok" },
  { t: "00:24:41", line: "upload: episode public + 2 shorts public · captions en+ur", kind: "ok" },
  { t: "00:24:48", line: "state/urdu-queue.json → UR-E01 done · phone push sent (2 links)", kind: "ok" },
];

export interface Channel {
  id: string;
  name: string;
  handle: string;
  kind: string;
  status: "live" | "paused";
  token: { label: string; state: "verified" | "pending" | "missing" };
  note?: string;
  hue: number;
  stats: { subs: number; views28d: number; uploads: number };
}

export const channels: Channel[] = [
  {
    id: "sealed-histories",
    name: "The Sealed Histories",
    handle: "@TheSealedHistories",
    kind: "Urdu documentaries · brand account on the dev mail",
    status: "live",
    token: { label: "URDU OAuth token", state: "verified" },
    note: "Thumbnail upgrade held behind youtube.com/verify for advanced features.",
    hue: 14,
    stats: { subs: 1284, views28d: 94200, uploads: 4 },
  },
  {
    id: "cloudxberry",
    name: "CloudXBerry",
    handle: "@CloudXBerry",
    kind: "Tech explainers · dev mail",
    status: "paused",
    token: { label: "TECH OAuth token", state: "verified" },
    note: "First render queued for the Tuesday cron — DNS-security episode in review.",
    hue: 205,
    stats: { subs: 0, views28d: 0, uploads: 0 },
  },
];

export interface Credential {
  id: string;
  name: string;
  scope: string;
  state: "verified" | "pending" | "missing";
  hint: string;
}

export const credentials: Credential[] = [
  { id: "yt-tech", name: "YouTube Data API · TECH", scope: "upload, manage", state: "verified", hint: "Rotated 2026-09-28 · client “yt-automation”" },
  { id: "yt-urdu", name: "YouTube Data API · URDU", scope: "upload, manage", state: "verified", hint: "Minted against the Sealed Histories brand account" },
  { id: "yt-analytics", name: "YouTube Analytics scope", scope: "yt-analytics.readonly", state: "missing", hint: "Not yet in the token — analytics page runs on demo data" },
  { id: "groq", name: "Groq API key", scope: "script drafting", state: "missing", hint: "AI script drafts paused; queue advances on hand-written scripts" },
  { id: "push", name: "Phone push (publish links)", scope: "notifications", state: "verified", hint: "Fires on every successful publish step" },
];

/* ---------- analytics (demo) ---------- */

export const views28d = [
  { d: "Sep 2", views: 900 }, { d: "Sep 3", views: 1240 }, { d: "Sep 4", views: 1610 },
  { d: "Sep 5", views: 1420 }, { d: "Sep 6", views: 1180 }, { d: "Sep 7", views: 1390 },
  { d: "Sep 8", views: 1520 }, { d: "Sep 9", views: 1840 }, { d: "Sep 10", views: 2210 },
  { d: "Sep 11", views: 2980 }, { d: "Sep 12", views: 3140 }, { d: "Sep 13", views: 2680 },
  { d: "Sep 14", views: 2410 }, { d: "Sep 15", views: 2890 }, { d: "Sep 16", views: 3320 },
  { d: "Sep 17", views: 4480 }, { d: "Sep 18", views: 3910 }, { d: "Sep 19", views: 3460 },
  { d: "Sep 20", views: 3120 }, { d: "Sep 21", views: 2870 }, { d: "Sep 22", views: 3350 },
  { d: "Sep 23", views: 3720 }, { d: "Sep 24", views: 5240 }, { d: "Sep 25", views: 4810 },
  { d: "Sep 26", views: 4380 }, { d: "Sep 27", views: 5920 }, { d: "Sep 28", views: 9840 },
  { d: "Sep 29", views: 7630 },
];

export const retention = [
  { t: "0%", pct: 100 }, { t: "10%", pct: 87 }, { t: "20%", pct: 79 }, { t: "30%", pct: 74 },
  { t: "40%", pct: 69 }, { t: "50%", pct: 66 }, { t: "60%", pct: 61 }, { t: "70%", pct: 58 },
  { t: "80%", pct: 55 }, { t: "90%", pct: 52 }, { t: "100%", pct: 49 },
];

export const topContent = [
  { title: "Salt: The Mineral That Built Empires", kind: "Episode", views: 41200, ctr: 8.4, ret: 61 },
  { title: "Why Wars Were Fought Over Salt", kind: "Short", views: 23800, ctr: 6.1, ret: 78 },
  { title: "The Salt Road That Fed Empires", kind: "Short", views: 17200, ctr: 5.8, ret: 74 },
  { title: "Tea — demo cut v4 (unlisted)", kind: "Episode", views: 6400, ctr: 4.9, ret: 57 },
];

export const geoSplit = [
  { country: "Pakistan", pct: 58 },
  { country: "India", pct: 21 },
  { country: "United States", pct: 8 },
  { country: "Saudi Arabia", pct: 5 },
  { country: "UAE", pct: 3 },
  { country: "Other", pct: 5 },
];

export const formatSplit = [
  { name: "Shorts", value: 61 },
  { name: "Episodes", value: 39 },
];

export interface ActivityItem {
  id: string;
  kind: "publish" | "render" | "cron" | "thumb" | "warn" | "auth";
  text: string;
  meta?: string;
  at: string; // ISO
}

export const activity: ActivityItem[] = [
  { id: "a1", kind: "publish", text: "Published UR-E01 “Salt” + 2 Shorts", meta: "public · captions en/ur", at: "2026-09-28T06:30:00+05:00" },
  { id: "a2", kind: "render", text: "DocShort 9:16 rendered", meta: "Shorts-safe layout", at: "2026-09-28T06:21:10+05:00" },
  { id: "a3", kind: "cron", text: "Cron fired · urdu-publish #842", meta: "Mon/Thu 06:00 PKT", at: "2026-09-28T06:02:11+05:00" },
  { id: "a4", kind: "auth", text: "TECH token rotated and verified", meta: "upload smoke PASS", at: "2026-09-28T03:12:00+05:00" },
  { id: "a5", kind: "warn", text: "Groq key still missing", meta: "AI script drafts paused", at: "2026-09-27T21:00:00+05:00" },
  { id: "a6", kind: "thumb", text: "Thumbnail re-generated (photo-poster)", meta: "both public videos", at: "2026-09-26T09:25:40+05:00" },
];

export const kpis = {
  subs: { value: 1284, delta: +38, label: "Subscribers" },
  views: { value: 94200, delta: +112, label: "Views · 28d" },
  watchHours: { value: 6100, delta: +64, label: "Watch hours · 28d" },
  ctr: { value: 7.8, delta: +1.9, label: "Avg. thumbnail CTR", suffix: "%" },
};

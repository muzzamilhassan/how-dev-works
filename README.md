# How Dev Works — channel engine

Everything for the **How Dev Works** dev-explainer channel in one place:
topic brain → render dispatch → YouTube upload. YouTube-only pipeline (FB/IG later).

**Channel:** How Dev Works (`@HowDevWorks`) — niche: "how software actually works"
**Style:** Dark Mode Minimalist Tech — calm animated 8–12 min deep-dives
**Branding/copy-paste package:** [BRANDING.md](BRANDING.md) · full research: automation repo `research/tech-channel-branding-2026-09.md`

## Second lane — The Sealed Histories (Urdu)

Same repo, same Google account (**muzzamilhassandev@gmail.com**), second channel: **The Sealed Histories** (`@TheSealedHistories`), a **Brand Account** for Urdu documentary shorts. Rendered locally by [urdu-render/](urdu-render/) (Remotion, Nastaliq/Naskh fonts, Pexels/Pixabay clips), uploaded via `tools/urdu-channel.mjs` with `URDU_YT_REFRESH_TOKEN` (consent picks The Sealed Histories brand identity — the lane split happens on the consent screen, `whoami` guards against the wrong lane). Setup: [docs/urdu-youtube-automation.md](docs/urdu-youtube-automation.md).

## Pipeline (weekly, autonomous)

```
daily.dev (webdev/programming/ai)                quarry-render (public render factory)
        │  topic-bank.yml — daily 05:45 PKT              │
        ▼                                                │
state/tech-topic-bank.json ── top 'new' idea ──▶ publish.yml (Tue/Fri 23:30 UTC)
        │                                                │  1. dispatch tech-video.yml
        │                                                │  2. wait for render (~30-50 min)
        └────────── mark topic used ◀────────────────────┘  3. download artifact
                                                         │  4. upload + schedule US-evening slot
                                                         ▼
                                               YouTube (private → scheduled public)
```

- **Render stays in [quarry-render](https://github.com/muzzamilhassan/quarry-render)** (engine + its Groq/Gemini secrets live there — no engine duplication, no cross-repo copy drift).
- **This repo owns the channel:** topics, publish decisions, upload tokens, upload log.

## Workflows

| Workflow | When | What |
|---|---|---|
| `Topic Bank` | daily 00:45 UTC | scores daily.dev trends → `state/tech-topic-bank.json` (committed back) + phone push of top 3 new ideas |
| `Trend Radar` | daily 06:30 UTC | scans HN front page, Reddit top/week (6 subs, optional), Google Trends RSS, Techmeme, GitHub Trending + YouTube charts → explainer-shaped hits become `wave` topics (72h, max 2/day); Google News amplifier promotes an existing bank topic when its keyword spikes vs the previous week; everything else = phone suggestion. Rationale: [docs/research](docs/research/2026-09-23-hot-topics-and-trend-platforms.md) |
| `Publish` | Tue/Fri 23:30 UTC + manual | picks topic (input, or top idea from bank) → renders in quarry-render → uploads to YouTube, scheduled at next Tue/Fri 19:30 ET slot → marks topic used → ntfy |
| `Publish Short` | Mon/Wed/Sat 15:00 UTC + manual | renders the 60-100s script mode (minutes=1) → repacks to branded vertical 1080×1920 (ffmpeg) → uploads PUBLIC immediately. Topic: input, else the latest published long video (promo short — bank is never consumed) |

Shorts never touch the render repo: the vertical repack happens in this repo with ffmpeg.

## Manual run

Actions → **Publish** → Run workflow:
- `topic` — blank = auto-pick from topic bank
- `minutes` — target length (default 10)
- `fallback` — `true` = curated deep-dive script, guaranteed length (default)
- `test` — `true` = render + download only, NO upload (safe chain test)

## Secrets (set via `gh secret set`)

| Secret | Purpose | Status |
|---|---|---|
| `DAILY_DEV_TOKEN` | topic brain (free tier 5 req/day) | ✅ set |
| `NTFY_TOPIC` | phone notifications | ✅ set |
| `SECRET_WRITER_PAT` | cross-repo render dispatch + artifact download + state commits | ✅ set |
| `YOUTUBE_CLIENT_ID/SECRET` | Google OAuth app (same as other channels) | ✅ set |
| `TECH_YT_REFRESH_TOKEN` | THIS channel's upload token | ✅ set (verified via Verify YouTube token workflow) |
| `REDDIT_CLIENT_ID/SECRET` + `REDDIT_USERNAME/PASSWORD` | Reddit "script" app for the radar's r/top week scan (free, ~100 req/min) | ⬜ optional — radar skips Reddit without them |

### One-time Reddit app (optional — enables the radar's Reddit source)

1. Create a dedicated Reddit account (or use yours) → https://reddit.com/prefs/apps → **create another app…** → type **script**, name `how-dev-works-radar`, redirect `http://localhost`.
2. Client ID = the string under the app name; secret = the **secret** field.
3. `gh secret set REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET / REDDIT_USERNAME / REDDIT_PASSWORD` (username/password = the account's login, used for the password grant).

### One-time YouTube token (browser-only — nothing runs locally)

1. Google Cloud Console → **APIs & Services → Credentials** → your OAuth client → Authorized redirect URIs: add `https://developers.google.com/oauthplayground` → Save.
2. Open https://developers.google.com/oauthplayground → ⚙️ gear (top right) → tick **Use your own OAuth credentials** → paste this project's client ID + secret. Keep **Force approval prompt** + access type **offline** ticked.
3. Step 1 → paste scope `https://www.googleapis.com/auth/youtube` → **Authorize APIs** → sign in as the Google account owning @HowDevWorks → unverified-app warning: *Advanced → continue → Allow*.
4. Step 2 → **Exchange authorization code for tokens** → copy the `refresh_token`.
5. GitHub → repo **Settings → Secrets and variables → Actions** → New secret `TECH_YT_REFRESH_TOKEN`.
6. Actions → **Verify YouTube token** → Run workflow — it prints the channel the token belongs to (costs 1 quota unit, uploads nothing).

(Local alternative: `tools/get-refresh-token.mjs`.)

## State (committed by CI with `[skip ci]`)

- `state/tech-topic-bank.json` — open topic ideas + used history
- `state/pending-renders.json` — dispatched renders awaiting upload (topic ↔ run mapping)
- `state/published.json` — upload log (videoId, publishAt, artifactId — idempotency: an artifact never uploads twice)

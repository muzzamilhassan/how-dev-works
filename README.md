# How Dev Works — channel engine

Everything for the **How Dev Works** dev-explainer channel in one place:
topic brain → render dispatch → YouTube upload. YouTube-only pipeline (FB/IG later).

**Channel:** How Dev Works (`@HowDevWorks`) — niche: "how software actually works"
**Style:** Dark Mode Minimalist Tech — calm animated 8–12 min deep-dives
**Branding/copy-paste package:** [BRANDING.md](BRANDING.md) · full research: automation repo `research/tech-channel-branding-2026-09.md`

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
| `Publish` | Tue/Fri 23:30 UTC + manual | picks topic (input, or top idea from bank) → renders in quarry-render → uploads to YouTube, scheduled at next Tue/Fri 19:30 ET slot → marks topic used → ntfy |

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

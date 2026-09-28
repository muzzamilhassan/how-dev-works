# Urdu channel — YouTube automation (how it works + one-time setup)

Date: 2026-09-26. Goal: run **The Sealed Histories** Urdu channel the same way the tech
lane runs @HowDevWorks — programmatic uploads, metadata, thumbnails, scheduling — with no
browser clicking after setup. Researched how the big open-source "YouTube automation"
repos actually talk to channels first; we adopt the same mechanism our live tech lane
already uses.

## 1. How the known automation repos work with channels

| Repo | Stars | Channel access | Reads channel data | Auto-work on channel |
|---|---|---|---|---|
| FujiwaraChoki/MoneyPrinterV2 | ~32k | Selenium + Firefox profile logged into YouTube | scraping | browser-driven Studio upload |
| dreammis/social-auto-upload | ~15k | Patchright (Playwright) + saved login cookies (`storage_state`) | Studio DOM | browser-driven Studio upload |
| ShortGPT / yt-upload-automation style | ~8k | **YouTube Data API v3 + OAuth refresh token** | `channels.list`, `videos.list` | `videos.insert` (upload), `thumbnails.set`, playlists |

Two architectures exist, nothing else:

- **Official API** (`googleapis` → OAuth2 refresh token → `youtube.*` endpoints). Stable,
  CI-friendly (GitHub Actions), quota-limited (upload = 1600 units of 10k/day). This is
  what our tech lane already runs (`publish.mjs`, `tools/verify-token.mjs`).
- **Saved browser session** (cookies → drive Studio). Needed only for one reason —
  social-auto-upload's own docstring says it: *uploads through an API project that hasn't
  passed Google's API audit get force-locked to private*. Browser uploads publish public
  immediately. Cost: fragile, breaks when Google changes Studio DOM.

We reuse the API path. Our OAuth client is evidently in good standing — the tech lane
uploads and publishes public videos through it (`publish-short.mjs` sets `public`
directly), so uploads for the Urdu channel through the **same client** behave the same.

## 2. Account split (do not mix lanes)

| | Tech lane (How Dev Works) | Urdu lane (The Sealed Histories) |
|---|---|---|
| Google account | **muzzamilhassandev@gmail.com** | **muzzamilhassandev@gmail.com** |
| Refresh token secret | `TECH_YT_REFRESH_TOKEN` | `URDU_YT_REFRESH_TOKEN` |
| OAuth client | `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` (shared — "yt-automation" project, owned by the dev mail) | same |
| Local tooling | `publish.mjs`, `publish-short.mjs` | `tools/urdu-channel.mjs` |

Both lanes live under muzzamilhassandev@gmail.com (consolidated 2026-09-28 — the OAuth client and every token are the dev mail's own; the old 302-owned client is retired). The lane split is on the **channel identity** picked at the consent screen. `whoami` in
`tools/urdu-channel.mjs` hard-fails if the token points at "How Dev Works" (wrong lane).

## 3. One-time setup checklist

### Step 1 — create the channel (manual, ~2 min; no API exists for this)

Sign in to **muzzamilhassandev@gmail.com**, go to youtube.com → avatar → **Create a
channel**, name it `The Sealed Histories`, handle `@TheSealedHistories`. This creates a Brand
Account under that Google account. No new Google account is needed.

If it errors with *"Failed to create channel. Please try changing your channel name"*:
the name is almost never the real problem (the green handle check proves the handle is
free). Work through these, in order:

1. **Verify a phone number** on the Google account (myaccount.google.com → Security) —
   the most common real cause; Google gates channel creation on verified accounts.
2. **Wait a few hours, retry** — repeated attempts from one account/IP trip spam
   protection that clears on its own.
3. **Different browser or incognito** — stale session cookies poison the flow (the
   in-app browser kept showing an old `muzzamilhassan302` session, which is exactly this
   failure mode).
4. **Create with a slightly different name** (e.g. add a word), then rename to
   "The Sealed Histories" in YouTube Studio → Customization immediately after.

### Step 2 — put the OAuth client in a local .env (gitignored)

Two ways to get `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET`:

- **Done (2026-09-28):** the active client is **"yt-automation"**, a Cloud project owned by
  muzzamilhassandev@gmail.com itself — values already in the repo `.env` and the GitHub
  secrets. Nothing more to do here.
- If ever re-creating it: console.cloud.google.com → sign in with muzzamilhassandev@gmail.com →
  New project → Enable **YouTube Data API v3** (+ YouTube Analytics API for reporting scopes)
  → OAuth consent screen (External, publish to production) → Credentials → OAuth client ID →
  **Desktop app** → Redirect URIs: BOTH `http://localhost:4100` and `http://127.0.0.1:4100`.

```ini
YOUTUBE_CLIENT_ID=...     
YOUTUBE_CLIENT_SECRET=...
URDU_YT_REFRESH_TOKEN=    # added in step 3
```

### Step 3 — mint the Urdu refresh token

While signed in to **muzzamilhassandev@gmail.com** in your normal browser (private
window is safest against the wrong-account issue):

```bash
node tools/get-refresh-token.mjs --name URDU_YT_REFRESH_TOKEN --label "@TheSealedHistories"
```

Open the printed URL, pick the dev-mail account, pick **The Sealed Histories** channel
identity on the consent screen, Allow ("Google hasn't verified this app" → it is your own
app, Continue is safe). Paste the token into `.env` (and later
`gh secret set URDU_YT_REFRESH_TOKEN -R muzzamilhassan/how-dev-works` if/when the Urdu
lane moves to Actions).

### Step 4 — verify + first upload

```bash
node tools/urdu-channel.mjs whoami          # must print The Sealed Histories
node tools/urdu-channel.mjs upload --file out/urdu-demo/urdu-tea-demo.mp4 \
  --title "چائے کی تاریخ" --privacy private   # smoke test, private
```

## 4. Quota and rates

`channels.list` / `playlistItems.list` ≈ 1 unit; `videos.insert` = 1600 units;
default 10 000 units/day → **~6 uploads/day ceiling**. Reads for research
(`tools/yt-research.mjs`, autocomplete) cost nothing.

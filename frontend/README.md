# Scriptorium — frontend for the how-dev-works pipeline

A full-detail React dashboard ("control room") for the Sealed Histories / CloudXBerry
automation platform, in the spirit of Zernio's developer-platform model: one place to
see channels, scheduled publishing, runs, media and analytics.

## Run it

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build in dist/
npm run preview  # serve the production build
```

## What's inside

- **Vite + React 18 + TypeScript**, Tailwind CSS v4 (CSS-first tokens, no config file)
- **lucide-react** icon set throughout
- **Fonts**: Inter (UI) · Instrument Serif (display numerals & titles) ·
  JetBrains Mono (data, crons, logs) · Noto Nastaliq Urdu (Urdu episode titles)
- **Dark & light themes** — "Lacquer ink" and "Ledger paper", token-driven via CSS
  custom properties, system-aware on first visit, persisted in `localStorage`
- **HashRouter** so the built app works on any static host without rewrite rules

### Pages

| Route         | What it shows                                                            |
| ------------- | ------------------------------------------------------------------------ |
| `/`           | Cron dial (Mon/Thu 06:00 PKT), in-lane progress, KPIs, activity, views    |
| `/queue`      | The publishing ledger mirroring `state/urdu-queue.json`, detail sheets    |
| `/studio`     | Retention-structured script editor, TTS voice rail, caption chunk preview |
| `/media`      | Clip matches, photo-poster thumbnails, TTS jobs                           |
| `/channels`   | Channel cards, token/credential states (TECH, URDU, Groq, analytics)      |
| `/automation` | Workflow list, run history, colored log viewer                            |
| `/analytics`  | Views, retention, format mix, geographies, top content                    |
| `/settings`   | Theme, lane clock & arm switch, phone-push preferences, lane controls     |

All data is demo data (`src/lib/data.ts`) modeled on the real pipeline. It is ready to
be swapped for real API calls once the `yt-analytics` scope is added to the token.

## Deploying to Vercel

1. Import the repo at [vercel.com/new](https://vercel.com/new) → set **Root Directory**
   to `frontend`. Framework (Vite), build (`npm run build`) and output (`dist`) are
   auto-detected — `vercel.json` already carries the SPA rewrite and asset caching.
2. **Lock it down:** Project → Settings → **Deployment Protection** → enable either
   *Vercel Authentication* (visitors must sign in to a Vercel account you approve) or
   *Password Protection* (shared password). Both are included free on the Hobby plan,
   and they gate the production URL too. The repo can stay public — repo visibility
   and deployment visibility are separate settings.
3. Never put channel tokens or API keys in this app. The bundle is public to anyone
   who opens devtools; real data must arrive through an authenticated source.

## Design system

The "archive ledger" system: warm stone paper + wax-seal crimson in light mode;
lacquer-black + ember seal in dark. Eyebrow labels are mono uppercase (running
headers of a ledger), big numbers are serif, every schedule stamp is PKT.
The signature element is the **cron dial** on the overview — a week ring with the
Mon/Thu spokes sealed in wax and a live countdown in the hub.

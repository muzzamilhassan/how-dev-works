# How Dev Works — Branding + YouTube Studio package

Copy-paste ready. Decision date 2026-09-21. (Full research: automation repo `research/tech-channel-branding-2026-09.md`.)

## Channel name (Basic info → Title)
```
How Dev Works
```

## Handle — SET THIS FIRST (verified free 2026-09-21)
```
@HowDevWorks
```

## Description
```
How software actually works — animated deep-dives into JavaScript, Git, networks, databases, and the tools developers use every day. Calm, visual, and honest: no hype, no fluff, just the machine explained.

WHAT YOU GET
• One system opened up and explained per video — event loop, Git internals, HTTPS, DNS, database indexes
• Clean dark-mode animations that show what your code does behind the scenes
• 8–12 minute deep-dives — watch once, understand for years
• Evergreen topics, not news — these videos don't expire

New deep-dive every week.

Whether you're a junior dev filling the gaps or a senior who wants the full picture, this channel shows you what happens under the hood.

Subscribe and finally see the whole machine.

📧 Business: muzzamilhassan302@gmail.com
```

## Channel keywords (<500 chars)
```
how dev works, programming explained, software engineering explained, javascript event loop, how git works, how https works, how dns works, system design, backend development, web development, computer science explained, database indexing, docker explained, nodejs, v8 engine, rest vs graphql, tech animations, dark mode, deep dive, under the hood
```

## Country: **US** (US-primetime CPM strategy, same as other channels)

## Generated assets (branding/)

Regenerate any time: `node tools/make-branding.mjs` (plus `node tools/make-logo.mjs` for the 120px OAuth logo).

| File | Size | Upload to |
|---|---|---|
| [profile-800.png](branding/profile-800.png) | 800×800 | YouTube Studio → Customization → Branding → **Picture** |
| [banner-2560x1440.png](branding/banner-2560x1440.png) | 2560×1440 (safe area 1546×423 centered) | Customization → Branding → **Banner image** |
| [watermark-150.png](branding/watermark-150.png) | 150×150, transparent | Customization → Branding → **Video watermark** |
| [thumbnail-git.png](branding/thumbnail-git.png) | 1280×720 | Content → hover video → Details → **Thumbnail** (needs phone-verified account) |

## Visual identity
- Banner: `How Dev Works` big + tagline `Software, explained.` — dark bg (#0D1117), one teal/cyan accent, NO heavy text borders (house rule: soft shadow only)
- Logo: minimal glyph — `{ }` or terminal caret on dark square, one accent line → generated: [branding/logo-120.png](branding/logo-120.png) (regenerate with `node tools/make-logo.mjs`)
- Watermark: same glyph

## Video defaults
- Title style: `How X Actually Works` (keep the pattern — it IS the brand)
- Category: Education (27)
- Trailer: Event Loop deep-dive (already rendered)
- Playlists: `How JavaScript Works` · `How Git Works` · `Networking Explained` · `Databases & Backend`

## First 12 videos
1. ✅ How the JavaScript Event Loop Actually Works (delivered — first upload + trailer)
2. How Git Actually Works
3. What Really Happens When You Type a URL and Press Enter
4. How HTTPS Actually Works
5. How DNS Finds a Website in Milliseconds
6. Inside the V8 Engine: How JavaScript Gets Fast
7. How Database Indexes Work
8. Promises vs Async/Await: What Actually Happens
9. How Docker Containers Actually Work
10. Garbage Collection Explained
11. REST vs GraphQL: What Each One Really Costs You
12. How React Re-Renders (and Why Your App Gets Slow)

Topics after #12 flow from `state/tech-topic-bank.json` (daily.dev trend brain).

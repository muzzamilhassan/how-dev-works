# GLOBAL DEEP RESEARCH — Free & Open-Source YouTube SEO Tooling + Virality Engineering

**Date:** 2026-09-24 · **Method:** 5 parallel research agents (~7,000 seconds of combined research, 100+ searches/fetches); every critical endpoint live-verified via HTTP the same day. Worldwide scope (US / EU / India / Pakistan / SEA / LATAM / MENA / China). **Supersedes** `2026-09-24-free-seo-tools-and-virality-research.md` (corrections flagged inline). No code changed in this pass.

**Scope:** faceless AI-narrated documentary channels ("history of everyday things", 15–23 min + Shorts; Urdu + English), operator runs a Node.js/GitHub-Actions pipeline with free-tier discipline.

---

## 0. TL;DR — THE BEST ZERO-COST SOLUTION (final answer)

There is **no single free tool** that does SEO score + keyword data + virality research. The best real-world solution is a **stack of ~7 free layers**, all verified working in 2026:

| Layer | Job | Tool (all free) |
|---|---|---|
| 1. Score | SEO score / on-video audit | **vidIQ free extension** (150 AI credits/mo) |
| 2. Keywords | Demand discovery, worldwide, any language | **YouTube autocomplete endpoint** (`client=firefox&ds=yt&hl=X&gl=CC`) — already implemented in `tools/yt-research.mjs` + **Ahrefs free keyword generator** (the only free tool with volume + difficulty) + **Keyword Tool .io** (750+ suggestions/seed, country selector) |
| 3. Outliers | What's going viral for others | **1of10 free plan** (unmetered outlier search + Chrome extension) + **ViewStats free extension** (outlier scores + thumbnail A/B history while browsing) |
| 4. Retention intel | Competitor retention curves | **yt-dlp `heatmap` field** (Most-Replayed data — free, no quota, the killer undocumented signal) |
| 5. Testing | A/B thumbnails/titles | **YouTube Studio Test & Compare** (free, 3 variants, watch-time-share winner) |
| 6. Pipeline | Automation primitives | **Channel RSS feeds** (include per-video view counts — quota-free competitor tracking) + Data API at 1 unit/call tactics + OSS: `scrapetube`, `youtube-transcript-api` |
| 7. Virality method | The actual growth engine | Outlier strategy + package-before-produce (Paddy Galloway) + retention engineering (see Part 5) |

**Corrections vs earlier report:** ① **1of10 DOES have a free plan now** (unmetered search, 3 tracked channels, free extension) — earlier "no free plan" was wrong. ② Ahrefs' free generator lives at `ahref s.com/keyword-generator` (the old /youtube-keyword-generator URL 404s) and includes volume + difficulty. ③ Spotter Studio **shut down** (Oct 2025). ④ TubeBuddy's free Keyword Explorer is capped at **3 results/query, no volume** — effectively useless. ⑤ Public Invidious/Piped instances are **dead for automation** (YouTube mass-blocked datacenter IPs; ~3 instances left, APIs locked).

---

## 1. FREE-TIER TOOLS, WORLDWIDE — VERIFIED

### The install list (all free tiers verified from official pricing pages)

| Tool | What's FREE (exact) | Gated | Verdict |
|---|---|---|---|
| **vidIQ** (US) | $0 forever: extension overlay (views/hour, SEO score), basic keyword research w/ volume+competition, daily ideas, **150 AI credits/mo**, niche trends | Advanced competitor tracking, bulk AI (Boost 2,000cr/mo) | **The best free install.** |
| **1of10** (US) | **Unmetered outlier search**, bookmarks, **3 tracked channels**, free Chrome extension scoring videos while you browse | More channels/features ($29–89/mo) | **Best free outlier tool — corrected from earlier report.** |
| **ViewStats** (US, MrBeast) | Free account + **free extension**: view trajectories, **Outlier Score**, **thumbnail A/B history** on any video; ~50 AI credits | Pro $49.99/mo (competitor tracking, trend alerts); Business $249+/mo | Install alongside 1of10; don't buy Pro. |
| **TubeLab** (tubelab.net) | **7 free tools**: channel/video/Shorts lookup, transcript fetcher, comments fetcher, **Niche Analyzer** (market size/saturation/RPM), YTRank | Niche Finder (500K channels), Outliers Finder (5M videos), MCP integration — paid | Free Niche Analyzer is genuinely useful for picking the next channel/niche. |
| **Ahrefs free generator** | ~100–150 keyword ideas **with search volume + difficulty**, YouTube platform option, no account | Full lists, SERP overview | Only free source of real volume numbers. |
| **Keyword Tool .io** | **~750+ suggestions per seed**, no account; country selector (IN/PK → Urdu/Hindi suggestions) | No volume at all on free | Bulk harvesting; pair with Ahrefs for volume. |
| **Keyword Sheeter** | Unlimited bulk generation from autocomplete | Volume/CPC reports | Raw corpus building. |
| **TubeRanker** | Free no-signup: tag generator/extractor, title generator, basic SEO score | Audits, tracking ($9.90/mo) | Quick one-off checks. |
| **Morningfame** (DE) | **24-hour keyword-research session** trial + 1 month analytics (invite codes circulate) | No permanent free tier | Best-in-class keyword *evaluation* — use the 24h deliberately once per batch. |
| **TubeSpanner** (AU) | "Free Forever" plan + free extension tier | Full suite $14.99/mo | Thin; optional. |
| **NexLev** (India, nexlev.io) | Free account; **MCP server (60+ AI tools) included free at Lite quota** — built for FACELESS channels (niche finder, RPM predictor, outlier tracking) | Pro tiers (prices login-walled); API 200 req/mo on Pro | The one regional tool worth testing for faceless-niche research. |
| **TunePocket / ryrob / Keyword Tool Dominator** | No-signup tag extraction, free volume-ish estimates, live autocomplete with country picker | — | Utility drawer. |
| **YouTube Studio built-ins** | Research tab (searches across YouTube + content gaps), **Test & Compare** (3 titles/thumbnails, watch-time-share winner, free since Jun 2024), retention graphs | Research tab has **no API, not exportable** (verified) | Ground truth; calibrate keyword lists against it manually. |

**Flagged NOT free / dead / nonexistent (skip them):** Keywords Everywhere (cheap credits, not free) · LowFruits (paid) · **Spotter Studio (public product shut down Oct 2025)** · Morningfame beyond trial · TubeBuddy free Keyword Explorer (3 results/query) · Vidooly (pivoted to enterprise B2B) · Tubics (Vienna, dead) · "Keyworth"/"TasteBuds"/"Hyperfrog" (could not verify existence — garbled names).

**Rest of world reality:** China = dead end (YouTube blocked, no Chinese YouTube tooling). SEA/LATAM/MENA = no meaningful local tools; everyone uses the global stack + `keywordtool.io`/KTD country targeting. Brazil has one free Android app (TubeSEO, PT-BR). India's NexLev (above) is the only notable regional build.

---

## 2. THE OPEN-SOURCE ARSENAL (GitHub, verified stars/licenses/2026 activity)

**Reality check first: a mature OSS "SEO score" engine does not exist.** Everything genuinely good is either (a) the YouTube Data API wrapped well, (b) quota-free scrapers, or (c) LLM-agent skill packs. The proprietary score black-boxes (vidIQ etc.) have no real OSS equivalent.

### Top 5 OSS picks (the actual best solution for a technical operator)

1. **`yt-dlp/yt-dlp`** (★193k, Unlicense, active) — the foundation. `-j` full metadata JSON, `--write-auto-subs`, `--write-comments`, `--flat-playlist` enumeration, chapters, tags… **and the `heatmap` field = Most-Replayed retention curves of ANY competitor video, free, no quota.** This is the single best free competitive-retention signal on the platform — no commercial tool gives competitor retention curves; YouTube's own heatmap does.
2. **`jdepoix/youtube-transcript-api`** (★8.4k, MIT, active; v1.2.x verified) — canonical free transcript plane, no key/quota, supports auto-generated captions + language priority. Pair with **Whisper/Groq** for caption-less languages (Urdu long-tail). npm equivalent: `Kakulukian/youtube-transcript` (★584) or `devhims/youtube-caption-extractor` (★171, TS, active).
3. **`dermasmid/scrapetube`** (★524, MIT) — quota-free search + channel + playlist enumeration (InnerTube parsing). The missing "find what ranks for X across competitors" piece without burning API quota.
4. **`shkuratovdesigner/yuben-app`** (★16, MIT, active) — the most real **local-first OSS outlier finder** (videos overperforming their channel baseline + why-analysis). Alternates: `slaavass/youtube-outlier-finder` (★5, MIT, fresh), `pandich93/youtube-niche-finder` (★1, MCP + HTTP API + PostgreSQL — exactly the self-hosted NexLev/vidIQ architecture), `AdamGarceau/ytscout` (view-to-sub outlier ratio). For the 1of10 job fully in-house: yuben's ratio logic + yt-dlp heatmap.
5. **`eliasdabbas/advertools`** (★1,463, MIT, active) — mature Python layer over the official free API tier: search/videos/channels/comments → pandas DataFrames with **multi-country × multi-language fan-out in one call**. Use for anything that must be production-stable. (Source-verified: there is **no** `kw_wildcard` function — AI search summaries claiming so are wrong.)

### By job (more candidates)

- **Keyword/autocomplete OSS:** `HouseofLoops/headwater` (★64, MIT, self-hosted Docker API unifying Trends + autocomplete + transcripts; pushed today), `systemfsoftware/youtube-autocomplete-scraper` (Apify actor, a-z expansion), `chukfinley/gscrape` (pure-HTTP Google/YouTube/Trends/News/autocomplete scrapers), `webdevcody`-style `youtube-suggest` npm pkg.
- **Agent skills (Claude Code/Cursor — fits this repo's operating style):** `AgriciDaniel/claude-youtube` (★393), `AgriciDaniel/youtuber` (★63, source-cited growth-strategy brain), `adityaarsharma/youtube-marketing-skills` (★44, 21 commands + live-channel MCP), `sergebulaev/youtube-skills` (★37, fresh), `deeployCO/youtube-seo-skills` (★10). All MIT. These are prompts+scripts, not data engines — best as the synthesis layer over the data tools above.
- **MCP servers:** `jkawamoto/mcp-youtube-transcript` (★484, committed today), `kimtaeyoon83/mcp-server-youtube-transcript` (★597), `ZubeidHendricks/youtube-mcp-server` (★575, broadest API MCP), `anaisbetts/mcp-youtube` (★546), `realiti4/youtube-context-mcp` (small but unique: exposes **most-replayed heatmap peaks** to agents), `i1s-abhishek/youtube-studio-mcp` (★18, your OWN channel's Studio analytics via OAuth). **Freemium-data MCPs to skip:** `ZeroPointRepo/youtube-skills` (★955 but requires paid TranscriptAPI.com), ScrapeCreators skills (★2.7k, paid data plane).
- **Metadata scoring OSS (young):** `BizMapper/Open-Tube-SEO` (★3, the only VidIQ-clone extension), `Gaurav-Wankhede/tubeforge` (CLI-first local SEO engine, ★1), rule-based title scorers (toy-grade — the pattern is trivial to build in-house).
- **Comments mining:** `mattwright324/youtube-comment-suite` (★323, MIT, active desktop app — bulk comment archival/search; comments = free demand mining, 1 API unit/call).
- **Scrapers (caution: ToS-gray, breakage-prone, cache hard):** `vsmutok/ytscrape` (★37, fresh), `JuanBindeZ/pytubefix` (★1,631 — friendly but breaks on YT changes), NewPipeExtractor (★1,980, JVM — use via Piped). **Avoid:** public Invidious/Piped (dead), ScrapingBee repo (commercial docs, not OSS).

---

## 3. WORLDWIDE MARKET INTEL + THE URDU/HINDI PLAYBOOK

### The three-script rule (live-verified, the most actionable finding)

Urdu keyword research = harvest the free autocomplete endpoint **three times per topic**: Urdu-script seed + **Roman Urdu** seed + English seed, with `hl=ur&gl=PK`. Verified live today:
- `hl=ur&gl=PK&q=تاریخ` → تاریخ اسلام، تاریخ پاکستان، تاریخی واقعات، تاریخی فلمیں… (real demand mix: academic + drama + essay queries)
- `hl=ur&gl=PK&q=tareekh` → "tareekh e islam", "tareekhi drama in urdu" — **distinct Roman-Urdu demand that no other query surfaces**
- `hl=hi&gl=IN&q=इतिहास` → parallel Hindi set
- **Critical mechanic: the seed's script dominates over hl/gl.** Match seed script to target language; hl/gl localize the market.
- No dedicated Urdu tool exists anywhere (verified) — and none is needed: the endpoint + 3-script rule is the whole answer. Pakistani SEO guides independently recommend English + Urdu script + Roman Urdu in titles/descriptions/tags.

### Dekho Suno Jano benchmark (the Urdu ceiling to aim at)

Faisal Warraich, since Jan 2018: **~2.9M subs, ~370M views, only ~506 uploads → ~730K average views per video.** Depth-over-volume evergreen model (history/geopolitics/biography, scripted voiceover + archival + motion graphics, no face), still gaining ~10K subs/month 8 years in. Est. ~$1.21 RPM (~$2.75K/mo). Lesson: the Urdu doc niche rewards **fewer, deeper, evergreen** — the opposite of shorts-farm economics.

### RPM economics (2025-26)

Pakistan ~$0.42–0.90 CPM · India ~$0.60–1.40 · US ~$11.95–14.67 (education mid-high tier). **20–50× gap.** Implication: engineer metadata so **diaspora traffic (US/UK/AE) isn't lost** — English keyword + Urdu hook titles, English description line 1 — blending RPM upward. At scale, localized per-locale titles beat one mixed bilingual string (YouTube multi-language metadata tooling consensus, 2025-26).

### Studio Research tab caveat for non-English

Launched English-only across 5 regions (US/UK/CA/AU/IN); non-English depth remains inconsistent — use it as a supplement, and weight "Your viewers' searches" (reflects your audience's language) most.

---

## 4. THE FREE DATA PIPELINE (all endpoints live-verified 2026-09-24)

### Working & verified

1. **Autocomplete:** `suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl={lang}&gl={CC}&q={seed}` — clean JSON, ~10 suggestions, worldwide. `client=chrome` works (~15 suggestions); `client=youtube` = JSONP with subtype hints; **`client=ytjs` is rejected (HTTP 400) — do not use**. a-z alphabet expansion = ~20–26× yield per seed. Crawl suggestions as new seeds (BFS), snapshot nightly, **diff for newly-appearing suggestions = rising demand before Trends sees it**. Throttle ~1–2s/req (bursts → 429 → temp IP blocks); hobbyist volume = effectively unlimited.
2. **Channel RSS:** `youtube.com/feeds/videos.xml?channel_id=UC…` — **each entry carries `media:statistics views=` (verified)** → free view counts on the 15 newest videos of any channel, no key, no quota. The quota-free competitor tracker: poll feeds → escalate to `videos.list` (1 unit/50 IDs) only for depth.
3. **Data API tactics (10,000 units/day, resets midnight PT):** ban `search.list` (100 units, ~100/day max) from the pipeline → that frees ~9,500 units. `videos.list` batch-50 = 1 unit (→ up to 500K video stats/day); `commentThreads.list` = 1 unit (demand mining); **`chart=mostPopular&regionCode=XX&videoCategoryId=YY` = 1 unit** → cheap per-country per-category trend firehose. `search.list relatedToVideoId` is **dead (removed Aug 2023)** — substitute: RSS + ytInitialData watch-page scrape. Quota extension exists (compliance-audit form) — not realistic for hobby use.
4. **Google Trends:** `trends.google.com/trending/rss?geo=XX` verified worldwide (US/IN/BR tested; query + traffic + news links) — the only official machine feed. The **YouTube Search filter still exists** in the UI (worldwide + per-country + per-category). `pytrends` is **archived** (repo verified: archived:true, last push 2024-08) — wrap, don't depend. SerpApi Trends free tier is now **250 searches/mo** (updated).
5. **ytInitialData + oEmbed:** full JSON payload present in search/watch pages (browser UA required); oEmbed (`youtube.com/oembed?url=…&format=json`) live for zero-cost title/channel enrichment.
6. **TikTok Creative Center** (ads.tiktok.com/business/creativecenter) — free without login: trending hashtags/sounds/keywords **with volume + trend direction + country filters**. The strongest free cross-platform early-warning surface (TikTok formats migrate to Shorts within days).
7. **yt-dlp heatmap** (repeat for emphasis — it's in this section because it's a data source): Most-Replayed curves for any competitor video = free retention intel no commercial tool provides.

### Dead / avoid

Public Invidious/Piped APIs (mass-blocked, ~3 instances left, PoW-locked) · relatedToVideoId · pytrends as a dependency · scraping Social Blade/Nox/Playboard/vidIQ web (ToS-hostile + anti-bot + data is recycled public stats anyway) · ViewStats has **no public API** (use the site/extension manually).

### Free AI assists (2026)

Gemini Flash free tier cut to ~20 req/day; **Gemini CLI ~250 requests/day free** (enough for a daily synthesis briefing); Perplexity free = unlimited basic + a few Pro/Deep-Research/day. Pattern: LLM as synthesis layer over the data sources above, optionally via an MCP wrapper that caches to conserve API quota.

---

## 5. VIRALITY ENGINEERING — THE EVIDENCE

### Algorithm mechanics (2025-26)

- Four ranking surfaces (Search / Browse / Suggested / Shorts); signals = engagement (CTR, watch time) × satisfaction (surveys, likes, "not interested") × relevance (viewer history).
- **Browse distribution = CTR × AVD × satisfaction, in widening impression waves** — each wave's performance buys the next, bigger wave.
- **~70% of all YouTube views come from the homepage, not search** (1of10's stat, directionally corroborated) → packaging beats keyword-stuffing for growth; search is the compounding second engine, not the first.
- Suggested = performance **relative to adjacent videos** (who you sit next to in a session).
- **Subscriber count does not gate reach** — every upload is a fresh auction tested on cold audiences. Small channels out-deliver 100K-sub channels routinely (Vault of History: 1.2M views at 3.8K subs in 26 days).

### The outlier strategy (the core method)

Find videos doing **≥10× their channel's median** views; **small-channel outliers matter most** (proven demand without authority). Multiplier = video views ÷ channel's recent median. Reverse-engineer the packaging (what promise is made in 1 second?), then **clone the concept, not the video** — new angle/script/visuals, same promise architecture. Free tooling for this: 1of10 free plan, ViewStats extension, or fully in-house (yuben-app logic + RSS-derived medians + yt-dlp heatmap).

### Packaging-first (Paddy Galloway framework, Colin & Samir Aug 2026)

Sequence: idea → **title** → **thumbnail** → *then* production. "If they don't click, they don't watch." Three rules: packaging decides everything; respect the viewer's time; build repeatable formats, not one-offs.

**Title triggers that measurably work:** curiosity gap (withhold the key detail — but pay it off fast; skepticism is inherent), specificity numbers/dates ("in 47 days"), negative framing (loss aversion — "why X failed" outperforms), emotional word, restraint on caps/emoji. Documentary formulas: "Why [X] Failed/Disappeared" · "POV: You're a [Roman soldier]" (proven mega-viral in AI history content, BBC-covered) · "The [Deadliest/Largest] [Thing] in History" · "How [People] Survived [Extreme] for [N Days]" · "Everything You Know About [X] Is Wrong".

### Retention engineering

- Cross-YouTube **average percentage viewed ≈ 23.7%** (10K-video benchmark); **55%+ of viewers leave in the first 60 seconds** — the first minute is the biggest lever in all of YouTube.
- Healthy APV: <5min → 50–70%; 5–10min → 40–55%; 30min → 35%+ (absolute watch time is what the algorithm rewards). For 15–23min docs: target ~40–50% APV.
- Structure: hook → body → payoff; state stakes + concrete promise in 0–10s; no channel intros. **Pattern interrupts** at predicted drop points (every ~30–60s in the first 3 minutes). **Open loops**: cut scenes before full resolution; release each payoff at peak curiosity and immediately open the next loop; escalate stakes act by act.

### Thumbnails

0–5 words of text (beyond 4 words CTR drops), text never repeats the title (thumbnail shows, title tells), high contrast, one unmistakable focal subject. Faces correlate ~+20% CTR *but* no-face thumbnails win when the scene carries emotion (documented +18% CTR case) — for a faceless history channel: dramatic scene/artifact/map/silhouette. **Always run Test & Compare with 2–3 variants**; your own watch-time share is the only ground truth (ignore "+73% CTR" generator marketing).

### Shorts → long funnel

Shorts were **75%+ of YouTube views in 2025** — the top-of-funnel surface. Revenue split 45% (Shorts) vs 55% (long-form) → Shorts are a subscriber-acquisition channel, not revenue. Playbook: each promo Short = self-contained miniature (hook→payoff in 60–100s) of a long video on the SAME topic, **attach the Related-Video link** (YouTube's officially promoted conversion tool) + pinned comment routing to the long version. Judge Shorts by subscriber intake and long-form session starts. (This matches the existing shorts lane design — promo shorts for the latest long video.)

### Case studies with numbers

- **LEMMiNO:** TV-grade production + **rarity as strategy** (~20 videos in a decade — each release is an event); breakout (Cicada 3301) rode existing internet buzz + an embedded participation puzzle. 1M→2M subs in 9 months (2015); still ~10K subs/mo during years-long gaps.
- **The "Boring History" AI wave** (404 Media, Sep 2025): Sleepless Historian, Boring History Bites et al. — 3-hour AI-scripted/narrated/visualized history; 2.3M-view flagship; one 22-year-old reportedly ~$700K/yr at ~2h/day. The *packaging* insight transfers (massive curiosity gap; ultra-long runtime = sleep-utility content with enormous AVD); the slop production does NOT (see policy below).
- **POV history trend** (BBC, Feb 2025): first-person AI history immersion = proven viral trigger.
- **History Time** (human counterpoint): 6 months research/video — research accuracy as durable moat + policy shield.
- Urdu benchmark: Dekho Suno Jano (Part 3) — ~730K avg views/video on ~500 uploads over 8 years.

### AI-content policy (verified from the official page, Jul 15 2025 update)

"Repetitious content" renamed **"inauthentic content"**: mass-produced/templated content is demonetizable — explicitly including *"AI-generated content made with generic or unoriginal templates giving the impression of mass production without adding the creator's original, authentic insights."* Still monetizable: distinct storyline per video, AI used to visualize an original narrative, "your own personalized spin." **Path is demonetization, not termination** (termination claims were overstated); enforcement as of Sep 2025 had not visibly hit the AI-history ecosystem, but YPP-application review risk is real. Your shield: original research/angle per video + visible editorial voice + AI disclosure (already the practice).

### Cadence

vidIQ's 10.2M-channel study: **≥1 upload/week**, increase only while quality holds. Frequency is a ticket-printer for the per-video impression auction, not a ranking factor; over-posting at degraded quality actively hurts (CTR/retention are the signals). Fixed schedule for habit; upload time is decoupled from browse distribution (sleep-history videos get pushed at 3 a.m. months later).

---

## 6. THE UNIFIED ZERO-COST WORKFLOW (for this operator, weekly loop)

1. **Hunt (30 min):** browse the niche with 1of10 + ViewStats extensions on; log every ≥10× outlier (small channels first). Run TubeLab's free Niche Analyzer before committing to any new sub-niche.
2. **Validate demand (free, worldwide):** autocomplete 3-script harvest (Urdu/Roman/English) with hl/gl targeting + a-z expansion; nightly snapshot diff for *new* suggestions; cross-check Ahrefs free generator for volume; TikTok Creative Center + Google News RSS for off-platform buzz; Studio Research tab as ground truth.
3. **Package before producing:** title via the 4 triggers → thumbnail via the 0–5-word rule → only then script. Kill weak packaging at zero cost.
4. **Engineer retention:** cold-open on the most dramatic beat; open loops; pattern interrupts every 30–60s early; check competitor Most-Replayed heatmaps (`yt-dlp --print "%(heatmap)s"`) to place payoffs where audiences actually stay.
5. **Ship:** ≥1/week at constant quality; Test & Compare every important upload; attach Related-Video links from Shorts to longs.
6. **Track quota-free:** channel RSS feeds (views included) for a competitor watchlist; videos.list only for depth; comments mined via commentThreads (1 unit) or youtube-comment-suite for demand signals.
7. **Differentiate from the AI-slop wave:** original angle + distinct storyline + visible editorial voice per video — demonetization shield AND moat.

---

## 7. SOURCES (primary anchors; full per-section source lists embedded in agent reports)

- vidIQ pricing https://vidiq.com/pricing/ · TubeBuddy https://www.tubebuddy.com/pricing · ViewStats https://www.viewstats.com/pricing · 1of10 https://1of10.com · TubeLab https://tubelab.net · Morningfame https://morningfa.me · Ahrefs https://ahrefs.com/keyword-generator · Keyword Tool .io https://keywordtool.io · NexLev https://nexlev.io · TubeSpanner https://www.tubespanner.com
- YouTube official: monetization policies https://support.google.com/youtube/answer/1311392 · thumbnail/title tips https://support.google.com/youtube/answer/12340300 · Test & Compare https://support.google.com/youtube/answer/16391400 · Data API quota https://developers.google.com/youtube/v3/determine_quota_cost · revision history (relatedToVideoId) https://developers.google.com/youtube/v3/revision_history · multi-language audio https://support.google.com/youtube/answer/13338784
- OSS: https://github.com/yt-dlp/yt-dlp · https://github.com/jdepoix/youtube-transcript-api · https://github.com/dermasmid/scrapetube · https://github.com/eliasdabbas/advertools · https://github.com/shkuratovdesigner/yuben-app · https://github.com/jkawamoto/mcp-youtube-transcript · https://github.com/realiti4/youtube-context-mcp · https://github.com/AgriciDaniel/claude-youtube
- Virality: Colin & Samir × Paddy Galloway https://www.colinandsamir.com · Creator Science https://podcast.creatorscience.com · 404 Media boring-history https://news.slashdot.org/story/25/09/03/2028206/ · BBC POV history https://www.bbc.com · retention benchmark https://virvid.ai
- Live-verified today via curl: suggestqueries matrix (incl. `client=ytjs` 400), channel RSS `media:statistics`, Trends RSS geo=US/IN/BR, oEmbed, ytInitialData presence, pytrends archived status, SerpApi 250/mo free tier.
- Local context: `docs/research/2026-09-23-vault-of-history-channel-audit.md` · `docs/research/2026-09-23-hot-topics-and-trend-platforms.md` · `docs/research/2026-09-24-free-seo-tools-and-virality-research.md` (superseded)

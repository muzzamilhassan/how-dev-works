# Free & Open-Source YouTube SEO Tooling + Virality Research

**Date:** 2026-09-24 · Research-only pass. No code changed. Context: history/documentary niche (Urdu channel project + how-dev-works pipeline), builds on [2026-09-23 Vault of History audit](2026-09-23-vault-of-history-channel-audit.md).

## TL;DR — the zero-cost stack

You do **not** need to pay for VidIQ/TubeBuddy/1of10. The honest picture: there is no single "totally free" tool that does everything; the winning setup is **YouTube's own free built-ins + two freemium extensions used on their free tiers + your existing autocomplete scraper + 3 open-source repos**.

| Job | Best free option |
|---|---|
| SEO score / on-page audit | vidIQ free extension (SEO score overlay) · Open-Tube-SEO (OSS, no account) |
| Keyword research | Your `yt-research.mjs` autocomplete harvester (already built!) + YouTube Studio Research tab + Answer Socrates |
| Competitor / outlier research (what's going viral) | ViewStats free account + Chrome extension · TubeLab MCP (7 of 11 tools free) · Social Blade |
| Thumbnail A/B testing | YouTube Studio **Test & Compare** (free for all creators since Jun 2024 — replaced TubeBuddy's paid A/B) |
| Trend monitoring | Already in-repo: `trend-radar.mjs` (HN + YouTube mostPopular) |
| Competitor scraping w/o API | OSS: `jnsougata/opentube` (YouTube public data, no API key) · `nuhmanpk/YoutubeTags` (tags without API) |
| AI-agent SEO workflow (fits this repo's style) | OSS: `AgriciDaniel/claude-youtube` (393★ skill) · `adityaarsharma/youtube-marketing-skills` ("free VidIQ/TubeBuddy alternative", 21 commands + live-channel MCP) |

---

## Part 1 — The tools, tier by tier

### Tier A — Free, built into YouTube (most creators never use these fully)

1. **YouTube Studio Research tab** (Analytics → Research): shows what your viewers *and all of YouTube* are searching, with "content gaps" — searches with high volume and low supply. Zero cost, zero install, and it's YouTube telling you what it wants more of. This is the single most underused free keyword tool.
2. **Test & Compare (A/B testing):** free for ALL creators since June 2024; tests up to 3 thumbnails, and since ~2025 also titles and title+thumbnail combos; runs up to 2 weeks, winner picked on watch-time share. Desktop Studio only. This kills the main reason people paid for TubeBuddy.
3. **Studio Analytics retention graphs:** the real "SEO score" is CTR × retention. Benchmarks from 2025-26 guides: ≥50–70% avg % viewed on short videos is healthy; below 50% = hook/structure problem; for 10+ min videos aim ~60%+.
4. **Hashtags/chapters/end screens** — marginal, but free.

### Tier B — Freemium tools whose FREE tier is genuinely useful

5. **vidIQ free plan** (Chrome extension): SEO score overlay on any video, basic keyword research with volume/competition, limited daily ideas, **150 AI credits/month**, niche trends. Compared in 2026 roundups as the more generous free tier vs TubeBuddy (TubeBuddy free ≈ 3 tags/video, minimal AI, no A/B — mostly a teaser).
6. **ViewStats (viewstats.com)** — MrBeast's analytics platform, **free account**: channel/video deep stats, **outlier scores** (flags videos massively overperforming their channel average), growth charts, and a Chrome extension that overlays view trajectories + outlier scores + thumbnail history *while you browse YouTube*. This is the free version of the $29/mo "1of10" outlier workflow. (ViewStats Pro is $49.99/mo but the free account covers outlier browsing.)
7. **TubeLab MCP server** — 11 YouTube research tools that plug into ChatGPT/Claude; **7 of them free** (searches cost 2–5 credits): live channel stats, outlier videos, transcripts, comments. Paid is $24–29/mo. Relevant because it turns an LLM agent into a YouTube research assistant — same shape as this repo's tooling philosophy.
8. **Answer Socrates** — free question-keyword miner (3 searches/day, 1,500 clustering credits/month, includes search volume). Great for "why/how/what happened" question titles, which is exactly the history-doc title grammar.
9. **Social Blade / Nox Influencer / Playboard** — free competitor tracking: SB for daily view/sub curves (used in the Vault audit), Nox extension for estimated earnings + demographics on the fly, Playboard for leaderboard-style analytics.
10. **Thumblytics / ThumbnailABTest / thumbnailtest.com free tiers** — pre-publish thumbnail mockups and small vote-tests. Secondary, because Test & Compare does the *real* testing for free.

### Tier C — Open source (GitHub), verified repos

11. **`AgriciDaniel/claude-youtube`** (~393★) — Claude Code skill: channel audits, video SEO, retention scripts, thumbnails, content strategy, Shorts optimization. MIT-style utility for exactly the agent-driven workflow this repo already uses.
12. **`adityaarsharma/youtube-marketing-skills`** (~44★) — agent-agnostic YouTube growth toolkit, 21 AI commands + live channel MCP, explicitly positioned as a **free VidIQ/TubeBuddy alternative**.
13. **`sergebulaev/youtube-skills`** (~37★) — high-CTR title + SEO description + retention hook skill pack (MIT).
14. **`BizMapper/Open-Tube-SEO`** (small, ~3★ but real) — "OpenTube SEO — Complete VidIQ Alternative": Chrome/Edge/Brave extension, keyword research via frequency analysis over real video metadata, estimates search volume — no account, no tracking, no limits. The only true OSS VidIQ clone found; young, so treat as experimental.
15. **`jnsougata/opentube`** (~95★) — pulls YouTube public data **without the official API** (no quota). Pairs with this repo's existing scrape-based probes (`probe-channel.mjs`, `watch-probe.mjs`, `search-scrape.mjs` from the Vault audit folder).
16. **`nuhmanpk/YoutubeTags`** (~46★) — extract any video's tags without the API (tags are hidden in the API's public surface).
17. **`eliasdabbas/advertools`** (~1,463★) — Python marketing/SEO library; keyword-combination generation + SERP analysis. More general-web than YouTube, but its autocomplete/keyword matrices complement the doc-niche title research.
18. **YouTube Data API v3 itself is free** — 10,000 units/day default; `search.list` costs 100 units (= ~100 searches/day); reads like `videos.list` are 1 unit. This repo already runs on OAuth + these endpoints; the quota is the only ceiling, and autocomplete scraping (as `yt-research.mjs` does) bypasses search-quota burn entirely.

### Not free (for the record)
1of10 ($29/mo, outlier discovery, no free plan), OutlierKit, TubeLab paid, ViewStats Pro, TubeBuddy paid, Keywords Everywhere. None needed given Tier A+B.

---

## Part 2 — How videos actually go viral in this niche (2025-26 synthesis)

**Mechanics (confirmed by the Vault of History audit + 2026 algorithm guides):**
- Long-form distribution comes from **Browse/Suggested**, decided per-video by CTR × retention × watch time. Sub count and channel age are *not* inputs — a 12-video channel can out-deliver 100K-sub channels (Vault did 1.2M views in 26 days at 3.8K subs).
- Every upload is a cold-audience test. Winners compound (30K → 130K → 337K); losers die quietly (Tobacco: 1.9K). Hit-rate, not perfection, is the game: publish consistently, let the feed pick winners.
- Search is the second engine: Vault's Tea video ranks #3 for its Hindi search phrase months later. Evergreen topics = compounding search traffic.

**The playbook that's printing in this niche right now:**
1. **Language-market arbitrage:** the "dark history of everyday things" format prints in under-served languages (Hindi proven at scale; Urdu = same thesis, even less competition — cf. Dekho Suno Jano). English is saturated.
2. **Proven-topic mining, not brainstorming:** salt, sugar, tea, spices, gold, pen, watch — the viral-topic list circulates; your job is to *validate* each against your own autocomplete + Studio Research data before producing (Vault audit already flags the Hindi list is now contested by clones).
3. **Packaging beats content:** title = English SEO keyword + local-language hook question; description line 1 in English for search, body local-language; thumbnail = one repeatable premium-doc art style + 2-word English keyword + one local hook line. (Fern/LEMMiNO aesthetic localized — engineered for cold CTR.)
4. **Retention architecture:** hook in the first 30s (cold viewers decide there), rising-stakes structure ("raise the stakes" throughout per TubeBuddy's retention guide), 15–23 min for mid-roll economics but only if retention holds ≥~50-60%. One 10-min video at 60% retention outgrows ten 3-min videos.
5. **Cadence + timing:** every 2–3 days, fixed morning slot (Vault: 6 AM IST). Consistency feeds the browse test schedule.
6. **Comments ON (deliberately break from Vault):** comments feed satisfaction signals; Vault's comment-off choice trades signal for zero backlash surface — fine for a burner, wrong for a brand.
7. **AI disclosure:** keep YouTube's altered-content label honest; the format wave is attracting termination risk (Vault runs a clone backup channel for a reason). Distinguish your channel with human-edit passes.
8. **Free viral-research loop (no paid tools):** browse your niche in YouTube with **ViewStats extension** → note outlier videos → mine their titles/thumbnails/transcripts (TubeLab free MCP or your scrape kit) → validate topic demand in **Studio Research + Answer Socrates + your autocomplete harvester** → produce → A/B thumbnail with **Test & Compare** → read retention graph → iterate.

---

## Part 3 — Mapping to this repo (no code changes required)

- `tools/yt-research.mjs` already does what paid keyword tools charge for (real autocomplete harvesting + query filtering). Nothing to buy.
- `tools/trend-radar.mjs` covers trend injection. The gap a free tool fills is **outlier mining** (what overperformed on *other* channels) → use ViewStats free account manually, or TubeLab free MCP tools inside an agent session.
- Competitor watchlist: the Vault audit's `probe-channel.mjs` / `watch-probe.mjs` / `search-scrape.mjs` are already a working intel kit — scheduling them is a future decision, not part of this pass.
- If we later want agent-native SEO audits, `AgriciDaniel/claude-youtube` and `adityaarsharma/youtube-marketing-skills` are drop-in skill packs — evaluate before any adoption; noted here as options only.

## Sources

- [YouTube Help — A/B test titles & thumbnails](https://support.google.com/youtube/answer/16391400) · [Test & Compare rollout thread](https://support.google.com/youtube/thread/279488115/)
- [YouTube Data API quota calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
- [vidIQ plans](https://vidiq.com) · [TubeBuddy free](https://www.tubebuddy.com) · [TubeBuddy vs vidIQ comparison](https://www.causalfunnel.com)
- [ViewStats](https://www.viewstats.com) · [1of10 alternatives comparison](https://1of10.com) · [OutlierKit tool comparison (TubeLab MCP free tools)](https://outlierkit.com)
- [Answer Socrates review (free limits)](https://stuffwithwords.com) · [AlsoAsked pricing](https://alsoasked.com)
- GitHub: [claude-youtube](https://github.com/AgriciDaniel/claude-youtube) · [youtube-marketing-skills](https://github.com/adityaarsharma/youtube-marketing-skills) · [youtube-skills](https://github.com/sergebulaev/youtube-skills) · [Open-Tube-SEO](https://github.com/BizMapper/Open-Tube-SEO) · [opentube](https://github.com/jnsougata/opentube) · [YoutubeTags](https://github.com/nuhmanpk/YoutubeTags) · [advertools](https://github.com/eliasdabbas/advertools)
- Retention/hook guidance: [1of10 storytelling guide](https://1of10.com) · [VideoShufflr 2026 faceless guide] · [Overseeros faceless AI history channels 2026](https://www.overseeros.com)
- Local: `docs/research/2026-09-23-vault-of-history-channel-audit.md`

# Code-to-Diagram Tools → YouTube Automation: Niche & Channel Research

**Date:** 2026-10-04
**Question:** "Which type of automation can we start with the code-to-diagram tools, which type of YouTube channel can we open, which niche, how, and which one will work?"
**Method:** 3 research layers — (A) tool/CI feasibility + licensing, (B) demand/RPM/saturation/language-gap market data, (C) channel & format landscape (live search + the channel evidence from agent B; the dedicated channel-profiling agent failed twice on API timeouts, so channel numbers below lean on the market agent's verified snapshots + our own 2026-09-26 CloudXBerry dissection). Every claim sourced.
**Companion docs:** 2026-10-04-code-to-diagram-tools-research.md (tool survey), 2026-09-26-cloudxberry-animation-dissection.md (motion grammar), 2026-09-26-audio-synced-animations-research.md (engine plan).

---

## 0. Executive verdict

**Open an English-language, faceless, long-form "Database / SQL internals" diagram-explainer channel — "databases finally make sense" — built on the existing Remotion engine, with D2/Mermaid SVGs feeding progressive-reveal scenes. It scored highest (21/25) on the evidence: massive evergreen demand, highest RPM tier ($10–25 vs $4–10 for history), the format lane owned only by a talking-head (Hussein Nasser), and a proven dev-tool sponsor market. Runner-up bets: English system-design explainers (higher ceiling, tougher head — our current channel already fights here) and an Urdu tech-explainer as a blue-ocean option play reusing the Sealed Histories pipeline. Do NOT do Shorts-only (worst RPM, exact template profile YouTube's July-2025 'inauthentic content' policy flags).**

Everything needed is CI-verified free software: D2 renders in <1s (and its `steps` boards are literally a storyboard DSL), mermaid-cli renders in ~2–5s with element-addressable SVG, both drop into Remotion for word-timestamp-driven progressive reveal. All licenses are clean for monetized video. The one legal gray zone is edge-tts on the free endpoint — build the Azure Speech adapter when the channel is close to monetization.

---

## 1. What the automation can actually do (CI-verified)

Feasibility matrix (full detail in §Appendix, sources inline there):

| Tool | Renders in GitHub Actions? | Animation route | Commercial-safe | Cost |
|---|---|---|---|---|
| **D2** | ✅ static binary | **`--animate-interval` = animated SVG from `steps`/`layers` boards — a storyboard DSL for free**; or `@terrastruct/d2` WASM inside the Remotion Node process | ✅ MPL-2.0, outputs are ours | <1 s/diagram |
| **mermaid-cli** | ✅ docker `minlag/mermaid-cli` + `--no-sandbox` | ✅ SVG ids are addressable (`#flowchart-A-0`, `#L_A_B_0`, `.edgePath`) → per-node reveal in Remotion | ✅ MIT | 2–5 s/diagram |
| Python Diagrams | ✅ apt graphviz + pip | static SVG → animate image/pan in Remotion | ✅ MIT code; icons = vendor terms (keep unmodified) | 1–2 s |
| PlantUML | ✅ apt jar / docker | static | ✅ GPL **image exemption**: "Those images are not covered by the GPL license" | 1–3 s |
| Kroki | ✅ Actions `services:` container | inherits engine | ✅ MIT | ~1 s/render |
| Inframap | ✅ release binary | static dot→svg | ✅ MIT | seconds |
| Gource | ✅ `xvfb-run gource -o - \| ffmpeg` (official PPM pipe) | it *is* video | ✅ video derives from our own git log | minutes |
| ChartDB / DrawDB | ❌ browser-only, no CLI | — | — | n/a |
| GitDiagram / DeepWiki-Open | ❌ as pipeline deps (need LLM keys + external services; non-deterministic) | emits Mermaid | MIT but LLM cost | 10–60 s + $$ |
| Manim | ✅ but CPU-bound | hand-coded only | ✅ MIT | **3–6× video runtime at 1080p** — wrong default |

**The three viable architectures for our Actions-only pipeline:**
- **A. D2 storyboard → Remotion reveal (recommended primary):** script → LLM emits per-scene `.d2` with `steps:` boards → D2 renders SVG per board → Remotion `dangerouslySetInnerHTML` + board-opacity keyed to `useCurrentFrame()`; edge-tts word timestamps drive both captions and reveal. <1 s/diagram, no browser, best ergonomics.
- **B. Mermaid → mmdc SVG → Remotion id-reveal:** same skeleton; choose when we want the strongest LLM-authoring prior (models write Mermaid more reliably than D2 — MermaidSeqBench, arXiv:2511.14967, shows syntax errors are THE failure mode → wrap mmdc as CI syntax oracle with one repair-retry).
- **C. Remotion-native diagram AST (flagship quality):** tiny JSON {nodes, edges} → dagre/elkjs layout → React primitives in our existing dark scene system; vendor icon packs drop in as assets. Most engineering; reuses 100% of current pipeline. Use for hero videos.

**Licensing (all verified):** Remotion free for individuals/≤3-employee companies **including monetized output**. AWS icon library: "The diagrams you create belong to you and we grant you a license to use any of OUR copyrighted icons in your diagrams" — a monetized explainer is the exact permitted use (don't recolor/distort, no implied endorsement). Azure: "permits use of these icons in architectural diagrams, training materials." GCP similar. PlantUML/Gource/Graphviz outputs unrestricted. Fonts JetBrains Mono / Inter = OFL. **edge-tts = gray** (unlicensed free endpoint; community consensus low enforcement risk, but the de-risked path for a revenue channel is Azure AI Speech — same voices, `wordBoundary` timestamps, free F0 tier → paid S0 cents/video). Build a thin TTS adapter now, swap later.

---

## 2. Which niches the evidence supports

### 2.1 Scoring (from market agent; 5 = favorable; full data + sources in report body)

| Niche | Demand | RPM | Saturation⁻¹ | YPP risk⁻¹ | Automation-fit | **/25** |
|---|---|---|---|---|---|---|
| **English DB + SQL internals explainers** | 4 | 5 | 4 | 4 | 4 | **21** |
| English system-design explainers | 5 | 5 | 2 | 4 | 4 | **20** |
| English DSA animations | 4 | 4 | 2 | 4 | 4 | **18** |
| Hindi system-design (animated) | 5 | 2 | 4 | 3 | 4 | **18** |
| Urdu tech-explainers | 3 | 1 | 5 | 3 | 4 | **16** |
| Shorts-only diagram facts | 3 | 1 | 1 | 2 | 5 | **12** |

### 2.2 The money data

- **RPM:** tech/programming long-form **$10–30** (creator-reported, Fourthwall/DepthHQ/Leaxor aggregations); faceless tech $10–25+; entertainment $2–4; history/true-crime middle tier ~$4–10. Tech ≈ **1.5–3× our history RPM**. Shorts: $0.04–0.08/1k even tech ($100–300 per 1M) — growth tool, never a business.
- **Sponsors:** dev-tool sponsorship CPM $15–60 (SponsorJuice/SponsorRadar; JetBrains-sponsored small channel billed $91–183/video vs $18–55 AdSense). Hussein Nasser's DB-internals channel sold **CockroachDB, SingleStore, Shopify** segments — DB content specifically attracts sponsors. Brilliant targets exactly this STEM-explainer inventory.
- **Evergreen proof:** Gaurav Sen's system-design intro still surfacing at **1.9M views ~6 years post-upload**; ByteByteGo library re-watched as reference corpus every hiring cycle; CodeAesthetic hit ~500–600K subs on **<25 videos** because diagram explainers trend for years on HN/Reddit. Internals (B-trees, WAL, HTTPS, git objects) essentially never decay.

### 2.3 Saturation map (English)

- **Crowded head:** system-design (ByteByteGo 1.44M subs, Gaurav Sen, "Jordan has no life"), DSA animations (NeetCode ~1M, Back To Back SWE, William Fiset, Tushar Roy, Reducible, Abdul Bari).
- **The exploitable middle:** animated-diagram channels at 50K–500K subs are **thin** — most tech content is still talking-head or static slides. Newcomers still break through (Ashish Pratap Singh: single system-design video **413K views**; Jordan has no life went from "small fanbase" 2023 to top-listed resource 2024-25).
- **The clean gap: DB/SQL internals in animation.** Hussein Nasser owns the *topic* but as a face/talking-head streamer. Nobody owns the faceless animated "how a database really works" lane. Demand proof: his DB-internals videos are his signature content; ByteByteGo's database videos are among its most-shared; our own test topic ("Auto Increment vs UUID" — quarry-render's default!) is a DB-internals topic and CloudXBerry's #2 video at 106K views.
- **Hindi:** topic heavily served (CodeWithHarry 7.35M, Apna College 5–6M, Love Babbar) but ALL talking-head/screen-record — the animated-diagram format is open; RPM is ~$1–3, so it's a volume/course-funnel play.
- **Urdu:** genuine **content vacuum** — searches for "system design urdu / DSA urdu / programming urdu" surface only small lecture channels (Codanics 227K subs is data-science, ~600-view DSA playlists). Demand is real and measurable: ~600K+ Pakistani IT professionals, 45K IT grads/year, 2.37M freelancers (world #4), $1.76B freelance FX earnings FY2025, ~90% YouTube penetration among Pakistani internet users. But Pakistan-traffic RPM is <$1–1.5 → strategic/option value, not AdSense value. We already own the Urdu distribution playbook (Sealed Histories).

### 2.4 Policy risk (2025-2026 — shapes the whole design)

- **July 15, 2025 "inauthentic content" policy** (YouTube monetization): bans "mass-produced, generic, repetitive" content; explicitly names **"image slideshows, templated storylines, or scrolling text with minimal or no narrative"**. Our defense is structural: per-topic research-driven scripts, distinct diagrams per video, original narrative voice — exactly what our pipeline already produces (and our git history = built-in proof-of-process for YPP appeals; documented appeal wins hinge on showing workflow artifacts). Shorts-only template channels are the most exposed profile.
- **YPP bar rises Feb 1, 2027:** new channels will need 1,000 subs + **8,000 watch hours** (doubled) or 20M Shorts views/90d (doubled). Consequence: **long-form watch-time must be the strategy**; Shorts feed discovery, not revenue.

---

## 3. The channel concepts, ranked

### 🥇 Concept 1 — "Databases finally make sense" (English, long-form, faceless animated)
- **Niche:** DB/SQL internals — B-trees & indexes, write-ahead logs, MVCC & isolation levels, query planning, connection pools, replication, sharding, auto-increment vs UUID, "what really happens on an INSERT".
- **Formats (proven):** "How X works internally" + "X vs Y" + "N laws of X" — the exact three formats our engine/templates were built for (CloudXBerry's 270K-view "8 API Laws", 106K-view "Auto Increment vs UUID").
- **Stack:** existing Remotion engine + scenes (SFlow/SBars/STerminal + planned `sim`/`selector`) for 80% of shots; **D2/Mermaid SVG progressive-reveal** (arch A/B) for complex architecture shots; Graphviz via Python-Diagrams when vendor icons needed; thumbnail factory as-is.
- **Why it wins:** best score (21/25) — demand 4 (huge evergreen + interview-driven), RPM 5 (top bidder categories + DB-tool sponsors), saturation 4 (topic owned only by a talking-head; the animated faceless lane is empty), YPP-safe 4, automation-fit 4 (diagrams ARE the product; no footage needed).
- **Risk:** narrower topic ceiling than all-of-system-design — mitigated by natural expansion path (files → caches → queues → the whole backend), i.e. it *grows into* a system-design channel from an unowned beachhead.

### 🥈 Concept 2 — English system-design explainers (our current lane, sharpened)
- Highest ceiling (demand 5, RPM 5) but head-on with ByteByteGo et al.; win condition is production quality = exactly the audio-synced-animation roadmap already planned (beatmap phases 1→4). Not a new channel — it's the evolution of the existing one; new channels should NOT clone it.

### 🥉 Concept 3 — Urdu tech-explainer (blue-ocean option play)
- Empty supply + real demand + our proven Urdu pipeline. RPM makes it an audience/option play (future: Pakistani-market sponsors, course funnels, or first-mover authority). Cheap to run: same render engine, Urdu TTS workstream already exists locally. Start *after* concept 1 is pumping, or opportunistically re-render winners.

### 4. Hindi system-design animated — only with a volume/course-funnel thesis (RPM ~$1–3).
### 5. Shorts-only diagram facts — reject as a channel; use Shorts as clips/funnel (policy-exposed, $0.05 RPM).
### 6. Gource/repo-visualization or codebase-tour channels — cute side formats, not defensible niches (novelty decay; GitDiagram/DeepWiki not CI-reliable).

---

## 4. The "how" — pipeline design for Concept 1

```
topic bank (DB internals, 50 topics)
  → LLM script (per-topic research prompt; narration + per-scene D2/Mermaid code + sim cues)
  → CI validate: d2 compile / mmdc exit-code = syntax oracle (1 repair-retry loop, then hard-fail)
  → D2 SVG per scene-board  (<1 s each)
  → Remotion: existing scene system + NEW D2Reveal component
       (dangerouslySetInnerHTML + board/node opacity keyed to useCurrentFrame();
        edge-tts word timestamps drive captions + reveal = one timeline)
  → edge_batch.py TTS (edge-tts now; Azure Speech adapter when monetizing)
  → thumbnail factory (existing) → cron publish (existing)
```

**Phased (each ships alone, zero-regression, matching the house style):**
- **Phase 0 (start now, zero new engineering):** first 10 videos entirely on existing scene templates — our flow/steps/terminal/bars scenes already express 80% of DB-internal concepts (INSERT→WAL→counter→row is the CloudXBerry `sim` pattern). Prove niche + retention before new code.
- **Phase 1:** `D2Reveal` component (~200 lines, arch A) — complex architecture shots upgrade to D2 SVGs with narration-ordered node/edge reveal.
- **Phase 2:** LLM emits D2 `steps:` boards per scene = storyboard reveal from one asset (`--animate-interval` fallback).
- **Phase 3:** full cue-sheet choreography (Layer 4 of the audio-synced plan) — diagram follows the argument.
- **Guardrails carried over:** shape-check AI output; bad/missing diagrams → fall back to native scenes; <300s test-render gate; render on public-repo runners (free).

**Compliance kit from day 1:** distinct research per topic (no templated sameness), original scripts, keep git artifacts (YPP appeal evidence), edge-tts→Azure adapter before monetization review, vendor icons unmodified.

**First 10 topics (evergreen, diagram-native, expandable):**
1. What Really Happens When You INSERT a Row (WAL, buffer pool, fsync)
2. Auto-Increment vs UUID (already our test topic — proven demand)
3. Why Is My Query Slow? (query planner, EXPLAIN, index selection)
4. B-Trees: The Only Data Structure Most Databases Need
5. Indexes: When They Hurt More Than They Help
6. MVCC: How Databases Read While Others Write
7. Transaction Isolation Levels Actually Explained
8. Connection Pools: The Cheapest Performance You'll Ever Buy
9. Replication Lag, Explained with Pictures
10. Sharding: When One Database Stops Being Enough

---

## 5. Sources (primary)

**Tools/CI/licensing:** github.com/mermaid-js/mermaid-cli (+ docs/linux-sandbox-issue.md) · hub.docker.com/r/minlag/mermaid-cli · raw.githubusercontent.com/terrastruct/d2/master/d2cli/{main.go,export.go} (--animate-interval, export table) · npmjs.com/package/@terrastruct/d2 (WASM in-process) · github.com/mingrammer/diagrams · plantuml.com/license (image exemption quote) · docs.kroki.io/kroki/setup/install (bundled engines) · github.com/cycloidio/inframap · github.com/acaudwell/Gource + wiki/Videos (PPM pipe) · github.com/NBprojekt/gource-action · github.com/chartdb/chartdb + drawdb-io/drawdb (no CLI — browser-only) · github.com/ahmedkhaleel2004/gitdiagram (self-host deps) · remotion.dev/docs/the-fundamentals + LICENSE.md (free ≤3 employees, monetized OK) · aws.amazon.com/architecture/icons + Azure learn.microsoft.com/azure/architecture/icons + cloud.google.com/icons (usage terms) · github.com/rany2/edge-tts + learn.microsoft.com TTS-usage Q&A (gray zone; Azure Speech = licensed path) · arXiv:2511.14967 MermaidSeqBench (LLM→Mermaid syntax-error failure mode) · ManimCommunity/manim#3897 (render cost) · github.com/JetBrains/JetBrainsMono + rsms/inter (OFL).
**Market:** fourthwall.com · taap.bio · leaxor.com · depthhq.com · fluxnote.io · tubevertex.com · sponsorjuice.com (sponsor CPMs $15–60) · chabot.dev DevRel almanac (sponsor roster; Hussein Nasser: CockroachDB/SingleStore/Shopify) · flowshorts.app (Shorts RPM) · hypeauditor.com (ByteByteGo 1.44M) · teamblind.com (NeetCode ~1M) · YouTube search pages (Gaurav Sen 1.9M evergreen; Ashish Pratap Singh 413K single video) · instagram/LinkedIn (CodeWithHarry 7.35M; Love Babbar) · codanics.com (Urdu: 227K, data-science) · PSEB/ADB sector reports (600K IT pros, 2.37M freelancers, $1.76B FY25) · ozbix/PTA/dailyk2 (Pakistan connectivity) · aiopportunity.publicfirst.co (YouTube Rs 16T Pakistan) · theverge.com + support.google.com/youtube/answer/1311392 (July-2025 inauthentic-content policy) · ppc.land + cyberkendra (YPP watch-hours doubling Feb 2027) · r/NewTubers + r/PartneredYoutube (reused-content appeal mechanics).
**Channel landscape (supplementary):** WebSearch sweeps 2026-10-04 — faceless/animated DSA incumbents: NeetCode, Back To Back SWE, William Fiset, Tushar Roy, Reducible, Abdul Bari; @TheCloudXBerry has minimal indexed web presence outside YouTube itself (video-level stats from our 2026-09-26 dissection: 270K/106K top videos).

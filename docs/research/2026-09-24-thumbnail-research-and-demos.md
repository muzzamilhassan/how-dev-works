# Thumbnail research + demo set — 2026-09-24

**Demos:** `out/thumbnail-demos/` (9 PNGs, 1280×720) · **Lab:** `thumbnail-lab/` (renderer + fonts + PD images)

## Why the current generated thumbnails feel cheap

`tools/make-thumbnail.mjs` renders a **text-only SVG card**: dark gradient, full-sentence headline, tiny `>_` glyph and corner brackets. Against what wins in the feed it fails on 5 points:

1. **No subject.** Every winning thumbnail leads with a visual (diagram, object, scene, face). Text-only cards have nothing to catch the eye at 168px feed size.
2. **Too many words.** Winners use 2–5 words at giant size. Ours crams the whole title.
3. **Dark-on-dark.** Low contrast background makes it recede next to loud neighbors.
4. **No focal point or story** — nothing to understand in 0.3 seconds.
5. **Decorative clutter** (brackets, tag row) spends pixels on things invisible at feed size.

## What the winners do (reference thumbnails in `thumbnail-lab/ref/`)

| Model | Example | Pattern |
|---|---|---|
| Diagram hero | ByteByteGo HTTPS (1.27M), PowerCert DNS (5.7M) | Clean colorful diagram IS the thumbnail; question band on top; minimal words |
| Giant acronym + object | PowerCert DNS | Huge white keyword, glowing tech object, floating labels, loud gradient |
| Flat pop + one object | Fireship Docker 100s (1.35M) | Flat bright color, one big object, 1–3 words, playful sub-line |
| Vintage scene | Vault of History, Quotes House Sugar (1.5M) | Sepia/painterly scene, oxblood "HISTORY OF X", native-language hook line |

Common law: **one focal visual + ≤5 giant words + one accent color + consistent template.**

## The 9 demos

**How Dev Works (tech) — 3 reusable concepts:**
- `tech-1-https.png` — *Diagram hero*: browser→4 steps→server handshake diagram, "How Does HTTPS Work?" band.
- `tech-2-dns.png` — *Giant acronym*: 330px "DNS", server rack + monitor, floating labels, teal→rust gradient.
- `tech-3-docker.png` — *Flat pop*: Docker blue, container stack, "CONTAINERS / not tiny virtual machines?"
- `tech-4-url.png` — *Diagram hero* variant: browser bar + DNS→TLS→page chain, "YOU PRESS ENTER. THEN WHAT?"
- `tech-5-index.png` — *Problem hook*: "WHY IS MY QUERY SLOW?" + table with highlighted row + O(1) magnifier.

**History/Urdu (Vault-derived) — 1 system, 4 samples:** framed vintage PD photo (museum-mat style), Bebas over-line + giant Anton keyword in oxblood, Nastaliq hook line, badge "اردو دستاویزی سلسلہ":
- `hist-1-salt.png` (SALT — وہ سفید دانہ جو سونے سے بھی قیمتی تھا) · `hist-2-tea.png` (TEA — چائے کے پیچھے جاسوسی، جنگ اور غلامی) · `hist-3-time.png` (TIME — انسان نے وقت کو کیسے قابو کیا؟) · `hist-4-company.png` (BOUGHT INDIA — ایک کمپنی نے ہندوستان کیسے خرید لیا؟)

## How it's built (all license-safe)

- **Renderer:** `thumbnail-lab/render.mjs` — HTML templates → headless Chrome (puppeteer-core) → PNG. No canvas/RTL headaches; Chrome shapes Nastaliq perfectly.
- **Fonts (OFL):** Anton, Bebas Neue, Inter Black, Noto Nastaliq Urdu, Noto Naskh Arabic (in `thumbnail-lab/fonts/`).
- **Images:** public-domain only via Openverse API (`license=cc0,pdm`), CC0 filter — zero strike risk. Wikimedia/Met/NASA unreachable from this network; Openverse works.
- **Rerun:** `node thumbnail-lab/render.mjs` (all) or pass names.

## Options from here (user decides)

1. **Adopt diagram-hero as the How Dev Works system** — extend `make-thumbnail.mjs` to HTML/Chrome, per-topic SVG motifs, keep brand cyan + `>_` mark.
2. **Adopt flat-pop** as the lighter-weight alternative (fastest to template: bg + word + one object).
3. **Adopt the framed-PD history template** for the Urdu channel — works today with Openverse CC0 images; can later swap in AI-generated painterly scenes (Vault-style) if an image-gen API is added.
4. Integrate as a pipeline step: topic bank → template pick → render → `set-thumbnail.mjs` at publish. Not built yet, awaiting decision.

Caveat: demos are hand-tuned one-offs; a pipeline version needs a topic→template mapping and auto-wrapped text (the old SVG script's layout logic ports over).

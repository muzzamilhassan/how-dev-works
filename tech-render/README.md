# tech-render — diagram-style explainer lane (the "ByteByteGo style" pipeline)

One spec file = one video. The composition (`src/DiagramExplainer.tsx`) is fully
spec-driven: narration beats, headline chapters, panels, self-drawing edges,
badges, takeaways, outro — all data in `specs/*.json`. This is the production
home of the style prototyped in `../diagram-lab/video` (kept as the lab).

## Render an episode

```bash
cd tech-render
npm install                # once (same pinned remotion as urdu-render)
node make.mjs specs/2026-10-05-btree.json            # TTS + timeline + shape-check
node make.mjs specs/2026-10-05-btree.json --render   # + muted render + premix/mux → out/<id>.mp4
```

Render flags that matter (env): `CONCURRENCY` (default 1 — raise on a runner
with free RAM), plus the Robustness Law baked in: **muted jpeg render +
ffmpeg premix/mux** — the audio mix never runs inside the browser.

## Spec format (see check-spec.mjs for the enforced rules)

| field | what |
|---|---|
| `beats[]` | narration sentences — one idea each; TTS + word timestamps are generated from these |
| `accentPerBeat[]` | chapter color per beat: `cyan · amber · green · violet · red` |
| `hook` | `{beat, text}` — the typewriter SQL/code chip |
| `headlines[]` | `{beat, parts:[{t, tint?}]}` — chapter headline swaps |
| `badges[]` + `badgeFadeBeat` | the numbered job chips strip |
| `panels[]` | `{id, title, sub, badge?, x,y,w,h, beat, db?, color?, rows?}` — pop when their beat is spoken; **breathe (glow) while their beat is active**; idle-float forever after; `rows` = staggered sub-lines instead of `sub` |
| `edges[]` | `{id, path:"M …", beat, color?, label?, lx,ly?, dash?, pulse?, flow?, dots?}` — draw-on in narration order; `pulse` = thickens while its own beat is spoken; **`flow` = data dots travel the path forever after** (the map stays alive) |
| `counters[]` | `{beat, x,y, label, from, to, suffix?, color?}` — **odometer chip**: the number ticks from→to while its beat is spoken |
| `terminals[]` | `{beat, x,y,w, title, lines[], color?}` — **fake terminal window** (traffic lights): lines type character-by-character across the beat |
| `selectors[]` | `{beat, x,y,w, title?, options[], color?}` — **highlight walks the options** in narration order (interactive-selector simulation) |
| headline swap | crossfade: previous headline fades up-out while the new one springs in |
| `takeaways[]` + `takeawaysBeat` | the closing comparison build (diagram shrinks up) |
| `outro` | final lockup chip |

Coordinates are 1920×1080 absolute; captions live below y≈940 (checker warns).
`node check-spec.mjs specs/<id>.json` exit-codes on any violation.

## Pipeline integration

- **`.github/workflows/tech-render.yml`** — manual dispatch: renders a spec on a
  runner (no local RAM needed), uploads the mp4 as an artifact.
- **`.github/workflows/publish-diagram.yml`** → `publish-diagram.mjs` — **the
  full auto pipeline**: no inputs needed. It picks the next idea from
  `specs/topic-ideas.json` (seeded from the niche research: DB/SQL internals),
  asks the AI to write the spec (`write-spec.mjs` — house style + schema in the
  prompt, check-spec as syntax oracle with 2 repair retries), renders, then
  uploads → thumbnail → state. Needs a free LLM key in repo secrets:
  `gh secret set GROQ_API_KEY` (console.groq.com) **or** `GEMINI_API_KEY`
  (aistudio.google.com). `--topic "X"` overrides the auto-pick; `demo: true`
  runs a shortform chain-test that never uploads.
- Publishing law unchanged: a video uploads only when the spec is `longform:true`
  AND the render is ≥ 300s. Demo-length specs always run in test mode.
- The old `publish.yml` → quarry-render lane is untouched; flip the cron over
  when the first auto longform episode has been through the chain once.

## Writing specs

Hand-write them (like `specs/`) or generate: the spec format is deliberately
LLM-friendly — prompt for beats + layout JSON, then ALWAYS run check-spec as
the syntax oracle with one repair-retry before rendering (same pattern as the
Mermaid/D2 lanes in the research doc).

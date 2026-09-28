# Audio-Synced ("Real-Time") Animations for How Dev Works — Deep Research

Date: 2026-09-26 · Status: research only, nothing implemented
Question: "realtime animations which change with audio words or by sentences — how can this be possible?"

---

## 0. Executive verdict

**It is not only possible — 60% of the machinery already exists in the pipeline.**
The render engine (quarry-render `explainer/remotion/tech-video.tsx`) already receives
word-level timestamps for every spoken word and already renders word-by-word karaoke
captions. What it does NOT do: react the *scene visuals* (diagrams, bars, terminals,
code) to what the narration is saying at each moment. Scenes animate on fixed internal
timers, deaf to the voice.

The upgrade is therefore not a new engine — it is **wiring existing timing data into
existing scene animations**, plus three new layers on top. Recommended build: 4 phases,
each independently shippable, all free (no new services, no paid APIs). Full build
estimate: 3–5 working sessions.

**One clarification first:** "real-time" is the wrong mental model, and that is GOOD
news. Real-time engines (Unity, WebGL streaming) render live → dropped frames, sync
drift, unfixable mistakes baked into every run. The professional standard (Fireship,
3Blue1Brown, every premium explainer) is **deterministic frame rendering**: the
animation is a *function of time*, computed per frame, with the audio placed on the
same timeline. Remotion — already the pipeline's engine — does exactly this. Sync
becomes math, not luck: a word spoken at t=42.30s appears at exactly frame 1015.20
(42.30 × 24fps). We want "responds to the audio as it plays", and we get it at
render time with perfect accuracy.

---

## 1. Ground truth — what already exists (verified in code, 2026-09-26)

### 1.1 Word-level timestamps: already flowing

`edge_batch.py` (quarry-render) synthesizes narration via edge-tts (Microsoft neural
voices) and captures **WordBoundary events** — every word gets `{w, s, d}` (word,
start-seconds, duration-seconds). Output per scene:
`tts-durations.json → [{i, ms, words: [{w, s, d}]}]`.

This is the hardest part of audio-synced video (transcription/alignment) and it is
already solved — edge-tts emits word boundaries natively, free, no Whisper needed.
(For reference: teams commonly pay for Whisper/Deepgram/AssemblyAI to get exactly
these numbers; sources in §8.1.)

### 1.2 Karaoke captions: already rendered

`tech-video.tsx` line 382, the `Captions` component:
- converts current frame → milliseconds, finds the active word (`ms >= t0-40 && ms < t1+150` — padding absorbs TTS drift, the documented best practice)
- active word = accent-colored chip + pop spring animation; past words tinted; future words dimmed
- scrolling 3-word window

This IS audio-synced animation — shipped, live in every video since Sep 21.

### 1.3 Scene visuals: animated but DEAF (the gap)

Each scene template (`STerminal`, `SBars`, `SFlow`, `SSteps`, `SCode`, `SClash`…)
animates with `spring()`/`interpolate()` driven by **hardcoded delays**
(`delay = i * 1.3`, `frame - 8`, etc.). Example: a `bars` scene grows its bars on a
fixed stagger even if the narrator names them 4 seconds later. The narration words
reach the component (`words[i]` prop is passed to `Captions`) but the scene body
never reads them.

**The whole upgrade = make scene bodies read the same word stream the captions
already read.**

---

## 2. The data flow (the "how")

### 2.1 Today

```
script (AI) → scenes[] → edge_batch.py (TTS) → beats + word timings
                                   ↓
        make-tech-video.mjs → props {scenes, starts, durs, sceneWords, sceneAudio, music}
                                   ↓
        Remotion: <Sequence per scene> → scene body (fixed timers) + Captions (word-synced)
```

### 2.2 Target (adds ONE intermediate file — the "beat map")

```
script → scenes[] → edge_batch.py → beats + word timings
                         ↓
        NEW: beatmap compiler (pure Node, ~150 lines)
          • sentence segmentation: split word stream on punctuation + pause gaps > 350ms
          • emphasis detection: numbers, capitalized tech terms, code tokens
          • merges AI scene data + per-sentence word ranges
        → beatmap.json { sentences: [{id, t0, t1, text, words[], emphasis[], cue}],
                         words: [{w,t0,t1,sentenceId}] }
                         ↓
        Remotion: scene bodies read beatmap via a context/hook
          • currentSentence() → which sentence is spoken NOW
          • isSpoken(t0,t1) → has this element's moment arrived?
          • emphasisPulse(word) → is this word being spoken right now?
```

Everything stays deterministic: `currentSentence()` is a pure lookup on
`useCurrentFrame()` — no runtime audio analysis needed for sync.

### 2.3 The four animation layers (phases)

**LAYER 1 — Sentence-driven choreography** (biggest visual win, lowest effort)
Replace fixed delays with sentence timings. Each scene lists its elements in
narration order; element N animates when sentence N starts being spoken:
- `steps` scene: step 3 appears exactly when the narrator says the 3rd step
- `flow` diagram: nodes/edges draw in narration order — the diagram builds as you listen
- `bars`: each bar springs up when its label is spoken
- `statement`: headline punch lands on the sentence that delivers it
Effect: the diagram feels *conducted by the voice*. This is the single change that
makes videos feel "alive with the audio".

**LAYER 2 — Emphasis effects** (the detail that reads as premium)
Beatmap flags emphasis words (numbers: "1903", "43 milliseconds"; tech terms: "call
stack", "handshake"; code tokens). While an emphasis word is spoken:
- the matching on-screen element pulses/glows (scale 1.0→1.06→1.0 spring)
- terminal scenes **type the command character-by-character across the sentence's
  duration** (typing speed = command length ÷ sentence duration — deterministic)
- key numbers on screen tick-up while spoken (counter ties to word timing)
- optional: a hard 1-frame "thock" zoom on the heaviest word per sentence

**LAYER 3 — Audio-reactive procedural texture** (the "breathing" feel)
`@remotion/media-utils` (`useAudioData` + `visualizeAudio`) returns FFT frequency
bins per frame from the narration+music files. Use for NON-semantic, always-on life:
- background grid/glow intensity breathes with narration loudness
- the end-card / title gets a subtle equalizer strip
- music drops automatically where narration RMS is high (ducking is already static;
  can stay as-is)
Cost: `useAudioData` adds decode time per render (mitigation: sample only the
current scene's beat file, not the full mix). Keep this layer subtle — it decorates,
it does not teach.

**LAYER 4 — AI choreography (cue sheet)** (the differentiator)
Today the AI writes narration only. Extend the script prompt to ALSO emit a cue per
sentence:
```json
{"text":"...the certificate is verified before opening...",
 "cue":{"focus":"seal-verify","fx":"highlight","annotation":"verified ✓"}}
```
The beat-map compiler merges cues with word timings → scene reads `cue.focus` to
know WHICH element to spotlight during that sentence. This is how a diagram can
*follow the argument* (spot the seal → then the courier → then the open letter) —
the "animation changes with the meaning of the sentence" tier, not just the timing
tier. Fits the existing Gemini/Groq script call (same JSON, one more field);
shape-check it like the rest of the script (invalid cues → fall back to Layer 1
order, never block a render).

---

## 3. Tooling decision (evaluated, verdict: stay on Remotion)

| Option | Verdict | Why |
|---|---|---|
| **Remotion (current)** | ✅ KEEP | Word timings + `<Audio>`/`<Sequence>` + `useCurrentFrame` = frame-exact sync; React = templates already built; deterministic renders; free; the pipeline's entire tooling already drives it |
| Motion Canvas | ❌ skip (for now) | Beautiful for hand-crafted single explainers ("optimizes for a human crafting one video interactively"), but it is a rewrite of every template and the pipeline is programmatic batch — wrong trade for an automated channel (§8.2) |
| Manim (3Blue1Brown) | ❌ skip | Math-animation aesthetic, Python toolchain, slow renders, wrong style for "dark mode tech" |
| After Effects / manual | ❌ skip | Not automatable at 3+ videos/week |
| Real-time engines (Unity/WebGL) | ❌ skip | Sync drift, dropped frames, non-deterministic — actively worse for this use case |
| AI video generators (Sora-class) | ❌ skip | Generic footage, no deterministic narration sync, no brand system |

Remotion-specific capabilities that map 1:1 to the layers:
- word-highlight pattern: `useCurrentFrame` → ms → word lookup (already in `Captions`)
- official `@remotion/captions` package: `createTikTokStyleCaptions()` pages words
  (our Captions already implements the equivalent manually — could migrate, low priority)
- `useAudioData` + `visualizeAudio`: FFT per frame for Layer 3 (§8.3)
- `<Sequence from={s*fps}>`: element-level timed entrances for Layer 1
- edge-tts WordBoundary: free word timestamps (§8.4) — already integrated

---

## 4. Where the code lives (constraint-aware)

All visual code lives in quarry-render (`explainer/remotion/tech-video.tsx` +
`make-tech-video.mjs` for the beat-map compiler). Standing rule: quarry-render edits
only with explicit user authorization, verified not to break the 4 longform channels
(they render via `make-longform.mjs` → separate `lf-audio/` + separate composition —
touching tech-video.tsx does not affect them; verified 2026-09-26).

Two delivery paths:

**Path A — evolve tech-video.tsx in quarry-render (RECOMMENDED)**
- All 10 scene templates, brand system, fonts, music engine already there
- Changes: add `beatmap.ts` compiler (make-tech-video.mjs side), pass beatmap prop,
  refactor scene bodies to read sentence timings, add emphasis/fx layers
- Risk: shared file with a working pipeline → mitigated by `--beatmap` being
  OPTIONAL: absent beatmap = today's exact behavior (scene falls back to fixed
  delays). Zero-regression rollout: render with beatmap off, compare, then flip.
- Needs: user authorization per the standing rule.

**Path B — new composition in how-dev-works (full ownership)**
- Pattern already proven: `urdu-render/` is a local Remotion project in this repo
  driving quarry-render parts. A `tech-render/` sibling could hold the new
  composition and render on how-dev-works Actions (repo is PUBLIC → unlimited free
  minutes, verified 2026-09-26).
- Cost: duplicate the render workflow + maintain a second Remotion project; tech
  lane would leave quarry-render entirely.
- Only worth it if quarry-render should one day belong solely to the Urdu/other
  lanes. Decision deferred — Path A does not block B.

---

## 5. Phased roadmap (each phase ships alone)

| Phase | What | Files touched | Effort | Impact |
|---|---|---|---|---|
| 1 | Beat-map compiler + sentence-driven choreography for `steps`, `flow`, `bars` | make-tech-video.mjs, tech-video.tsx (3 scene bodies) | 1 session | Diagrams build with the voice — biggest perceived jump |
| 2 | Emphasis layer: typing-sync in `terminal`/`code`, pulse on numbers/terms, counter tie-in | tech-video.tsx (4 bodies) + beatmap emphasis flags | 1 session | Premium feel; retention on technical segments |
| 3 | Audio-reactive texture (grid breathing, end-card EQ) via media-utils | tech-video.tsx (2 shared components) | ½ session | Subtle "alive" texture |
| 4 | AI cue choreography (script prompt emits per-sentence cues; spotlight/fx) | make-tech-video.mjs prompt + shape-check, beatmap merge, scene `focus` support | 1–2 sessions | Diagrams follow the ARGUMENT — the true "changes with sentences" tier |

Render-time cost: beatmap adds negligible compile time; Layers 1–2 add ~0%
(Kinematic lookups); Layer 3 adds audio-decode time (~5-15% render); Layer 4 adds a
few hundred tokens per script generation. All within the free public-runner budget.

Guardrails carried over: shape-check AI cues; missing/partial beatmap → fixed-delay
fallback (current behavior); word-timing padding ±40-150ms already proven in
Captions; duration gate (<300s = test render) unchanged.

---

## 6. What sync accuracy to expect

edge-tts WordBoundary offsets are sample-accurate to the synthesized audio (they
come from the synthesis engine itself, not post-hoc ASR), so caption-grade sync is
frame-exact at 24fps (one frame = 41.7ms; observed drift is absorbed by the ±40/150ms
padding already in Captions). Sentence boundaries derived from punctuation + >350ms
pause gaps are reliable in calm "teaching voice" narration (the house style — no
em-dashes, direct sentences).

---

## 7. Open decisions (user)

1. Authorize Path A (quarry-render template edits, zero-regression design) — or
   defer to Path B (new composition in this repo)?
2. Phase order approved? (1 → 2 → 3 → 4 as tabled)
3. Layer 3 audio-reactive intensity: subtle (recommended) vs pronounced?

## 8. Sources

### 8.1 Word-level timestamps / captions
- edge-tts SubMaker & WordBoundary events — https://github.com/rany2/edge-tts/blob/master/src/edge_tts/submaker.py · https://github.com/rany2/edge-tts/issues/335
- edge-tts word boundaries for karaoke captions — https://dipinkrishna.com/blog/2026/09/edge-tts-wordboundary-karaoke-captions
- edge-tts subtitle generation (Python async) — https://stackoverflow.com/questions/79403115/subtitle-generation-in-edge-tts-python
- TikTok-style captions in Remotion (Whisper word timestamps + padding + per-word highlight) — https://rendercomp.com
- Official @remotion/captions (`createTikTokStyleCaptions`, `parseSrt`) — https://www.remotion.dev/docs/captions

### 8.2 Engine comparison
- Remotion vs Motion Canvas ("systems producing videos programmatically" vs "human crafting one interactively") — https://rendercomp.com

### 8.3 Audio-reactive in Remotion
- `useAudioData()` / `visualizeAudio()` — https://www.remotion.dev/docs/media-utils/useaudiodata · https://www.remotion.dev/docs/media-utils/visualizeaudio

### 8.4 Pipeline-internal ground truth (read from code, 2026-09-26)
- quarry-render `explainer/edge_batch.py` (WordBoundary → `{i, ms, words[{w,s,d}]}`)
- quarry-render `explainer/remotion/tech-video.tsx` (Captions component L382; RENDERERS L415; orchestrator L428 — `sceneWords` prop already reaches every scene)
- quarry-render `longvideo/make-tech-video.mjs` (props assembly)

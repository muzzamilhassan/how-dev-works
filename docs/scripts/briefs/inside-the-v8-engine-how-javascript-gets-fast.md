# Inside the V8 Engine: How JavaScript Gets Fast — Never-Forget brief
Generated 2026-09-24 · format: docs/scripts/2026-09-24-never-forget-metaphor-format.md

## 1. HOOK — MANDATORY, cold open, NOTHING before it (no logo, no "hey guys", no intro)
- PRIMARY: When your JavaScript runs, this is what it looks like: fuel in, explosions out, thousands per minute. Google literally named it after an engine.
- ALT (misdirection): JavaScript was invented in 10 days in 1995 and everyone thought it was a toy. Today it runs banks. The reason is a machine called V8.

RULE: the hook is spoken over the OBJECT (b-roll below), never over code. The tech word appears only in the hook's last sentence.

## 2. THE OBJECT (you already know this)
Everyday object: **motorcycle/car engine**. Walk the object on its own terms for 60-90 seconds — no tech words yet. Plant every role listed below as a physical thing.

## 3. THE MAPPING (one pair per chapter, split screen)
- crude fuel → your .js file — just text
- refined fuel → bytecode the engine can burn
- the first piston → Ignition, the interpreter
- the turbo → TurboFan, the optimizing compiler (hot code only)
- engine knock → de-optimization when a type changes shape

## 4. WHERE THE ANALOGY BREAKS (the credibility beat — never skip)
A real engine cannot misfire, learn, and rebuild itself mid-drive — V8 does, every time your types change shape. Consistent object shapes = smooth driving.

## 5. THE REAL MECHANISM
Now teach fast, reusing the analogy's vocabulary as shorthand. Order: your .js file → bytecode the engine can burn → Ignition → TurboFan → de-optimization when a type changes shape.

## 6. THE WELD + PAYOFF
Keep-one-sentence: **JavaScript is fast because an engine watches your code drive — and tunes itself while you move.**
CTA → tease the next metaphor video.

## B-ROLL shopping list
- engine cylinders firing macro
- piston crankshaft spin
- code scrolling on dark screen
- flame graph / profiler UI

## Thumbnail (factory-ready)
```
node tools/thumbnail-factory.mjs --title "Inside the V8 Engine: How JavaScript Gets Fast" --chip "JAVASCRIPT" --line1 "THE" --accent "V8 ENGINE" --sub "why JavaScript stopped being slow" --bg tech-code.jpg --out thumb-<videoId>.png
```

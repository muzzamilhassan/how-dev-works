# How React Re-Renders (and Why Your App Gets Slow) — Never-Forget brief
Generated 2026-09-24 · format: docs/scripts/2026-09-24-never-forget-metaphor-format.md

## 1. HOOK — MANDATORY, cold open, NOTHING before it (no logo, no "hey guys", no intro)
- PRIMARY: You changed one number on the screen — and React threw away a wall and painted it again. On purpose. Here is why that is not insane.
- ALT (misdirection): Your React app just re-rendered 400 components because one checkbox changed. React is not broken. You just met its one rule.

RULE: the hook is spoken over the OBJECT (b-roll below), never over code. The tech word appears only in the hook's last sentence.

## 2. THE OBJECT (you already know this)
Everyday object: **repainting a wall because one poster moved**. Walk the object on its own terms for 60-90 seconds — no tech words yet. Plant every role listed below as a physical thing.

## 3. THE MAPPING (one pair per chapter, split screen)
- the wall section → a component
- the thermostat setting changed → state changed
- repainting the whole section → re-render — re-running the component function
- paint tape over the finished parts → memo / dependency arrays — "do not repaint this"

## 4. WHERE THE ANALOGY BREAKS (the credibility beat — never skip)
Painting is not the expensive part — React repaints a virtual wall first and only touches the real one where it differs (the diff). Slow apps usually tape nothing and repaint giant walls.

## 5. THE REAL MECHANISM
Now teach fast, reusing the analogy's vocabulary as shorthand. Order: a component → state changed → re-render → memo / dependency arrays.

## 6. THE WELD + PAYOFF
Keep-one-sentence: **React re-renders the whole wall section on every change — your job is the tape (memo, deps).**
CTA → tease the next metaphor video.

## B-ROLL shopping list
- roller repainting a wall for one small poster
- virtual wall sketch vs real wall
- React dev tools highlight update
- memo comparison

## Thumbnail (factory-ready)
```
node tools/thumbnail-factory.mjs --title "How React Re-Renders (and Why Your App Gets Slow)" --chip "REACT" --line1 "WHY YOUR APP" --accent "GETS SLOW" --sub "re-renders, explained with a paint roller" --bg tech-code.jpg --out thumb-<videoId>.png
```

# Garbage Collection Explained — Never-Forget brief
Generated 2026-09-24 · format: docs/scripts/2026-09-24-never-forget-metaphor-format.md

## 1. HOOK — MANDATORY, cold open, NOTHING before it (no logo, no "hey guys", no intro)
- PRIMARY: Right now, inside your running program, a janitor is walking through every room deciding what is trash. If it gets this decision wrong even slightly, your app dies. Here is how it never gets it wrong.
- ALT (misdirection): You wrote the code that creates objects. You never wrote the code that deletes them. Someone else does — meet the garbage collector.

RULE: the hook is spoken over the OBJECT (b-roll below), never over code. The tech word appears only in the hook's last sentence.

## 2. THE OBJECT (you already know this)
Everyday object: **office janitor**. Walk the object on its own terms for 60-90 seconds — no tech words yet. Plant every role listed below as a physical thing.

## 3. THE MAPPING (one pair per chapter, split screen)
- a desk with stuff on it → an object in memory (the heap)
- a name tag someone points at → a live reference — "this is still used"
- the janitor's walk-through → the GC mark phase — follow every reachable tag
- rooms with no pointing tags → unreachable objects — swept away

## 4. WHERE THE ANALOGY BREAKS (the credibility beat — never skip)
The janitor only trusts pointing hands, not intentions — a desk you MEAN to reuse but never point at again still gets swept (that is why you null references). And stopping the world = the janitor clears everyone out of the building first (pause).

## 5. THE REAL MECHANISM
Now teach fast, reusing the analogy's vocabulary as shorthand. Order: an object in memory → a live reference → the GC mark phase → unreachable objects.

## 6. THE WELD + PAYOFF
Keep-one-sentence: **Garbage collection = a janitor that keeps exactly what is still pointed at — so point carefully.**
CTA → tease the next metaphor video.

## B-ROLL shopping list
- janitor walking dark office
- sticky name tags on desks
- desk swept away
- heap snapshot UI

## Thumbnail (factory-ready)
```
node tools/thumbnail-factory.mjs --title "Garbage Collection Explained" --chip "MEMORY" --line1 "WHO CLEANS" --accent "YOUR RAM?" --sub "garbage collection, explained" --bg tech-junk.jpg --out thumb-<videoId>.png
```

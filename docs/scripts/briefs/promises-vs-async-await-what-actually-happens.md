# Promises vs Async/Await: What Actually Happens — Never-Forget brief
Generated 2026-09-24 · format: docs/scripts/2026-09-24-never-forget-metaphor-format.md

## 1. HOOK — MANDATORY, cold open, NOTHING before it (no logo, no "hey guys", no intro)
- PRIMARY: When you order food, you do not stand at the kitchen door until it is cooked. You take a buzzer and sit down. Your code just learned the same trick — it is called a Promise.
- ALT (misdirection): JavaScript can do exactly one thing at a time. So how does it download a file, play a video, and answer your click at once? The answer is a little paper ticket.

RULE: the hook is spoken over the OBJECT (b-roll below), never over code. The tech word appears only in the hook's last sentence.

## 2. THE OBJECT (you already know this)
Everyday object: **restaurant order ticket + buzzer**. Walk the object on its own terms for 60-90 seconds — no tech words yet. Plant every role listed below as a physical thing.

## 3. THE MAPPING (one pair per chapter, split screen)
- placing the order → starting the async task (fetch)
- the ticket / buzzer → the Promise object — a receipt for a future result
- the kitchen → the browser workers doing network/disk work
- buzzer goes off → pick up food → .then / await — continuation when ready
- wrong order → complain to manager → .catch — rejection handling

## 4. WHERE THE ANALOGY BREAKS (the credibility beat — never skip)
The restaurant is NOT doing your chewing for you — JS stays single-threaded; only the waiting is delegated. And await does not "pause the program", it pauses only your function.

## 5. THE REAL MECHANISM
Now teach fast, reusing the analogy's vocabulary as shorthand. Order: starting the async task → the Promise object → the browser workers doing network/disk work → .then / await → .catch.

## 6. THE WELD + PAYOFF
Keep-one-sentence: **A Promise is a buzzer: order now, get called when the kitchen is done — and someone must answer the buzzer.**
CTA → tease the next metaphor video.

## B-ROLL shopping list
- order buzzer lighting up
- kitchen working while customer sits
- ticket rail full of orders
- event loop diagram

## Thumbnail (factory-ready)
```
node tools/thumbnail-factory.mjs --title "Promises vs Async/Await: What Actually Happens" --chip "JAVASCRIPT" --line1 "A RAIN CHECK" --accent "FOR YOUR CODE" --sub "Promises and await, explained at a restaurant" --bg tech-code.jpg --out thumb-<videoId>.png
```

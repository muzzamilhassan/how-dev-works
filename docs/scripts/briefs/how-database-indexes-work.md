# How Database Indexes Work — Never-Forget brief
Generated 2026-09-24 · format: docs/scripts/2026-09-24-never-forget-metaphor-format.md

## 1. HOOK — MANDATORY, cold open, NOTHING before it (no logo, no "hey guys", no intro)
- PRIMARY: Your query just asked a database with 10 million rows a question — and without one trick, it reads every single row before answering. Here is the trick.
- ALT (misdirection): A library with a million books can find any one of them in seconds. Your database with a million rows can too — if somebody built the catalog.

RULE: the hook is spoken over the OBJECT (b-roll below), never over code. The tech word appears only in the hook's last sentence.

## 2. THE OBJECT (you already know this)
Everyday object: **library card catalog**. Walk the object on its own terms for 60-90 seconds — no tech words yet. Plant every role listed below as a physical thing.

## 3. THE MAPPING (one pair per chapter, split screen)
- the bookshelf → the table — rows in insertion order
- the card catalog → the index — a sorted, tiny copy of one column
- the catalog card pointing to a shelf → the index pointing to a row location
- re-cataloging every new book → the write penalty — every INSERT updates every index

## 4. WHERE THE ANALOGY BREAKS (the credibility beat — never skip)
A catalog is free to browse but costs work to maintain — too many indexes and every write gets slower. Indexes are a tax on writes, paid so reads never scan.

## 5. THE REAL MECHANISM
Now teach fast, reusing the analogy's vocabulary as shorthand. Order: the table → the index → the index pointing to a row location → the write penalty.

## 6. THE WELD + PAYOFF
Keep-one-sentence: **An index = a small tax on every write, so no read ever has to walk the whole shelf.**
CTA → tease the next metaphor video.

## B-ROLL shopping list
- library card catalog drawers
- scanning every book one by one (tiring)
- card pulled → jump straight to shelf
- EXPLAIN query plan UI

## Thumbnail (factory-ready)
```
node tools/thumbnail-factory.mjs --title "How Database Indexes Work" --chip "DATABASES" --line1 "WHY IS MY" --accent "QUERY SLOW?" --sub "your database is reading every single row" --bg tech-hdd.jpg --out thumb-<videoId>.png
```

# REST vs GraphQL: What Each One Really Costs You — Never-Forget brief
Generated 2026-09-24 · format: docs/scripts/2026-09-24-never-forget-metaphor-format.md

## 1. HOOK — MANDATORY, cold open, NOTHING before it (no logo, no "hey guys", no intro)
- PRIMARY: One app asks for a user's name and gets 4 megabytes of data it throws away. Every. Single. Time. Two philosophies fight over this — REST and GraphQL.
- ALT (misdirection): A restaurant with a fixed menu is fast and simple — until you want eggs, no onions, extra sauce. That exact complaint is why GraphQL exists.

RULE: the hook is spoken over the OBJECT (b-roll below), never over code. The tech word appears only in the hook's last sentence.

## 2. THE OBJECT (you already know this)
Everyday object: **set-menu restaurant vs build-your-own bowl**. Walk the object on its own terms for 60-90 seconds — no tech words yet. Plant every role listed below as a physical thing.

## 3. THE MAPPING (one pair per chapter, split screen)
- fixed set meals → REST endpoints — each returns a fixed shape
- ordering 3 set meals for one combo → overfetching — multiple REST calls, unused fields
- build-your-own bowl, pay for what you take → GraphQL query — exactly the fields you ask
- one counter for everything → one /graphql endpoint

## 4. WHERE THE ANALOGY BREAKS (the credibility beat — never skip)
The build-your-own bowl has a cost: the kitchen needs a schema and guard rails, or one hungry query can ask for the whole fridge. REST's boring fixed menu is also its caching superpower.

## 5. THE REAL MECHANISM
Now teach fast, reusing the analogy's vocabulary as shorthand. Order: REST endpoints → overfetching → GraphQL query → one /graphql endpoint.

## 6. THE WELD + PAYOFF
Keep-one-sentence: **REST = fixed menus (fast, cacheable); GraphQL = build-your-own bowl (exact, but the kitchen needs rules).**
CTA → tease the next metaphor video.

## B-ROLL shopping list
- fixed menu card
- buffet bowl being built
- JSON payloads side by side (big vs small)
- graphiql UI

## Thumbnail (factory-ready)
```
node tools/thumbnail-factory.mjs --title "REST vs GraphQL: What Each One Really Costs You" --chip "APIS" --line1 "REST" --accent "VS" --line2 "GRAPHQL" --sub "what each one really costs you" --bg tech-cables.jpg --out thumb-<videoId>.png
```

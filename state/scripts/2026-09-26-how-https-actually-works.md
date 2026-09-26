# How HTTPS Actually Works — Never-Forget brief
Generated 2026-09-26 · format: docs/scripts/2026-09-24-never-forget-metaphor-format.md

## 1. HOOK — MANDATORY, cold open, NOTHING before it (no logo, no "hey guys", no intro)
- PRIMARY: Every password you type today will pass through ~10 machines that are not yours. This is the wax seal that makes that safe.
- ALT (misdirection): In 1832, if someone steamed open your letter, you would never know. In 1995, the internet had the same problem — and one idea fixed it forever.
- ALT (stat): That tiny padlock in your browser just did more math than your bank did all day. Here is what it actually did.
RULE: the hook is spoken over the OBJECT (b-roll below), never over code. The tech word appears only in the hook's last sentence.

## 2. THE OBJECT (you already know this)
Everyday object: **wax-sealed letter**. Walk the object on its own terms for 60-90 seconds — no tech words yet. Plant every role listed below as a physical thing.

## 3. THE MAPPING (one pair per chapter, split screen)
- the letter → your data (password, card, message)
- the wax seal → the TLS certificate — proof of sender, applied fresh
- the courier route → the routers your data crosses in plaintext-looking traffic
- breaking the seal = alarm → tamper detection — changed data fails the check

## 4. WHERE THE ANALOGY BREAKS (the credibility beat — never skip)
A wax seal is reused for years; a TLS key is melted down and re-made for EVERY session (that is the handshake). And the seal only proves identity and privacy — it cannot stop a scammer you willingly hand your letter to.

## 5. THE REAL MECHANISM
Now teach fast, reusing the analogy's vocabulary as shorthand. Order: your data → the TLS certificate → the routers your data crosses in plaintext-looking traffic → tamper detection.

## 6. THE WELD + PAYOFF
Keep-one-sentence: **HTTPS = a fresh wax seal on every letter, verified before opening, melted after one read.**
CTA → tease the next metaphor video.

## B-ROLL shopping list
- wax seal being pressed into hot wax (close-up)
- envelope crossing a crowded room
- certificate + key animation
- browser padlock UI
- handshake diagram

## Thumbnail (factory-ready)
```
node tools/thumbnail-factory.mjs --title "How HTTPS Actually Works" --chip "SECURITY" --line1 "HTTPS" --accent "DECODED" --sub "what that padlock actually does in 1 second" --bg tech-cpu.jpg --out thumb-<videoId>.png
```

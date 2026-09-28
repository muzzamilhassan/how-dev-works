# Clean Code Is Not the Same as Clear Code: Comments Were Never the Problem — Never-Forget brief
Generated 2026-09-24 · format: docs/scripts/2026-09-24-never-forget-metaphor-format.md

## 1. HOOK — MANDATORY, cold open, NOTHING before it (no logo, no "hey guys", no intro)
- PRIMARY: If your joke needs explaining, it is not a good joke. If your code needs a comment, maybe it is not good code. But the truth is more interesting.
- ALT (misdirection): Every senior developer eventually says the same strange sentence: "the best comment is no comment." They are not wrong — but they are not right either.

RULE: the hook is spoken over the OBJECT (b-roll below), never over code. The tech word appears only in the hook's last sentence.

## 2. THE OBJECT (you already know this)
Everyday object: **a joke that needs explaining**. Walk the object on its own terms for 60-90 seconds — no tech words yet. Plant every role listed below as a physical thing.

## 3. THE MAPPING (one pair per chapter, split screen)
- a well-told joke → self-explanatory code — lands without a footnote
- explaining the joke → a comment apologizing for confusing code
- a footnote that adds context → a GOOD comment — the why, not the what
- a stale footnote for a changed joke → a lying comment — worse than none

## 4. WHERE THE ANALOGY BREAKS (the credibility beat — never skip)
Comments are not the problem — lies are. Code cannot tell you WHY a strange decision exists; only a comment can. Explain intent, never narrate mechanics.

## 5. THE REAL MECHANISM
Now teach fast, reusing the analogy's vocabulary as shorthand. Order: self-explanatory code → a comment apologizing for confusing code → a GOOD comment → a lying comment.

## 6. THE WELD + PAYOFF
Keep-one-sentence: **Refactor until the code explains WHAT; comment only to explain WHY.**
CTA → tease the next metaphor video.

## B-ROLL shopping list
- comedian explaining own joke to death
- clean desk vs messy desk
- before/after refactor diff
- great comment example

## Thumbnail (factory-ready)
```
node tools/thumbnail-factory.mjs --title "Clean Code Is Not the Same as Clear Code: Comments Were Never the Problem" --chip "CRAFT" --line1 "COMMENTS WERE" --accent "NEVER THE PROBLEM" --sub "clean code is not the same as clear code" --bg tech-code.jpg --out thumb-<videoId>.png
```

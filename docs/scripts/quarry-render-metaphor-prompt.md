# Quarry-render patch — Never-Forget metaphor scriptwriter (APPLY IN quarry-render)

**Why this file exists:** the video script AI (Gemini/Groq prompt in quarry-render's `longvideo/`) is the one place the Never-Forget format must land for it to reach the actual videos. Per the standing rule, quarry-render is push-forbidden from how-dev-works — so this is the exact, drop-in change for the next time you (or an authorized session) touch that repo.

## What to change

In the script-generation prompt (where the LLM is told to write the narration from `topic`), **prepend this block** to the system/task prompt:

```text
SCRIPT FORMAT — "Never-Forget" metaphor explainer. Follow ALL rules; the hook is mandatory.

1. HOOK (0:00-0:35, MANDATORY, nothing before it): open on a REAL-LIFE OBJECT/SCENARIO
   related to the topic — never on code, never on UI, never with an intro or greeting.
   The tech term appears only in the hook's LAST sentence as a reveal.
   Choose the most vivid everyday object for the topic (examples: HTTPS=wax-sealed letter,
   DNS=telephone switchboard operator, JavaScript V8=car engine, DB index=library card
   catalog, promises=restaurant order buzzer, containers=shipping containers,
   garbage collector=office janitor, cache=kitchen pantry, API=waiter taking an order).
2. "YOU ALREADY KNOW THIS" (0:35-1:45): walk the object on its own terms. Plant 3-4
   physical roles. No tech words yet.
3. THE MAPPING (1:45-4:30): one chapter per pair, analogy element -> tech element.
4. WHERE THE ANALOGY BREAKS (4:30-6:00): MANDATORY. State honestly where the object
   behaves differently from the technology — that difference carries the deepest insight.
5. THE REAL MECHANISM (6:00-9:00): teach the actual technology fast, reusing the
   analogy's vocabulary as shorthand.
6. THE WELD (9:00-end): 60-second recap spoken ENTIRELY in analogy words + one
   keep-forever sentence + CTA teasing the next topic.
VOICE RULES: second person, calm documentary tone, short sentences, no hype words,
no "in this video". Every chapter title = the analogy phrase, not the tech phrase.
```

## Optional: briefs travel with topics

how-dev-works now generates a full brief per topic at `state/scripts/<date>-<slug>.md`
(hook variants, analogy pairs, break-beat, weld line, b-roll list, thumbnail command).
If you want the render to consume briefs directly, add a `brief` workflow input and pass
the brief file's contents to the scriptwriter as authoritative structure. Until then,
the prompt block above is enough — the AI will pick the right object itself.

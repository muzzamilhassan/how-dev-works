# How Docker Containers Actually Work — Never-Forget brief
Generated 2026-09-24 · format: docs/scripts/2026-09-24-never-forget-metaphor-format.md

## 1. HOOK — MANDATORY, cold open, NOTHING before it (no logo, no "hey guys", no intro)
- PRIMARY: In 1958, shipping a crate of goods cost more than the goods. One standardized box changed world trade — and in 2013, the same idea changed software. It is called a container.
- ALT (misdirection): It works on my machine. Four words that started a revolution — and the fix came from the shipping industry.

RULE: the hook is spoken over the OBJECT (b-roll below), never over code. The tech word appears only in the hook's last sentence.

## 2. THE OBJECT (you already know this)
Everyday object: **shipping containers**. Walk the object on its own terms for 60-90 seconds — no tech words yet. Plant every role listed below as a physical thing.

## 3. THE MAPPING (one pair per chapter, split screen)
- the standard steel box → the container image — app + dependencies, sealed
- the cargo ship (any ship can carry it) → the host kernel — any Linux machine can run it
- cranes and standardized ports → Docker runtime + registries (Docker Hub)
- containers stacked, not new ships → processes sharing one kernel — no guest OS

## 4. WHERE THE ANALOGY BREAKS (the credibility beat — never skip)
Containers are NOT tiny virtual machines: VMs ship a whole second computer; a container is just walls around processes on the SAME kernel. Light as a box, not a ship.

## 5. THE REAL MECHANISM
Now teach fast, reusing the analogy's vocabulary as shorthand. Order: the container image → the host kernel → Docker runtime + registries → processes sharing one kernel.

## 6. THE WELD + PAYOFF
Keep-one-sentence: **A container = a standard box for your app: seal it once, any machine carries it.**
CTA → tease the next metaphor video.

## B-ROLL shopping list
- container port cranes timelapse
- ship vs stacked boxes comparison
- docker build + run terminal
- VM vs container diagram

## Thumbnail (factory-ready)
```
node tools/thumbnail-factory.mjs --title "How Docker Containers Actually Work" --chip "DEVOPS" --line1 "CONTAINERS" --accent "&#8800;" --line2 "VIRTUAL MACHINES" --sub "same kernel · no guest OS · seconds to start" --bg tech-racks.jpg --out thumb-<videoId>.png
```

# How DNS Actually Works — Never-Forget brief
Generated 2026-09-26 · format: docs/scripts/2026-09-24-never-forget-metaphor-format.md

## 1. HOOK — MANDATORY, cold open, NOTHING before it (no logo, no "hey guys", no intro)
- PRIMARY: Forty-three milliseconds. That is all the time your browser needs to ask a machine on another continent: "where is this website?" — and this machine has been doing that job since 1878.
- ALT (misdirection): Before telephones had numbers, you told an operator a NAME and she connected you. Your browser still does exactly that — you just never hear the call.
- ALT (stat): You have never visited "142.250.185.78" — but your browser visits numbers like it every single day. Something has to translate. Meet DNS.
RULE: the hook is spoken over the OBJECT (b-roll below), never over code. The tech word appears only in the hook's last sentence.

## 2. THE OBJECT (you already know this)
Everyday object: **1878 telephone switchboard**. Walk the object on its own terms for 60-90 seconds — no tech words yet. Plant every role listed below as a physical thing.

## 3. THE MAPPING (one pair per chapter, split screen)
- the name you asked for → the domain name (youtube.com)
- the operator → the DNS resolver (your ISP's or 8.8.8.8)
- the giant switchboard → the root + TLD + authoritative name servers
- the connection made → the IP address returned

## 4. WHERE THE ANALOGY BREAKS (the credibility beat — never skip)
Operators kept no memory of calls; DNS resolvers CACHE everything (that is why changes take hours to spread — TTL). And the operator can lie: that is DNS spoofing, which DNSSEC exists to stop.

## 5. THE REAL MECHANISM
Now teach fast, reusing the analogy's vocabulary as shorthand. Order: the domain name → the DNS resolver → the root + TLD + authoritative name servers → the IP address returned.

## 6. THE WELD + PAYOFF
Keep-one-sentence: **DNS = the switchboard that never sleeps, with a memory of every name it has ever looked up.**
CTA → tease the next metaphor video.

## B-ROLL shopping list
- switchboard operators plugging cables (archival)
- giant old phonebook
- packet reaching 4 servers in sequence
- cached answer stopwatch

## Thumbnail (factory-ready)
```
node tools/thumbnail-factory.mjs --title "How DNS Actually Works" --chip "NETWORKING" --line1 "THE INTERNET&#8217;S" --accent "PHONEBOOK" --sub "DNS finds any website in 43 milliseconds" --bg tech-rotary.jpg --out thumb-<videoId>.png
```

# HTTPS: The Wax Seal — full narration script (Never-Forget format)

**Topic bank:** "How HTTPS Actually Works" (score 499 — next in queue) · **Target:** 10–11 min · **Thumbnail:** factory `--chip SECURITY --line1 "HTTPS" --accent "DECODED" --bg tech-cpu.jpg` · **Brief:** `docs/scripts/briefs/how-https-actually-works.md`

**Law:** the hook is spoken over wax-seal b-roll, never over code. The analogy's vocabulary (letter, seal, courier, forge) is the video's vocabulary from Beat 3 on.

---

## BEAT 1 — COLD OPEN HOOK (0:00–0:35)

*(B-roll: extreme close-up — molten red wax, a brass stamp presses down, lifts. The seal gleams. Sound up, no music.)*

**NARRATOR:** Every password you type today will pass through about ten machines that are not yours. Your internet provider. Your office. Three routers in a city you have never been to. All of them, in theory, could read it.

*(beat. The seal cracks — someone breaks it open.)*

In 1832, if someone steamed open your letter, you would never know. In 1995, the internet had exactly the same problem. And the fix is this — *(the seal fills the frame)* — a wax seal for the digital world. It is called HTTPS. And after ten minutes, you will never forget how it works.

## BEAT 2 — YOU ALREADY KNOW THIS (0:35–1:45)

*(B-roll: a letter being written, sealed, handed to a courier.)*

Here is everything you need to know about sending a secret letter in the 1800s. You write the message. You fold it. You drip wax on the fold and press your ring into it. Now two things are true: nobody can read it without tearing it open — and everyone can see whose seal it is. Signature and lock, in one blob of wax.

Keep four words in your head: **letter, seal, courier, forgery.** Because your browser keeps the same four.

## BEAT 3 — THE MAPPING (1:45–4:30)

*(split screen: wax letter left, browser right)*

**The letter is your data.** Your password, your card number, that message you just sent. Raw text, folded and ready to travel.

**The courier route is the internet.** And here is the uncomfortable part people forget: your letter does not go directly to the bank. It hops — router to router to router, each one a stranger's desk. Without protection, every hop can read it. That was called HTTP. Anything in the letter, readable by anyone holding it.

**The wax seal is the certificate.** Before the real message moves, the server hands your browser a certificate — a seal that says: "I really am mybank.com, and here is proof, signed by an authority everyone trusts." Your browser checks the seal against its list of trusted seal-makers — the certificate authorities. Seal checks out? The padlock appears.

**Breaking the seal sets off an alarm.** The letter travels with a tamper-evident fold: a checksum. Change one character anywhere along the route, and the fold doesn't match. The browser knows. It won't open a letter that's been steamed.

## BEAT 4 — WHERE THE ANALOGY BREAKS (4:30–6:00)

Now — where the wax seal analogy lies. Because a real wax seal is pressed once and lasts for years. TLS does something stranger and smarter: **a fresh seal is made for every single letter.** Every visit, every session, a brand-new key, negotiated in a fraction of a second. That negotiation is the famous "TLS handshake" — the part you now understand is not bureaucracy; it is the seal being manufactured in front of you.

And one more honest crack: the seal proves the letter wasn't read *in transit* — it cannot protect you from handing your letter to a scammer willingly. A perfect seal on a letter to a fake bank is still a perfect scam. That is why the browser shows you *whose* seal it is — and why you should read it.

*(B-roll: many small seals being made rapidly; a fake seal rejected.)*

## BEAT 5 — THE REAL MECHANISM (6:00–9:00)

So now the real words, fast — because you already have the scaffold.

Your browser says hello, sends the ciphers it speaks. The server answers with its certificate and its part of the key exchange — Diffie–Hellman, which lets both sides compute the same secret **without ever sending the secret itself** — imagine two people mixing paint in public and ending up with the same private color. The browser verifies the certificate chain up to a root authority. Both sides now hold a matching session key: symmetric encryption, AES, for the actual conversation.

*(B-roll: Wireshark capture — everything unreadable; the padlock click; certificate viewer panel walk-through.)*

Everything after that is the courier route again — except now every packet is a letter no router can open. When you leave, the session key is destroyed. Next visit: a new seal, manufactured in 43 milliseconds.

And when people say "HTTPS is slower" — that stopped being true years ago. The handshake costs one round trip. The math is hardware-accelerated. The padlock is essentially free now; there is no excuse left to ship without it.

## BEAT 6 — THE WELD + PAYOFF (9:30–10:30)

So — forever now: **your data is a letter. The certificate is a fresh wax seal, checked against seal-makers the world trusts. The route is full of strangers, and the seal proves nobody read it — and melts after one use.**

One sentence to keep: *HTTPS is a new wax seal on every letter, verified before opening, destroyed after reading.*

Next time: your telephone call in 1878 was already DNS — the switchboard operators did it first. Subscribe, so the courier always brings the sealed ones.

---

**Description draft:** HTTPS explained with a wax-sealed letter. What the padlock actually does: certificates, the TLS handshake, symmetric keys — and why it is free now.
**Tags:** how https works, https explained, tls handshake, ssl vs tls, certificate authority explained, what is a certificate, https tutorial, encryption explained, symmetric vs asymmetric, web security
**Factory call:** `node tools/thumbnail-factory.mjs --title "HTTPS: The Wax Seal — what the padlock actually does" --chip SECURITY --line1 "HTTPS" --accent "DECODED" --sub "what that padlock actually does in 1 second" --bg tech-cpu.jpg --out inbox/thumb-<videoId>.png`

// Never-Forget metaphor brief generator.
// Turns a tech topic into a shooting brief: MANDATORY hook (3 variants), analogy map,
// 6-beat structure, where-the-analogy-breaks, weld line, b-roll list, thumbnail copy.
// The hook is never optional — a brief without a hook fails loudly.
//
// Usage:
//   node tools/metaphor-script.mjs --topic "How HTTPS Actually Works" --out state/scripts/x.md
//   node tools/metaphor-script.mjs --bank state/tech-topic-bank.json --outdir docs/scripts/briefs
import fs from 'fs';
import path from 'path';

// ---------- metaphor board (object the thumbnail shows = the memory) ----------
// Each entry: match = topic keywords; object; hooks[3]; pairs[[analogy, tech]]; break; weld;
// thumb {chip, line1, accent, line2, sub, bg}; broll[]
const BOARD = [
  {
    id: 'https', match: /https|tls|ssl|certificate|encrypt|security/i,
    object: 'wax-sealed letter',
    hooks: [
      'Every password you type today will pass through ~10 machines that are not yours. This is the wax seal that makes that safe.',
      'In 1832, if someone steamed open your letter, you would never know. In 1995, the internet had the same problem — and one idea fixed it forever.',
      'That tiny padlock in your browser just did more math than your bank did all day. Here is what it actually did.',
    ],
    pairs: [
      ['the letter', 'your data (password, card, message)'],
      ['the wax seal', 'the TLS certificate — proof of sender, applied fresh'],
      ['the courier route', 'the routers your data crosses in plaintext-looking traffic'],
      ['breaking the seal = alarm', 'tamper detection — changed data fails the check'],
    ],
    break: 'A wax seal is reused for years; a TLS key is melted down and re-made for EVERY session (that is the handshake). And the seal only proves identity and privacy — it cannot stop a scammer you willingly hand your letter to.',
    weld: 'HTTPS = a fresh wax seal on every letter, verified before opening, melted after one read.',
    thumb: { chip: 'SECURITY', line1: 'HTTPS', accent: 'DECODED', line2: '', sub: 'what that padlock actually does in 1 second', bg: 'tech-cpu.jpg' },
    broll: ['wax seal being pressed into hot wax (close-up)', 'envelope crossing a crowded room', 'certificate + key animation', 'browser padlock UI', 'handshake diagram'],
  },
  {
    id: 'dns', match: /dns|domain|name server|resolv/i,
    object: '1878 telephone switchboard',
    hooks: [
      'Forty-three milliseconds. That is all the time your browser needs to ask a machine on another continent: "where is this website?" — and this machine has been doing that job since 1878.',
      'Before telephones had numbers, you told an operator a NAME and she connected you. Your browser still does exactly that — you just never hear the call.',
      'You have never visited "142.250.185.78" — but your browser visits numbers like it every single day. Something has to translate. Meet DNS.',
    ],
    pairs: [
      ['the name you asked for', 'the domain name (youtube.com)'],
      ['the operator', 'the DNS resolver (your ISP\'s or 8.8.8.8)'],
      ['the giant switchboard', 'the root + TLD + authoritative name servers'],
      ['the connection made', 'the IP address returned'],
    ],
    break: 'Operators kept no memory of calls; DNS resolvers CACHE everything (that is why changes take hours to spread — TTL). And the operator can lie: that is DNS spoofing, which DNSSEC exists to stop.',
    weld: 'DNS = the switchboard that never sleeps, with a memory of every name it has ever looked up.',
    thumb: { chip: 'NETWORKING', line1: 'THE INTERNET&#8217;S', accent: 'PHONEBOOK', line2: '', sub: 'DNS finds any website in 43 milliseconds', bg: 'tech-rotary.jpg' },
    broll: ['switchboard operators plugging cables (archival)', 'giant old phonebook', 'packet reaching 4 servers in sequence', 'cached answer stopwatch'],
  },
  {
    id: 'v8', match: /v8|javascript engine|ignition|turbofan|jit/i,
    object: 'motorcycle/car engine',
    hooks: [
      'When your JavaScript runs, this is what it looks like: fuel in, explosions out, thousands per minute. Google literally named it after an engine.',
      'JavaScript was invented in 10 days in 1995 and everyone thought it was a toy. Today it runs banks. The reason is a machine called V8.',
    ],
    pairs: [
      ['crude fuel', 'your .js file — just text'],
      ['refined fuel', 'bytecode the engine can burn'],
      ['the first piston', 'Ignition, the interpreter'],
      ['the turbo', 'TurboFan, the optimizing compiler (hot code only)'],
      ['engine knock', 'de-optimization when a type changes shape'],
    ],
    break: 'A real engine cannot misfire, learn, and rebuild itself mid-drive — V8 does, every time your types change shape. Consistent object shapes = smooth driving.',
    weld: 'JavaScript is fast because an engine watches your code drive — and tunes itself while you move.',
    thumb: { chip: 'JAVASCRIPT', line1: 'THE', accent: 'V8 ENGINE', line2: '', sub: 'why JavaScript stopped being slow', bg: 'tech-code.jpg' },
    broll: ['engine cylinders firing macro', 'piston crankshaft spin', 'code scrolling on dark screen', 'flame graph / profiler UI'],
  },
  {
    id: 'index', match: /database index|indexes|query slow|b-tree|postgres|mysql/i,
    object: 'library card catalog',
    hooks: [
      'Your query just asked a database with 10 million rows a question — and without one trick, it reads every single row before answering. Here is the trick.',
      'A library with a million books can find any one of them in seconds. Your database with a million rows can too — if somebody built the catalog.',
    ],
    pairs: [
      ['the bookshelf', 'the table — rows in insertion order'],
      ['the card catalog', 'the index — a sorted, tiny copy of one column'],
      ['the catalog card pointing to a shelf', 'the index pointing to a row location'],
      ['re-cataloging every new book', 'the write penalty — every INSERT updates every index'],
    ],
    break: 'A catalog is free to browse but costs work to maintain — too many indexes and every write gets slower. Indexes are a tax on writes, paid so reads never scan.',
    weld: 'An index = a small tax on every write, so no read ever has to walk the whole shelf.',
    thumb: { chip: 'DATABASES', line1: 'WHY IS MY', accent: 'QUERY SLOW?', line2: '', sub: 'your database is reading every single row', bg: 'tech-hdd.jpg' },
    broll: ['library card catalog drawers', 'scanning every book one by one (tiring)', 'card pulled → jump straight to shelf', 'EXPLAIN query plan UI'],
  },
  {
    id: 'promises', match: /promise|async|await|callback/i,
    object: 'restaurant order ticket + buzzer',
    hooks: [
      'When you order food, you do not stand at the kitchen door until it is cooked. You take a buzzer and sit down. Your code just learned the same trick — it is called a Promise.',
      'JavaScript can do exactly one thing at a time. So how does it download a file, play a video, and answer your click at once? The answer is a little paper ticket.',
    ],
    pairs: [
      ['placing the order', 'starting the async task (fetch)'],
      ['the ticket / buzzer', 'the Promise object — a receipt for a future result'],
      ['the kitchen', 'the browser workers doing network/disk work'],
      ['buzzer goes off → pick up food', '.then / await — continuation when ready'],
      ['wrong order → complain to manager', '.catch — rejection handling'],
    ],
    break: 'The restaurant is NOT doing your chewing for you — JS stays single-threaded; only the waiting is delegated. And await does not "pause the program", it pauses only your function.',
    weld: 'A Promise is a buzzer: order now, get called when the kitchen is done — and someone must answer the buzzer.',
    thumb: { chip: 'JAVASCRIPT', line1: 'A RAIN CHECK', accent: 'FOR YOUR CODE', line2: '', sub: 'Promises and await, explained at a restaurant', bg: 'tech-code.jpg' },
    broll: ['order buzzer lighting up', 'kitchen working while customer sits', 'ticket rail full of orders', 'event loop diagram'],
  },
  {
    id: 'docker', match: /docker|container|kubernetes|image registry/i,
    object: 'shipping containers',
    hooks: [
      'In 1958, shipping a crate of goods cost more than the goods. One standardized box changed world trade — and in 2013, the same idea changed software. It is called a container.',
      'It works on my machine. Four words that started a revolution — and the fix came from the shipping industry.',
    ],
    pairs: [
      ['the standard steel box', 'the container image — app + dependencies, sealed'],
      ['the cargo ship (any ship can carry it)', 'the host kernel — any Linux machine can run it'],
      ['cranes and standardized ports', 'Docker runtime + registries (Docker Hub)'],
      ['containers stacked, not new ships', 'processes sharing one kernel — no guest OS'],
    ],
    break: 'Containers are NOT tiny virtual machines: VMs ship a whole second computer; a container is just walls around processes on the SAME kernel. Light as a box, not a ship.',
    weld: 'A container = a standard box for your app: seal it once, any machine carries it.',
    thumb: { chip: 'DEVOPS', line1: 'CONTAINERS', accent: '&#8800;', line2: 'VIRTUAL MACHINES', sub: 'same kernel · no guest OS · seconds to start', bg: 'tech-racks.jpg' },
    broll: ['container port cranes timelapse', 'ship vs stacked boxes comparison', 'docker build + run terminal', 'VM vs container diagram'],
  },
  {
    id: 'gc', match: /garbage collection|garbage collector|memory leak|heap/i,
    object: 'office janitor',
    hooks: [
      'Right now, inside your running program, a janitor is walking through every room deciding what is trash. If it gets this decision wrong even slightly, your app dies. Here is how it never gets it wrong.',
      'You wrote the code that creates objects. You never wrote the code that deletes them. Someone else does — meet the garbage collector.',
    ],
    pairs: [
      ['a desk with stuff on it', 'an object in memory (the heap)'],
      ['a name tag someone points at', 'a live reference — "this is still used"'],
      ['the janitor\'s walk-through', 'the GC mark phase — follow every reachable tag'],
      ['rooms with no pointing tags', 'unreachable objects — swept away'],
    ],
    break: 'The janitor only trusts pointing hands, not intentions — a desk you MEAN to reuse but never point at again still gets swept (that is why you null references). And stopping the world = the janitor clears everyone out of the building first (pause).',
    weld: 'Garbage collection = a janitor that keeps exactly what is still pointed at — so point carefully.',
    thumb: { chip: 'MEMORY', line1: 'WHO CLEANS', accent: 'YOUR RAM?', line2: '', sub: 'garbage collection, explained', bg: 'tech-junk.jpg' },
    broll: ['janitor walking dark office', 'sticky name tags on desks', 'desk swept away', 'heap snapshot UI'],
  },
  {
    id: 'git', match: /\bgit\b|commit|branch|merge|version control/i,
    object: 'save points in a video game',
    hooks: [
      'Every developer has typed one command that saved their career: git reset. It works because Git is not a history — it is a save-file system.',
      'You make a save point before fighting the boss. Your code editor has had that button for twenty years. It is called a commit.',
    ],
    pairs: [
      ['a save point', 'a commit — a full snapshot, not a list of changes'],
      ['a second save slot', 'a branch — a parallel universe of saves'],
      ['merging two save files', 'a merge — combining snapshots, conflict when the same spot changed'],
      ['loading an old save', 'checkout / reset — the game state, not the story, rewinds'],
    ],
    break: 'Players think saves store a diff ("what changed since last save"); Git stores complete snapshots and only *displays* them as diffs. That misunderstanding is the source of most Git fear.',
    weld: 'Git = unlimited save points for your code: snapshot everything, fear nothing.',
    thumb: { chip: 'TOOLS', line1: 'GIT', accent: 'SAVE POINTS', line2: '', sub: 'commits, branches and resets, explained with a save file', bg: 'tech-code.jpg' },
    broll: ['game save menu', 'two parallel playthroughs', 'loading an earlier save', 'git log graph UI'],
  },
  {
    id: 'react', match: /react|re-render|virtual dom|usestate|component/i,
    object: 'repainting a wall because one poster moved',
    hooks: [
      'You changed one number on the screen — and React threw away a wall and painted it again. On purpose. Here is why that is not insane.',
      'Your React app just re-rendered 400 components because one checkbox changed. React is not broken. You just met its one rule.',
    ],
    pairs: [
      ['the wall section', 'a component'],
      ['the thermostat setting changed', 'state changed'],
      ['repainting the whole section', 're-render — re-running the component function'],
      ['paint tape over the finished parts', 'memo / dependency arrays — "do not repaint this"'],
    ],
    break: 'Painting is not the expensive part — React repaints a virtual wall first and only touches the real one where it differs (the diff). Slow apps usually tape nothing and repaint giant walls.',
    weld: 'React re-renders the whole wall section on every change — your job is the tape (memo, deps).',
    thumb: { chip: 'REACT', line1: 'WHY YOUR APP', accent: 'GETS SLOW', line2: '', sub: 're-renders, explained with a paint roller', bg: 'tech-code.jpg' },
    broll: ['roller repainting a wall for one small poster', 'virtual wall sketch vs real wall', 'React dev tools highlight update', 'memo comparison'],
  },
  {
    id: 'rest-graphql', match: /rest|graphql|api design|endpoint/i,
    object: 'set-menu restaurant vs build-your-own bowl',
    hooks: [
      'One app asks for a user\'s name and gets 4 megabytes of data it throws away. Every. Single. Time. Two philosophies fight over this — REST and GraphQL.',
      'A restaurant with a fixed menu is fast and simple — until you want eggs, no onions, extra sauce. That exact complaint is why GraphQL exists.',
    ],
    pairs: [
      ['fixed set meals', 'REST endpoints — each returns a fixed shape'],
      ['ordering 3 set meals for one combo', 'overfetching — multiple REST calls, unused fields'],
      ['build-your-own bowl, pay for what you take', 'GraphQL query — exactly the fields you ask'],
      ['one counter for everything', 'one /graphql endpoint'],
    ],
    break: 'The build-your-own bowl has a cost: the kitchen needs a schema and guard rails, or one hungry query can ask for the whole fridge. REST\'s boring fixed menu is also its caching superpower.',
    weld: 'REST = fixed menus (fast, cacheable); GraphQL = build-your-own bowl (exact, but the kitchen needs rules).',
    thumb: { chip: 'APIS', line1: 'REST', accent: 'VS', line2: 'GRAPHQL', sub: 'what each one really costs you', bg: 'tech-cables.jpg' },
    broll: ['fixed menu card', 'buffet bowl being built', 'JSON payloads side by side (big vs small)', 'graphiql UI'],
  },
  {
    id: 'clean-code', match: /clean code|comments|readab|code review/i,
    object: 'a joke that needs explaining',
    hooks: [
      'If your joke needs explaining, it is not a good joke. If your code needs a comment, maybe it is not good code. But the truth is more interesting.',
      'Every senior developer eventually says the same strange sentence: "the best comment is no comment." They are not wrong — but they are not right either.',
    ],
    pairs: [
      ['a well-told joke', 'self-explanatory code — lands without a footnote'],
      ['explaining the joke', 'a comment apologizing for confusing code'],
      ['a footnote that adds context', 'a GOOD comment — the why, not the what'],
      ['a stale footnote for a changed joke', 'a lying comment — worse than none'],
    ],
    break: 'Comments are not the problem — lies are. Code cannot tell you WHY a strange decision exists; only a comment can. Explain intent, never narrate mechanics.',
    weld: 'Refactor until the code explains WHAT; comment only to explain WHY.',
    thumb: { chip: 'CRAFT', line1: 'COMMENTS WERE', accent: 'NEVER THE PROBLEM', line2: '', sub: 'clean code is not the same as clear code', bg: 'tech-code.jpg' },
    broll: ['comedian explaining own joke to death', 'clean desk vs messy desk', 'before/after refactor diff', 'great comment example'],
  },
];

const FALLBACK = {
  object: 'a machine the viewer already understands (pick the closest everyday machine)',
  hooks: [
    'You use this every day — and almost nobody knows what happens inside. Today we open it up.',
    'This looks like magic. It is not. It is a machine with 4 moving parts — and you already know all of them.',
  ],
  pairs: [['part 1', 'tech element 1'], ['part 2', 'tech element 2'], ['part 3', 'tech element 3']],
  break: 'Find the one place the analogy lies — that place is where the real insight lives. State it honestly.',
  weld: 'One sentence, analogy words only, that a viewer can repeat tomorrow.',
  thumb: { chip: 'HOW DEV WORKS', line1: '', accent: '', line2: '', sub: 'a calm, visual deep dive', bg: '' },
  broll: ['close-up of the real-world object in action', 'side-by-side analogy/tech screens', 'the moment of failure/success'],
};

// ---------- assemble brief ----------
function entryFor(topic) {
  return BOARD.find(b => b.match.test(topic)) ?? { ...FALLBACK, id: 'generic' };
}

// One-line creative directive for the render AI (quarry-render feeds the topic string
// verbatim into its script prompt, so the hook/analogy must ride inside the topic).
function oneline(topic) {
  const e = entryFor(topic);
  return `Analogy: ${e.object}. Hook: ${e.hooks[0]} Weld: ${e.weld}`;
}

function brief(topic) {
  const e = entryFor(topic);
  const thumb = e.thumb;
  return `# ${topic} — Never-Forget brief
Generated ${new Date().toISOString().slice(0, 10)} · format: docs/scripts/2026-09-24-never-forget-metaphor-format.md

## 1. HOOK — MANDATORY, cold open, NOTHING before it (no logo, no "hey guys", no intro)
- PRIMARY: ${e.hooks[0]}
- ALT (misdirection): ${e.hooks[1] ?? e.hooks[0]}
${e.hooks[2] ? `- ALT (stat): ${e.hooks[2]}` : ''}
RULE: the hook is spoken over the OBJECT (b-roll below), never over code. The tech word appears only in the hook's last sentence.

## 2. THE OBJECT (you already know this)
Everyday object: **${e.object}**. Walk the object on its own terms for 60-90 seconds — no tech words yet. Plant every role listed below as a physical thing.

## 3. THE MAPPING (one pair per chapter, split screen)
${e.pairs.map(([a, t]) => `- ${a} → ${t}`).join('\n')}

## 4. WHERE THE ANALOGY BREAKS (the credibility beat — never skip)
${e.break}

## 5. THE REAL MECHANISM
Now teach fast, reusing the analogy's vocabulary as shorthand. Order: ${e.pairs.map(p => p[1].split(/[(,—]/)[0].trim()).join(' → ')}.

## 6. THE WELD + PAYOFF
Keep-one-sentence: **${e.weld}**
CTA → tease the next metaphor video.

## B-ROLL shopping list
${e.broll.map(b => `- ${b}`).join('\n')}

## Thumbnail (factory-ready)
\`\`\`
node tools/thumbnail-factory.mjs --title "${topic}" --chip "${thumb.chip}" --line1 "${thumb.line1}" --accent "${thumb.accent}" ${thumb.line2 ? `--line2 "${thumb.line2}" ` : ''}--sub "${thumb.sub}" --bg ${thumb.bg} --out thumb-<videoId>.png
\`\`\`
`;
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

// ---------- run ----------
const topic = arg('topic');
const out = arg('out');
const bank = arg('bank');
const outdir = arg('outdir');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return (v === undefined || v.startsWith('--')) ? true : v;
}

if (out && typeof out === 'string' && topic) {
  const md = brief(String(topic));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, md);
  const hook = md.split('\n').find(l => l.startsWith('- PRIMARY:'));
  console.log('OK: wrote', out);
  console.log(hook || 'WARN: no hook line');
  if (arg('oneline') === true) console.log('ONELINE:' + oneline(String(topic)));
} else if (bank && outdir) {
  const j = JSON.parse(fs.readFileSync(String(bank), 'utf8'));
  const open = (j.topics || []).filter(t => t.status === 'new');
  for (const t of open) {
    const f = path.join(String(outdir), slug(t.title) + '.md');
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, brief(t.title));
    console.log('wrote', f);
  }
  console.log('OK:', open.length, 'briefs');
} else {
  console.error('usage: --topic X --out f.md  |  --bank b.json --outdir dir');
  process.exit(1);
}

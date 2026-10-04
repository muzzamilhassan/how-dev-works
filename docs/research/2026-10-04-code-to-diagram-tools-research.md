# Code → Diagram Tools: Global Deep Research (free & open source)

**Research date:** 2026-10-04
**Trigger:** User asked for deep worldwide research on the best **totally free** platforms/products (open source or free tiers) that convert code into diagrams, referencing Alex Xu's (ByteByteGo) YouTube video ["Top 6 Tools to Turn Code into Beautiful Diagrams"](https://www.youtube.com/watch?v=jCd6XfWLZsg).
**Method:** 3 parallel research agents verified every claim against primary sources (official GitHub API data pulled live 2026-10-04: license SPDX, stars, last push, archived status; official pricing/docs pages fetched directly). Star counts and activity reflect 2026-10-04.

---

## TL;DR — the best picks

| If you want… | Use | Why |
|---|---|---|
| One default tool | **Mermaid** (MIT) | 31 diagram types, ~90.5k stars, renders **natively in GitHub markdown**, free editor at mermaid.live |
| The most beautiful architecture diagrams | **D2** (MPL-2.0) | Best-looking output; as of v0.9.0 (Sep 2026) even the TALA layout engine is open source now |
| Deep UML (sequence/class/state) | **PlantUML** + **C4-PlantUML** | Deepest UML notation support; images generated are GPL-exempt |
| Cloud architecture icons (AWS/Azure/GCP/K8s) | **Diagrams** (Python, MIT) | The video's #1 tool; write Python, get icon-perfect cloud diagrams |
| Paste a GitHub repo → get an architecture diagram | **GitDiagram** (MIT, gitdiagram.com) or **DeepWiki** (free for public repos) | AI-generated; GitDiagram is open source & self-hostable |
| Real code → UML class diagrams | **pyreverse** (Python), **Doxygen+Graphviz** (C/C++), **clang-uml** (C++), **TsUML2** (TS), **cargo-modules** (Rust) | All 100% free/open source |
| Database → ER diagram | **ChartDB** / **DrawDB** / **Azimutt** / **SchemaSpy** / **DBeaver Community** | All open source, all free |
| Terraform → infra graph | **Inframap** or built-in `terraform graph` | Free CLI tools |
| Everything through one API | **Kroki** (MIT, kroki.io) | One free server unifying ~29 engines (PlantUML, Mermaid, D2, Graphviz, DBML, …) |

**Traps found (NOT actually free — flagged during research):** tldraw SDK (production use needs paid license), Cloudcraft (now Datadog-bundle only), Eraser repo-scale AI (3 free AI credits), IcePanel (100 object cap), Structurizr cloud (EOL Sep 30, 2026), ObjectAid (dead), Sourcetrail original (archived; domain squatted — use the petermost fork), CodeViz (domain dead), hcl2dot (unpublished from npm).

---

## Part 1 — The 6 tools from the reference video (verified)

### 1. Diagrams (Python) — mingrammer/diagrams
- **Repo:** https://github.com/mingrammer/diagrams — docs: https://diagrams.mingrammer.com
- Write Python code → cloud/system architecture diagrams. Icon sets for AWS, Azure, GCP, Kubernetes, Alibaba Cloud, Oracle Cloud, on-prem, SaaS, programming frameworks (https://diagrams.mingrammer.com).
- **License:** MIT. **Stars:** 42,671. **Alive:** last push 2026-10-01, v0.25.1 (Nov 2025).
- Requires Graphviz installed locally (https://diagrams.mingrammer.com/docs/getting-started/installation). Outputs png/jpg/svg/pdf/dot. Online playground available.
- Architecture-only niche — no sequence/class/ER.

### 2. Go Diagrams — blushft/go-diagrams
- **Repo:** https://github.com/blushft/go-diagrams — "loose port of" Python Diagrams.
- **License:** MIT. **Stars:** 5,235. **Stalled:** last push 2025-03-22.
- Emits Graphviz DOT + assets; you render with `dot -Tpng` (https://github.com/blushft/go-diagrams). Fine, but the Python original is the better bet.

### 3. Mermaid — mermaid-js/mermaid
- **Repo:** https://github.com/mermaid-js/mermaid — docs: https://mermaid.js.org
- Markdown-inspired text → SVG in the browser. **31 diagram types**: flowchart, sequence, class, state, ER (experimental), C4 (experimental), mindmap, timeline, gantt, gitgraph, sankey, architecture, and more (https://mermaid.js.org/intro/).
- **License:** MIT. **Stars:** 90,522 (largest in the space). **Alive:** pushed 2026-10-03, v12 line.
- Free editor https://mermaid.live; CLI `mermaid-cli` (mmdc) renders SVG/PNG/PDF headlessly (https://github.com/mermaid-js/mermaid-cli).
- **The only engine GitHub renders natively in markdown** (issues, PRs, wikis, .md files) — https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams. GitLab also native (https://docs.gitlab.com/user/markdown/).

### 4. PlantUML (+ C4-PlantUML)
- **Repo:** https://github.com/plantuml/plantuml — https://plantuml.com
- Text DSL → deepest UML set (sequence, class, activity, state, component, deployment, timing, use case) plus non-UML: network/nwdiag, ER, Gantt, mindmap, JSON/YAML viz, Salt UI mockups, Archimate (https://plantuml.com/).
- **License:** GPL-3.0+ per official site, **but generated images are explicitly NOT covered by the GPL** (https://plantuml.com/license). **Stars:** 13,351. **Alive:** v1.2026.8 (Sep 2026).
- C4-PlantUML (MIT, 7,423 stars, plantuml-stdlib/C4-PlantUML) adds C4 model for architecture. Online editor runs fully client-side now (https://plantuml.com).
- Not rendered natively on GitHub.

### 5. ASCII diagram tools
- **ASCIIFlow** — https://asciiflow.com, MIT, 5,958 stars, active; mouse-drawn ASCII output (https://github.com/lewish/asciiflow).
- **svgbob** — Rust ASCII-art → SVG, Apache-2.0, 4,234 stars, maintained (https://github.com/ivanceras/svgbob).
- **ditaa** — ASCII → bitmap, LGPL-3.0, dormant since 2022; usable via Kroki (https://github.com/stathissideris/ditaa).

### 6. Markmap — markmap/markmap
- **Repo:** https://github.com/markmap/markmap — https://markmap.js.org
- Markdown headings/lists → interactive collapsible mindmaps. MIT, 13,144 stars, active; REPL at https://markmap.js.org/repl; VS Code extension. Mindmaps only.

---

## Part 2 — Other major diagram-as-code engines

### D2 — d2lang/d2 (Terrastruct) ⭐ top pick for beauty
- **Repo:** https://github.com/d2lang/d2 — https://d2lang.com
- Modern diagram scripting language; Markdown labels, multi-language text, watch mode, animated diagrams; exports SVG/PNG/PDF/PPTX/GIF/ASCII (https://d2lang.com/).
- Layout engines: dagre (default), ELK, **TALA** — **TALA went open source (MPL-2.0) and is bundled since v0.9.0, Sep 7 2026**; no license key needed anymore (https://github.com/d2lang/d2/releases). D2 is now "an independent open-source project fiscally sponsored by Hack Club" (https://d2lang.com/).
- **License:** MPL-2.0. **Stars:** 25,558. **Alive:** pushed 2026-10-02. Playground: play.d2lang.com.

### Graphviz — the foundation under everything
- https://gitlab.com/graphviz/graphviz — https://graphviz.org. The `dot` language; rendering backend underneath Diagrams, go-diagrams, Doxygen, Inframap.
- **License:** EPL-2.0 (https://graphviz.org/license/). Release 16.1.0, active 2026-10-03. Low-level: raw graph layout, no styling/icons.

### Kroki — one free API for ~29 engines
- **Repo:** https://github.com/yuzutech/kroki — https://kroki.io
- Wraps PlantUML, C4-PlantUML, Mermaid, D2, Graphviz, DBML, ERD, Excalidraw, Structurizr, svgbob, ditaa, nomnoml, Pikchr, TikZ, WaveDrom, BlockDiag family, and more (https://kroki.io/). Free public service (Exoscale-sponsored) + self-host Docker. MIT, 4,354 stars, active. GitLab supports Kroki natively.

### flowchart.fun — tone-row/flowchart-fun
- https://flowchart.fun — indentation-based text → flowcharts. MIT, 3,370 stars, maintained. Free hosted app.

### nomnoml — skanaar/nomnoml
- https://www.nomnoml.com — compact UML-ish text → SVG. MIT, 2,837 stars, maintained. Also on Kroki.

### Structurizr DSL (C4 reference implementation) — structurizr/structurizr
- https://docs.structurizr.com — Simon Brown's "models as code" C4 tooling. Apache-2.0, 427 stars, active monorepo.
- **2026 changes:** cloud service EOL Sep 30 2026; Structurizr Lite archived → replaced by free `local` command; only the `server` binary is paid (https://docs.structurizr.com/eol). Playground: https://playground.structurizr.com.

### LikeC4 — likec4/likec4 (rising C4 DSL)
- https://likec4.dev — typed DSL → interactive React diagrams, static-site export, VS Code extension, MCP server for AI agents. **MIT, 5,802 stars, very active (pushed 2026-10-03).** Free, self-hostable. Modern Structurizr alternative.

### Pikchr
- https://pikchr.org — PIC-inspired markup for docs, 0-clause BSD; used by SQLite/Fossil; embeds in markdown fenced blocks. Maintained.

### BlockDiag family — blockdiag/blockdiag ⚠️ unmaintained
- Python blockdiag/seqdiag/actdiag/nwdiag. Apache-2.0, but last release 2021, site down (HTTP 525). Use via Kroki only. Japanese origin (Takeshi Komiya).

### DBML — holistics/dbml (Vietnam)
- https://dbml.org / https://github.com/holistics/dbml — DSL for database structures → ER diagrams (dbdiagram.io renders it). Apache-2.0, ~3.7k stars. Powers dbdiagram.io/dbdocs.io.

---

## Part 3 — Real source code → diagrams (static analysis)

| Tool | Lang | What it makes | License | Status |
|---|---|---|---|---|
| **pyreverse** (in pylint) | Python | UML class + package diagrams; outputs dot/puml/**mermaid**/html | GPL-2.0 | Alive (pylint v4.1.2, Oct 2026) — https://pylint.readthedocs.io/en/stable/pyreverse.html |
| **Doxygen + Graphviz** | C/C++/Java/PHP/… | inheritance, collaboration, **call & caller graphs**, include/dir dependency graphs (`HAVE_DOT`, `CALL_GRAPH`) | GPL-2.0 | Alive (v1.18.0, Aug 2026) — https://www.doxygen.nl/manual/diagrams.html |
| **clang-uml** | C++ | class/sequence/package/include diagrams → PlantUML or Mermaid | Apache-2.0 | Alive — https://github.com/bkryza/clang-uml |
| **PlantUmlClassDiagramGenerator** | C#/VB | class diagrams → PlantUML; `puml-gen` CLI + VS Code ext | MIT | Alive — https://github.com/pierre3/PlantUmlClassDiagramGenerator |
| **TsUML2** (`tsuml2`) | TypeScript | class/interface/enum/type diagrams (nomnoml SVG), fully offline | MIT | Alive — https://github.com/demike/TsUML2 |
| **cargo-modules** | Rust | module tree + graphs (Graphviz/Mermaid), orphan & cycle detection | MPL-2.0 | Alive — https://github.com/regexident/cargo-modules |
| **Eclipse Papyrus** | Java/UML | full UML modeling + reverse engineering (heavyweight) | EPL | Alive — https://eclipse.dev/papyrus |
| **code2flow** | Python/JS/Ruby/PHP | approximate **call graphs** → DOT/SVG (Graphviz) | MIT | Alive but slow — https://github.com/scottrogowski/code2flow |
| **madge** | JS/TS | module dependency graph + circular-dep detection | MIT | Alive — https://github.com/pahen/madge |
| **dependency-cruiser** | JS/TS | dependency graphs **+ architecture rule validation in CI**; outputs dot/mermaid/html | MIT | Very alive — https://github.com/sverweij/dependency-cruiser |
| **pydeps** | Python | import graphs with clustering + cycles | BSD-2 | Alive — https://github.com/thebjorn/pydeps |
| **npmgraph** | npm ecosystem | interactive dependency graphs w/ license+size rollups, web | MIT | Alive — https://npmgraph.js.org |
| **emerge** | many (C/C++/Java/Python/JS/Go/Swift/…) | interactive codebase/dependency graphs in browser; Graphviz/Gephi export | MIT | Alive — https://github.com/glato/emerge |
| **Sourcetrail** (fork: petermost/Sourcetrail) | C/C++/Java/Python | interactive code explorer (graph + source side-by-side) | GPL-3.0 | Original **archived 2021, sourcetrail.com domain squatted by unrelated blog**; fork active (pushed 2026-10-02) — https://github.com/petermost/Sourcetrail |
| **CodeCharta** | metrics-driven | interactive **3D "code city"** maps from SonarQube/Tokei/git-log parsers | BSD-3 | Alive — https://codecharta.com (MaibornWolff, Germany) |
| **Gource** | git/svn/hg logs | animated 3D dev-history visualization → video | GPL-3.0 | Alive — https://gource.io |
| **AppMap** | Java/Python/Ruby/JS/.NET/Swift | **runtime** traces → sequence diagrams, dependency maps, flame graphs in VS Code/JetBrains | OSS (MIT plugins) | Alive; Community Edition **free ≤25 devs** — https://appmap.io |
| **ArchGuard** | Java/etc. | architecture governance: dependency analysis → diagrams + fitness functions | MIT | Alive; China (Thoughtworks China origin) — https://github.com/archguard/archguard |

**Dead/dormant flags:** ObjectAid (site returns bare "OK" stub — dead), JDepend (dormant 2020), Degraph (dormant 2021), cargo-depgraph (archived May 2026), githubocto/repo-visualizer (archived), "C++ to UML"/"Java2UML" VS Code extensions (unverifiable — use clang-uml/TsUML2 instead).

---

## Part 4 — AI-powered: paste a repo → get a diagram

| Tool | What | Free status | License | Source |
|---|---|---|---|---|
| **GitDiagram** — https://gitdiagram.com | GitHub repo URL → interactive Mermaid architecture diagram, click node → jump to source; MCP server | Hosted **free**; self-host free (MIT) but bring your own LLM key | MIT, 17,784 stars, very alive | https://github.com/ahmedkhaleel2004/gitdiagram |
| **DeepWiki** (Cognition) — https://deepwiki.com | Public repo → AI wiki with flowcharts/sequence diagrams + chat | **Free unlimited for public repos**; private repos need paid Devin | Proprietary SaaS | https://cognition.ai/blog/deepwiki |
| **DeepWiki-Open** | Self-hosted clone: GitHub/GitLab/Bitbucket → wiki + diagrams + RAG chat, BYO keys (local models OK) | 100% free software; you pay model API | MIT, 18,115 stars | https://github.com/AsyncFuncAI/deepwiki-open |
| **CodeBoarding** — https://codeboarding.org | Static analysis + LLM naming → nested interactive architecture maps; **GitHub Action posts architecture-impact diagrams on PRs**; VS Code ext; 8 languages | OSS engine free (BYO key); public-repo web app free, no sign-in | MIT, 2,472 stars, alive | https://github.com/CodeBoarding/CodeBoarding |
| **Eraser DiagramGPT / Eraserbot** | Prompt/code → polished diagrams; GitHub integration | Free plan only **3 files / 3 AI diagrams** — repo-scale is paid ($15+/mo) | Proprietary | https://www.eraser.io/pricing |
| **Repomix** (+ any LLM) | Packs repo → one AI-friendly file; add "draw architecture as Mermaid" prompt = DIY repo→diagram | 100% free; diagram quality = your LLM | MIT, 28,664 stars | https://github.com/yamadashy/repomix |
| **Codebase Digest** | Similar packer with built-in "Generate Architectural Diagram" prompt | Free CLI | MIT | https://github.com/kamilstanuch/codebase-digest |

**Flag:** CodeViz (codeviz.dev) unreachable 2026-10-04 — treat as dead.

---

## Part 5 — Free platforms & editors (hosted / self-hostable)

### General diagram platforms
- **diagrams.net / draw.io** — https://app.diagrams.net, https://github.com/jgraph/drawio. Apache-2.0, ~8.5k stars, active. **Fully free forever, zero paid tier**: web + Windows/macOS/Linux desktop + Docker self-host. Imports Mermaid & PlantUML as **native editable shapes** (https://www.drawio.com/blog/mermaid-diagrams).
- **Excalidraw** — https://excalidraw.com, https://github.com/excalidraw/excalidraw. MIT, ~133.5k stars (biggest repo in the survey). Free hosted, self-hostable; built-in **Mermaid → Excalidraw** conversion (https://github.com/excalidraw/mermaid-to-excalidraw).
- ⚠️ **tldraw** — free to *use* on tldraw.com, but the SDK is source-available: **production deployment requires a paid license** (https://tldraw.dev/pricing). Not open source.
- **Penpot** — MPL-2.0, ~60.6k stars, self-hostable; design-first, no dedicated diagramming canvas (https://penpot.app).

### C4 / architecture-as-code platforms
- **Structurizr DSL + `local`** — free (Apache-2.0); cloud retired 2026 (https://docs.structurizr.com/eol).
- **LikeC4** — MIT, free, self-hostable, VS Code + MCP (https://likec4.dev).
- **C4-PlantUML** — MIT, free (https://github.com/plantuml-stdlib/C4-PlantUML).
- **Ilograph** — freemium: free tier is generous (unlimited public AND private diagrams, no size limits; https://www.ilograph.com/pricing.html) but closed source, hosted-only free.
- Freemium caps: **IcePanel** free = 1 landscape / 100 model objects; **Whimsical** free = 50 objects/board, watermark; **Miro** = 3 boards; **Lucidchart** = 3 docs / 60 shapes; **Mermaid Chart (now mermaid.ai)** has a free plan, exact limits unpublished.

### Database → ER diagrams (all free & open)
- **ChartDB** — https://chartdb.io, AGPL-3.0, ~23k stars. One "smart query" per DB (Postgres/MySQL/MSSQL/SQLite/ClickHouse/BigQuery/…) → interactive ERD; AI dialect-translation export BYO-key, self-hostable.
- **DrawDB** — https://drawdb.app, AGPL-3.0, ~39.8k stars. Free hosted + self-host visual ERD editor ↔ SQL DDL both ways.
- **Azimutt** — https://azimutt.app, MIT, France. ER explorer built for **huge schemas** (find-path between tables, column hiding); live DB or SQL dump; `npx azimutt explore`.
- **SchemaSpy** — http://schemaspy.org, LGPL-3.0. Live JDBC schema → full HTML docs site with ER diagrams.
- **DBeaver Community** — Apache-2.0, ~51.9k stars. ER diagrams included in free desktop edition.
- **Supabase Studio** visualizer — built into free tier & self-hosted Studio (Apache-2.0).
- **dbdiagram.io** (DBML) — free tier ~10 saved diagrams (cap community-cited, not officially verifiable); **dbdocs.io** free.

### Infrastructure / cloud from code/state
- **Inframap** (Cycloid, France) — https://github.com/cycloidio/inframap. Terraform state/HCL → Graphviz DAG (AWS/GCP/Azure). MIT, ~2k stars.
- **Rover** — https://github.com/im2nguyen/rover, https://rover.tf. Terraform state → interactive local web UI. MIT, ~3.3k stars; semi-dormant (last push Jul 2025).
- `terraform graph` → Graphviz — built-in, always maintained.
- ⚠️ **Cloudcraft** — now **Datadog-owned; "free with any Datadog subscription"** only (https://www.cloudcraft.co/pricing). Not freestanding-free anymore.
- ⚠️ hcl2dot — unpublished/dead. komodor — paid SaaS.

### AI text→diagram free tiers
- **Eraser** — 3 free AI diagrams (see Part 4).
- **Swimlanes.ai** — free web sequence-diagram editor with AI helper; quotas unpublished.
- **Whimsical AI** — 10 AI credits/member/month on free plan.
- **Napkin AI** — free-forever plan with weekly credits; text → business infographics more than engineering diagrams.
- Edraw AI / Miro AI / Cloudairy — freemium, marketing-limited; not truly free.

---

## Part 6 — Master comparison (the headline tools)

| Tool | Input | Diagram types | License | 100% free? | GitHub-native | Stars | Status |
|---|---|---|---|---|---|---|---|
| **Mermaid** | text (markdown-ish) | 31 types | MIT | ✅ | ✅ **only one** | 90.5k | very active |
| **D2** | text DSL | architecture/graphs, animated | MPL-2.0 | ✅ (incl. TALA now) | ❌ | 25.6k | very active |
| **PlantUML** | text DSL | deepest UML + ER/network/Gantt | GPL-3.0+ (images exempt) | ✅ | ❌ | 13.4k | very active |
| **Diagrams (Py)** | Python | cloud architecture icons | MIT | ✅ | ❌ | 42.7k | active |
| **Excalidraw** | drawing + Mermaid import | freehand whiteboard | MIT | ✅ | ❌ | 133.5k | very active |
| **draw.io** | drawing + Mermaid/PlantUML import | everything, editable | Apache-2.0 | ✅ no paid tier | ❌ | 8.5k | active |
| **Graphviz** | dot | raw graphs | EPL-2.0 | ✅ | ❌ | 1.5k | active |
| **Kroki** | text (29 syntaxes) | meta | MIT | ✅ hosted+self-host | via GitLab | 4.4k | active |
| **LikeC4** | typed DSL | C4 interactive | MIT | ✅ | ❌ | 5.8k | very active |
| **Structurizr** | DSL | C4 | Apache-2.0 | ✅ (server paid) | ❌ | 427 | active |
| **GitDiagram** | repo URL | AI architecture map | MIT | ✅ hosted + self-host | ❌ | 17.8k | very active |
| **DeepWiki** | repo URL | AI wiki + diagrams | proprietary | ✅ public repos | ❌ | n/a | active |
| **ChartDB** | DB query | ERD | AGPL-3.0 | ✅ self-host (AI BYOK) | ❌ | 23k | active |
| **DrawDB** | visual/SQL | ERD | AGPL-3.0 | ✅ | ❌ | 39.8k | very active |
| **Azimutt** | live DB/dump | ERD (huge schemas) | MIT | ✅ | ❌ | 2.2k | active |
| **Inframap** | terraform state/HCL | infra graph | MIT | ✅ | ❌ | 2.1k | maintained |
| **AppMap** | runtime traces | sequence/dep maps | OSS | ✅ ≤25 devs | ❌ | org | active |
| **Markmap** | markdown | mindmaps | MIT | ✅ | ❌ | 13.1k | active |
| **CodeCharta** | metrics | 3D code city | BSD-3 | ✅ | ❌ | 543 | active |

---

## Recommendations by scenario

1. **Just getting started / docs in GitHub:** **Mermaid**. Zero setup, renders in every `.md`, issue, and PR. Use https://mermaid.live to compose.
2. **Presentable architecture diagrams (like the video's thumbnails):** **D2** — the best-looking engine, fully open since TALA went MPL-2.0 in Sep 2026. Playground: https://play.d2lang.com.
3. **Cloud architecture with real AWS/Azure/GCP/K8s icons:** **Diagrams (Python)** — exactly the tool shown in the video.
4. **Formal UML for design docs:** **PlantUML** (+C4-PlantUML); render via https://kroki.io or the client-side editor.
5. **"Understand this codebase for me":** **GitDiagram** (paste GitHub URL, free) or **DeepWiki** (free for public repos); self-host **DeepWiki-Open** for privacy.
6. **Diagrams from actual source:** pyreverse / Doxygen / clang-uml / TsUML2 / cargo-modules — pick by language (table in Part 3).
7. **Databases:** ChartDB or DrawDB for editing/design; Azimutt for exploring big existing schemas; SchemaSpy for auto-docs.
8. **Terraform:** Inframap or `terraform graph | dot -Tsvg`.
9. **One self-hosted service for all text-diagram syntaxes:** **Kroki**.
10. **Hand-drawn style sketches:** **Excalidraw** (Mermaid import built in).

## Verified-dead / avoid list
ObjectAid (dead) · Sourcetrail original (archived + domain squatted → use petermost/Sourcetrail) · CodeViz (domain dead) · hcl2dot (unpublished) · cargo-depgraph (archived) · BlockDiag family (unmaintained, Kroki-only) · ditaa (dormant) · Structurizr cloud (EOL 2026-09-30) · Cloudcraft standalone free plan (gone — Datadog bundle) · tldraw SDK for production (paid license) · repo-visualizer (GitHub Next, archived).

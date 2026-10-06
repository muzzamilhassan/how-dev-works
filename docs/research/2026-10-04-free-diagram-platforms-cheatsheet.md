# Free Diagram Platforms — Findings Cheat-Sheet

**Date:** 2026-10-04 · **Scope:** every genuinely free / open-source tool that turns code, text, schemas, or repos into diagrams — verified against live GitHub/pricing data (full cited research: [`2026-10-04-code-to-diagram-tools-research.md`](2026-10-04-code-to-diagram-tools-research.md)). Working examples in this repo: [`diagram-lab/`](../../diagram-lab/README.md). Companion: [`2026-10-04-diagram-channel-automation-research.md`](2026-10-04-diagram-channel-automation-research.md).

**Legend:** ⭐ = GitHub stars (2026-10-04) · "CI" = renders headlessly in GitHub Actions.

---

## 1. Text/Code → Diagram ("diagram as code") — the core family

| Tool | License | ⭐ | How to use | Where it fits | CI |
|---|---|---|---|---|---|
| **Mermaid** | MIT | 90.5k | [mermaid.live](https://mermaid.live) · ```` ```mermaid ```` blocks render **natively in GitHub** markdown (README/issues/PRs/wiki) · `mermaid-cli` (mmdc) → SVG/PNG in CI (~5s) | **Default choice.** Docs, repos, and the channel (AI writes it most reliably; SVG ids addressable for Remotion animation) | ✅ docker `minlag/mermaid-cli` + `--no-sandbox` |
| **D2** | MPL-2.0 | 25.6k | [play.d2lang.com](https://play.d2lang.com) · single static binary CLI (<1s render) · `steps:`/`layers:` boards + `--animate-interval` = **animated storyboard SVG from text** | Most beautiful architecture diagrams; storyboards; already used in `diagram-lab` | ✅ static binary |
| **PlantUML** | GPL-3.0+ (**generated images GPL-exempt**) | 13.4k | [plantuml.com/plantuml](https://www.plantuml.com/plantuml) (client-side) · `plantuml.jar` · apt package | Deepest UML: sequence/class/state/activity + network/ER/Gantt | ✅ jar or docker |
| **Diagrams (Python)** | MIT | 42.7k | `pip install diagrams` + Graphviz → write Python → cloud architecture with real AWS/Azure/GCP/K8s/Alibaba icons | Cloud-infrastructure explainers (icon terms explicitly allow monetized videos if icons unmodified) | ✅ apt graphviz + pip |
| **Graphviz** | EPL-2.0 | 1.5k | `dot -Tsvg graph.dot` | The engine underneath Diagrams/Doxygen/Inframap — raw node-edge graphs | ✅ apt |
| **Go Diagrams** | MIT | 5.2k | Go port of Python Diagrams | Only if writing Go | ✅ (stalled since 2025) |
| **Markmap** | MIT | 13.1k | [markmap.js.org/repl](https://markmap.js.org/repl) · VS Code extension | Markdown outline → interactive mind maps (video outlines, docs) | ❌ (browser) |
| **flowchart.fun** | MIT | 3.4k | Type indented lines at [flowchart.fun](https://flowchart.fun) | Instant flowcharts, zero learning | ❌ (web) |
| **nomnoml** | MIT | 2.8k | [nomnoml.com](https://www.nomnoml.com) | Compact UML-ish class sketches | ✅ via Kroki |
| **ASCIIFlow** | MIT | 6.0k | Draw at [asciiflow.com](https://asciiflow.com) → ASCII art | ASCII diagrams for READMEs/terminals | ❌ (manual) |
| **svgbob** | Apache-2.0 | 4.2k | ASCII art → SVG | ASCII scribbles → real graphics | ✅ via Kroki |
| **ditaa** | LGPL-3.0 | 1.0k | ASCII → bitmap | Legacy only | ⚠️ dormant (2022), Kroki-only |
| **DBML** | Apache-2.0 | 3.7k | Write DBML text → ER diagram ([dbdiagram.io](https://dbdiagram.io) renders it) | **Text-based database schemas — the CI-friendly ER option** | ✅ via Kroki |
| **Pikchr** | 0-clause BSD | — | PIC-style markup in fenced code blocks | Docs embedded diagrams (SQLite uses it) | ✅ via Kroki |

---

## 2. Architecture-as-code (C4 model)

| Tool | License | ⭐ | How to use | Notes |
|---|---|---|---|---|
| **LikeC4** | MIT | 5.8k | VS Code extension → `likec4 serve` / `likec4 build` → interactive site or static export | **Modern pick** — typed DSL, validation, MCP server for AI agents, very active |
| **C4-PlantUML** | MIT | 7.4k | C4 macros in any PlantUML renderer (official plantuml-stdlib) | Classic; works everywhere PlantUML works |
| **Structurizr DSL** | Apache-2.0 | 427 | DSL + free `local` command ([docs.structurizr.com](https://docs.structurizr.com)) | C4 reference implementation (Simon Brown). ⚠️ their **cloud** service EOL Sep 2026 — use local tooling |

---

## 3. Free diagram editors / platforms

| Platform | License | ⭐ | Free status | How to use |
|---|---|---|---|---|
| **draw.io / diagrams.net** | Apache-2.0 | 8.5k | **Fully free — no paid tier exists** | [app.diagrams.net](https://app.diagrams.net) · desktop app (Win/mac/Linux) · Docker · imports Mermaid/PlantUML text as **native editable shapes** |
| **Excalidraw** | MIT | 133.5k | Free hosted + self-hostable (paid tier is separate SaaS) | [excalidraw.com](https://excalidraw.com) · built-in **Mermaid → Excalidraw** converter |
| **Ilograph** | Proprietary | — | Free tier: unlimited public AND private diagrams (hosted only) | [ilograph.com](https://www.ilograph.com) — zoomable interactive diagrams, YAML DSL |
| **Penpot** | MPL-2.0 | 60.6k | Fully free, self-hostable | Design/prototyping platform — light diagramming only |
| **LibreOffice Draw** | MPL-2.0 | — | Fully free | Opens/edits Visio files (.vsd/.vsdx) — Visio refugees only |
| ⚠️ Freemium only | Proprietary | — | Miro (3 boards) · Lucidchart (3 docs/60 shapes) · Whimsical (50 objects + watermark) · IcePanel (1 landscape/100 objects) · Eraser (3 files/3 AI credits) · Mermaid Chart (free plan, limits unpublished) | Occasional manual use only — never automation |
| ❌ **tldraw** (SDK) | Custom (source-available) | 50.7k | Consumer site free; **SDK production use = paid license** | Avoid in pipelines |

---

## 4. Real source code → diagrams (static analysis)

| Tool | License | ⭐ | Language | Output | How |
|---|---|---|---|---|---|
| **pyreverse** (in pylint) | GPL-2.0 | 5.7k | Python | UML class + package diagrams → dot/**PlantUML/Mermaid**/html | `pyreverse -o mmd src/` |
| **Doxygen + Graphviz** | GPL-2.0 | 6.6k | C/C++/Java/PHP/… | Inheritance, collaboration, **call & caller graphs**, include/dir graphs | `HAVE_DOT=YES`, `CALL_GRAPH=YES` |
| **clang-uml** | Apache-2.0 | 0.9k | C++ | Class/sequence/package/include diagrams → PlantUML or Mermaid | config-driven CLI |
| **PlantUmlClassDiagramGenerator** | MIT | 0.8k | C#/VB | Class diagrams → PlantUML | `dotnet tool install puml-gen` + VS Code ext |
| **TsUML2** | MIT | 0.3k | TypeScript | Class/interface/enum diagrams (offline) | `npx tsuml2` |
| **cargo-modules** | MPL-2.0 | 1.3k | Rust | Module tree + graphs (Graphviz/Mermaid), orphan/cycle detection | `cargo install cargo-modules` |
| **Eclipse Papyrus** | EPL | — | Java/UML | Full UML modeling + reverse engineering | Heavyweight; committed users only |
| **code2flow** | MIT | 4.6k | Python/JS/Ruby/PHP | Approximate **call graphs** → DOT/SVG | `pip install code2flow` |
| **dependency-cruiser** | MIT | 7.2k | JS/TS | Dependency graphs **+ architecture rules enforced in CI** | `npx dependency-cruiser src --output-type dot \| dot -Tsvg` |
| **madge** | MIT | 10.2k | JS/TS | Dependency graphs + cycle detection | `npx madge --image graph.svg src` |
| **pydeps** | BSD-2 | 2.1k | Python | Import graphs, clustering, cycles | `pip install pydeps` |
| **npmgraph** | MIT | 0.8k | npm ecosystem | Interactive dependency graphs + license/size rollups | [npmgraph.js.org](https://npmgraph.js.org) |
| **emerge** | MIT | 1.2k | 15+ languages | Interactive codebase/dependency graphs in browser; Graphviz/Gephi export | local, no AI |
| **Gource** | GPL-3.0 | 13.2k | git/svn/hg history | **Animated video** of repo evolution | `xvfb-run gource -o - \| ffmpeg …` — proven in Actions |
| **CodeCharta** | BSD-3 | 0.5k | metrics | Interactive **3D code-city** maps | parsers (SonarQube/Tokei/git-log) → web visualizer |
| **AppMap** | OSS (MIT plugins) | org | Java/Python/Ruby/JS/.NET/Swift | **Runtime** sequence diagrams, dependency maps, flame graphs | VS Code/JetBrains; free ≤25 devs |
| **ArchGuard** (China) | MIT | 0.7k | JVM-centric | Architecture governance: dependency analysis → diagrams + fitness functions | self-host |
| **Sourcetrail** | GPL-3.0 | 16.5k | C/C++/Java/Python | Interactive code explorer (graph + source) | ⚠️ original archived 2021 + domain squatted → use fork **`petermost/Sourcetrail`** (active) |
| ❌ **ObjectAid** | — | — | Java | — | **Dead** (site is a stub) |
| ❌ **JDepend / Degraph / cargo-depgraph** | — | — | Java/Rust | — | Dormant/archived — use dependency-cruiser / cargo-modules |

---

## 5. AI: paste a repo → architecture diagram

| Tool | License | ⭐ | Free status | How to use |
|---|---|---|---|---|
| **GitDiagram** | MIT | 17.8k | Hosted free; self-host free (BYO LLM key) | Swap `github.com` → `gitdiagram.com` in any repo URL; Mermaid output, click-to-source, free MCP server |
| **DeepWiki** (Cognition) | Proprietary | — | **Free unlimited for public repos** | Swap `github.com` → `deepwiki.com` — AI wiki + diagrams + chat |
| **DeepWiki-Open** | MIT | 18.1k | 100% free self-host (BYO keys, local models OK) | Own the pipeline for private repos |
| **CodeBoarding** | MIT | 2.5k | Free OSS engine (BYO key); public-repo web app free | Static analysis + LLM naming → architecture maps; **GitHub Action posts architecture-impact diagrams on PRs** |
| **Repomix** | MIT | 28.7k | 100% free | Pack any repo → one AI-friendly file → ask any LLM to "draw the architecture" (DIY route) |
| **Codebase Digest** | MIT | 0.4k | Free CLI | Repo → digest + built-in diagram prompts (dormant 2024) |
| ⚠️ **Eraser** DiagramGPT | Proprietary | — | 3 free files/3 AI credits only | Repo-scale generation is paid ($15+/mo) |
| ❌ **CodeViz** | — | — | — | Domain dead (2026-10-04) — do not rely |

---

## 6. Database → ER diagrams

| Tool | License | ⭐ | How to use | Notes |
|---|---|---|---|---|
| **ChartDB** | AGPL-3.0 | 23.0k | Run one "smart query" on your DB → instant interactive ERD; AI dialect-translation (BYO key); free hosted + self-host Docker | 9+ dialects (Postgres/MySQL/MSSQL/SQLite/ClickHouse/BigQuery…) |
| **DrawDB** | AGPL-3.0 | 39.8k | Free hosted ([drawdb.app](https://drawdb.app)) + self-host | Visual ERD editor ↔ SQL DDL both ways |
| **Azimutt** (France) | MIT | 2.2k | [azimutt.app](https://azimutt.app) free, `npx azimutt explore` | Built for **huge** existing schemas — find paths between tables, column hiding |
| **SchemaSpy** | LGPL-3.0 | 3.7k | Point at live JDBC schema → full HTML docs site with ERDs | Zero-effort auto-documentation |
| **DBeaver Community** | Apache-2.0 | 51.9k | ER diagrams of any connected database | Included in free desktop edition |
| **dbdiagram.io** | Proprietary | — | DBML text → ERD | Free ~10 saved diagrams; **dbdocs.io** (hosted DB docs) free |
| **Supabase Studio** | Apache-2.0 | 111k | Built-in schema visualizer | Free tier + self-hosted |

---

## 7. Infrastructure / cloud → diagrams from code

| Tool | License | ⭐ | How to use | Notes |
|---|---|---|---|---|
| **Inframap** (Cycloid, France) | MIT | 2.1k | `inframap generate state.tfstate \| dot -Tsvg` | Terraform state/HCL → Graphviz DAG (AWS/GCP/Azure) |
| **Rover** | MIT | 3.3k | Terraform state → interactive local web UI ([rover.tf](https://rover.tf)) | Semi-dormant (2025) but works |
| `terraform graph` | MPL (built-in) | — | `terraform graph \| dot -Tsvg` | Always maintained, no extra tool |
| ❌ **Cloudcraft** | Proprietary (Datadog) | — | — | Standalone free plan **gone** — now "free with Datadog subscription" only |
| ❌ **hcl2dot** | — | — | — | Unpublished from npm — dead |

---

## 8. The force multiplier: Kroki (MIT, 4.4k⭐)

One free server — [kroki.io](https://kroki.io) public, or one Docker container as an Actions `services:` block — that renders **~29 syntaxes** through a single API: PlantUML, C4-PlantUML, Mermaid, D2, Graphviz, DBML, ERD, Excalidraw, svgbob, ditaa, nomnoml, Structurizr, Pikchr, TikZ, WaveDrom, and more.

```bash
curl https://kroki.io/plantuml/svg --data-raw 'Bob->Alice: hello' > out.svg
```

Instead of installing ten renderers, POST text to one endpoint. GitLab supports Kroki natively. **This is the pragmatic glue for any docs/diagram pipeline.**

---

## ❌ Verified dead / traps — do not build on these

| Item | Status |
|---|---|
| ObjectAid | Dead (site returns a stub) |
| Sourcetrail (original) | Archived 2021; **domain squatted by unrelated blog** → use `petermost/Sourcetrail` fork |
| CodeViz | Domain unreachable (2026-10-04) |
| hcl2dot | Unpublished from npm |
| Structurizr **cloud** | EOL 2026-09-30 (local tooling continues) |
| Structurizr Lite / on-prem repos | Archived → replaced by new `local`/`server` commands |
| Cloudcraft standalone free plan | Gone (Datadog bundle only) |
| tldraw SDK | Production use requires paid license (consumer site is free) |
| Eraser repo-scale AI | 3 free credits, then paid |
| BlockDiag family / ditaa | Unmaintained (Kroki-only if ever needed) |
| cargo-depgraph · JDepend · Degraph · repo-visualizer (GitHub Next) | Archived/dormant |

---

## Licensing in one line (monetized video safety)

Mermaid MIT · D2 MPL-2.0 (**outputs are yours**) · PlantUML GPL with **image exemption** · Graphviz EPL (compiler-like) · Gource GPL (output derives from *your* git log) · draw.io/Excalidraw/LikeC4/MIT-Apache ✅ · **AWS/Azure/GCP icons: explicitly permitted in diagrams/training materials — keep them unmodified, never recolor, no implied endorsement** · Fonts: JetBrains Mono & Inter (OFL) safe. Sole gray zone in the video pipeline: edge-tts voices (unlicensed free endpoint) → swap to Azure AI Speech before monetization review.

---

## Where these slot into how-dev-works

| Surface | Tools |
|---|---|
| Episode pipeline (`tech-render/`) | Spec-driven composition (Remotion-native) — Mermaid/D2 feed it per the research architectures |
| `diagram-lab/` workflow | Mermaid-cli, D2, Python Diagrams, PlantUML — already rendering on Actions (dispatch-only) |
| GitHub repos/docs | Mermaid natively in markdown; Kroki self-host for everything else |
| DB episodes research/design | ChartDB · DrawDB · Azimutt · DBML · SchemaSpy · DBeaver |
| Studying any public repo before scripting | GitDiagram · DeepWiki (free) · Repomix + own LLM |
| Fun/community content | Gource render of this repo · CodeCharta code-city |

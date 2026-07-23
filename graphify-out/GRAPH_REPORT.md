# Graph Report - src  (2026-07-18)

## Corpus Check
- Corpus is ~28,471 words - fits in a single context window. You may not need a graph.

## Summary
- 253 nodes · 522 edges · 18 communities (16 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- UI Components & Layout
- Component Primitives
- Routing & Hooks
- Data & Config
- Animation & Shaders
- Paraglide i18n & Custom UI
- Three.js & 3D
- Stores & Page Transitions
- App Shell & Typography
- Spotify Integration
- App Layout & Icons
- Server Handle

## God Nodes (most connected - your core abstractions)
1. `$lib/data` - 42 edges
2. `$lib/paraglide/messages` - 33 edges
3. `$lib/ui/cn/dialog` - 19 edges
4. `$lib/types/ui` - 15 edges
5. `$lib/ui/custom` - 13 edges
6. `$lib/ui/dialog` - 12 edges
7. `$lib/ui/cn/button` - 10 edges
8. `$lib/ui/page` - 10 edges
9. `$lib/ui/module/app-nav.svelte` - 10 edges
10. `$lib/ui/module/about.svelte` - 9 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `getRecentlyPlayed()`  [EXTRACTED]
  routes/api/recently-played/+server.ts → lib/spotify.ts
- `$lib/ui/helper` --re_exports--> `../helper/theme-switcher.svelte`  [EXTRACTED]
  lib/ui/helper/index.ts → lib/ui/helper/theme-switcher.svelte

## Import Cycles
- 4-file cycle: `lib/ui/dialog/home.svelte -> lib/ui/page/index.ts -> lib/ui/page/helper.svelte -> lib/ui/dialog/index.ts -> lib/ui/dialog/home.svelte`
- 4-file cycle: `lib/ui/dialog/index.ts -> lib/ui/dialog/music.svelte -> lib/ui/page/index.ts -> lib/ui/page/helper.svelte -> lib/ui/dialog/index.ts`
- 4-file cycle: `lib/ui/dialog/index.ts -> lib/ui/dialog/skills.svelte -> lib/ui/page/index.ts -> lib/ui/page/helper.svelte -> lib/ui/dialog/index.ts`
- 4-file cycle: `lib/ui/dialog/home.svelte -> lib/ui/page/index.ts -> lib/ui/page/home.svelte -> lib/ui/dialog/index.ts -> lib/ui/dialog/home.svelte`
- 4-file cycle: `lib/ui/dialog/index.ts -> lib/ui/dialog/music.svelte -> lib/ui/page/index.ts -> lib/ui/page/home.svelte -> lib/ui/dialog/index.ts`
- 4-file cycle: `lib/ui/dialog/index.ts -> lib/ui/dialog/skills.svelte -> lib/ui/page/index.ts -> lib/ui/page/home.svelte -> lib/ui/dialog/index.ts`

## Communities (18 total, 2 thin omitted)

### Community 0 - "UI Components & Layout"
Cohesion: 0.09
Nodes (23): $app/environment, $lib/ui/module/about.svelte, $lib/ui/module/contact.svelte, ./cube-3d.svelte, $lib/ui/module/cursor.svelte, $lib/ui/module/divider.svelte, $lib/ui/module/footer.svelte, $lib/ui/module/gallery.svelte (+15 more)

### Community 1 - "Component Primitives"
Cohesion: 0.11
Nodes (7): svelte/elements, $lib/ui/cn/card, $lib/ui/cn/dialog, $lib/ui/cn/separator/separator.svelte, $lib/ui/cn/tabs, $lib/ui/cn/tooltip, @lucide/svelte/icons/x

### Community 2 - "Routing & Hooks"
Cohesion: 0.11
Nodes (9): $lib/paraglide/runtime, $lib/const, $lib/ui/cn/button, $lib/ui/custom, ./skill-card.svelte, $lib/ui/dialog, $lib/ui/helper, ../helper/theme-switcher.svelte (+1 more)

### Community 3 - "Data & Config"
Cohesion: 0.07
Nodes (31): $lib/data, appNavRoutes, dock, journey, languages, media_assets, music, navLinks (+23 more)

### Community 4 - "Animation & Shaders"
Cohesion: 0.13
Nodes (15): @threlte/core, svelte/easing, @threlte/extras, $lib/shaders/smoke/fragment.glsl, $lib/shaders/smoke/vertex.glsl, $lib/models/home.svelte, gltf, ref (+7 more)

### Community 5 - "Paraglide i18n & Custom UI"
Cohesion: 0.14
Nodes (9): $lib/paraglide/messages, $lib/ui/cn/aspect-ratio, ./avatar.svelte, ./app-footer.svelte, $lib/ui/module/app-nav.svelte, $lib/ui/module/page-shell.svelte, $app/state, $app/stores (+1 more)

### Community 6 - "Three.js & 3D"
Cohesion: 0.12
Nodes (7): $lib/three/canvas/portal.svelte, $lib/three/canvas/target.svelte, @threlte/rapier, svelte/reactivity, opacity, @threlte/studio, @threlte/theatre

### Community 7 - "Stores & Page Transitions"
Cohesion: 0.25
Nodes (6): ../app.css, $lib/stores/page-transition, pageTransition, $lib/ui/page/room-transition.svelte, $app/navigation, svelte/transition

### Community 8 - "App Shell & Typography"
Cohesion: 0.29
Nodes (7): App HTML Shell, Almarai Font, Cabinet Grotesk Font, Instrument Serif Font, JetBrains Mono Font, Paraglide i18n, SvelteKit Framework

### Community 9 - "Spotify Integration"
Cohesion: 0.70
Nodes (3): getAccessToken(), getRecentlyPlayed(), GET()

## Knowledge Gaps
- **44 isolated node(s):** `App`, `lucide-svelte`, `WorkItem`, `ServiceItem`, `journey` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$lib/data` connect `Data & Config` to `UI Components & Layout`, `Routing & Hooks`, `Paraglide i18n & Custom UI`?**
  _High betweenness centrality (0.215) - this node is a cross-community bridge._
- **Why does `$lib/paraglide/messages` connect `Paraglide i18n & Custom UI` to `UI Components & Layout`, `Routing & Hooks`, `Data & Config`, `Three.js & 3D`, `Stores & Page Transitions`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Why does `$lib/types/ui` connect `Data & Config` to `Routing & Hooks`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `App`, `lucide-svelte`, `WorkItem` to the rest of the system?**
  _44 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.08668076109936575 - nodes in this community are weakly interconnected._
- **Should `Component Primitives` be split into smaller, more focused modules?**
  _Cohesion score 0.10668563300142248 - nodes in this community are weakly interconnected._
- **Should `Routing & Hooks` be split into smaller, more focused modules?**
  _Cohesion score 0.11229946524064172 - nodes in this community are weakly interconnected._
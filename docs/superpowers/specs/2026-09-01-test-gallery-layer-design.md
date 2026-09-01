# `/test` Phase 2b: Gallery Layer Design

**Date:** 2026-09-01
**Scope:** Port the Home.js horizontal-scroll project gallery — warped card meshes, hover raycasting, video-on-hover, front/back image+bloom compositing — into `/test`. Titles and text (project name/description as 3D typography) stay on the placeholder textures phase 1/2a already wired; that's explicitly deferred (blocked on an unscraped source component — see "Out of Scope").

**Source of truth:** `static/sites/segerman-dev-86ede42f/root-7944de32/js/home-pretty.txt` (class `D`, the scroller, and class `_`/`B`, the per-card mesh/video wrappers) and `world.js` (`He`/Images layer, `Oe`/Video layer). The per-card image/video fragment shaders live in a chunk not previously scraped — freshly fetched this session via Firecrawl from `https://segerman.dev/_astro/video.BlQOh9uf.js` and confirmed to match the current live build.

**Assets:** 5 projects already downloaded at `static/sites/segerman-dev-86ede42f/root-7944de32/work/{slug}-featured.{webp,mp4}` for `estrela`, `payjustnow`, `vineyard`, `yucca`, `zulik`.

---

## Goal

`/test`'s gallery shows 5 project cards laid out in a horizontal strip, each a curved/warped image plane. Hovering a card raycasts against its (curved) geometry, scales it up, and crossfades its video in over the image. The gallery's image content feeds both the back compositor (immersive, revealed via the fluid cursor trail — matches phase 2a's existing behavior) and the front compositor (visible by default) with the exact dual-render-pass treatment the original uses (different color grading per pass). No click-through navigation (no other routes exist yet), no title/description text (deferred), no Lenis-driven smooth scroll (deferred — see below for the interim substitute).

---

## Section 1 — New shared `Scene` uniforms

`uCurveX`/`uCurveZ` (the warp vertex shader's screen-curvature amount) join `SceneUniforms`, matching `world.js`'s `initUniforms()` values: `uCurveX: 5e-5`, `uCurveZ: 0.01`.

## Section 2 — `Card` (per-project image mesh)

Port of Home.js's class `_` (a `MediaMesh` subclass). A `THREE.PlaneGeometry(1,1,1,1)` mesh using:
- **Vertex shader** `q` — the exact warp/CRT-curve shader from the original bundle (already fully captured in this session's context; verbatim, no extraction needed since it was pasted directly, not sourced from a scraped file — cite `home-pretty.txt`'s `var q=` assignment as the canonical location for the plan to extract from instead of retyping from memory).
- **Fragment shader** `i` (aliased `n` in the freshly-fetched `video.BlQOh9uf.js`) — samples `tMap` with aspect-corrected UVs, branches on `uImageMode` (< 0.5: direct saturation-adjusted color; ≥ 0.5: grain + duotone treatment via `uLightColor`/`uDarkColor`/`uInputBlack`/`uInputWhite`/`uGamma`/`uNoiseSize`/`uNoiseAmount`).
- Texture loaded directly via `THREE.TextureLoader` from the project's `-featured.webp` (copied into `static/textures/segerman-bg/work/`) — the original's lazy MediaMesh/thumbnail-preload system is skipped; a direct load is a reasonable simplification for 5 known, small assets.
- `setActive()`/`setInactive()`: GSAP tween of `uHover` 0↔1 and a slight mesh `scale` bump, matching the original's hover animation (simplified to the "back mode" branch only, since front/back GSAP-timeline branching in the original is for its toggle system, phase 3 scope).

## Section 3 — `VideoCard` (per-project video overlay)

Port of Home.js's class `B`, simplified: the original crossfades a thumbnail→video via `uLoad`; this port skips the thumbnail (no separate thumbnail asset needed) and always shows the video once its `<video>` element is ready, with a `uOffsetY` reveal tween on hover-in (`0` = video visible, matching the original's in/out timeline direction) driven by GSAP, using fragment shader `v` (aliased `e` in `video.BlQOh9uf.js`) with `uLoad` fixed at `1`. Video source: the project's `-featured.mp4` (copied into `static/videos/segerman-bg/work/`), loaded as a muted/looping `<video>` element wrapped in `THREE.VideoTexture`, `play()`/`pause()` called on hover in/out (matches original's `playVideo()`/`pauseVideo()`).

## Section 4 — `Gallery` (scroller orchestrator)

Port of Home.js's class `D`, scoped down:
- Constructs one `Card` + one `VideoCard` per project, grouped under a `THREE.Group`/pivot pair matching the original's `group`/`groupPivot` structure (needed for the mouse-parallax + back-mode 3D repositioning).
- **Horizontal-scroll positioning** (`updateItems`): port verbatim — infinite-wrap modulo layout using a `gap` interpolated between `gapSizes.front` (2.4 units) and `gapSizes.back` (8 units) via `uMode`.
- **Back-mode 3D layout + mouse parallax** (`updateGroup`): port verbatim — the tuned `backState` transform (`rotationY: -0.49, positionX: -5.3, positionZ: -14`, etc.) interpolated by `uMode`, plus the mouse-offset pivot rotation/position scaled by `(1 - uMode)`.
- **Curved-plane hover raycasting** (`handleHover`): port verbatim — this is NOT a standard `THREE.Raycaster` call; it's a custom screen-space bounding-box projection accounting for the warp shader's curve displacement (`uCurveX`/`uCurveZ`), then a closest-hit selection. Complex but the original algorithm is complete and unambiguous; no invention needed.
- **Entrance animation**: a simplified GSAP timeline — `uProgress` 0→1 and `uWarp` 0→1 per card, staggered, matching the original's shape but without the title-stagger lines (titles don't exist yet).
- **Scroll input — interim substitute, documented deviation:** the original drives `updateItems` from `e.scroll.current`, populated by Lenis (phase 5, not built). This phase adds a minimal wheel-event accumulator directly in `Gallery` (`window.addEventListener('wheel', ...)` accumulating into a local `scrollPosition` value, no easing/momentum) purely so the gallery is interactively scrollable now. This gets **replaced**, not layered on top of, when phase 5 adds real Lenis — call this out explicitly in the plan so it's not mistaken for permanent architecture.
- No click-through navigation — `handleClick`'s original behavior (`router.barba.go(href)`) is dropped entirely; hovering still changes cursor style if desired, but clicking does nothing (no routes to go to).

## Section 5 — `Images` layer (port of `He`)

Renders `Gallery`'s card scene **twice** per frame, matching the original's dual-pass structure exactly (this is what makes the gallery visible in both the default front/white view and the fluid-revealed back/immersive view):
1. `uImageMode = 0` → render → blur/bloom-composite (reusing the existing `Blur` utility from phase 1) → `tImagesBack` + `tImagesBackBloom` (replaces two of `Compositor`'s current placeholder bindings).
2. `uImageMode = 1` → render → `tImagesFront` (replaces one of `Front`'s current placeholder bindings) — no bloom pass for this one, matching the original.

## Section 6 — `Video` layer (port of `Oe`)

Renders `Gallery`'s video-card scene once per frame to `tVideo` (replaces the placeholder shared by both `Compositor` and `Front`).

## Section 7 — Wiring

`Front`'s `tImagesFront`/`tVideo` uniforms and `Compositor`'s `tImagesBack`/`tImagesBackBloom`/`tVideo` uniforms switch from `createPlaceholderTexture()` to live reads of the new `Images`/`Video` layers' outputs (same live-read-every-frame pattern already established for `tFluid`/`tFront`/`tPlanetBlur`). `tTitles`/`tTitlesSoft`/`tTitlesBlur`/`tTexts` remain on placeholders — untouched by this phase.

---

## Testing

Same visual-only approach as prior phases. New checklist items: 5 project cards visible in a horizontal strip (front/white default view shows the duotone-graded version; cursor-reveal through the fluid trail shows the direct-color back version with fog/bloom), hovering a card scales it and fades its video in, scroll-wheel moves the strip, `npm run check` clean.

## Out of Scope

- **Titles/Texts** (real project name/description as 3D typography) — blocked on `Meta.BG7jecb1.js` (the `Text`/`SplitText` component) and `content.CFZxyfkA.js` (project copy data), neither scraped nor fetched this session. A future phase should either fetch those chunks via Firecrawl (same method used for `video.BlQOh9uf.js` this session) or substitute a simpler 2D DOM overlay.
- Click-through navigation to project pages (no other routes exist).
- Real Lenis-driven smooth scroll (phase 5) — this phase's wheel-accumulator is an explicitly temporary stand-in, to be removed when phase 5 lands.
- Toggle button, page transitions (phases 3-4, unchanged from prior specs).

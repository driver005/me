# segerman.dev WebGL Background → `/test` (Phase 1) Design

**Date:** 2026-09-01
**Scope:** Port the segerman.dev home-page WebGL background scene (stars, planet, fog, fluid ink, compositor) to a new SvelteKit route `/test`. Gallery/scroller, page-transition burn shader, Barba-style routing, Lenis, and loader intro are explicitly out of scope for this phase.

**Source of truth:** `static/sites/segerman-dev-86ede42f/root-7944de32/js/world.js` (de-minified scrape) and `.../js/home-pretty.txt`. Textures already present at `static/sites/segerman-dev-86ede42f/root-7944de32/textures/{planet.webp,cracked.webp,cracked-normal.webp,noise.png}`.

**Full project context:** this is sub-project 1 of a multi-phase clone (see "Out of scope" below for the rest). Each phase gets its own spec/plan cycle.

---

## Goal

`/test` renders a full-viewport canvas with the same layered scene segerman.dev uses behind its home page: procedural starfield, a terrain-displaced planet with hover-reveal cracks, drifting fbm fog, and a mouse-reactive fluid ink sim, all composited through the original's output shader. No page content, no navigation, no gallery — a working visual + interaction substrate that phase 2 (horizontal-scroll gallery) will build on top of.

---

## Section 1 — Route & Mounting

`src/routes/test/+page.svelte`: minimal shell — a `<canvas>` element, WebGL2-support check (reuse `src/lib/three/dev/webgl.svelte`'s fallback pattern/messaging, not the component itself since it gates children rather than owning a canvas), and `onMount` handing the canvas to the scene controller. `onDestroy`/cleanup disposes the controller. No SvelteKit layout chrome — this route stands alone.

Pattern: raw Three.js in `onMount` + manual rAF loop, matching `src/lib/design/module/spiral.svelte`'s style (canvas ref via `$state`, shaders as imported `.glsl` strings, explicit dispose on unmount). Not Threlte — this is an imperative multi-pass render-target pipeline ported near-1:1 from a class-based original; forcing it through Threlte's reactive scene graph adds friction with no benefit here.

---

## Section 2 — Directory Layout

```
src/lib/three/scenes/segerman-bg/
  scene.ts          — orchestrator (port of world.js `Je`/World): owns renderer, camera,
                       shared uniforms (uTime, uRes, uDpr, uMode), RT registry, resize,
                       per-frame loop calling each layer's render(), dispose()
  fluid.ts           — GPGPU fluid sim (port of `ye`): splat/advect/curl/vorticity/pressure
  stars.ts           — procedural starfield (port of `Ge`)
  fog.ts             — fbm fog layer (port of `Ae`)
  planet.ts          — displaced sphere + hover-crack trail (port of `Le`)
  compositor.ts       — back-render compositor + output shader (ports of `ke` + `Me`)
  blur.ts             — reusable two-pass box blur util (port of `Ce`), used by planet bloom
                        and compositor bloom
  placeholder-textures.ts — 1x1 transparent DataTexture factory for unused compositor inputs

src/lib/shaders/segerman-bg/
  fluid/{splat,advect,curl,vorticity,divergence,pressure,gradient-subtract,clear}/{vertex,fragment}.glsl
  stars/fragment.glsl        (vertex reuses fullscreen-triangle vertex, shared)
  fog/fragment.glsl
  planet/{vertex,fragment}.glsl
  compositor/{back-fragment,output-fragment}.glsl
  common/fullscreen-triangle.glsl   (shared vertex shader for all fullscreen passes)
```

Each `.glsl` file is a straight copy of the corresponding template-string body already visible in `world.js` (variables `Pe`, `me`, `ve`, `fe`, `de`, `he`, `ge`, `pe`, `xe`, `We`, `Ie`, `be`, `Re`, `Se` etc.) — no logic changes, just extraction into files per the project's existing `vite-plugin-glsl` convention (see `src/lib/shaders/smoke/`).

---

## Section 3 — Data Flow

1. `scene.ts` creates one `WebGLRenderer` (alpha, high-performance), a perspective camera, and a registry of `WebGLRenderTarget`s sized by a per-layer scale function (mirrors original's `createRT(scaleFn)` — planet/fog/fluid render at reduced resolution, matching original's dpr-aware downscaling for perf).
2. Each frame (dirty-flag gated, see Section 5): `fluid.update()` → `stars.render()` → `fog.render()` → `planet.render()`, each writing to its own RT.
3. `compositor.ts`'s back-pass samples all of the above RTs plus placeholder textures for `tTitles`/`tTexts`/`tImagesBack`/`tImagesBackBloom`/`tVideo` (phase-2 layers that don't exist yet) into one composited RT.
4. `compositor.ts`'s output pass draws a fullscreen triangle sampling the composited RT to the actual canvas (`setRenderTarget(null)`).
5. Shared uniforms (`uTime`, `uRes`, `uDpr`, `uMode`) live on `scene.ts` and are handed by reference to every layer's material uniforms, same as original's `e.W.uniforms` singleton pattern — avoids per-frame uniform copying.

`uMode` in the original toggles between "front" (DOM/2D-ish, `uMode=1`) and "back" (3D/immersive, `uMode=0`) states via a page-transition button; phase 1 has no such toggle, so `uMode` is a fixed constant (`0` — the immersive state that shows the full 3D scene) rather than an animatable value. Wire it as a real uniform (not inlined) so phase 2's toggle can drive it later without touching this code.

---

## Section 4 — Interactivity

- **Pointer move** (`pointermove` on window, passive): compute normalized delta same as original's `mousemove` handler → push a `fluid.splats` entry (position + velocity-scaled color) each frame movement exceeds a small threshold. Directly ports original's dx/dy-threshold + splat-push logic.
- **Planet hover**: raycast from camera through pointer NDC against the planet mesh (only meaningful once `uMode` implies the 3D view, which is always-true in phase 1). On hit, feed world-space hit point into the planet's trail render-target (ping-pong stamp + decay, port of the original's `trailMaterial`/`uMouseUV`/`uActive` uniforms) which drives the crack-reveal mix in the planet fragment shader.
- No click/tap behavior in phase 1 (no navigation target exists yet).

---

## Section 5 — Perf / Render Loop

Port the original's `dirty()`/`needsRender` pattern per layer (`B` base class in `world.js`): a layer only re-renders when explicitly marked dirty (resize, uniform change) or every frame if it's inherently animated (fluid, stars twinkle/shooting stars, fog drift, planet rotation-on-scroll — phase 1 has no scroll, so planet idle-rotates slowly instead). This avoids the original's full always-on 60fps cost for layers that don't need it, matching the source architecture rather than simplifying it away.

DPR handling: clamp to `min(devicePixelRatio, 2)`, expose `isLowDpr` (`devicePixelRatio <= 1.5`) same as original, used to drop fog/planet blur pass counts on low-power devices.

---

## Section 6 — Error Handling

- WebGL2 unavailable → same fallback UI pattern as `src/lib/three/dev/webgl.svelte` (message + link to get.webgl.org), rendered by the route itself since this route owns its own canvas lifecycle.
- Texture load failure (404/decode error) → caught per-load, logged, layer proceeds with a flat placeholder color rather than throwing (matches original's `.catch(()=>t())` swallow-and-continue pattern in `initTextures`).
- `scene.ts.dispose()` must tear down every RT, geometry, material, and the renderer itself on route unmount (SvelteKit client-side nav will otherwise leak GL contexts) — mirrors original's per-layer `destroy()` methods.

---

## Section 7 — Testing

Visual/manual only — no unit tests for GLSL correctness. Verification checklist for phase-1 completion:
1. `/test` loads, canvas fills viewport, no WebGL context errors in console.
2. Stars + planet + fog visible, planet idle-rotates, fog drifts.
3. Moving the pointer produces a visible fluid ink trail that fades (decay).
4. Hovering the planet reveals crack texture at the cursor's projected hit point, fading out after hover ends.
5. Resize (including DPR change, e.g. moving window between displays) doesn't break render target sizing or leave stale content.
6. Navigating away from `/test` and back doesn't leak GL contexts (check `renderer.info` / browser task manager doesn't show growing WebGL context count across repeated visits).

Use the `run` skill or Playwright to load `/test` and screenshot for visual confirmation once implemented.

---

## Out of Scope (later phases)

- Phase 2: horizontal-scroll project gallery (`D` class in `home-pretty.txt`) — card mesh warp vertex shader, raycast hover/click, GSAP entrance timeline, titles/text/image/video compositor layers (`tTitles`, `tTexts`, `tImagesBack`, `tVideo`) that phase 1 currently stubs with placeholder textures.
- Phase 3: Barba-style page-transition burn shader, `uMode` front/back toggle wiring, multi-route navigation.
- Phase 4: Lenis smooth-scroll integration, loader intro sequence, full site chrome.

Each gets its own brainstorming → spec → plan cycle when started.

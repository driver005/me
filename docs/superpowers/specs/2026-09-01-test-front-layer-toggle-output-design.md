# `/test` Phase 2a: Front/DOM Layer + Real Output Toggle Design

**Date:** 2026-09-01
**Scope:** Replace phase 1's flat-white output hack with the real front↔back compositor system: a `Front` layer (port of `De`/`Fe`), and a rewrite of `Compositor`'s output stage to the real `be`/`Me` shader (front/back wipe + fluid-reveal), trimmed of transition-only and toggle-only machinery (phases 3-4). No toggle button UI yet — `uMode` becomes a real, wired value but stays at its correct **default** rather than phase 1's placeholder fixed value.

**Correction to the phase-1 spec's `uMode` note:** phase 1 fixed `uMode=0` to force the immersive 3D scene always visible, since no front layer existed yet — a reasonable phase-1-only choice. Re-reading the original source's `initSite()` (`m.isBackMode=!1`) and `World`'s `initUniforms()` (`uMode:{value:1}`), **the real site's default state is `uMode=1` (front/white), `isBackMode=false`** — the 3D scene is normally hidden behind the white page and only shown via the fluid-cursor-trail peek (always active) or an explicit toggle (phase 3, not built yet). This phase corrects the default to `uMode=1` to match. Since phase 1's own `Compositor.backMaterial` uniform `uMode` is a **shared reference** to `scene.uniforms.uMode` (not a duplicated value), changing `Scene`'s default in one place propagates correctly to `Stars`/`Fog`/`Planet`/`Compositor` all at once — confirm this during implementation, don't hardcode `uMode` anywhere else.

---

## Section 1 — `Front` layer (port of `De`/`Fe`)

New file `src/lib/three/scenes/segerman-bg/front.ts`, following the same `Layer`-subclass pattern as `Stars`/`Fog`/`Planet`. Constructor uniforms per the original `De` (search `world.js` for `this.scale=()=>e.dpr,this.rt=e.W.createRT(this.scale)` — the anchor right before `class De extends B`): `tTitles`, `tTexts`, `tImagesFront`, `tVideo` (all four bound to phase-1's `createPlaceholderTexture()` for now — phase 2's gallery build will replace them with real content later without touching this file), `uTime` (shared `scene.uniforms.uTime`), `uRes` (shared), `uTextColor` (`#00031F`, black — the "base.black" original color), `uLabelColor` (`#93949F`, grey — "base.grey"), `uBgOffset` (fixed at `1`, not animated — this is the intro-loader reveal-width; phase 1/2a has no loader, so bake in the finished/settled value).

Fragment shader: search `world.js` for the anchor `vec4 bg = vec4(1., 1., 1., bgMask);` and copy the enclosing template literal (`Fe`) verbatim into `src/lib/shaders/segerman-bg/front/fragment.glsl`. Vertex shader: reuse `common/fullscreen-triangle.glsl` (GLSL1-style, matches `Fe`'s `varying`/`texture2D` syntax — same family as Stars/Fog/Planet/Compositor, not the GLSL3 fluid family).

RT: single render target via `scene.createRenderTarget(scene.dpr)` (matches original's `this.scale=()=>e.dpr`).

`Front extends Layer`, always-render `loop()` override (matches the established Task 6 convention — cheap to render, and the eventual toggle/gallery content will need it live every frame).

Public surface: `get texture(): THREE.Texture`, `render()`, `dispose()`.

---

## Section 2 — Real Output shader (replace phase 1's passthrough)

Extract the full `be` template literal from `world.js` (search anchor: `uniform sampler2D tFront;` — this is unique to `be`, unlike the ambiguous anchors used for the back-compositor's `Re`/`Se` pair) into `src/lib/shaders/segerman-bg/compositor/output-fragment.glsl`, **replacing** the phase-1 hand-written passthrough (including the fluid-reveal fix from the previous session — that logic is a subset of what `be` already does correctly, `edgeFront * fluidMask`, so this extraction supersedes it, not adds to it).

Trim these phase-3/4-only pieces after extraction (all are inert at their default values today, but keeping dead uniform plumbing around is confusing — strip them; re-add each in the phase that actually needs it):
- `uToggleCoords`/`uToggleProgress` and the whole `if (uToggleProgress * uMode > 0.0) { ... }` block (phase 3 — toggle button doesn't exist).
- `tTransFront`/`tTransBack`/`uTransAlpha`/`uFinalAlpha`/`uBgOffset` (the compositor's own, separate from `Front`'s `uBgOffset`) and the `if (uFinalAlpha < 1.0) { ... } else { color = final.rgb; }` branch — collapse to just `color = final.rgb;` unconditionally (phase 4/5 — no loader, no transition-capture textures exist).
- `uWarp`/`uProgressFront`/`uProgressBack`/`uDirection` and the `if (warp > 0.0) { ... }` chroma-warp block — collapse to the `else` branch unconditionally (`back = texture2D(tBack, uv); front = texture2D(tFront, uv);`) since phase 4 (page transitions) is what animates these; at their defaults (`uWarp=0`) the `if` branch never ran anyway.

**Keep:** the `edgeFront` computation (it still needs `uTime`/`uIsTouch` and the `snoise` noise helpers even simplified, since it's what keeps the front/back wipe edge stable — verify it still evaluates to ≈1 across the screen with `uProgressFront`/`uProgressBack` no longer present as uniforms; if trimming those uniforms breaks the formula, hardcode their former default (`0.0`) directly into the simplified expression rather than leaving dangling references), the `fluidMask` computation, and `final = mix(back, front, edgeFront * fluidMask)`.

Rewire `compositor.ts`'s `outputMaterial`: uniforms become `tFront` (from the new `Front` layer's `.texture`, live-read every `render()` call same as `tFluid` already is — `Front`'s output is a plain RT like Stars/Fog, not ping-pong, so a one-time reference would actually be safe as established in phase 1, but match the fluid pattern for consistency and because Section 1 leaves room for `Front` to later gain animated/ping-pong content), `tBack` (already wired), `tFluid` (already wired), `uRes`/`uTime`/`uIsTouch` (shared `scene.uniforms`, add `uIsTouch` to `SceneUniforms` if it isn't already there — check `scene.ts` first, phase 1 may not have needed it).

---

## Section 3 — `Scene` default `uMode`

In `scene.ts`, change the `uMode` initial value from `0` to `1` in the constructor's `uniforms` object. This is the only place it's set — every consumer (`Stars`, `Fog`, `Planet`, `Compositor.backMaterial`) already reads the shared reference, so this one-line change is the entire fix. Verify none of those four files independently re-set or hardcode `uMode` anywhere (they shouldn't, per phase 1's design, but confirm during implementation).

Note the ripple effect this correctly has on existing, already-shipped code: `Re`/back-fragment's `col = mix(backCol, frontCol, uMode)` (phase 1, `compositor/back-fragment.glsl`) will now default to `frontCol`-leaning instead of `backCol`-leaning, and `Stars`' `modeBoost = mix(1.0, uFrontBoost, uMode)` will use `uFrontBoost` (1.3) instead of `1.0`. Both are correct — this is the real site's actual default styling, which phase 1 approximated backwards for lack of a front layer to make it meaningful.

---

## Section 4 — Wiring in the route

In `src/routes/test/+page.svelte`: construct `Front` alongside the existing four layers, `scene.addLayer(front)`, pass it into `Compositor`'s constructor (extend `CompositorLayers` to include `front: Front`), dispose it in `onDestroy` (already covered generically since `scene.dispose()` iterates all registered layers — confirm `front` gets `scene.addLayer()`'d like the others).

---

## Testing

Same visual-only approach as phase 1 (spec's original Section 7, still standing). New checklist items: `/test` loads showing a mostly-white/light view by default (not the full immersive 3D scene phase 1 showed), moving the pointer reveals the 3D scene underneath through the fluid trail exactly as before (visually this should look similar to the post-fix phase-1 state, now for the structurally-correct reason), no console errors, `npm run check` clean.

## Out of Scope (unchanged from the original spec, renumbered)

- Phase 2: Gallery layer (Titles/Texts/Images/Video real content — `Front`'s uniforms stay on placeholders until this lands).
- Phase 3: Toggle button UI + `uToggleCoords`/`uToggleProgress` blob-peek (re-added to the output shader then).
- Phase 4: Page-transition burn shader + warp/chroma morph (re-added to the output shader then).
- Phase 5: Lenis smooth scroll, Barba routing, loader intro (and the `uFinalAlpha`/loader-reveal alpha logic this phase strips).

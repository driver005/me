# `/test` Phase 3: Toggle Button Design

**Date:** 2026-09-02
**Scope:** Add the front/back mode toggle button — clicking it tweens the shared `uMode` uniform between `1` (front/white, current default) and `0` (back/immersive), with a circular "blob" reveal window effect synced to the transition, and swaps the fluid-cursor trail's feel to match the destination mode.

**Source of truth:** `static/sites/segerman-dev-86ede42f/root-7944de32/js/world.js` — the output compositor shader `be` (class `Me`, byte offset ~13847, full `uToggleCoords`/`uToggleProgress` block already extracted and quoted below) and `Je`'s `initFluid()`/`onToggleStart()` (front/back fluid dissipation settings). The toggle button's own source component (whatever rendered `.toggle` in the original's nav) was never present in any scraped or fetched chunk this session — no markup, no click-handler class was found searching `app.js`, `world.js`, or `home-pretty.txt`. The button UI and its click-handler are therefore new code, not a port, informed by the *effects* it must trigger (which are fully sourced).

---

## Goal

A small always-visible button that toggles the background between its two states:
- **Front (`uMode = 1`):** white/neutral, current default since phase 2a.
- **Back (`uMode = 0`):** the immersive 3D scene (stars/fog/planet, gallery cards in their curved 3D layout), the state built in phase 1.

Clicking it plays a ~1.2s transition: `uMode` tweens to the target value, a circular window expands from the button's screen position revealing the destination state's back-texture content early, and the cursor-following fluid trail's size/decay swaps to match the destination mode's feel (bigger and stickier in back mode, tighter and quicker in front mode).

---

## Section 1 — `Toggle` component (new)

A new Svelte component, `src/lib/components/sites/segerman/Toggle.svelte` (co-located with the route's other segerman-bg pieces), rendered inside `src/routes/test/+page.svelte` alongside the canvas. Fixed-position button (bottom-right corner, simple pill/circle — no source markup exists to port, so this is a minimal functional element: visible, clickable, indicates current state via text or a simple icon swap). It owns:
- `isBackMode: boolean` — local state, starts `false` (matches `uMode`'s existing default of `1`/front).
- A click handler that:
  1. Reads its own `getBoundingClientRect()` to compute a UV-space coordinate (`x = (rect.left + rect.width/2) / window.innerWidth`, `y = 1 - (rect.top + rect.height/2) / window.innerHeight`) and writes it into a shared `uToggleCoords` uniform (`THREE.Vector2`).
  2. Flips `isBackMode`, computes the target `uMode` value (`isBackMode ? 0 : 1`).
  3. Kills any in-flight toggle timeline, starts a new GSAP timeline (duration `1.2s`, `power2.inOut`) that tweens `scene.uniforms.uMode.value` to the target and, in parallel, tweens a shared `uToggleProgress` uniform `0 → 1` over the same duration, then immediately sets it back to `0` on completion (`onComplete`).
  4. Calls `fluid.setMode(isBackMode)` (Section 3) once, at the start of the tween (matches the original's `onToggleStart()` firing at transition start, not end).

`uToggleCoords` and `uToggleProgress` are two new uniforms added to `SceneUniforms` (alongside the existing `uMode`/`uCurveX`/`uCurveZ` pattern from earlier phases) so `Compositor`'s output material can read them by shared reference — the same live-shared-uniform convention already established.

## Section 2 — Blob-reveal shader (port, `output-fragment.glsl`)

Port the `be` shader's toggle block verbatim into the existing `output-fragment.glsl` (which already implements a reduced form of `be` — the fluid-reveal crossfade — from phase 2a). Add uniforms `uRes` (not yet present in this file — new), `uToggleCoords`, `uToggleProgress`, and this block after the existing `final = mix(back, front, edgeFront * fluidMask);` line:

```glsl
if (uToggleProgress * uMode > 0.0) {
    float aspect = uRes.x / uRes.y;
    vec2 toToggle = vUv - uToggleCoords;
    toToggle.x *= aspect;
    float distToToggle = length(toToggle);

    float blobRadius = (0.085 + n * 0.014) * uToggleProgress * uMode;
    float toggleMask = 1.0 - smoothstep(blobRadius - 0.001, blobRadius + 0.001, distToToggle);

    vec2 windowUV = uv0 + n * 0.0015 * toggleMask;
    float windowChroma = toggleMask * 0.001 + n * .0001;
    vec4 windowBack = vec4(
        texture2D(tBack, windowUV + vec2(windowChroma, 0.0)).r,
        texture2D(tBack, windowUV).g,
        texture2D(tBack, windowUV - vec2(windowChroma, 0.0)).b,
        1.0
    );

    final = mix(final, windowBack, toggleMask);
}
```

(`n` is already computed earlier in the existing shader; the original's `be` shader has a separately-warped `uv` variable that this port's simplified `output-fragment.glsl` never introduced — phase 2a's port only kept `uv0`, since the warp-bulge block that would produce a distinct `uv` is itself out-of-scope route-transition machinery. Use `uv0` in place of `uv` throughout this block. `vUv` and `tBack` already exist in the file.) `Compositor`'s `outputMaterial` uniforms gain `uRes: scene.uniforms.uRes` (shared, matches the `uTime`/`uIsTouch` pattern already there), `uToggleCoords: scene.uniforms.uToggleCoords`, `uToggleProgress: scene.uniforms.uToggleProgress`.

## Section 3 — Fluid dissipation mode swap (port, `fluid.ts`)

`FluidSim`'s three dissipation constants and its max-radius constant are currently fixed module-level constants that happen to equal the *original's back-mode values* (`DENSITY_DISSIPATION = 0.83`, `VELOCITY_DISSIPATION = 0.9`, `PRESSURE_DISSIPATION = 0.97`, `MAX_RADIUS = 16`) — a leftover from phase 1, when `uMode` briefly defaulted to `0`/back before phase 2a corrected the default to `1`/front. This phase makes them mutable instance fields with a front/back pair, defaulting to **front** (matching the current `uMode` default):

```typescript
const DISSIPATION = {
	front: { density: 0.73, velocity: 0.98, pressure: 0.7, maxRadius: 6 },
	back: { density: 0.83, velocity: 0.9, pressure: 0.97, maxRadius: 16 }
};
```

Add `setMode(isBackMode: boolean): void` to `FluidSim`, called once by `Toggle`'s click handler at transition start:

```typescript
setMode(isBackMode: boolean): void {
	const preset = isBackMode ? DISSIPATION.back : DISSIPATION.front;
	this.densityDissipation = preset.density;
	this.velocityDissipation = preset.velocity;
	this.pressureDissipation = preset.pressure;
	this.maxRadius = preset.maxRadius;
}
```

The three `DENSITY_DISSIPATION`/`VELOCITY_DISSIPATION`/`PRESSURE_DISSIPATION` module constants and their three use-sites (`clearMaterial`'s initial uniform, and the two `.value =` assignments in the density/velocity advection passes) switch to reading `this.densityDissipation`/`this.velocityDissipation`/`this.pressureDissipation` instead — initialized in the constructor from `DISSIPATION.front`. `MAX_RADIUS`'s one use-site (`updateRadiusFromSpeed`) switches to `this.maxRadius`.

## Section 4 — Wiring

`src/routes/test/+page.svelte`: import and render `<Toggle scene={scene} fluid={fluid} />`, passed only once `scene`/`fluid` are non-null (inside the `{#if scene && fluid}` guard, or an equivalent null check — both are assigned inside `onMount`, so the component mounts only after WebGL init succeeds). `Toggle` takes two props, `scene: Scene` and `fluid: FluidSim`, and writes to `scene.uniforms.uToggleCoords`/`uMode`/`uToggleProgress` and calls `fluid.setMode()` directly — no additional prop plumbing needed. `Compositor`'s `outputMaterial` uniform block gains the three new uniforms per Section 2.

---

## Testing

Visual-only, same approach as prior phases: click the toggle, confirm `uMode` visibly crossfades between the white front view and the immersive back view over ~1.2s, confirm a circular window briefly reveals the destination content expanding from the button's position, confirm the fluid cursor-trail feels bigger/stickier immediately after switching to back mode and tighter/quicker immediately after switching to front mode. `npm run check` clean.

## Out of Scope

- Render-gating (`dirty()`/`needsRender` optimization) — this port renders every layer unconditionally every frame, an established convention from phases 1–2b; explicitly kept as-is per this phase's own scoping decision.
- `isToggleTransitioning`-gated `uSpeed` writes on `Card` — this port doesn't drive `uSpeed` at all yet (parked as a Minor finding in phase 2b's final review); nothing to gate.
- Page-transition machinery in the same shader (`uFinalAlpha`/`uTransAlpha`/`uBgOffset`, the warp-bulge `if (warp > 0.0)` block) — route-transition-specific, no other routes exist (phase 4/5 scope, unchanged).
- `Gallery`'s `onToggleStart`/`onToggleEnd` scroll-position locking — the original snaps/locks the scroll position during the transition to prevent a discrete layout jump from the front/back gap sizes differing; this port's `updateItems()` already interpolates the gap continuously via `uMode` every frame (`lerp(GAP_BACK, GAP_FRONT, uMode)`), so there is no discrete jump to guard against.
- Toggle button visual design fidelity to the original — no source markup was ever captured; the button built here is new, minimal, functional UI.

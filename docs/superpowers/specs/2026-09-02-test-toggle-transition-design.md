# `/test` Phase 3.5: Toggle Real Transition Design

**Date:** 2026-09-02
**Scope:** Replace phase 3's simplified toggle behavior with the real, fully-sourced mechanism: a genuine fullscreen front/back crossfade wipe (not just the fluid trail + blob), a warp/chroma flash, a transition-in-flight guard, hover-driven (not click-driven) blob-peek, and a real 3D crescent-icon mesh for the button instead of plain DOM chrome.

**Source of truth:** `https://segerman.dev/_astro/Meta.BG7jecb1.js`, fetched fresh this session via Firecrawl (confirmed current build — `Layout.astro_astro_type_script_index_0_lang.BYGFA18R.js`'s import of `app.8ySn1L4n.js` matches the hash already cited by every prior phase this session). Contains: class `Ha extends ft` (the real toggle component, full click/hover handlers, quoted verbatim below), class `Ur extends ft` (the DOM-position-synced mesh wrapper base class), and the shader `Va` (the crescent-icon fragment shader). Also re-confirms `output-fragment.glsl`'s full source (`be` in `world.js`, already fully captured in phase 3's spec) for the `uProgressFront`/`uProgressBack`/`uDirection`/`uWarp` block this phase finally wires up.

**Relationship to phase 3:** additive/corrective, not a rewrite. `Toggle.svelte`, the shared uniforms it already introduced (`uToggleCoords`, `uToggleProgress`), `FluidSim.setMode()`, and the existing blob-reveal shader block all stay — this phase changes *when* `uToggleProgress` is driven (hover, not click) and adds the uniforms/shader work that make `uMode` actually crossfade the screen, which phase 3's final review flagged as missing.

---

## Goal

Clicking the toggle produces the real transition: the white front plate wipes away directionally (not just via the cursor trail), a brief screen-warp/chroma glitch accompanies it, and a second click can't be queued mid-transition. Hovering the button (not clicking) previews the destination state through a small porthole. The button itself is a small 3D crescent-moon icon — DOM-position-synced, screen-space — rather than plain HTML chrome.

---

## Section 1 — Real crossfade wipe

**New shared uniforms** (`SceneUniforms`, alongside `uToggleCoords`/`uToggleProgress`): `uDirection: { value: 0 }`, `uProgressFront: { value: 0 }` (default `0`, not the naive guess of `1` — see Section 3 for why).

**`output-fragment.glsl`** — replace the current fixed-edge crossfade with the real, direction-aware one. Current:

```glsl
float axis = mix(uv0.y, uv0.x, uIsTouch);
float t = axis;
...
float edgePosFront = -0.05 + n * 0.05;
float edgeFront = smoothstep(edgePosFront - 0.02, edgePosFront + 0.01, t);
```

Becomes (quoted verbatim from `be`, `world.js`):

```glsl
float axis = mix(uv0.y, uv0.x, uIsTouch);
float altAxis = mix(uv0.x, uv0.y, uIsTouch);
float t = mix(axis, 1.0 - axis, uDirection);

float x = altAxis * 2.0 - 1.0;
float arc = sqrt(max(0.0, 1.0 - x*x));
float dirSign = mix(-1.0, 1.0, uDirection);

float bulgeMaskFront = smoothstep(0.0, 0.9, uProgressFront) * (1.0 - smoothstep(0.1, 1.0, uProgressFront));
float tFrontEdge = t + dirSign * arc * 0.3 * bulgeMaskFront;
float edgePosFront = mix(mix(-0.05, -0.3, uDirection), mix(1.3, 1.05, uDirection), uProgressFront) + n * 0.05;
float edgeFront = smoothstep(edgePosFront - 0.02, edgePosFront + 0.01, tFrontEdge);
```

New uniforms `uDirection`/`uProgressFront` added to the file's uniform block, and wired into `Compositor.outputMaterial` by shared reference (same pattern as `uMode`/`uToggleCoords`).

## Section 2 — Warp/chroma flash

Port the `if (warp > 0.0) {...}` block verbatim (quoted in full in phase 3's spec, Section 2 — re-cited here since it wasn't ported then):

```glsl
vec2 uv = uv0;
vec4 back;
vec4 front;

if (warp > 0.0) {
    float bulgeMaskBack = smoothstep(0.0, 0.9, uProgressBack) * (1.0 - smoothstep(0.1, 1.0, uProgressBack));
    float tB = t + dirSign * arc * 0.3 * bulgeMaskBack;
    float edgePosBack = mix(mix(-0.05, -0.3, uDirection), mix(1.3, 1.05, uDirection), uProgressBack) + n * 0.05;
    float edgeBandBack = smoothstep(0.4, 0.0, abs(tB - edgePosBack));

    uv += (n * 0.3) * (edgeBandBack * 0.4 * warp);
    float chroma = edgeBandBack * 0.02 * warp;

    vec2 rUV = uv + vec2(chroma, 0.0);
    vec2 bUV = uv - vec2(chroma, 0.0);

    back = vec4(texture2D(tBack, rUV).r, texture2D(tBack, uv).g, texture2D(tBack, bUV).b, texture2D(tBack, uv).a);
    front = vec4(texture2D(tFront, rUV).r, texture2D(tFront, uv).g, texture2D(tFront, bUV).b, texture2D(tFront, uv).a);
} else {
    back = texture2D(tBack, uv);
    front = texture2D(tFront, uv);
}
```

This replaces the file's current unconditional `vec4 back = texture2D(tBack, uv0); vec4 front = texture2D(tFront, uv0);` lines (`uv` takes over from `uv0` as the sample coordinate from here on, matching the original — this is the "warped `uv`" phase 2a/3's specs both noted this file never introduced; it's introduced here, in this exact block, for the first time). `warp` is declared at the top of `main()` as `float warp = uWarp;` (also new). Two more new shared uniforms: `uWarp: { value: 0 }`, `uProgressBack: { value: 0 }` (default `0`, matching `uProgressFront`'s reasoning in Section 3).

## Section 3 — `Toggle.svelte`: real click timeline

Quoted verbatim from `Ha`'s click handler (`Meta.BG7jecb1.js`), adapted to this port's variable names:

```js
u.to(scene.uniforms.uMode, {value: isBackMode?0:1, duration:.8, ease:"power3.out"}, 0);
u.set(scene.uniforms.uDirection, {value: isBackMode?0:1}, 0);
u.fromTo(scene.uniforms.uWarp, {value:0}, {value:1, duration:.05, ease:"none"}, 0);
u.to(scene.uniforms.uWarp, {value:0, duration:.5, ease:"none"}, .4);
u.fromTo(scene.uniforms.uProgressFront, {value: isBackMode?0:1}, {value: isBackMode?1:0, duration:3.2, ease:"power4.out"}, 0);
u.fromTo(scene.uniforms.uProgressBack, {value: isBackMode?0:1}, {value: isBackMode?1:0, duration: isBackMode?3.3:3, ease:"power4.out"}, 0);
u.add(() => { isToggleTransitioning = false; }, 1.2);
```

(`isBackMode` here is the already-flipped, destination-state boolean — same convention `Toggle.svelte` already uses. The source's `duration:(I.isBackMode,3.2)` for `uProgressFront` is a minifier artifact of JS's comma operator — `I.isBackMode` is evaluated and discarded, the duration is unconditionally `3.2`; transcribe it as the literal `3.2`, not as a ternary.)

This **replaces** phase 3's existing `timeline.to(scene.uniforms.uMode, ...)`/`timeline.to(scene.uniforms.uToggleProgress, ...)` pair — `uToggleProgress` is no longer touched by the click handler at all (Section 5 moves it to hover). The `uMode` tween's duration changes from phase 3's invented `1.2s power2.inOut` to the real `0.8s power3.out`. `uToggleCoords` is still set the same way phase 3 already does it (unchanged — the original toggle mesh doesn't need per-click coordinate updates since it doesn't move, but the shared blob-reveal shader still keys off a fixed screen point, and Section 5's DOM-synced mesh gives us a natural anchor to read that point from, same as phase 3's own button `getBoundingClientRect()`).

**`isToggleTransitioning` guard**, a local `let` in `Toggle.svelte`: click handler returns immediately if `true`; set `true` right after the guard check (before anything else runs), reset `false` by the timeline's final `.add(...)` at `1.2`.

**Why `uProgressFront`/`uProgressBack` default to `0`:** at `uProgressFront = 1`, `edgePosFront` moves to `mix(1.3, 1.05, uDirection)` — off past `1.0`, so `edgeFront` is `0` everywhere, meaning `final = back` — i.e. **fully immersive**. Since `uMode` defaults to `1` (front, this port's existing idle state), a default of `1` for `uProgressFront` would contradict `uMode` at rest, showing the back scene fullscreen before any toggle ever fires. The original's true idle-state default for these two uniforms was not conclusively resolvable from the fetched chunks (the initial page-load state runs through a different, non-toggle code path — the router's `once()` transition, out of scope here). This spec makes the pragmatic choice consistent with `uMode`'s existing default: **`0`**, not `1` — at `0`, `edgePosFront = mix(-0.05, -0.3, uDirection)`, near the bottom of the screen, giving `edgeFront ≈ 1` almost everywhere, i.e. **front visible**, matching `uMode`'s default of `1`/front and this port's existing idle-state visual (white plate, revealed only by the fluid trail). This is a deliberate deviation from a literal reading of the source — flagged explicitly rather than silently guessed.

## Section 4 — `Texts` layer + toggle mesh

**New file `src/lib/three/scenes/segerman-bg/texts.ts`** — a minimal single-mesh layer, not the full title/typography system (still out of scope — no project titles, no `SplitText`). Renders one small `THREE.Scene` containing the toggle icon mesh to an RT, replacing the `tTexts` placeholder already wired (as a placeholder) in both `Front` and `Compositor` since phase 1.

**Toggle mesh** (`ToggleIcon` class or inlined into `Texts` — implementer's call, single small mesh doesn't need its own file): a `THREE.PlaneGeometry(1,1,1,1)` with the crescent-icon fragment shader, quoted verbatim (`Va`, `Meta.BG7jecb1.js`):

```glsl
varying vec2 vUv;
uniform float uMode;
uniform float uRadius;
uniform float uSize;
uniform float uProgress;
uniform vec3 uColor;
uniform float uOffset;

void main() {
    vec2 uv = vUv;
    uv.y += uOffset;

    float r = uRadius * .95;
    float r2 = uRadius * uSize;
    float x = mix(.9, -.9, uProgress);
    float y = mix(1., -1., uProgress);
    vec2 offset = vec2(x, y);
    offset *= r2;

    float feather = 0.025;
    vec2 p = uv - 0.5;

    float d1 = length(p);
    float d2 = length(p - offset);

    float c1 = 1.0 - smoothstep(r - feather, r + feather, d1);
    float c2 = 1.0 - smoothstep(r2 - feather, r2 + feather, d2);

    float inside = step(0.0, uv.y) * (1.0 - step(1.0, uv.y));
    float alpha = clamp(c1 - c2, 0.0, 1.0) * inside;

    vec3 col = uColor;
    gl_FragColor = vec4(col, alpha);
}
```

(`uProgress2`/`uOffset`-driven reveal-on-load animation from the source are dropped — `uOffset` stays fixed at `0`, no load-in tween, matching this port's existing convention of skipping load-in choreography for phase-1-era elements. `uMode` uniform is declared but unused by this shader — kept for source fidelity, harmless.)

Uniforms: `uMode: scene.uniforms.uMode` (shared, unused but present), `uColor: { value: new THREE.Color('red') }` (matches source literally — only its `.r` channel is ever read downstream, by `Front`/`Compositor`'s existing `getTextsRGB`/`typeColor` tinting logic, so the exact hue is inconsequential; kept as-is rather than "corrected" to white, for fidelity), `uRadius: { value: 0.5 }`, `uSize: { value: 0.44 }`, `uProgress: { value: isBackMode ? 1 : 0 }` (mirrors the shared `isBackMode` boolean `Toggle.svelte` already tracks), `uOffset: { value: 0 }`.

**DOM-position sync:** the mesh's world position/scale is derived from a DOM anchor element's `getBoundingClientRect()` every frame the anchor might have moved (resize), using the camera-fov/z world-unit conversion:

```typescript
const fovRad = (camera.fov * Math.PI) / 180;
const heightAtZ = 2 * Math.tan(fovRad / 2) * camera.position.z;
const widthAtZ = heightAtZ * camera.aspect;

function syncMeshToRect(mesh: THREE.Mesh, rect: DOMRect, scaleMultiplier: number): void {
	const w = (rect.width / window.innerWidth) * widthAtZ * scaleMultiplier;
	const h = (rect.height / window.innerHeight) * heightAtZ * scaleMultiplier;
	mesh.scale.set(w, h, 1);
	mesh.position.x = (rect.left / window.innerWidth) * widthAtZ - widthAtZ / 2 + w / 2;
	mesh.position.y = -((rect.top / window.innerHeight) * heightAtZ - heightAtZ / 2) - h / 2;
}
```

(Ported from `Ur.update()`'s math, simplified — this port has no touch-scroll offset to subtract since there's no Lenis scroll on `<body>`.) `Scene` gains a `get widthAtZ()`/`get heightAtZ()` pair (derived once in the constructor and on resize, alongside the existing `resize()` method's other derived values) so `Texts` doesn't recompute the camera math independently.

**`Toggle.svelte` changes:** the visible DOM `<button>` becomes invisible chrome (keeps the click target and hit area, loses its background/text — `class="fixed right-6 bottom-6 z-10 h-11 w-11 rounded-full"`, no visible fill), and the icon that used to be the button's text is now this mesh, rendered via the `Texts` layer and composited into the scene through the existing `tTexts` binding. `Toggle` reads the button's `getBoundingClientRect()` (already does, for `uToggleCoords`) and additionally passes it to the mesh sync — the cleanest wiring is `Toggle` calling `texts.syncButtonRect(rect)` (position/base-scale only) on mount and on window resize, rather than `Texts` reading the DOM itself — keeps `Texts` DOM-agnostic. The hover-driven scale multiplier (Section 5's `iconScaleTarget` tween, 1↔1.4) is a separate, independent concern layered on top of this base scale — it doesn't re-run `syncButtonRect`, it just multiplies whatever `syncButtonRect` already set.

## Section 5 — Hover-driven blob-peek + icon hover animation

**The mouseenter/mouseleave dispatch is inverted by mode** — `in()`/`out()` name the icon's own animation direction (crescent "opening" vs "closing"), not literally "mouse entered/left"; which one plays on enter vs. leave flips depending on `isBackMode`. Quoted verbatim:

```js
// mouseenter:
isBackMode ? handleOut() : handleIn();
// mouseleave:
isBackMode ? handleIn() : handleOut();
```

`handleIn()`/`handleOut()` (`Ha.in()`/`Ha.out()`), quoted verbatim in full — **note both start with two unconditional lines** (a `uProgress` tween and a `uSize` "pop" pulse that runs the same regardless of mode) **before** the mode-conditional branch:

```js
// handleIn():
hoverTl?.kill();
hoverTl = gsap.timeline();
hoverTl.to(iconMaterial.uniforms.uProgress, { value: 1, duration: .8, ease: "power3.inOut" }, 0);
hoverTl.to(iconMaterial.uniforms.uSize, { value: 0.95 /* size.full */, duration: .4, ease: "power3.in" }, 0);
hoverTl.to(iconMaterial.uniforms.uSize, { value: 0.44 /* size.base */, duration: .4, ease: "power3.out" }, .4);
if (isBackMode) {
	hoverTl.to(scene.uniforms.uToggleProgress, { value: 0, duration: .4, ease: "power3.out" }, 0);
	hoverTl.to(iconScaleTarget, { value: 1 /* scale.base */, duration: .8, ease: "power3.out" }, 0);
} else {
	hoverTl.to(scene.uniforms.uToggleProgress, { value: 1, duration: .4, ease: "power3.out" }, 0);
	hoverTl.to(iconScaleTarget, { value: 1.4 /* scale.hover */, duration: .8, ease: "power3.out" }, 0);
}

// handleOut(): identical structure, different values —
hoverTl?.kill();
hoverTl = gsap.timeline();
hoverTl.to(iconMaterial.uniforms.uProgress, { value: 0, duration: .8, ease: "power3.inOut" }, 0);
hoverTl.to(iconMaterial.uniforms.uSize, { value: 0.95 /* size.full */, duration: .4, ease: "power3.in" }, 0);
hoverTl.to(iconMaterial.uniforms.uSize, { value: 0.44 /* size.base */, duration: .4, ease: "power3.out" }, .4);
if (isBackMode) {
	hoverTl.to(scene.uniforms.uToggleProgress, { value: 1, duration: .8, ease: "power3.out" }, 0);
	hoverTl.to(iconScaleTarget, { value: 1.4 /* scale.hover */, duration: .8, ease: "power3.out" }, 0);
} else {
	hoverTl.to(scene.uniforms.uToggleProgress, { value: 0, duration: .4, ease: "power3.out" }, 0);
	hoverTl.to(iconScaleTarget, { value: 1 /* scale.base */, duration: .8, ease: "power3.out" }, 0);
}
```

(`iconMaterial.uniforms.uProgress` here is the crescent-icon mesh's own `uProgress` uniform from Section 4's shader — its hover behavior is a self-contained "wink" animation driven purely by hover in/out, unrelated to `isBackMode`; only its *initial* value at construction reflects `isBackMode`. `iconScaleTarget` is whatever this port exposes as the mesh's overall scale — a plain `THREE.Mesh.scale.setScalar(...)` call is the direct equivalent of the source's wrapper-object `.scale` field, since this port has no `Ur`-style indirection; the implementer should tween a value and apply it via an `onUpdate` callback calling `mesh.scale.setScalar(value)`, matching the source's `onUpdate:()=>{this.mesh.update()}` re-projection pattern.) The two tween call sites live on `Texts` (or a small `ToggleIcon` sub-class it owns) since they touch the icon mesh's own material/scale — `Toggle.svelte` calls a method like `texts.setIconHover(isBackMode: boolean, entering: boolean): void` that internally picks `handleIn()`/`handleOut()` per the dispatch table above.

---

## Testing

Same visual-only approach as prior phases. New checklist items: clicking the toggle now wipes the whole screen from white to the immersive 3D scene (not just the fluid-trail area), with a brief chroma/warp glitch; a second click during the ~3.2s wipe does nothing (guard); hovering the button previews a small porthole before clicking; the button itself renders as a small crescent-moon icon that flips orientation and grows slightly on hover, not plain HTML. `npm run check` clean.

## Out of Scope

- Full Titles/Texts typography system (project names/descriptions as 3D text) — `Texts` here is a one-mesh scaffold, not the full system. A future phase can extend it.
- Touch-device-specific behavior (`isTouch` branches throughout `Ha` skip the hover tweens and the DOM-scroll-offset subtraction in `Ur.update()`) — this port has no touch-specific handling anywhere yet, consistent with prior phases.
- `setGlowStr()`'s page-specific glow tuning (`router.pageId`-keyed) — route-transition machinery, no other routes exist.
- The router's initial-load transition (`once()`), which sets up transition textures differently from the toggle's own `enter()` path — out of scope, not exercised by this port (no routing).

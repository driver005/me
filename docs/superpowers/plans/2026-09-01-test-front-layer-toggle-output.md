# `/test` Front Layer + Real Output Toggle (Phase 2a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace phase 1's flat-white output hack with the real front/back compositor system — a new `Front` layer, a rewrite of the output shader to the real (trimmed) `be`/`Me` logic, and a correction to `uMode`'s default so the scene matches the original site's actual resting state.

**Architecture:** `Front` is a new `Layer` subclass (same shape as `Stars`/`Fog`) rendering a flat white background with four content uniforms currently bound to placeholders. `Compositor`'s output stage gets a new fragment shader — hand-derived from the original `be`, with every phase-3/4/5-only branch (toggle blob, page-transition warp/chroma, loader alpha-reveal) algebraically collapsed out at its always-zero default rather than left as dead uniform plumbing. `Scene`'s `uMode` default flips from `0` to `1` (front), which is a one-line change that correctly ripples through every consumer since they all read the same shared uniform reference.

**Tech Stack:** Same as phase 1 — Three.js `^0.182.0`, SvelteKit 2/Svelte 5, `vite-plugin-glsl`, `npm run check` for verification, Playwright via `mcp__plugin_playwright_playwright__*` where available (may still be broken — see Global Constraints).

**Spec:** `docs/superpowers/specs/2026-09-01-test-front-layer-toggle-output-design.md`

## Global Constraints

- Source of truth: `static/sites/segerman-dev-86ede42f/root-7944de32/js/world.js` (de-minified scrape, unchanged since phase 1 — confirmed via a fresh live re-scrape earlier this session).
- GLSL extraction procedure: search `world.js` for the given anchor, copy the **entire enclosing backtick-delimited template literal** verbatim into the target `.glsl` file — except Task 2's output shader, which is explicitly a **hand-derived rewrite**, not a verbatim extraction (see that task for why and exact content).
- `.glsl` imports into `.ts` files need `// @ts-ignore` above them (established convention — see `src/lib/three/scenes/segerman-bg/stars.ts`).
- Continuously-animated layers override `loop()` to unconditionally `render()` every frame (established in a phase-1 fix, commit `db9444b`) — `Front` needs this too.
- Environment note: the Playwright MCP browser tool was broken for all of phase 1 (stale server process holding a pre-fix config). It may or may not be fixed now — each task should try it once and fall back to `npm run check` + manual diff review if it still fails with "Chromium distribution 'chrome' is not found" or similar, per phase 1's established pattern. Don't loop retrying it.
- Dev server: background `npm run dev` processes have been getting killed by the sandbox periodically. Each task should check `curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/test` first and start a fresh one if it's not `200`, rather than assuming an earlier task's server is still up.

---

## File Structure

```
src/lib/three/scenes/segerman-bg/
  front.ts                 — new: Front layer (port of De)
  scene.ts                  — modified: add uIsTouch to shared uniforms, flip uMode default 0→1
  compositor.ts              — modified: new CompositorLayers.front, rewritten outputMaterial

src/lib/shaders/segerman-bg/
  front/fragment.glsl        — new: verbatim extraction of Fe
  compositor/output-fragment.glsl — REPLACED: hand-derived simplified version of be (not extraction)

src/routes/test/+page.svelte — modified: construct Front, wire into Compositor, dispose
```

---

### Task 1: `Front` layer

**Files:**
- Create: `src/lib/shaders/segerman-bg/front/fragment.glsl`
- Create: `src/lib/three/scenes/segerman-bg/front.ts`

**Interfaces:**
- Consumes: `Layer` (`src/lib/three/scenes/segerman-bg/layer.ts`), `Scene` (`.uniforms.uTime`, `.uniforms.uRes`, `.fullScreenTriangle`, `.renderer`, `.createRenderTarget`, `.dpr`), `createPlaceholderTexture` (`src/lib/three/scenes/segerman-bg/placeholder-textures.ts`).
- Produces: `class Front extends Layer { constructor(scene: Scene); get texture(): THREE.Texture; render(): void; dispose(): void }` — Task 3 consumes `.texture` as `tFront`.

- [ ] **Step 1: Extract the fragment shader**

Search `static/sites/segerman-dev-86ede42f/root-7944de32/js/world.js` for the anchor `vec4 bg = vec4(1., 1., 1., bgMask);` (appears exactly once in the file). Find the enclosing template literal — it starts with `` vec4 over(vec4 src, vec4 dst) { `` and ends with `` gl_FragColor = final;\n}` `` (the closing backtick is immediately followed by `;class De extends B`). Copy that entire literal verbatim into `src/lib/shaders/segerman-bg/front/fragment.glsl`.

- [ ] **Step 2: Write `front.ts`**

Ported from class `De`'s constructor (search anchor: `this.scale=()=>e.dpr,this.rt=e.W.createRT(this.scale)`). Per the spec, `uBgOffset` is fixed at `1` (the settled post-intro value — there's no loader in this port) rather than animated from `0`, and all four content uniforms (`tTitles`, `tTexts`, `tImagesFront`, `tVideo`) are placeholders until the gallery layer (a later phase) replaces them.

```typescript
// src/lib/three/scenes/segerman-bg/front.ts
import * as THREE from 'three';
import { Layer } from './layer';
import type { Scene } from './scene';
import { createPlaceholderTexture } from './placeholder-textures';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/extra/caffee.svelte for the same pattern)
import frontFragment from '$lib/shaders/segerman-bg/front/fragment.glsl';
// @ts-ignore
import fullscreenVertex from '$lib/shaders/segerman-bg/common/fullscreen-triangle.glsl';

export class Front extends Layer {
	renderTarget: THREE.WebGLRenderTarget;
	private mesh: THREE.Mesh;
	private material: THREE.ShaderMaterial;
	private scene: Scene;
	private placeholder = createPlaceholderTexture();

	constructor(scene: Scene) {
		super(scene.isTouch);
		this.scene = scene;
		this.renderTarget = scene.createRenderTarget(scene.dpr);

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				tTitles: { value: this.placeholder },
				tTexts: { value: this.placeholder },
				tImagesFront: { value: this.placeholder },
				tVideo: { value: this.placeholder },
				uTime: scene.uniforms.uTime,
				uRes: scene.uniforms.uRes,
				uTextColor: { value: new THREE.Color('#00031f').convertLinearToSRGB() },
				uLabelColor: { value: new THREE.Color('#93949f').convertLinearToSRGB() },
				uBgOffset: { value: 1 }
			},
			vertexShader: fullscreenVertex,
			fragmentShader: frontFragment
		});
		this.mesh = new THREE.Mesh(scene.fullScreenTriangle, this.material);
		this.mesh.frustumCulled = false;
	}

	get texture(): THREE.Texture {
		return this.renderTarget.texture;
	}

	loop(): void {
		this.render();
	}

	render(): void {
		this.scene.renderer.setRenderTarget(this.renderTarget);
		this.scene.renderer.render(this.mesh, this.scene.camera);
	}

	dispose(): void {
		this.material.dispose();
		this.placeholder.dispose();
	}
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/shaders/segerman-bg/front/fragment.glsl src/lib/three/scenes/segerman-bg/front.ts
git commit -m "feat(test-bg): add Front layer (white bg + placeholder content, port of De)"
```

---

### Task 2: Rewrite the output shader

**Files:**
- Modify: `src/lib/shaders/segerman-bg/compositor/output-fragment.glsl` (full replace — this REPLACES phase 1's flat-white passthrough, including the fluid-reveal fix added in a follow-up commit after phase 1 shipped; that logic is a subset of what this task's shader already does correctly)

**Interfaces:**
- Consumes: nothing new (same `tBack`, adds `tFront` and `tFluid` stays, adds `uTime`/`uIsTouch`).
- Produces: the same file path, new uniform list `tFront`, `tBack`, `tFluid`, `uTime`, `uIsTouch` — Task 3 wires these.

The original `be` (search anchor for verification, if you want to compare: `uniform sampler2D tFront;`, unique in the file — the enclosing literal spans from the noise-helper functions through `gl_FragColor = vec4(color, 1.0);\n}`) mixes `tBack`/`tFront` via a wipe-edge (`edgeFront`) and the fluid-cursor-reveal (`fluidMask`), gated by several uniforms that are page-transition-only (`uWarp`, `uDirection`, `uProgressFront`, `uProgressBack`) or toggle-only (`uToggleCoords`, `uToggleProgress`) or loader-only (`uFinalAlpha`, `uTransAlpha`, `uBgOffset`, `tTransFront`, `tTransBack`) — all of which sit at their always-inert default value in this phase (no transitions, no toggle button, no loader exist yet). This task is **not a verbatim extraction** — it's the same math with those always-zero terms algebraically simplified out, verified below.

At `uWarp=0`, the `if (warp > 0.0) {...}` branch never ran in the original — only its `else` branch (`back = texture2D(tBack, uv); front = texture2D(tFront, uv);` with unmodified `uv`) is live. At `uProgressBack=0`, `bulgeMaskBack` was always `0`, so that branch's math is moot (already excluded by the above). At `uProgressFront=0`, `bulgeMaskFront = smoothstep(0,.9,0)*(1-smoothstep(.1,1,0)) = 0`, so `tFrontEdge = t + dirSign*arc*0.3*0 = t` exactly — meaning `dirSign`/`arc`/`x`/`altAxis` (only ever used multiplied into that now-zero term) drop out entirely. At `uDirection=0`, `t = mix(axis, 1-axis, 0) = axis`, and `edgePosFront = mix(mix(-.05,-.3,0), mix(1.3,1.05,0), 0) + n*.05 = -.05 + n*.05`. At `uToggleProgress=0`, the toggle-blob `if` block's condition (`uToggleProgress * uMode > 0.0`) is always false regardless of `uMode` — dropped entirely. At `uFinalAlpha=1` (no loader ever mid-fade in this port), the `if (uFinalAlpha < 1.0) {...} else { color = final.rgb; }` branch always takes the `else` — dropped entirely, along with `tTransFront`/`tTransBack`/`uTransAlpha`/`uBgOffset`.

What survives, algebraically identical to the original at these defaults:

```glsl
// src/lib/shaders/segerman-bg/compositor/output-fragment.glsl
varying vec2 vUv;

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

    i = mod(i, 289.0 );
    vec4 p = permute( permute( permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
    dot(p2,x2), dot(p3,x3) ) );
}

uniform sampler2D tFront;
uniform sampler2D tBack;
uniform sampler2D tFluid;
uniform vec2 uRes;
uniform float uTime;
uniform float uIsTouch;

void main() {
    vec2 uv0 = vUv;
    float noiseAmt = mix(5., 3.5, uIsTouch);

    vec2 off = vec2(
        uv0.x + sin(uv0.y + uTime * 0.1) * 0.001,
        uv0.y - uTime * 0.5
    );
    float n = snoise(vec3(off, uTime * 0.1) * noiseAmt);

    float axis = mix(uv0.y, uv0.x, uIsTouch);
    float t = axis;

    vec4 back = texture2D(tBack, uv0);
    vec4 front = texture2D(tFront, uv0);

    float edgePosFront = -0.05 + n * 0.05;
    float edgeFront = smoothstep(edgePosFront - 0.02, edgePosFront + 0.01, t);

    vec3 fluid = texture2D(tFluid, uv0).rgb;
    float intensity = length(fluid);
    float fluidMask = 1.0 - smoothstep(0.001, 0.003, intensity);

    vec4 final = mix(back, front, edgeFront * fluidMask);

    gl_FragColor = vec4(final.rgb, 1.0);
}
```

The `over`/`getRGB`/`desaturate` helper functions present in the original `be` literal are dropped here — they were dead code in the original too (never called from `be`'s own `main()`), so omitting them isn't a fidelity loss, just skipping genuinely-unused code that this task authors fresh rather than extracts.

- [ ] **Step 1: Replace the file**

Overwrite `src/lib/shaders/segerman-bg/compositor/output-fragment.glsl` with the exact content above.

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: no errors (this is a `.glsl` file, so this step mainly catches whether the file syntax is well-formed enough for the build pipeline — full GLSL compile errors won't surface until runtime/Playwright).

- [ ] **Step 3: Commit**

```bash
git add src/lib/shaders/segerman-bg/compositor/output-fragment.glsl
git commit -m "feat(test-bg): rewrite output shader to real front/back wipe + fluid reveal

Derived from the original be shader with every phase-3/4/5-only branch
(toggle blob, transition warp/chroma, loader alpha-reveal) algebraically
collapsed out at its always-zero default, not left as dead uniforms."
```

---

### Task 3: Wire `Front` into `Scene` and `Compositor`

**Files:**
- Modify: `src/lib/three/scenes/segerman-bg/scene.ts`
- Modify: `src/lib/three/scenes/segerman-bg/compositor.ts`

**Interfaces:**
- Consumes: `Front` (Task 1), the new output shader's uniform list (Task 2).
- Produces: `SceneUniforms` gains `uIsTouch: { value: number }`; `Scene`'s `uMode` initial value is `1`, not `0`; `CompositorLayers` gains `front: Front`; `Compositor`'s `outputMaterial` uniforms become `{ tBack, tFront, tFluid, uRes, uTime, uIsTouch }`.

- [ ] **Step 1: Add `uIsTouch` to `SceneUniforms` and `Scene`**

In `src/lib/three/scenes/segerman-bg/types.ts`, add to the `SceneUniforms` interface:

```typescript
	uIsTouch: { value: number };
```

In `src/lib/three/scenes/segerman-bg/scene.ts`'s constructor, in the `this.uniforms = { ... }` object (it already computes `this.isTouch` earlier in the constructor — add this uniform right after `uMode`):

```typescript
			uIsTouch: { value: 0 }
```

then, immediately after that object literal is assigned (same place `this.isTouch = ...` is already set), set the real value:

```typescript
		this.uniforms.uIsTouch.value = this.isTouch ? 1 : 0;
```

- [ ] **Step 2: Flip `uMode`'s default**

In the same `uniforms` object literal in `scene.ts`, change:

```typescript
			uMode: { value: 0 }
```

to:

```typescript
			uMode: { value: 1 }
```

This is the only place `uMode`'s initial value is set — `Stars`, `Fog`, `Planet`, and `Compositor.backMaterial` all read `scene.uniforms.uMode` by shared reference (confirm this by grepping those four files for `uMode` — none should have their own independent `uMode` value; if one does, that's a bug from an earlier task, stop and report it rather than silently working around it).

- [ ] **Step 3: Update `CompositorLayers` and the constructor**

In `src/lib/three/scenes/segerman-bg/compositor.ts`, add the import and interface field:

```typescript
import type { Front } from './front';
```

```typescript
export interface CompositorLayers {
	stars: Stars;
	fog: Fog;
	fluid: FluidSim;
	planet: Planet;
	front: Front;
}
```

Add a private field and store it in the constructor, alongside the existing `this.fluidSim = layers.fluid;` line:

```typescript
	private frontLayer: Front;
```

```typescript
		this.frontLayer = layers.front;
```

- [ ] **Step 4: Replace the `outputMaterial` uniforms and `render()`**

Replace the `outputMaterial` construction:

```typescript
		this.outputMaterial = new THREE.ShaderMaterial({
			uniforms: {
				tBack: { value: this.backRT.texture },
				tFront: { value: layers.front.texture },
				tFluid: { value: layers.fluid.texture },
				uRes: scene.uniforms.uRes,
				uTime: scene.uniforms.uTime,
				uIsTouch: scene.uniforms.uIsTouch
			},
			vertexShader: fullscreenVertex,
			fragmentShader: outputFragment
		});
```

Replace `render()`'s body to also live-read the front texture each frame (same pattern already used for `tFluid`, since `Front`'s output could later become animated once the gallery layer feeds it):

```typescript
	render(): void {
		const renderer = this.scene.renderer;
		this.backMaterial.uniforms.tFluid.value = this.fluidSim.texture;
		this.outputMaterial.uniforms.tFluid.value = this.fluidSim.texture;
		this.outputMaterial.uniforms.tFront.value = this.frontLayer.texture;
		renderer.setRenderTarget(this.backRT);
		renderer.render(this.backMesh, this.scene.camera);

		renderer.setRenderTarget(null);
		renderer.render(this.outputMesh, this.scene.camera);
	}
```

- [ ] **Step 5: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/three/scenes/segerman-bg/types.ts src/lib/three/scenes/segerman-bg/scene.ts src/lib/three/scenes/segerman-bg/compositor.ts
git commit -m "feat(test-bg): wire Front into Scene/Compositor, correct uMode default to 1"
```

---

### Task 4: Route wiring + verification

**Files:**
- Modify: `src/routes/test/+page.svelte`

**Interfaces:**
- Consumes: `Front` (Task 1), updated `Compositor`/`CompositorLayers` (Task 3).

- [ ] **Step 1: Construct and wire `Front`**

In `src/routes/test/+page.svelte`'s `onMount`, add the import:

```typescript
import { Front } from '$lib/three/scenes/segerman-bg/front';
```

Construct it alongside the other layers (after `planet` is constructed, before `compositor` is constructed) and hoist it to the same component-scope `let` binding pattern already used for `stars`/`fog`/`fluid`/`planet` (so `onDestroy` can reach it):

```typescript
const front = new Front(scene);
scene.addLayer(front);
```

Update the `Compositor` construction call to include it:

```typescript
const compositor = new Compositor(scene, { stars, fog, fluid, planet, front });
```

- [ ] **Step 2: Dispose it**

`front` is disposed automatically via `scene.dispose()` (which iterates every layer added via `scene.addLayer()` — confirmed working for the other four layers already; `front` follows the identical path since Step 1 registers it the same way). No explicit `front?.dispose()` call is needed in `onDestroy` beyond what already exists — verify this is true by reading `Scene.dispose()`'s actual code before skipping the explicit call; if it *doesn't* iterate registered layers the way this assumes, add `front?.dispose()` explicitly next to the other layer references in `onDestroy` instead.

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 4: Verify**

Check dev server: `curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/test` — if not `200`, start one (`npm run dev`, `run_in_background: true`, wait for it to respond).

Try Playwright once: navigate to `/test`, screenshot, check console. If it works: expected result is a **mostly white/light view** by default (not the full immersive 3D scene phase 1 showed — this is the corrected, spec-accurate default), with the 3D scene (stars/planet/fog) revealed through a soft cursor-follow shape wherever the pointer has moved, fading back to white as the fluid trail decays. If Playwright fails with the known "Chromium distribution 'chrome' is not found" error (or similar), fall back to `npm run check` (already done in Step 3) plus a careful manual read of the final `+page.svelte`/`compositor.ts`/`scene.ts` diff against this task's Steps 1-2, and note in your report that live visual confirmation wasn't possible.

- [ ] **Step 5: Commit**

```bash
git add src/routes/test/+page.svelte
git commit -m "feat(test-bg): wire Front layer into the route, complete phase 2a"
```

---

## Self-Review Notes

- **Spec coverage:** Section 1 (Front layer) → Task 1. Section 2 (real Output shader) → Task 2, with the algebraic-simplification reasoning made explicit and checkable line-by-line against the original. Section 3 (`uMode` default) → Task 3 Step 2. Section 4 (route wiring) → Task 4. Testing section → Task 4 Step 4.
- **Placeholder scan:** no TBD/TODO; Task 2's shader is fully written out, not described; the "derived, not extracted" framing is stated explicitly so a reviewer doesn't flag it as a failed verbatim-copy check by mistake.
- **Type consistency:** `Front` name and public surface (`texture` getter, `render()`, `dispose()`, `loop()`) match the pattern every other layer (`Stars`/`Fog`/`Planet`) already uses, confirmed consistent across Tasks 1, 3, and 4. `CompositorLayers.front: Front` matches the constructor parameter destructuring in Task 3 Step 3 and the call site in Task 4 Step 1.
- **Scope check:** single subsystem (front layer + output shader correction), consistent with the spec's phase-2a boundary. Gallery content, toggle button, transitions, and Lenis/routing remain explicitly deferred (spec's "Out of Scope" section).

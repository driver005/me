# `/test` Toggle Real Transition (Phase 3.5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace phase 3's simplified toggle with the real, fully-sourced transition: a genuine fullscreen crossfade wipe, a warp/chroma flash, a transition-in-flight guard, hover-driven blob-peek (not click-driven), and a real 3D crescent-icon mesh for the button.

**Architecture:** A new `Texts` layer (minimal, single-mesh — not the full title system) renders a DOM-position-synced crescent-icon mesh into the `tTexts` slot already wired as a placeholder since phase 1. `output-fragment.glsl` gains the real warp/crossfade block, driven by four new shared uniforms. `Toggle.svelte` is rewritten: click drives the real transition timeline (replacing phase 3's invented one), hover drives the blob-peek and the icon's own animation (previously click-driven).

**Tech Stack:** SvelteKit 2 / Svelte 5 (runes), Three.js, GSAP, `vite-plugin-glsl`.

**Spec:** docs/superpowers/specs/2026-09-02-test-toggle-transition-design.md

## Global Constraints

- `uMode` convention (established phases 1/2a): `0` = back/immersive, `1` = front/white. Current default `1`.
- `isBackMode` in tween-value expressions is always the **already-flipped, destination-state** boolean — the existing convention from phase 3's `Toggle.svelte`.
- Shared uniforms are passed into materials by direct object reference (`scene.uniforms.uMode`), mutated via `.value` — established pattern, no live-read-per-frame needed for scalars/vectors that don't change identity.
- `uProgressFront`/`uProgressBack` default to `0` (a deliberate deviation from a literal reading of the source, explained in the spec's Section 3 — NOT `1`, which would show back mode fullscreen at rest, contradicting `uMode`'s front-mode default of `1`).
- `// @ts-ignore` above every `.glsl` import (established convention).
- Work directly on `main`, no worktree (established convention this session).
- Verification: `npm run check` must be clean (0 errors); Playwright is known-broken in this session's sandbox — try once, fall back to manual diff review.

---

### Task 1: Real crossfade wipe + warp/chroma flash — output shader

**Files:**
- Modify: `src/lib/three/scenes/segerman-bg/types.ts`
- Modify: `src/lib/three/scenes/segerman-bg/scene.ts`
- Modify: `src/lib/shaders/segerman-bg/compositor/output-fragment.glsl`
- Modify: `src/lib/three/scenes/segerman-bg/compositor.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `SceneUniforms.uDirection: {value: number}`, `.uProgressFront: {value: number}`, `.uProgressBack: {value: number}`, `.uWarp: {value: number}` — Task 4 (`Toggle.svelte`) writes/tweens these.

- [ ] **Step 1: Add four new uniforms to `SceneUniforms`**

In `src/lib/three/scenes/segerman-bg/types.ts`, add to the `SceneUniforms` interface (after `uToggleProgress`):

```typescript
	uDirection: { value: number };
	uProgressFront: { value: number };
	uProgressBack: { value: number };
	uWarp: { value: number };
```

- [ ] **Step 2: Initialize them in `Scene`'s constructor**

In `src/lib/three/scenes/segerman-bg/scene.ts`, the `this.uniforms = {...}` object literal currently ends with:

```typescript
			uToggleCoords: { value: new THREE.Vector2(0.9, 0.9) },
			uToggleProgress: { value: 0 }
		};
```

Change it to (note the added trailing comma after `uToggleProgress`'s line):

```typescript
			uToggleCoords: { value: new THREE.Vector2(0.9, 0.9) },
			uToggleProgress: { value: 0 },
			uDirection: { value: 0 },
			uProgressFront: { value: 0 },
			uProgressBack: { value: 0 },
			uWarp: { value: 0 }
		};
```

(`uProgressFront`/`uProgressBack` default to `0`, not `1` — see Global Constraints.)

- [ ] **Step 3: Rewrite `output-fragment.glsl`'s uniform block and `main()`**

Replace the file's uniform block (currently ending `uniform float uToggleProgress;`) and entire `main()` function with:

```glsl
uniform sampler2D tFront;
uniform sampler2D tBack;
uniform sampler2D tFluid;
uniform float uTime;
uniform float uIsTouch;
uniform float uMode;
uniform vec2 uRes;
uniform vec2 uToggleCoords;
uniform float uToggleProgress;
uniform float uDirection;
uniform float uProgressFront;
uniform float uProgressBack;
uniform float uWarp;

void main() {
    vec2 uv0 = vUv;
    float warp = uWarp;
    float noiseAmt = mix(5., 3.5, uIsTouch);

    vec2 off = vec2(
        uv0.x + sin(uv0.y + uTime * 0.1) * 0.001,
        uv0.y - uTime * 0.5
    );
    float n = snoise(vec3(off, uTime * 0.1) * noiseAmt);

    float axis = mix(uv0.y, uv0.x, uIsTouch);
    float altAxis = mix(uv0.x, uv0.y, uIsTouch);
    float t = mix(axis, 1.0 - axis, uDirection);

    float x = altAxis * 2.0 - 1.0;
    float arc = sqrt(max(0.0, 1.0 - x*x));
    float dirSign = mix(-1.0, 1.0, uDirection);

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

    float bulgeMaskFront = smoothstep(0.0, 0.9, uProgressFront) * (1.0 - smoothstep(0.1, 1.0, uProgressFront));
    float tFrontEdge = t + dirSign * arc * 0.3 * bulgeMaskFront;
    float edgePosFront = mix(mix(-0.05, -0.3, uDirection), mix(1.3, 1.05, uDirection), uProgressFront) + n * 0.05;
    float edgeFront = smoothstep(edgePosFront - 0.02, edgePosFront + 0.01, tFrontEdge);

    vec3 fluid = texture2D(tFluid, uv).rgb;
    float intensity = length(fluid);
    float fluidMask = 1.0 - smoothstep(0.001, 0.003, intensity);

    vec4 final = mix(back, front, edgeFront * fluidMask);

    if (uToggleProgress * uMode > 0.0) {
        float aspect = uRes.x / uRes.y;
        vec2 toToggle = vUv - uToggleCoords;
        toToggle.x *= aspect;
        float distToToggle = length(toToggle);

        float blobRadius = (0.085 + n * 0.014) * uToggleProgress * uMode;
        float toggleMask = 1.0 - smoothstep(blobRadius - 0.001, blobRadius + 0.001, distToToggle);

        vec2 windowUV = uv + n * 0.0015 * toggleMask;
        float windowChroma = toggleMask * 0.001 + n * .0001;
        vec4 windowBack = vec4(
            texture2D(tBack, windowUV + vec2(windowChroma, 0.0)).r,
            texture2D(tBack, windowUV).g,
            texture2D(tBack, windowUV - vec2(windowChroma, 0.0)).b,
            1.0
        );

        final = mix(final, windowBack, toggleMask);
    }

    gl_FragColor = vec4(final.rgb, 1.0);
}
```

(Everything above `uniform sampler2D tFront;` — the `permute`/`taylorInvSqrt`/`snoise` helper functions and the `varying vec2 vUv;` line — is unchanged, leave it exactly as-is. Two corrections versus the file phase 3 shipped: the `fluid`/`intensity`/`fluidMask` line and the blob-reveal's `windowUV` line both now sample at `uv` instead of `uv0` — this matches the real source exactly, and only becomes possible now that this task introduces a genuine warped `uv` distinct from `uv0`; phase 3 had no choice but to use `uv0` there since `uv` didn't exist yet.)

- [ ] **Step 4: Wire the four new uniforms into `Compositor`'s `outputMaterial`**

In `src/lib/three/scenes/segerman-bg/compositor.ts`, the `outputMaterial`'s uniforms object currently ends with:

```typescript
				uToggleCoords: scene.uniforms.uToggleCoords,
				uToggleProgress: scene.uniforms.uToggleProgress
			},
```

Change it to (note the added trailing comma after `uToggleProgress`'s line):

```typescript
				uToggleCoords: scene.uniforms.uToggleCoords,
				uToggleProgress: scene.uniforms.uToggleProgress,
				uDirection: scene.uniforms.uDirection,
				uProgressFront: scene.uniforms.uProgressFront,
				uProgressBack: scene.uniforms.uProgressBack,
				uWarp: scene.uniforms.uWarp
			},
```

(All four shared by direct reference, matching the existing `uMode`/`uToggleCoords` pattern on this same material — no live-read-per-frame code needed.)

- [ ] **Step 5: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/three/scenes/segerman-bg/types.ts src/lib/three/scenes/segerman-bg/scene.ts src/lib/shaders/segerman-bg/compositor/output-fragment.glsl src/lib/three/scenes/segerman-bg/compositor.ts
git commit -m "feat(test-bg): port real crossfade wipe + warp/chroma flash into output shader"
```

---

### Task 2: `Texts` layer + crescent-icon mesh

**Files:**
- Modify: `src/lib/three/scenes/segerman-bg/scene.ts`
- Create: `src/lib/shaders/segerman-bg/texts/vertex.glsl`
- Create: `src/lib/shaders/segerman-bg/texts/icon-fragment.glsl`
- Create: `src/lib/three/scenes/segerman-bg/texts.ts`

**Interfaces:**
- Consumes: `Scene.widthAtZ`/`Scene.heightAtZ` (this task adds them), `Layer` base class.
- Produces: `class Texts extends Layer { constructor(scene: Scene, isBackMode: boolean); get texture(): THREE.Texture; syncButtonRect(rect: DOMRect): void; handleIn(isBackMode: boolean): void; handleOut(isBackMode: boolean): void; render(): void; dispose(): void }` — Task 3 wires `.texture` into `Front`/`Compositor`; Task 4 calls `syncButtonRect`/`handleIn`/`handleOut` from `Toggle.svelte`.

- [ ] **Step 1: Add `widthAtZ`/`heightAtZ` to `Scene`**

In `src/lib/three/scenes/segerman-bg/scene.ts`, add two private fields near the other private fields (after `private height = 0;`):

```typescript
	private _widthAtZ = 0;
	private _heightAtZ = 0;
```

Add two public getters, anywhere in the class body (e.g. right after the `uniforms`/`pointer` public fields):

```typescript
	get widthAtZ(): number {
		return this._widthAtZ;
	}

	get heightAtZ(): number {
		return this._heightAtZ;
	}
```

In `resize(width: number, height: number): void`, right after the existing `this.camera.updateProjectionMatrix();` line, add:

```typescript
		const fovRad = (this.camera.fov * Math.PI) / 180;
		this._heightAtZ = 2 * Math.tan(fovRad / 2) * this.camera.position.z;
		this._widthAtZ = this._heightAtZ * this.camera.aspect;
```

(`resize()` already runs once from the constructor via `handleWindowResize()`, so `widthAtZ`/`heightAtZ` are populated before any layer's constructor could read them.)

- [ ] **Step 2: Write the icon's vertex shader**

```glsl
// src/lib/shaders/segerman-bg/texts/vertex.glsl
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

(A standard passthrough vertex shader — this mesh is a normal positioned/scaled `THREE.Mesh` in 3D space, not a fullscreen-triangle compositor pass, so it needs real `projectionMatrix`/`modelViewMatrix` transforms, unlike every other shader in this port so far.)

- [ ] **Step 3: Write the icon's fragment shader**

```glsl
// src/lib/shaders/segerman-bg/texts/icon-fragment.glsl
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

- [ ] **Step 4: Write `texts.ts`**

```typescript
// src/lib/three/scenes/segerman-bg/texts.ts
import * as THREE from 'three';
import gsap from 'gsap';
import { Layer } from './layer';
import type { Scene } from './scene';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/extra/caffee.svelte for the same pattern)
import textsVertex from '$lib/shaders/segerman-bg/texts/vertex.glsl';
// @ts-ignore
import iconFragment from '$lib/shaders/segerman-bg/texts/icon-fragment.glsl';

const SIZE_BASE = 0.44;
const SIZE_FULL = 0.95;
const SCALE_BASE = 1;
const SCALE_HOVER = 1.4;

export class Texts extends Layer {
	private scene: Scene;
	private textsScene = new THREE.Scene();
	private renderTarget: THREE.WebGLRenderTarget;
	private iconMesh: THREE.Mesh;
	private iconMaterial: THREE.ShaderMaterial;
	private baseWidth = 0;
	private baseHeight = 0;
	private baseX = 0;
	private baseY = 0;
	private scaleMultiplier = SCALE_BASE;
	private hoverTimeline: gsap.core.Timeline | null = null;

	constructor(scene: Scene, isBackMode: boolean) {
		super(scene.isTouch);
		this.scene = scene;
		this.renderTarget = scene.createRenderTarget(scene.dpr);

		this.iconMaterial = new THREE.ShaderMaterial({
			uniforms: {
				uMode: scene.uniforms.uMode,
				uColor: { value: new THREE.Color('red') },
				uRadius: { value: 0.5 },
				uSize: { value: SIZE_BASE },
				uProgress: { value: isBackMode ? 1 : 0 },
				uOffset: { value: 0 }
			},
			vertexShader: textsVertex,
			fragmentShader: iconFragment,
			transparent: true
		});
		this.iconMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 1), this.iconMaterial);
		this.textsScene.add(this.iconMesh);
	}

	get texture(): THREE.Texture {
		return this.renderTarget.texture;
	}

	/** Called by Toggle.svelte on mount and on window resize, with the button's current getBoundingClientRect(). */
	syncButtonRect(rect: DOMRect): void {
		const { widthAtZ, heightAtZ } = this.scene;
		this.baseWidth = (rect.width / window.innerWidth) * widthAtZ;
		this.baseHeight = (rect.height / window.innerHeight) * heightAtZ;
		this.baseX = (rect.left / window.innerWidth) * widthAtZ - widthAtZ / 2 + this.baseWidth / 2;
		this.baseY = -((rect.top / window.innerHeight) * heightAtZ - heightAtZ / 2) - this.baseHeight / 2;
		this.applyTransform();
	}

	private applyTransform(): void {
		this.iconMesh.scale.set(this.baseWidth * this.scaleMultiplier, this.baseHeight * this.scaleMultiplier, 1);
		this.iconMesh.position.set(this.baseX, this.baseY, 0);
	}

	/** Ported from Ha.in() — isBackMode is the CURRENT mode (hover never flips it). */
	handleIn(isBackMode: boolean): void {
		this.hoverTimeline?.kill();
		this.hoverTimeline = gsap.timeline();
		this.hoverTimeline.to(this.iconMaterial.uniforms.uProgress, { value: 1, duration: 0.8, ease: 'power3.inOut' }, 0);
		this.hoverTimeline.to(this.iconMaterial.uniforms.uSize, { value: SIZE_FULL, duration: 0.4, ease: 'power3.in' }, 0);
		this.hoverTimeline.to(this.iconMaterial.uniforms.uSize, { value: SIZE_BASE, duration: 0.4, ease: 'power3.out' }, 0.4);
		if (isBackMode) {
			this.hoverTimeline.to(this.scene.uniforms.uToggleProgress, { value: 0, duration: 0.4, ease: 'power3.out' }, 0);
			this.tweenScale(SCALE_BASE);
		} else {
			this.hoverTimeline.to(this.scene.uniforms.uToggleProgress, { value: 1, duration: 0.4, ease: 'power3.out' }, 0);
			this.tweenScale(SCALE_HOVER);
		}
	}

	/** Ported from Ha.out() — isBackMode is the CURRENT mode (hover never flips it). */
	handleOut(isBackMode: boolean): void {
		this.hoverTimeline?.kill();
		this.hoverTimeline = gsap.timeline();
		this.hoverTimeline.to(this.iconMaterial.uniforms.uProgress, { value: 0, duration: 0.8, ease: 'power3.inOut' }, 0);
		this.hoverTimeline.to(this.iconMaterial.uniforms.uSize, { value: SIZE_FULL, duration: 0.4, ease: 'power3.in' }, 0);
		this.hoverTimeline.to(this.iconMaterial.uniforms.uSize, { value: SIZE_BASE, duration: 0.4, ease: 'power3.out' }, 0.4);
		if (isBackMode) {
			this.hoverTimeline.to(this.scene.uniforms.uToggleProgress, { value: 1, duration: 0.8, ease: 'power3.out' }, 0);
			this.tweenScale(SCALE_HOVER);
		} else {
			this.hoverTimeline.to(this.scene.uniforms.uToggleProgress, { value: 0, duration: 0.4, ease: 'power3.out' }, 0);
			this.tweenScale(SCALE_BASE);
		}
	}

	private tweenScale(target: number): void {
		const scaleState = { value: this.scaleMultiplier };
		this.hoverTimeline!.to(
			scaleState,
			{
				value: target,
				duration: 0.8,
				ease: 'power3.out',
				onUpdate: () => {
					this.scaleMultiplier = scaleState.value;
					this.applyTransform();
				}
			},
			0
		);
	}

	loop(): void {
		this.render();
	}

	render(): void {
		const renderer = this.scene.renderer;
		renderer.setRenderTarget(this.renderTarget);
		renderer.clear();
		renderer.render(this.textsScene, this.scene.camera);
	}

	dispose(): void {
		this.hoverTimeline?.kill();
		this.iconMaterial.dispose();
		this.iconMesh.geometry.dispose();
	}
}
```

(`renderTarget` is tracked/disposed by `Scene.dispose()` since it's created via `scene.createRenderTarget()` — `Texts.dispose()` correctly only disposes its own material/geometry/timeline, matching the established pattern from `Planet`/`Images`/`Video`. `loop()` always renders every frame — this port's established convention from every other layer, and this phase's own explicit "keep always-rendering" decision.)

- [ ] **Step 5: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/three/scenes/segerman-bg/scene.ts src/lib/shaders/segerman-bg/texts/vertex.glsl src/lib/shaders/segerman-bg/texts/icon-fragment.glsl src/lib/three/scenes/segerman-bg/texts.ts
git commit -m "feat(test-bg): add Texts layer — crescent-icon mesh, DOM-position-synced"
```

---

### Task 3: Wire `Texts` into `Front`/`Compositor` + route construction

**Files:**
- Modify: `src/lib/three/scenes/segerman-bg/front.ts`
- Modify: `src/lib/three/scenes/segerman-bg/compositor.ts`
- Modify: `src/routes/test/+page.svelte`

**Interfaces:**
- Consumes: `Texts` (Task 2).
- Produces: `Front`'s constructor signature changes to `(scene, images, video, texts)`; `Compositor`'s `CompositorLayers` gains `texts: Texts` — Task 4 doesn't touch either signature further, only reads `texts` at the route level via a new `let texts: Texts | null` variable this task adds.

- [ ] **Step 1: Update `Front`**

In `src/lib/three/scenes/segerman-bg/front.ts`:

Add the import: `import type { Texts } from './texts';`

Add a new private field, alongside the existing `imagesLayer`/`videoLayer` fields:

```typescript
	private textsLayer: Texts;
```

Change the constructor signature and body's first five lines (everything from `constructor(...)` through the existing `this.videoLayer = video;` line — the `this.renderTarget = scene.createRenderTarget(scene.dpr);` line and everything after it in the constructor stays exactly as it already is, unchanged):

```typescript
	constructor(scene: Scene, images: Images, video: Video, texts: Texts) {
		super(scene.isTouch);
		this.scene = scene;
		this.imagesLayer = images;
		this.videoLayer = video;
		this.textsLayer = texts;
```

Update the comment and the `tTexts` uniform (currently `tTexts: { value: this.placeholder },` under the comment `// tTitles/tTexts are deliberate placeholders — real content lands in a future gallery-content phase, not this one.`):

```typescript
				// tTitles is a deliberate placeholder — real content (project titles) lands in a future phase.
				tTitles: { value: this.placeholder },
				tTexts: { value: texts.texture },
```

In `render()`, add a live-read (alongside the existing `tImagesFront`/`tVideo` live-reads):

```typescript
		this.material.uniforms.tTexts.value = this.textsLayer.texture;
```

- [ ] **Step 2: Update `Compositor`**

In `src/lib/three/scenes/segerman-bg/compositor.ts`:

Add the import: `import type { Texts } from './texts';`

Extend `CompositorLayers`:

```typescript
export interface CompositorLayers {
	stars: Stars;
	fog: Fog;
	fluid: FluidSim;
	planet: Planet;
	front: Front;
	images: Images;
	video: Video;
	texts: Texts;
}
```

Add a private field:

```typescript
	private textsLayer: Texts;
```

Store it in the constructor (alongside the other `layers.*` assignments):

```typescript
		this.textsLayer = layers.texts;
```

Change the `backMaterial`'s `tTexts` uniform from `{ value: this.placeholder }` to `{ value: layers.texts.texture }`.

In `render()`, add a live-read (alongside the existing `tImagesBack`/`tImagesBackBloom`/`tVideo` live-reads):

```typescript
		this.backMaterial.uniforms.tTexts.value = this.textsLayer.texture;
```

- [ ] **Step 3: Wire the route**

In `src/routes/test/+page.svelte`:

Add the import: `import { Texts } from '$lib/three/scenes/segerman-bg/texts';`

Add the outer `let` declaration alongside the other layer declarations:

```typescript
	let texts: Texts | null = null;
```

In `onMount`, construct `texts` alongside `images`/`video` (before `front`), and register it:

```typescript
			images = new Images(scene, gallery);
			scene.addLayer(images);
			video = new Video(scene, gallery);
			scene.addLayer(video);
			texts = new Texts(scene, false);
			scene.addLayer(texts);

			front = new Front(scene, images, video, texts);
```

(`false` is the initial `isBackMode` — matches the route's other initial-state assumptions, e.g. `uMode`'s default of `1`/front.)

Update the `Compositor` construction call to include `texts`:

```typescript
			compositor = new Compositor(scene, { stars, fog, fluid, planet, front, images, video, texts });
```

Add `texts = null;` to the block of null-outs in `onDestroy`, alongside the existing `images = null;` etc:

```typescript
		texts = null;
```

(`texts` is a `Layer` registered via `scene.addLayer()`, so its `dispose()` runs automatically via `Scene.dispose()`'s existing `layer.dispose?.()` loop — no explicit `texts?.dispose()` call needed, matching the `images`/`video` pattern exactly.)

- [ ] **Step 4: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/three/scenes/segerman-bg/front.ts src/lib/three/scenes/segerman-bg/compositor.ts src/routes/test/+page.svelte
git commit -m "feat(test-bg): wire Texts layer into Front/Compositor/route"
```

---

### Task 4: `Toggle.svelte` rewrite — real transition, hover-driven peek, guard, DOM chrome

**Files:**
- Modify: `src/lib/components/sites/segerman/Toggle.svelte`
- Modify: `src/routes/test/+page.svelte`

**Interfaces:**
- Consumes: `Texts.syncButtonRect`/`.handleIn`/`.handleOut` (Task 2), `Scene.uniforms.uDirection`/`.uProgressFront`/`.uProgressBack`/`.uWarp` (Task 1), `texts` (the route-level variable Task 3 added).

- [ ] **Step 1: Rewrite `Toggle.svelte`**

```svelte
<!-- src/lib/components/sites/segerman/Toggle.svelte -->
<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import gsap from 'gsap';
	import type { Scene } from '$lib/three/scenes/segerman-bg/scene';
	import type { FluidSim } from '$lib/three/scenes/segerman-bg/fluid';
	import type { Texts } from '$lib/three/scenes/segerman-bg/texts';

	let { scene, fluid, texts }: { scene: Scene; fluid: FluidSim; texts: Texts } = $props();

	let buttonRef: HTMLButtonElement | null = $state(null);
	let isBackMode = $state(false);
	let isToggleTransitioning = false;
	let timeline: gsap.core.Timeline | null = null;

	function syncRect(): void {
		if (!buttonRef) return;
		const rect = buttonRef.getBoundingClientRect();
		texts.syncButtonRect(rect);
		const x = (rect.left + rect.width / 2) / window.innerWidth;
		const y = 1 - (rect.top + rect.height / 2) / window.innerHeight;
		scene.uniforms.uToggleCoords.value.set(x, y);
	}

	function handleClick(): void {
		if (isToggleTransitioning) return;
		isToggleTransitioning = true;
		isBackMode = !isBackMode;
		fluid.setMode(isBackMode);
		syncRect();

		timeline?.kill();
		timeline = gsap.timeline();
		timeline.to(scene.uniforms.uMode, { value: isBackMode ? 0 : 1, duration: 0.8, ease: 'power3.out' }, 0);
		timeline.set(scene.uniforms.uDirection, { value: isBackMode ? 0 : 1 }, 0);
		timeline.fromTo(scene.uniforms.uWarp, { value: 0 }, { value: 1, duration: 0.05, ease: 'none' }, 0);
		timeline.to(scene.uniforms.uWarp, { value: 0, duration: 0.5, ease: 'none' }, 0.4);
		timeline.fromTo(
			scene.uniforms.uProgressFront,
			{ value: isBackMode ? 0 : 1 },
			{ value: isBackMode ? 1 : 0, duration: 3.2, ease: 'power4.out' },
			0
		);
		timeline.fromTo(
			scene.uniforms.uProgressBack,
			{ value: isBackMode ? 0 : 1 },
			{ value: isBackMode ? 1 : 0, duration: isBackMode ? 3.3 : 3, ease: 'power4.out' },
			0
		);
		timeline.add(() => {
			isToggleTransitioning = false;
		}, 1.2);
	}

	// The mouseenter/mouseleave dispatch is inverted by mode — see the spec's Section 5.
	function handleMouseEnter(): void {
		if (isBackMode) {
			texts.handleOut(isBackMode);
		} else {
			texts.handleIn(isBackMode);
		}
	}

	function handleMouseLeave(): void {
		if (isBackMode) {
			texts.handleIn(isBackMode);
		} else {
			texts.handleOut(isBackMode);
		}
	}

	onMount(() => {
		syncRect();
		window.addEventListener('resize', syncRect);
	});

	onDestroy(() => {
		window.removeEventListener('resize', syncRect);
		timeline?.kill();
		scene.uniforms.uToggleProgress.value = 0;
	});
</script>

<button
	bind:this={buttonRef}
	type="button"
	onclick={handleClick}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	class="fixed right-6 bottom-6 z-10 h-11 w-11 rounded-full"
	aria-label="Toggle background mode"
></button>
```

(The visible pill/text chrome from phase 3 is gone — the button is now an invisible hit-target; the crescent icon mesh, rendered via `Texts` into the scene, is what's actually visible at this screen position. `isToggleTransitioning` is a plain `let`, not `$state` — it's read/written only inside `handleClick`'s synchronous body and the timeline's `.add()` callback, never by the template, so it doesn't need Svelte's reactivity.)

- [ ] **Step 2: Update the route's `<Toggle>` call site**

In `src/routes/test/+page.svelte`, the template currently has:

```svelte
{#if webglReady && scene && fluid}
	<Toggle {scene} {fluid} />
{/if}
```

Change the guard and props to include `texts`:

```svelte
{#if webglReady && scene && fluid && texts}
	<Toggle {scene} {fluid} {texts} />
{/if}
```

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 4: Verify**

Check the dev server: `curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/test` — start `npm run dev` in the background if the response isn't `200`.

Try Playwright once (per this session's established pattern). Expected if it works: a small crescent-moon-shaped icon visible in the bottom-right corner (not a pill button); clicking it wipes the whole screen from white toward the immersive 3D view over ~1-3 seconds (not just the fluid-trail area), with a brief warp/chroma glitch at the start; a second click during the transition does nothing; hovering the icon (without clicking) grows a small preview porthole and the icon itself pulses/scales. Fall back to `npm run check` (already clean) plus careful manual diff review if Playwright fails, and say which path was used.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/sites/segerman/Toggle.svelte src/routes/test/+page.svelte
git commit -m "feat(test-bg): Toggle.svelte real transition timeline + hover-driven blob-peek, complete phase 3.5"
```

---

## Self-Review Notes

- **Spec coverage:** Section 1 (real crossfade wipe) → Task 1. Section 2 (warp/chroma flash) → Task 1 (same file, interleaved GLSL, not separable — see below). Section 3 (`Toggle.svelte` click timeline + guard) → Task 4. Section 4 (`Texts` layer + toggle mesh + DOM sync) → Tasks 2-3. Section 5 (hover-driven blob-peek + icon hover animation) → Tasks 2 (the `handleIn`/`handleOut` methods) and 4 (the dispatch that calls them).
- **Task 1 merge rationale:** the spec's Sections 1 and 2 are two GLSL blocks that sit inside the same `main()` function and share variables (`t`, `dirSign`, `arc`, `n` — Section 2's bulge-mask math directly consumes Section 1's `t`/`dirSign`/`arc`). A reviewer cannot meaningfully approve one while rejecting the other without also deciding what the file's intermediate state looks like — they're one coherent rewrite of a single function body, not two independent changes. Combined into one task per the "split only where a reviewer could meaningfully reject one task while approving its neighbor" rule.
- **Placeholder scan:** none found — every step has literal code. The two GLSL fidelity corrections (`uv0`→`uv` on the fluid line and the `windowUV` line, Task 1) are flagged inline as intentional, explained corrections, not placeholders.
- **Type consistency:** `Texts`'s public surface (`texture` getter, `syncButtonRect`, `handleIn`, `handleOut`) is defined once in Task 2 and consumed identically in Task 3 (`.texture` only) and Task 4 (`.syncButtonRect`/`.handleIn`/`.handleOut`) — names and signatures match exactly everywhere they're referenced. `Front`'s constructor signature (`scene, images, video, texts`) is defined in Task 3 and has exactly one call site (the route, also updated in Task 3) — no stale call sites left. `Scene.widthAtZ`/`.heightAtZ` (Task 2) are read only by `Texts.syncButtonRect` (same task) — no other consumer.
- **Scope check:** single subsystem (the toggle's real transition mechanics), matching the spec's own phase-3.5 boundary. Full Titles/Texts typography, touch-specific behavior, page-specific glow tuning, and the router's initial-load transition all remain explicitly out of scope per the spec's own "Out of Scope" section.

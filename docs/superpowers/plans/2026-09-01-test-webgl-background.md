# `/test` segerman.dev WebGL Background (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/test`, a standalone SvelteKit route rendering the segerman.dev home-page WebGL background — procedural stars, a terrain-displaced planet with hover-reveal cracks, drifting fbm fog, and a pointer-reactive fluid ink sim, composited through a ported version of the original's back-compositor shader.

**Architecture:** Raw Three.js (not Threlte) driven from `onMount` in a single Svelte route, mirroring the existing `src/lib/design/module/spiral.svelte` pattern. A `Scene` orchestrator owns the renderer/camera/shared uniforms/pointer state and a set of `Layer` subclasses (Stars, Fog, Fluid, Planet) that each render to their own `WebGLRenderTarget`; a `Compositor` samples all of them into one final image drawn to the canvas. Every non-trivial GLSL body is a verbatim, cited extraction from the already-decompiled source sitting in this repo — never retyped from memory.

**Tech Stack:** Three.js `^0.182.0` (already a project dependency), SvelteKit 2 / Svelte 5 runes, `vite-plugin-glsl` (already configured) for `.glsl` imports, Playwright (via the project's existing `mcp__plugin_playwright_playwright__*` tools) for visual verification, `npm run check` for type-checking. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-01-test-webgl-background-design.md`

**Source of truth for all ported logic:** `static/sites/segerman-dev-86ede42f/root-7944de32/js/world.js` (de-minified scrape, real line numbers, referenced by exact grep anchors below — do not use the other pretty/txt files, they don't cover `world.js`). Textures: `static/sites/segerman-dev-86ede42f/root-7944de32/textures/{planet.webp,cracked.webp,cracked-normal.webp,noise.png}`.

## Global Constraints

- WebGL2 required. No fallback rendering path beyond the existing "3D not supported" messaging pattern (reuse i18n keys `m['webgl.title']()`, `m['webgl.description']()`, `m['webgl.link']()`, `m['webgl.button']()` from `messages/en.json`).
- `uMode` is a **fixed constant `0`** for all of phase 1 (the "back"/3D immersive state — see spec Section 3 correction). Never animate it in this phase.
- Fluid layer shaders use `THREE.RawShaderMaterial` + `glslVersion: THREE.GLSL3` (they're written in `in`/`out`/`texture()` GLSL3 style in the source). Every other shader (stars, fog, planet, compositor, blur) uses plain `THREE.ShaderMaterial` with no `glslVersion` set (they're written in `varying`/`texture2D`/`gl_FragColor` GLSL1 style — three.js compiles this fine under a WebGL2 context without changes).
- No unit tests for GLSL (per spec). Verification is: `npm run check` (typecheck, every task) plus, for tasks that change rendered output, a dev-server + Playwright screenshot/console check (see each task's Step "Verify visually").
- Every `.glsl` file gets a **verbatim** copy of the cited source block — do not "clean up" or rename variables inside the shader body; only the *surrounding* uniform declarations may be trimmed where a task explicitly says so (only Task 9 does this, for the burn-transition strip).
- GLSL extraction procedure (used throughout): open `static/sites/segerman-dev-86ede42f/root-7944de32/js/world.js`, search for the literal anchor string given in the task, find the enclosing `` `...` `` (backtick-delimited) template literal it sits inside, and copy that literal's **entire contents** (not the surrounding JS) into the target `.glsl` file verbatim.

---

## File Structure

```
src/routes/test/+page.svelte                                  — route shell, mounts Scene

src/lib/three/scenes/segerman-bg/
  types.ts               — SceneUniforms, PointerState interfaces
  layer.ts                — abstract Layer base class (dirty-flag render pattern)
  rt-pair.ts               — createRTPair() ping-pong render-target helper
  fullscreen-triangle.ts   — createFullscreenTriangle() BufferGeometry factory
  placeholder-textures.ts — createPlaceholderTexture() 1x1 transparent DataTexture factory
  blur.ts                  — Blur two-pass box-blur utility (port of `Ce`/`_`)
  scene.ts                 — Scene orchestrator (port of `Je`/World, trimmed to phase-1 needs)
  stars.ts                 — Stars layer (port of `Ge`)
  fog.ts                    — Fog layer (port of `Ae`)
  fluid.ts                  — FluidSim layer (port of `ye`)
  planet.ts                 — Planet layer (port of `Le`)
  compositor.ts              — Compositor (port of `ke`'s back-pass, `Re`, burn-stripped) + output blit

src/lib/shaders/segerman-bg/
  common/fullscreen-triangle.glsl
  fluid/vertex.glsl
  fluid/clear-fragment.glsl
  fluid/splat-fragment.glsl
  fluid/advection-fragment.glsl
  fluid/divergence-fragment.glsl
  fluid/curl-fragment.glsl
  fluid/vorticity-fragment.glsl
  fluid/pressure-fragment.glsl
  fluid/gradient-subtract-fragment.glsl
  blur/fragment.glsl
  stars/fragment.glsl
  fog/fragment.glsl
  planet/vertex.glsl
  planet/fragment.glsl
  planet/trail-vertex.glsl
  planet/trail-fragment.glsl
  compositor/back-fragment.glsl
  compositor/output-fragment.glsl   (authored new, phase-1-only — see Task 9)
```

---

### Task 1: Foundation utilities

**Files:**
- Create: `src/lib/shaders/segerman-bg/common/fullscreen-triangle.glsl`
- Create: `src/lib/three/scenes/segerman-bg/types.ts`
- Create: `src/lib/three/scenes/segerman-bg/layer.ts`
- Create: `src/lib/three/scenes/segerman-bg/rt-pair.ts`
- Create: `src/lib/three/scenes/segerman-bg/fullscreen-triangle.ts`
- Create: `src/lib/three/scenes/segerman-bg/placeholder-textures.ts`

**Interfaces:**
- Produces: `Layer` (abstract class, `needsRender: boolean`, `dirty(): void`, `abstract render(): void`, `loop(force?: boolean): void`, optional `dispose?(): void`), `createRTPair(width, height, options): RTPair`, `createFullscreenTriangle(): THREE.BufferGeometry`, `createPlaceholderTexture(): THREE.DataTexture`, `SceneUniforms`, `PointerState` types — every later task consumes these exact names.

No visual output yet — this task is pure library code.

- [ ] **Step 1: Author the shared fullscreen-triangle vertex shader**

This is the generic GLSL1-style vertex shader every non-fluid fullscreen pass uses (stars/fog/planet's own vertex differs — this one is for stars/fog/blur/compositor). It's a trivial 6-line shader (confirmed against the `Te` template literal in `world.js`, which contains exactly this body — search anchor `void main() {` right after `out vec2 vUv;` is ambiguous across files, so author it directly instead of citing):

```glsl
// src/lib/shaders/segerman-bg/common/fullscreen-triangle.glsl
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
```

- [ ] **Step 2: Write `types.ts`**

```typescript
// src/lib/three/scenes/segerman-bg/types.ts
import type * as THREE from 'three';

export interface SceneUniforms {
	uTime: { value: number };
	uRes: { value: THREE.Vector2 };
	uDpr: { value: number };
	uMode: { value: number };
}

export interface PointerState {
	x: number;
	y: number;
	dx: number;
	dy: number;
	nx: number;
	ny: number;
	speed: number;
	isDown: boolean;
}
```

- [ ] **Step 3: Write `layer.ts`**

Port of `world.js`'s base class `B` (search anchor: `class B{constructor(){this.needsRender=!0}`). Original: `dirty()` sets the flag; default `loop()` always renders on touch devices (no continuous pointermove to mark dirty), otherwise only renders when dirty.

```typescript
// src/lib/three/scenes/segerman-bg/layer.ts
export abstract class Layer {
	needsRender = true;
	protected isTouch: boolean;

	constructor(isTouch: boolean) {
		this.isTouch = isTouch;
	}

	dirty(): void {
		this.needsRender = true;
	}

	abstract render(): void;

	loop(): void {
		if (this.isTouch) {
			this.render();
			return;
		}
		if (this.needsRender) {
			this.render();
			this.needsRender = false;
		}
	}

	dispose?(): void;
}
```

- [ ] **Step 4: Write `rt-pair.ts`**

Port of `world.js`'s `G(s,t,n)` ping-pong helper (search anchor: `read:new k(s,t,n),write:new k`).

```typescript
// src/lib/three/scenes/segerman-bg/rt-pair.ts
import * as THREE from 'three';

export interface RTPair {
	read: THREE.WebGLRenderTarget;
	write: THREE.WebGLRenderTarget;
	swap(): void;
	setSize(width: number, height: number): void;
	dispose(): void;
}

export function createRTPair(
	width: number,
	height: number,
	options: THREE.RenderTargetOptions
): RTPair {
	const pair: RTPair = {
		read: new THREE.WebGLRenderTarget(width, height, options),
		write: new THREE.WebGLRenderTarget(width, height, options),
		swap() {
			const r = pair.read;
			pair.read = pair.write;
			pair.write = r;
		},
		setSize(w, h) {
			pair.read.setSize(w, h);
			pair.write.setSize(w, h);
		},
		dispose() {
			pair.read.dispose();
			pair.write.dispose();
		}
	};
	return pair;
}
```

- [ ] **Step 5: Write `fullscreen-triangle.ts`**

Port of `world.js`'s `U()` (search anchor: `setAttribute("position",new L([-1,3,0,-1,-1,0,3,-1,0],3))`). This is the classic single-triangle-covers-viewport trick (avoids seams a two-triangle quad can have).

```typescript
// src/lib/three/scenes/segerman-bg/fullscreen-triangle.ts
import * as THREE from 'three';

export function createFullscreenTriangle(): THREE.BufferGeometry {
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute(
		'position',
		new THREE.Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3)
	);
	geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
	return geometry;
}
```

- [ ] **Step 6: Write `placeholder-textures.ts`**

Used by the compositor for the phase-2 texture inputs (titles/texts/images/video) that don't exist yet — a fully transparent 1x1 texture so those `mix()`/`over()` terms contribute nothing.

```typescript
// src/lib/three/scenes/segerman-bg/placeholder-textures.ts
import * as THREE from 'three';

export function createPlaceholderTexture(): THREE.DataTexture {
	const texture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat);
	texture.needsUpdate = true;
	return texture;
}
```

- [ ] **Step 7: Typecheck**

Run: `npm run check`
Expected: no errors in the 6 new files (some "declared but never used" warnings are fine — nothing consumes these yet).

- [ ] **Step 8: Commit**

```bash
git add src/lib/shaders/segerman-bg/common/fullscreen-triangle.glsl src/lib/three/scenes/segerman-bg/types.ts src/lib/three/scenes/segerman-bg/layer.ts src/lib/three/scenes/segerman-bg/rt-pair.ts src/lib/three/scenes/segerman-bg/fullscreen-triangle.ts src/lib/three/scenes/segerman-bg/placeholder-textures.ts
git commit -m "feat(test-bg): add foundation utilities for segerman-bg scene"
```

---

### Task 2: Scene orchestrator skeleton + pointer tracking

**Files:**
- Create: `src/lib/three/scenes/segerman-bg/scene.ts`
- Test: manual, via Task 3's route (this task has no mount point of its own yet)

**Interfaces:**
- Consumes: nothing from other tasks (Task 1 types only, informally — `Scene` doesn't need to import them yet since it defines its own uniforms object inline).
- Produces: `class Scene { constructor(canvas: HTMLCanvasElement); renderer: THREE.WebGLRenderer; camera: THREE.PerspectiveCamera; uniforms: SceneUniforms; pointer: PointerState; isTouch: boolean; isLowDpr: boolean; addLayer(layer: Layer): void; createRenderTarget(scale: number, options?: THREE.RenderTargetOptions): THREE.WebGLRenderTarget; setOutput(drawFn: () => void): void; start(): void; resize(width: number, height: number): void; dispose(): void }` — Tasks 4–9 all call `scene.addLayer()`, `scene.createRenderTarget()`, read `scene.uniforms`/`scene.pointer`.

This task has no visible content by itself (it clears the canvas to black each frame) — verified end-to-end in Task 3 once there's a route to mount it in. Write it now, verify in Task 3.

- [ ] **Step 1: Write `scene.ts`**

Ports: World constructor's renderer/camera setup (search anchor: `this.renderer=new K({canvas:this.canvas`), `createRT` (search anchor: `createRT(t=1){const n=typeof t=="function"`), pointer tracking from the App class in `app-pretty.txt` (search anchor: `const t={id:null,x:0,y:0,px:0,py:0,isDown:!1,started:!1}` — normalized `mouseN` computed as `clientX/width*2-1`, `-(clientY/height)*2+1`), and `resize()`/DPR handling (search anchor: `handleDprChange(){const t=this.getCurrentDpr()`).

```typescript
// src/lib/three/scenes/segerman-bg/scene.ts
import * as THREE from 'three';
import type { Layer } from './layer';
import type { PointerState, SceneUniforms } from './types';
import { createFullscreenTriangle } from './fullscreen-triangle';

export class Scene {
	canvas: HTMLCanvasElement;
	renderer: THREE.WebGLRenderer;
	camera: THREE.PerspectiveCamera;
	scene = new THREE.Scene();
	fullScreenTriangle = createFullscreenTriangle();

	uniforms: SceneUniforms;
	pointer: PointerState = { x: 0, y: 0, dx: 0, dy: 0, nx: 0, ny: 0, speed: 0, isDown: false };

	isTouch: boolean;
	isLowDpr: boolean;
	dpr: number;

	private layers: Layer[] = [];
	private rts: { rt: THREE.WebGLRenderTarget; scaleFn: () => number }[] = [];
	private outputFn: (() => void) | null = null;
	private rafId = 0;
	private width = 0;
	private height = 0;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.isTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
		this.dpr = Math.min(window.devicePixelRatio, 2);
		this.isLowDpr = window.devicePixelRatio <= 1.5;

		this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, powerPreference: 'high-performance' });
		this.renderer.autoClear = false;
		this.renderer.setPixelRatio(this.dpr);
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;

		this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
		this.camera.position.z = 100;

		this.uniforms = {
			uTime: { value: 0 },
			uRes: { value: new THREE.Vector2() },
			uDpr: { value: this.dpr },
			uMode: { value: 0 }
		};

		window.addEventListener('resize', this.handleWindowResize);
		canvas.addEventListener('pointermove', this.onPointerMove, { passive: true });
		canvas.addEventListener('pointerdown', this.onPointerDown, { passive: true });
		canvas.addEventListener('pointerup', this.onPointerUp, { passive: true });
		canvas.addEventListener('pointercancel', this.onPointerUp, { passive: true });

		this.handleWindowResize();
	}

	addLayer(layer: Layer): void {
		this.layers.push(layer);
	}

	createRenderTarget(scale: number, options: THREE.RenderTargetOptions = {}): THREE.WebGLRenderTarget {
		const scaleFn = () => scale;
		const rt = new THREE.WebGLRenderTarget(
			Math.round(this.width * scale),
			Math.round(this.height * scale),
			{ minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false, ...options }
		);
		rt.texture.generateMipmaps = false;
		this.rts.push({ rt, scaleFn });
		return rt;
	}

	/** The final draw call each frame — set once by the compositor (Task 9). Before that, defaults to a black clear. */
	setOutput(drawFn: () => void): void {
		this.outputFn = drawFn;
	}

	private onPointerMove = (event: PointerEvent): void => {
		const nx = (event.clientX / this.width) * 2 - 1;
		const ny = -(event.clientY / this.height) * 2 + 1;
		this.pointer.dx = event.clientX - this.pointer.x;
		this.pointer.dy = event.clientY - this.pointer.y;
		this.pointer.x = event.clientX;
		this.pointer.y = event.clientY;
		this.pointer.nx = nx;
		this.pointer.ny = ny;
		this.pointer.speed = Math.abs(this.pointer.dx) + Math.abs(this.pointer.dy);
	};

	private onPointerDown = (event: PointerEvent): void => {
		this.pointer.isDown = true;
		this.pointer.x = event.clientX;
		this.pointer.y = event.clientY;
	};

	private onPointerUp = (): void => {
		this.pointer.isDown = false;
	};

	private handleWindowResize = (): void => {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.dpr = Math.min(window.devicePixelRatio, 2);
		this.resize(this.width, this.height);
	};

	resize(width: number, height: number): void {
		this.width = width;
		this.height = height;
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.uniforms.uRes.value.set(width, height);
		this.uniforms.uDpr.value = this.dpr;
		this.renderer.setPixelRatio(this.dpr);
		this.renderer.setSize(width, height);
		for (const { rt, scaleFn } of this.rts) {
			rt.setSize(Math.round(width * scaleFn()), Math.round(height * scaleFn()));
		}
		for (const layer of this.layers) layer.dirty();
	}

	private loop = (t: number): void => {
		this.uniforms.uTime.value = t / 1000;
		for (const layer of this.layers) layer.loop();
		this.renderer.setRenderTarget(null);
		this.renderer.clear();
		if (this.outputFn) {
			this.outputFn();
		}
		this.rafId = requestAnimationFrame(this.loop);
	};

	start(): void {
		this.rafId = requestAnimationFrame(this.loop);
	}

	dispose(): void {
		cancelAnimationFrame(this.rafId);
		window.removeEventListener('resize', this.handleWindowResize);
		this.canvas.removeEventListener('pointermove', this.onPointerMove);
		this.canvas.removeEventListener('pointerdown', this.onPointerDown);
		this.canvas.removeEventListener('pointerup', this.onPointerUp);
		this.canvas.removeEventListener('pointercancel', this.onPointerUp);
		for (const layer of this.layers) layer.dispose?.();
		for (const { rt } of this.rts) rt.dispose();
		this.fullScreenTriangle.dispose();
		this.renderer.dispose();
	}
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/three/scenes/segerman-bg/scene.ts
git commit -m "feat(test-bg): add Scene orchestrator skeleton with pointer tracking"
```

---

### Task 3: Route shell (`/test`)

**Files:**
- Create: `src/routes/test/+page.svelte`

**Interfaces:**
- Consumes: `Scene` from Task 2 (`new Scene(canvas)`, `.start()`, `.dispose()`).

- [ ] **Step 1: Write the route**

WebGL2 check pattern ported from `src/lib/three/dev/webgl.svelte` (this route owns its own canvas, so it can't reuse that component's children-gating API — same messaging, different shell), canvas ref pattern from `src/lib/design/module/spiral.svelte`.

```svelte
<!-- src/routes/test/+page.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import { Scene } from '$lib/three/scenes/segerman-bg/scene';

	let canvasRef: HTMLCanvasElement | null = $state(null);
	let webglFailed = $state(false);
	let scene: Scene | null = null;

	onMount(() => {
		const testCanvas = document.createElement('canvas');
		const gl = testCanvas.getContext('webgl2');
		if (!gl) {
			webglFailed = true;
			return;
		}
		if (canvasRef) {
			scene = new Scene(canvasRef);
			scene.start();
		}
	});

	onDestroy(() => {
		scene?.dispose();
		scene = null;
	});
</script>

<svelte:head>
	<title>WebGL Background Test</title>
</svelte:head>

{#if webglFailed}
	<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-10 text-center text-white">
		<h1 class="text-2xl font-black uppercase">{m['webgl.title']()}</h1>
		<p class="mt-6 max-w-sm leading-tight">{m['webgl.description']()}</p>
		<a href="https://get.webgl.org/" target="_blank" rel="noopener noreferrer" class="mt-8 underline">
			{m['webgl.link']()}
		</a>
	</div>
{:else}
	<canvas bind:this={canvasRef} class="fixed inset-0 h-full w-full"></canvas>
{/if}
```

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 3: Verify visually**

Run dev server: `npm run dev` (background)
Use Playwright (`mcp__plugin_playwright_playwright__browser_navigate` to `http://localhost:5173/test`, then `browser_console_messages` and `browser_take_screenshot`).
Expected: full-viewport black canvas, no console errors, no `webgl.title` fallback text visible.
Stop the dev server (or leave running — later tasks reuse it).

- [ ] **Step 4: Commit**

```bash
git add src/routes/test/+page.svelte
git commit -m "feat(test-bg): add /test route shell mounting the background scene"
```

---

### Task 4: Stars layer

**Files:**
- Create: `src/lib/shaders/segerman-bg/stars/fragment.glsl`
- Create: `src/lib/three/scenes/segerman-bg/stars.ts`
- Modify: `src/routes/test/+page.svelte` (temporarily preview this layer directly — replaced in Task 9)

**Interfaces:**
- Consumes: `Layer` (Task 1), `Scene.createRenderTarget`/`.uniforms`/`.fullScreenTriangle`/`.renderer` (Task 2).
- Produces: `class Stars extends Layer { constructor(scene: Scene); renderTarget: THREE.WebGLRenderTarget; get texture(): THREE.Texture }` — Task 9 consumes `.texture` as `tStars`.

- [ ] **Step 1: Extract the fragment shader**

Search `world.js` for the anchor `starGrid(vec2 p`. Copy the full enclosing template literal (the `We` variable — starts with `varying vec2 vUv;\n\nuniform vec2 uRes;` and ends after `void main() { ... }`) verbatim into `src/lib/shaders/segerman-bg/stars/fragment.glsl`.

- [ ] **Step 2: Write `stars.ts`**

Constructor uniforms and RT scale ported from class `Ge` (search anchor: `this.rt=e.W.createRT(e.isSafari?.6:.7)`). Phase-1 values: `uMode=0` (fixed, matches scene global), `uIsIntro=0` (fixed — enables the shooting-star flicker, which is gated off during the original's loader intro), `uFrontBoost` kept for fidelity but inert at `uMode=0`. `uBrightness`/`uDustBrightness` use the "default" (non-work-page) preset values from the original's `brightness`/`dustBrightness` objects.

```typescript
// src/lib/three/scenes/segerman-bg/stars.ts
import * as THREE from 'three';
import { Layer } from './layer';
import type { Scene } from './scene';
import starsFragment from '$lib/shaders/segerman-bg/stars/fragment.glsl';
import fullscreenVertex from '$lib/shaders/segerman-bg/common/fullscreen-triangle.glsl';

export class Stars extends Layer {
	renderTarget: THREE.WebGLRenderTarget;
	private mesh: THREE.Mesh;
	private material: THREE.ShaderMaterial;
	private scene: Scene;

	constructor(scene: Scene) {
		super(scene.isTouch);
		this.scene = scene;
		this.renderTarget = scene.createRenderTarget(scene.isTouch ? 0.6 : 0.7);

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				uRes: scene.uniforms.uRes,
				uMode: scene.uniforms.uMode,
				uTime: scene.uniforms.uTime,
				uColor: { value: new THREE.Color('#001524').convertLinearToSRGB() },
				uDustColor: { value: new THREE.Color('#064c9a').convertLinearToSRGB() },
				uBrightness: { value: 2.8 },
				uStarBrightness: { value: 1.3 },
				uDustBrightness: { value: 0.1 },
				uFrontBoost: { value: 1.3 },
				uIsIntro: { value: 0 }
			},
			vertexShader: fullscreenVertex,
			fragmentShader: starsFragment
		});
		this.mesh = new THREE.Mesh(scene.fullScreenTriangle, this.material);
		this.mesh.frustumCulled = false;
	}

	get texture(): THREE.Texture {
		return this.renderTarget.texture;
	}

	render(): void {
		this.scene.renderer.setRenderTarget(this.renderTarget);
		this.scene.renderer.render(this.mesh, this.scene.camera);
	}

	dispose(): void {
		this.material.dispose();
	}
}
```

- [ ] **Step 3: Temporarily preview this layer**

In `src/routes/test/+page.svelte`'s `onMount`, after `scene.start()`, add:

```typescript
import { Stars } from '$lib/three/scenes/segerman-bg/stars';
// ...
const stars = new Stars(scene);
scene.addLayer(stars);
scene.setOutput(() => {
	const blitMaterial = new THREE.ShaderMaterial({
		uniforms: { tMap: { value: stars.texture } },
		vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}',
		fragmentShader: 'varying vec2 vUv; uniform sampler2D tMap; void main(){gl_FragColor=texture2D(tMap,vUv);}'
	});
	const blitMesh = new THREE.Mesh(scene.fullScreenTriangle, blitMaterial);
	scene.renderer.render(blitMesh, scene.camera);
});
```

(This inline preview block gets deleted in Task 9, replaced by the real compositor. It exists only so this task is independently verifiable.)

- [ ] **Step 4: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 5: Verify visually**

Dev server + Playwright navigate to `/test`, screenshot.
Expected: a starfield (small twinkling points, a soft blue dust glow near center, occasional streaking shooting stars over a few seconds) visible on canvas, no console errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/shaders/segerman-bg/stars/fragment.glsl src/lib/three/scenes/segerman-bg/stars.ts src/routes/test/+page.svelte
git commit -m "feat(test-bg): add procedural Stars layer"
```

---

### Task 5: Fog layer

**Files:**
- Create: `src/lib/shaders/segerman-bg/fog/fragment.glsl`
- Create: `src/lib/three/scenes/segerman-bg/fog.ts`
- Modify: `src/routes/test/+page.svelte` (swap preview to fog — or layer both; see Step 3)

**Interfaces:**
- Consumes: `Layer`, `Scene` (same as Task 4). Also needs a noise texture: load `static/sites/segerman-dev-86ede42f/root-7944de32/textures/noise.png` — copy it to `static/textures/segerman-bg/noise.png` first (SvelteKit serves `static/` at the root, and this repo's convention keeps route-specific static assets namespaced — see `static/movies/` for precedent of top-level asset dirs; `segerman-bg/` subfolder keeps this scene's assets grouped).
- Produces: `class Fog extends Layer { constructor(scene: Scene, noiseTexture: THREE.Texture); renderTarget; get texture(): THREE.Texture }`.

- [ ] **Step 1: Copy the noise texture into `static/`**

```bash
mkdir -p static/textures/segerman-bg
cp static/sites/segerman-dev-86ede42f/root-7944de32/textures/noise.png static/textures/segerman-bg/noise.png
```

- [ ] **Step 2: Extract the fragment shader**

Search `world.js` for the anchor `#define NUM_OCTAVES 8`. Copy the full enclosing template literal (starts with `varying vec2 vUv;\nuniform vec2 uRes;` through the closing `void main() { ... }`) verbatim into `src/lib/shaders/segerman-bg/fog/fragment.glsl`.

- [ ] **Step 3: Write `fog.ts`**

Ported from class `Ae` (search anchor: `this.rt=e.W.createRT(.3)`). Phase-1 uses the original's "home" preset statically (no page-transition animation needed): `uHasFog=1`, `uScale=1.6`, `uDarkMul=1`, `uMidMul=1`, `uLightLift=1` (these were the `animate("home")` GSAP targets in the original — baked in directly here since there's no page to transition from/to).

```typescript
// src/lib/three/scenes/segerman-bg/fog.ts
import * as THREE from 'three';
import { Layer } from './layer';
import type { Scene } from './scene';
import fogFragment from '$lib/shaders/segerman-bg/fog/fragment.glsl';
import fullscreenVertex from '$lib/shaders/segerman-bg/common/fullscreen-triangle.glsl';

export class Fog extends Layer {
	renderTarget: THREE.WebGLRenderTarget;
	private mesh: THREE.Mesh;
	private material: THREE.ShaderMaterial;
	private scene: Scene;

	constructor(scene: Scene, noiseTexture: THREE.Texture) {
		super(scene.isTouch);
		this.scene = scene;
		this.renderTarget = scene.createRenderTarget(0.3);

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				uMode: scene.uniforms.uMode,
				uRes: scene.uniforms.uRes,
				uTime: scene.uniforms.uTime,
				tNoise: { value: noiseTexture },
				tFluid: { value: null },
				uHasFog: { value: 1 },
				uColor: { value: new THREE.Color('#20447e').convertLinearToSRGB() },
				uScale: { value: 1.6 },
				uQSpeed: { value: 0.02 },
				uQYSpeed: { value: 0 },
				uRXSpeed: { value: 0.08 },
				uRYSpeed: { value: 0.08 },
				uFluidStr: { value: 0.003 },
				uDarkMul: { value: 1 },
				uMidMul: { value: 1 },
				uLightLift: { value: 1 },
				uDensityMin: { value: 0.1 },
				uDensityMax: { value: 1 },
				uOffsetX: { value: 0 },
				uOffsetY: { value: 0 }
			},
			vertexShader: fullscreenVertex,
			fragmentShader: fogFragment
		});
		this.mesh = new THREE.Mesh(scene.fullScreenTriangle, this.material);
		this.mesh.frustumCulled = false;
	}

	/** Called by the Fluid layer's owner once fluid exists (Task 6) so fog can distort around the pointer trail. */
	setFluidTexture(texture: THREE.Texture): void {
		this.material.uniforms.tFluid.value = texture;
	}

	get texture(): THREE.Texture {
		return this.renderTarget.texture;
	}

	render(): void {
		this.scene.renderer.setRenderTarget(this.renderTarget);
		this.scene.renderer.render(this.mesh, this.scene.camera);
	}

	dispose(): void {
		this.material.dispose();
	}
}
```

- [ ] **Step 4: Swap the route's temporary preview to fog**

In `src/routes/test/+page.svelte`, replace the `Stars`-only preview block with:

```typescript
import { Fog } from '$lib/three/scenes/segerman-bg/fog';
// ...
const noiseTexture = new THREE.TextureLoader().load('/textures/segerman-bg/noise.png');
const fog = new Fog(scene, noiseTexture);
scene.addLayer(fog);
scene.setOutput(() => {
	const blitMaterial = new THREE.ShaderMaterial({
		uniforms: { tMap: { value: fog.texture } },
		vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}',
		fragmentShader: 'varying vec2 vUv; uniform sampler2D tMap; void main(){gl_FragColor=texture2D(tMap,vUv);}'
	});
	const blitMesh = new THREE.Mesh(scene.fullScreenTriangle, blitMaterial);
	scene.renderer.render(blitMesh, scene.camera);
});
```

(Keep the `Stars` instantiation and `scene.addLayer(stars)` call from Task 4 — just don't preview it this task. Both layers render to their own RTs every frame regardless of which one is currently blitted to screen.)

- [ ] **Step 5: Typecheck**

Run: `npm run check`

- [ ] **Step 6: Verify visually**

Dev server + Playwright, screenshot `/test`.
Expected: drifting blue-ish marble/cloud fog pattern (fbm noise, animating slowly), alpha-blended look (density-based), no console errors, no 404 on `/textures/segerman-bg/noise.png` (check via `browser_network_requests`).

- [ ] **Step 7: Commit**

```bash
git add static/textures/segerman-bg/noise.png src/lib/shaders/segerman-bg/fog/fragment.glsl src/lib/three/scenes/segerman-bg/fog.ts src/routes/test/+page.svelte
git commit -m "feat(test-bg): add fbm Fog layer"
```

---

### Task 6: Fluid simulation layer, wired to pointer

**Files:**
- Create: `src/lib/shaders/segerman-bg/fluid/vertex.glsl`
- Create: `src/lib/shaders/segerman-bg/fluid/clear-fragment.glsl`
- Create: `src/lib/shaders/segerman-bg/fluid/splat-fragment.glsl`
- Create: `src/lib/shaders/segerman-bg/fluid/advection-fragment.glsl`
- Create: `src/lib/shaders/segerman-bg/fluid/divergence-fragment.glsl`
- Create: `src/lib/shaders/segerman-bg/fluid/curl-fragment.glsl`
- Create: `src/lib/shaders/segerman-bg/fluid/vorticity-fragment.glsl`
- Create: `src/lib/shaders/segerman-bg/fluid/pressure-fragment.glsl`
- Create: `src/lib/shaders/segerman-bg/fluid/gradient-subtract-fragment.glsl`
- Create: `src/lib/three/scenes/segerman-bg/fluid.ts`
- Modify: `src/routes/test/+page.svelte`

**Interfaces:**
- Consumes: `Layer`, `Scene`, `createRTPair` (Task 1), `Fog.setFluidTexture` (Task 5).
- Produces: `class FluidSim extends Layer { constructor(scene: Scene); get texture(): THREE.Texture; pushSplat(x: number, y: number, dx: number, dy: number, color: THREE.Vector3): void }`.

This is the biggest single task — a multi-pass GPGPU solver. Every fragment shader is a direct, small extraction; the orchestration in `fluid.ts` is the real work.

- [ ] **Step 1: Extract all 9 fluid shaders**

All nine live in one contiguous run of template literals at the very top of `world.js` — extract in this order, each into its own file:

| Search anchor | Target file |
|---|---|
| `vL = vUv - vec2(texelSize.x` | `fluid/vertex.glsl` (full literal, includes `vR`/`vT`/`vB` too) |
| `FragColor = value * texture(uTexture` | `fluid/clear-fragment.glsl` |
| `vec3 splat = exp` | `fluid/splat-fragment.glsl` |
| `vec2 coord = vUv - dt * texture(uVelocity` | `fluid/advection-fragment.glsl` |
| `float div = 0.5 * (R - L` | `fluid/divergence-fragment.glsl` |
| `float vorticity = R - L - T + B` | `fluid/curl-fragment.glsl` |
| `force *= curl * C` | `fluid/vorticity-fragment.glsl` |
| `float pressure = (L + R + B + T - divergence)` | `fluid/pressure-fragment.glsl` |
| `velocity.xy -= vec2(R - L, T - B)` | `fluid/gradient-subtract-fragment.glsl` |

Each is its own template literal — copy only the one containing each anchor, not the whole file.

- [ ] **Step 2: Write `fluid.ts`**

Ported from class `ye` (search anchor: `this.simRes=n,this.dyeRes=o`) and its `update()` method (search anchor: `update(t=1/60)`), plus the World's actual instantiation params (search anchor: `new ye(this.renderer,{iterations:1`) and per-frame radius/dt logic from `Je.loop` (search anchor: `if(this.fluid){const r=this.fluid.radius`).

Phase-1 constants (back-mode preset, since `uMode` is always 0/back): `simRes=128`, `dyeRes=512`, `iterations=1`, `curlStrength=0` (radius-only splats, no vorticity confinement — matches original instantiation), `densityDissipation=.83`, `velocityDissipation=.9`, `pressureDissipation=.97`, `fluidMaxRadius=16`.

```typescript
// src/lib/three/scenes/segerman-bg/fluid.ts
import * as THREE from 'three';
import { Layer } from './layer';
import type { Scene } from './scene';
import { createRTPair, type RTPair } from './rt-pair';
import fluidVertex from '$lib/shaders/segerman-bg/fluid/vertex.glsl';
import clearFragment from '$lib/shaders/segerman-bg/fluid/clear-fragment.glsl';
import splatFragment from '$lib/shaders/segerman-bg/fluid/splat-fragment.glsl';
import advectionFragment from '$lib/shaders/segerman-bg/fluid/advection-fragment.glsl';
import divergenceFragment from '$lib/shaders/segerman-bg/fluid/divergence-fragment.glsl';
import curlFragment from '$lib/shaders/segerman-bg/fluid/curl-fragment.glsl';
import vorticityFragment from '$lib/shaders/segerman-bg/fluid/vorticity-fragment.glsl';
import pressureFragment from '$lib/shaders/segerman-bg/fluid/pressure-fragment.glsl';
import gradientSubtractFragment from '$lib/shaders/segerman-bg/fluid/gradient-subtract-fragment.glsl';

interface Splat {
	x: number;
	y: number;
	dx: number;
	dy: number;
}

const SIM_RES = 128;
const DYE_RES = 512;
const ITERATIONS = 1;
const CURL_STRENGTH = 0;
const DENSITY_DISSIPATION = 0.83;
const VELOCITY_DISSIPATION = 0.9;
const PRESSURE_DISSIPATION = 0.97;
const MAX_RADIUS = 16;

export class FluidSim extends Layer {
	private scene: Scene;
	private density: RTPair;
	private velocity: RTPair;
	private pressure: RTPair;
	private divergenceRT: THREE.WebGLRenderTarget;
	private curlRT: THREE.WebGLRenderTarget;
	private splats: Splat[] = [];
	private radius = 0;
	private mesh: THREE.Mesh;

	private clearMaterial: THREE.RawShaderMaterial;
	private splatMaterial: THREE.RawShaderMaterial;
	private advectionMaterial: THREE.RawShaderMaterial;
	private divergenceMaterial: THREE.RawShaderMaterial;
	private curlMaterial: THREE.RawShaderMaterial;
	private vorticityMaterial: THREE.RawShaderMaterial;
	private pressureMaterial: THREE.RawShaderMaterial;
	private gradientSubtractMaterial: THREE.RawShaderMaterial;

	constructor(scene: Scene) {
		super(scene.isTouch);
		this.scene = scene;

		const texelSize = { value: new THREE.Vector2(1 / SIM_RES, 1 / SIM_RES) };

		this.density = createRTPair(DYE_RES, DYE_RES, { type: THREE.HalfFloatType, depthBuffer: false });
		this.velocity = createRTPair(SIM_RES, SIM_RES, { type: THREE.HalfFloatType, format: THREE.RGFormat, depthBuffer: false });
		this.pressure = createRTPair(SIM_RES, SIM_RES, {
			type: THREE.HalfFloatType,
			format: THREE.RedFormat,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter,
			depthBuffer: false
		});
		this.divergenceRT = new THREE.WebGLRenderTarget(SIM_RES, SIM_RES, {
			type: THREE.HalfFloatType,
			format: THREE.RedFormat,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter,
			depthBuffer: false
		});
		this.curlRT = new THREE.WebGLRenderTarget(SIM_RES, SIM_RES, {
			type: THREE.HalfFloatType,
			format: THREE.RedFormat,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter,
			depthBuffer: false
		});

		const common = { glslVersion: THREE.GLSL3, vertexShader: fluidVertex, blending: THREE.NoBlending, depthTest: false, depthWrite: false };

		this.clearMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, uTexture: { value: null }, value: { value: PRESSURE_DISSIPATION } }, fragmentShader: clearFragment });
		this.splatMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, uTarget: { value: null }, uAspect: { value: 1 }, color: { value: new THREE.Vector3() }, point: { value: new THREE.Vector2() }, radius: { value: 1 } }, fragmentShader: splatFragment });
		this.advectionMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, dyeTexelSize: { value: new THREE.Vector2(1 / DYE_RES, 1 / DYE_RES) }, uVelocity: { value: null }, uSource: { value: null }, dt: { value: 0.016 }, dissipation: { value: 1 } }, fragmentShader: advectionFragment });
		this.divergenceMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, uVelocity: { value: null } }, fragmentShader: divergenceFragment });
		this.curlMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, uVelocity: { value: null } }, fragmentShader: curlFragment });
		this.vorticityMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, uVelocity: { value: null }, uCurl: { value: null }, curl: { value: CURL_STRENGTH }, dt: { value: 0.016 } }, fragmentShader: vorticityFragment });
		this.pressureMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, uPressure: { value: null }, uDivergence: { value: null } }, fragmentShader: pressureFragment });
		this.gradientSubtractMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, uPressure: { value: null }, uVelocity: { value: null } }, fragmentShader: gradientSubtractFragment });

		this.mesh = new THREE.Mesh(scene.fullScreenTriangle, this.clearMaterial);
		this.mesh.frustumCulled = false;
	}

	get texture(): THREE.Texture {
		return this.density.read.texture;
	}

	/** dx/dy are already scaled (see Scene pointer wiring in Task 6 Step 3). */
	pushSplat(x: number, y: number, dx: number, dy: number): void {
		this.splats.push({ x, y, dx, dy });
	}

	private renderPass(material: THREE.RawShaderMaterial, target: THREE.WebGLRenderTarget): void {
		this.mesh.material = material;
		this.scene.renderer.setRenderTarget(target);
		this.scene.renderer.render(this.mesh, this.scene.camera);
	}

	/** Called every frame by Layer.loop() via render(), but the sim also needs a real dt — Scene passes it through `render`. */
	render(): void {
		this.update(1 / 60);
	}

	update(dtSeconds: number): void {
		const renderer = this.scene.renderer;
		const prevTarget = renderer.getRenderTarget();
		const prevAutoClear = renderer.autoClear;
		renderer.autoClear = false;

		for (const splat of this.splats.splice(0)) {
			this.splatMaterial.uniforms.uTarget.value = this.velocity.read.texture;
			this.splatMaterial.uniforms.point.value.set(splat.x, splat.y);
			this.splatMaterial.uniforms.color.value.set(splat.dx, splat.dy, 1);
			this.splatMaterial.uniforms.radius.value = this.radius / 100;
			this.renderPass(this.splatMaterial, this.velocity.write);
			this.velocity.swap();

			this.splatMaterial.uniforms.uTarget.value = this.density.read.texture;
			this.renderPass(this.splatMaterial, this.density.write);
			this.density.swap();
		}

		this.curlMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
		this.renderPass(this.curlMaterial, this.curlRT);

		this.vorticityMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
		this.vorticityMaterial.uniforms.uCurl.value = this.curlRT.texture;
		this.vorticityMaterial.uniforms.dt.value = dtSeconds;
		this.renderPass(this.vorticityMaterial, this.velocity.write);
		this.velocity.swap();

		this.divergenceMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
		this.renderPass(this.divergenceMaterial, this.divergenceRT);

		this.clearMaterial.uniforms.uTexture.value = this.pressure.read.texture;
		this.clearMaterial.uniforms.value.value = PRESSURE_DISSIPATION;
		this.renderPass(this.clearMaterial, this.pressure.write);
		this.pressure.swap();

		this.pressureMaterial.uniforms.uDivergence.value = this.divergenceRT.texture;
		for (let i = 0; i < ITERATIONS; i++) {
			this.pressureMaterial.uniforms.uPressure.value = this.pressure.read.texture;
			this.renderPass(this.pressureMaterial, this.pressure.write);
			this.pressure.swap();
		}

		this.gradientSubtractMaterial.uniforms.uPressure.value = this.pressure.read.texture;
		this.gradientSubtractMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
		this.renderPass(this.gradientSubtractMaterial, this.velocity.write);
		this.velocity.swap();

		this.advectionMaterial.uniforms.dt.value = dtSeconds;
		this.advectionMaterial.uniforms.dyeTexelSize.value.set(1 / SIM_RES, 1 / SIM_RES);
		this.advectionMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
		this.advectionMaterial.uniforms.uSource.value = this.velocity.read.texture;
		this.advectionMaterial.uniforms.dissipation.value = VELOCITY_DISSIPATION;
		this.renderPass(this.advectionMaterial, this.velocity.write);
		this.velocity.swap();

		this.advectionMaterial.uniforms.dyeTexelSize.value.set(1 / DYE_RES, 1 / DYE_RES);
		this.advectionMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
		this.advectionMaterial.uniforms.uSource.value = this.density.read.texture;
		this.advectionMaterial.uniforms.dissipation.value = DENSITY_DISSIPATION;
		this.renderPass(this.advectionMaterial, this.density.write);
		this.density.swap();

		renderer.autoClear = prevAutoClear;
		renderer.setRenderTarget(prevTarget);
	}

	/** Called once per frame from the route before layer.loop() runs — see Task 6 Step 3. */
	updateRadiusFromSpeed(speed: number): void {
		const target = Math.min(Math.max(speed, 0), MAX_RADIUS) * 0.01;
		this.radius += (target - this.radius) * 0.1;
	}

	dispose(): void {
		this.density.dispose();
		this.velocity.dispose();
		this.pressure.dispose();
		this.divergenceRT.dispose();
		this.curlRT.dispose();
		for (const m of [this.clearMaterial, this.splatMaterial, this.advectionMaterial, this.divergenceMaterial, this.curlMaterial, this.vorticityMaterial, this.pressureMaterial, this.gradientSubtractMaterial]) {
			m.dispose();
		}
	}
}
```

`splatMaterial.uniforms.uAspect` is set once at creation time via the caller (Task 9 sets it on resize, matching original's `fluid.splatMaterial.uniforms.uAspect.value=e.aspectRatio`); note this in Task 9, not here — `fluid.ts` exposes the material implicitly through construction but phase-1 doesn't need a public setter since Task 9 wires resize centrally. *(Correction if the reviewer flags it: expose `setAspect(aspect: number)` on `FluidSim` if Task 9 needs external access — the material is currently private.)* Add this now to avoid the churn:

- [ ] **Step 2b: Add an aspect setter**

Add to `FluidSim`, right after `pushSplat`:

```typescript
	setAspect(aspect: number): void {
		this.splatMaterial.uniforms.uAspect.value = aspect;
	}
```

- [ ] **Step 3: Wire pointer → splats in the route**

In `src/routes/test/+page.svelte`, replace the fog preview block with the fluid preview, and add pointer→splat wiring. This block also introduces the "push a splat on pointer move past a small threshold" logic ported from the App class's `mousemove` (search anchor in `app-pretty.txt`: `this.lenis.on('virtual-scroll'` is unrelated — use the World's own `mousemove(t)` method instead, search anchor in `world.js`: `if(this.speed=Math.abs(r)+Math.abs(i), Math.abs(r)>.2||Math.abs(i)>.2)`):

```typescript
import { FluidSim } from '$lib/three/scenes/segerman-bg/fluid';
// ...
const fluid = new FluidSim(scene);
scene.addLayer(fluid);
fog.setFluidTexture(fluid.texture);
fluid.setAspect(window.innerWidth / window.innerHeight);
window.addEventListener('resize', () => fluid.setAspect(window.innerWidth / window.innerHeight));

canvasRef?.addEventListener('pointermove', () => {
	fluid.updateRadiusFromSpeed(scene.pointer.speed);
	if (Math.abs(scene.pointer.dx) > 0.2 || Math.abs(scene.pointer.dy) > 0.2) {
		fluid.pushSplat(
			scene.pointer.x / window.innerWidth,
			1 - scene.pointer.y / window.innerHeight,
			scene.pointer.dx * 5,
			scene.pointer.dy * -5
		);
	}
});

scene.setOutput(() => {
	const blitMaterial = new THREE.ShaderMaterial({
		uniforms: { tMap: { value: fluid.texture } },
		vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}',
		fragmentShader: 'varying vec2 vUv; uniform sampler2D tMap; void main(){gl_FragColor=texture2D(tMap,vUv);}'
	});
	const blitMesh = new THREE.Mesh(scene.fullScreenTriangle, blitMaterial);
	scene.renderer.render(blitMesh, scene.camera);
});
```

- [ ] **Step 4: Typecheck**

Run: `npm run check`

- [ ] **Step 5: Verify visually**

Dev server + Playwright: navigate to `/test`, use `browser_evaluate` or `mcp__plugin_playwright_playwright__browser_hover`/mouse-move actions to move the pointer across the canvas a few times, then screenshot.
Expected: a colored ink trail follows the pointer path and fades/dissipates over roughly a second; canvas is black where the pointer hasn't been. No console errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/shaders/segerman-bg/fluid/ src/lib/three/scenes/segerman-bg/fluid.ts src/routes/test/+page.svelte
git commit -m "feat(test-bg): add GPGPU fluid sim, wired to pointer movement"
```

---

### Task 7: Blur utility + Planet layer (no crack trail yet)

**Files:**
- Create: `src/lib/shaders/segerman-bg/blur/fragment.glsl`
- Create: `src/lib/three/scenes/segerman-bg/blur.ts`
- Create: `src/lib/shaders/segerman-bg/planet/vertex.glsl`
- Create: `src/lib/shaders/segerman-bg/planet/fragment.glsl`
- Create: `src/lib/three/scenes/segerman-bg/planet.ts`
- Modify: `src/routes/test/+page.svelte`

**Interfaces:**
- Consumes: `Layer`, `Scene`, `createFullscreenTriangle` (already on `Scene.fullScreenTriangle`).
- Produces: `class Blur { apply(source: THREE.Texture, rtA: THREE.WebGLRenderTarget, rtB: THREE.WebGLRenderTarget, strength?: number): THREE.Texture }`; `class Planet extends Layer { constructor(scene: Scene, textures: { map: THREE.Texture; cracked: THREE.Texture; crackedNormal: THREE.Texture }); mesh: THREE.Mesh; get texture(): THREE.Texture; get blurTexture(): THREE.Texture }` — Task 8 adds the hover-crack trail on top of this; Task 9 consumes `.texture`/`.blurTexture` as `tPlanet`/`tPlanetBlur`.

- [ ] **Step 1: Extract the blur fragment shader**

Search `world.js` for `sum += texture(image, uv - 4.0`. This anchor is inside the `blur()` GLSL *function* (not a full shader) — the actual fragment shader that calls it is the *next* template literal, which contains `FragColor = blur(tMap, vUv, uResolution, uBluriness * uDirection);`. Copy **that second literal's full contents** (it starts with `precision highp float;\n\nuniform sampler2D tMap;` and already includes the `blur()` function body inlined via `${Be}` in the source — since we're extracting statically, first copy the `blur()` function template literal (anchor `sum += texture(image, uv - 4.0`) into the top of the file, then copy the fragment literal (anchor `FragColor = blur(tMap, vUv, uResolution`) below it, in that order, into one file: `src/lib/shaders/segerman-bg/blur/fragment.glsl`.

- [ ] **Step 2: Write `blur.ts`**

Ported from `_` (blur material, search anchor: `new f(.5,.5)){super({glslVersion:x`) and `Ce` (search anchor: `apply(t,n,o,r=1){const i=e.W.renderer`). Note the blur *vertex* shader is the same generic one from Task 1 — the original's `Te` constant is identical in content, so reuse `fullscreen-triangle.glsl`.

```typescript
// src/lib/three/scenes/segerman-bg/blur.ts
import * as THREE from 'three';
import type { Scene } from './scene';
import blurFragment from '$lib/shaders/segerman-bg/blur/fragment.glsl';
import fullscreenVertex from '$lib/shaders/segerman-bg/common/fullscreen-triangle.glsl';

export class Blur {
	private scene: Scene;
	private hMaterial: THREE.ShaderMaterial;
	private vMaterial: THREE.ShaderMaterial;
	private mesh: THREE.Mesh;

	constructor(scene: Scene) {
		this.scene = scene;
		this.hMaterial = new THREE.ShaderMaterial({
			uniforms: { tMap: { value: null }, uBluriness: { value: 1 }, uDirection: { value: new THREE.Vector2(1, 0) }, uResolution: { value: new THREE.Vector2() } },
			vertexShader: fullscreenVertex,
			fragmentShader: blurFragment
		});
		this.vMaterial = new THREE.ShaderMaterial({
			uniforms: { tMap: { value: null }, uBluriness: { value: 1 }, uDirection: { value: new THREE.Vector2(0, 1) }, uResolution: { value: new THREE.Vector2() } },
			vertexShader: fullscreenVertex,
			fragmentShader: blurFragment
		});
		this.mesh = new THREE.Mesh(scene.fullScreenTriangle, this.hMaterial);
		this.mesh.frustumCulled = false;
	}

	apply(source: THREE.Texture, rtA: THREE.WebGLRenderTarget, rtB: THREE.WebGLRenderTarget, strength = 1): THREE.Texture {
		const renderer = this.scene.renderer;
		this.hMaterial.uniforms.uBluriness.value = strength;
		this.vMaterial.uniforms.uBluriness.value = strength;
		this.hMaterial.uniforms.uResolution.value.set(rtA.width, rtA.height);
		this.vMaterial.uniforms.uResolution.value.set(rtB.width, rtB.height);

		this.hMaterial.uniforms.tMap.value = source;
		this.mesh.material = this.hMaterial;
		renderer.setRenderTarget(rtA);
		renderer.render(this.mesh, this.scene.camera);

		this.vMaterial.uniforms.tMap.value = rtA.texture;
		this.mesh.material = this.vMaterial;
		renderer.setRenderTarget(rtB);
		renderer.render(this.mesh, this.scene.camera);

		return rtB.texture;
	}

	dispose(): void {
		this.hMaterial.dispose();
		this.vMaterial.dispose();
	}
}
```

- [ ] **Step 3: Extract the planet vertex shader**

Search `world.js` for `float terrain(vec3 p)`. Copy the full enclosing template literal (`Pe` — starts with `vec4 permute(vec4 x)...` noise helpers through the closing `gl_Position = ...` in `main()`) verbatim into `src/lib/shaders/segerman-bg/planet/vertex.glsl`.

- [ ] **Step 4: Extract the planet fragment shader**

Search `world.js` for `float crackLuma`. Copy the full enclosing template literal (`Ie` — starts with `varying vec3 vNormal;` through the final `gl_FragColor = vec4(col, 1.0);`) verbatim into `src/lib/shaders/segerman-bg/planet/fragment.glsl`.

- [ ] **Step 5: Write `planet.ts`**

Ported from class `Le`'s constructor (search anchor: `this.rt=e.W.createRT(this.scale)`, and note `this.scale=e.isMobile?1:.8` for RT sizing) and geometry setup (search anchor: `const n=new V(93,128,128);n.computeTangents()`). Uses the "home" preset from the original's `pages.home` object (search anchor: `home:{position:{x:62,y:-26,z:-10}`) baked in statically (no page-transition GSAP needed in phase 1). Crack-trail wiring (`uMouseWorld`, `uMouseStrength`, `tCrackedNormal` sampling, trail RT) is added in Task 8 — this task's uniforms include the crack-related ones (they're part of the fragment shader's uniform block regardless) but `uCrackActive` stays `0` until Task 8 wires the trail RT.

```typescript
// src/lib/three/scenes/segerman-bg/planet.ts
import * as THREE from 'three';
import { Layer } from './layer';
import type { Scene } from './scene';
import { Blur } from './blur';
import planetVertex from '$lib/shaders/segerman-bg/planet/vertex.glsl';
import planetFragment from '$lib/shaders/segerman-bg/planet/fragment.glsl';

export interface PlanetTextures {
	map: THREE.Texture;
	cracked: THREE.Texture;
	crackedNormal: THREE.Texture;
}

export class Planet extends Layer {
	mesh: THREE.Mesh;
	renderTarget: THREE.WebGLRenderTarget;
	private scene: Scene;
	private material: THREE.ShaderMaterial;
	private innerScene = new THREE.Scene();
	private blur: Blur;
	private blurRTA: THREE.WebGLRenderTarget;
	private blurRTB: THREE.WebGLRenderTarget;
	private blurTextureValue: THREE.Texture | null = null;

	constructor(scene: Scene, textures: PlanetTextures) {
		super(scene.isTouch);
		this.scene = scene;

		const scale = scene.isMobile ? 1 : 0.8;
		this.renderTarget = scene.createRenderTarget(scale);
		this.blur = new Blur(scene);
		this.blurRTA = scene.createRenderTarget(0.15);
		this.blurRTB = scene.createRenderTarget(0.15);

		const geometry = new THREE.SphereGeometry(93, 128, 128);
		geometry.computeTangents();

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				uColor: { value: new THREE.Color('#00060a').convertLinearToSRGB() },
				uRimPow: { value: 4.5 },
				uGlowPow: { value: 3.2 },
				uGlowStr: { value: 1 },
				uRimStr: { value: 0 },
				uLightColor: { value: new THREE.Color('#81aeca') },
				uDarkColor: { value: new THREE.Color('#436eb1') },
				uLightStart: { value: 0.4 },
				uLightEnd: { value: 1 },
				uTerrainScale: { value: 3.9 },
				uTerrainHeight: { value: 0.7 },
				uTerrainDetail: { value: 1.5 },
				uTerrainTime: { value: 0 },
				uGlowBiasX: { value: -0.6 },
				uGlowBiasY: { value: 0 },
				uBiasGlowStr: { value: 1.5 },
				uBiasGlowPow: { value: 7 },
				uMouseWorld: { value: new THREE.Vector3(0, 0, 1000) },
				uMouseRadius: { value: 0.9 },
				uMouseStrength: { value: 0 },
				uTime: scene.uniforms.uTime,
				uMode: scene.uniforms.uMode,
				uIsIntro: { value: 0 },
				uIsMobile: { value: scene.isMobile ? 1 : 0 },
				uRes: scene.uniforms.uRes,
				tMap: { value: textures.map },
				tCracked: { value: textures.cracked },
				tCrackedNormal: { value: textures.crackedNormal },
				uTrailMap: { value: null },
				uRevealRadius: { value: 1.5 },
				uCrackStr: { value: 2 },
				uCrackActive: { value: 0 },
				uNormalStr: { value: 1.2 }
			},
			vertexShader: planetVertex,
			fragmentShader: planetFragment
		});

		this.mesh = new THREE.Mesh(geometry, this.material);
		this.mesh.position.set(62, -26, -10);
		this.innerScene.add(this.mesh);
	}

	get texture(): THREE.Texture {
		return this.renderTarget.texture;
	}

	get blurTexture(): THREE.Texture {
		return this.blurTextureValue ?? this.renderTarget.texture;
	}

	/** Exposed for Task 8 (hover-crack trail) to set the trail render target's texture and drive uCrackActive/uMouseStrength. */
	get uniforms() {
		return this.material.uniforms;
	}

	render(): void {
		this.material.uniforms.uTerrainTime.value += (1 / 60) * 0.1;
		this.mesh.rotation.y += 0.0008;

		this.scene.renderer.setRenderTarget(this.renderTarget);
		this.scene.renderer.render(this.innerScene, this.scene.camera);

		this.blurTextureValue = this.blur.apply(this.renderTarget.texture, this.blurRTA, this.blurRTB, 1);
	}

	dispose(): void {
		this.mesh.geometry.dispose();
		this.material.dispose();
		this.blur.dispose();
	}
}
```

`scene.isMobile` doesn't exist on `Scene` yet — add it now:

- [ ] **Step 5b: Add `isMobile` to `Scene`**

In `src/lib/three/scenes/segerman-bg/scene.ts`, add a public field next to `isTouch`:

```typescript
	isMobile: boolean;
```

and in the constructor, next to the `isTouch` assignment:

```typescript
		this.isMobile = window.matchMedia('(max-width: 767px)').matches;
```

- [ ] **Step 6: Load planet textures and preview in the route**

Copy the three planet textures into `static/` (same convention as Task 5's noise texture):

```bash
mkdir -p static/textures/segerman-bg
cp static/sites/segerman-dev-86ede42f/root-7944de32/textures/planet.webp static/textures/segerman-bg/planet.webp
cp static/sites/segerman-dev-86ede42f/root-7944de32/textures/cracked.webp static/textures/segerman-bg/cracked.webp
cp static/sites/segerman-dev-86ede42f/root-7944de32/textures/cracked-normal.webp static/textures/segerman-bg/cracked-normal.webp
```

In `src/routes/test/+page.svelte`, replace the fluid preview's `scene.setOutput` with:

```typescript
import { Planet } from '$lib/three/scenes/segerman-bg/planet';

const textureLoader = new THREE.TextureLoader();
const planet = new Planet(scene, {
	map: textureLoader.load('/textures/segerman-bg/planet.webp'),
	cracked: textureLoader.load('/textures/segerman-bg/cracked.webp'),
	crackedNormal: textureLoader.load('/textures/segerman-bg/cracked-normal.webp')
});
scene.addLayer(planet);

scene.setOutput(() => {
	const blitMaterial = new THREE.ShaderMaterial({
		uniforms: { tMap: { value: planet.texture } },
		vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}',
		fragmentShader: 'varying vec2 vUv; uniform sampler2D tMap; void main(){gl_FragColor=texture2D(tMap,vUv);}'
	});
	const blitMesh = new THREE.Mesh(scene.fullScreenTriangle, blitMaterial);
	scene.renderer.render(blitMesh, scene.camera);
});
```

Also mark the planet layer dirty every frame regardless of pointer activity (it idle-rotates continuously) — in `Planet`, override `loop()`:

- [ ] **Step 6b: Always-render override**

Add to `Planet`, replacing the inherited `loop()`:

```typescript
	loop(): void {
		this.render();
	}
```

(Matches the original's touch-vs-dirty distinction being moot here — the planet always animates via rotation/terrain time, so it always needs a fresh frame, same as the original's `isBackMode` branch in `Le.loop`.)

- [ ] **Step 7: Typecheck**

Run: `npm run check`

- [ ] **Step 8: Verify visually**

Dev server + Playwright, screenshot `/test`.
Expected: a glowing, terrain-displaced sphere with a blue rim light, slowly rotating, positioned toward the right/upper area of the viewport (position `(62,-26,-10)` relative to a camera at `z=100` looking down `-z`). No console errors, no 404s on the three `.webp` textures.

- [ ] **Step 9: Commit**

```bash
git add src/lib/shaders/segerman-bg/blur/ src/lib/three/scenes/segerman-bg/blur.ts src/lib/shaders/segerman-bg/planet/vertex.glsl src/lib/shaders/segerman-bg/planet/fragment.glsl src/lib/three/scenes/segerman-bg/planet.ts src/lib/three/scenes/segerman-bg/scene.ts static/textures/segerman-bg/planet.webp static/textures/segerman-bg/cracked.webp static/textures/segerman-bg/cracked-normal.webp src/routes/test/+page.svelte
git commit -m "feat(test-bg): add blur utility and Planet layer (terrain + rim glow)"
```

---

### Task 8: Planet hover-crack trail

**Files:**
- Create: `src/lib/shaders/segerman-bg/planet/trail-vertex.glsl`
- Create: `src/lib/shaders/segerman-bg/planet/trail-fragment.glsl`
- Modify: `src/lib/three/scenes/segerman-bg/planet.ts`
- Modify: `src/routes/test/+page.svelte`

**Interfaces:**
- Consumes: `Planet.uniforms` (Task 7's getter), `Scene.camera`/`.pointer` (Task 2).
- Produces: `Planet.setPointerNDC(nx: number, ny: number): void` — called every frame by the route with the current normalized pointer coordinates.

- [ ] **Step 1: Extract the trail shaders**

Search `world.js` for `gl_FragColor = vec4(max(existing, stamp)` — copy the enclosing template literal (`ze`, starts with `uniform sampler2D tTrail;`) into `src/lib/shaders/segerman-bg/planet/trail-fragment.glsl`.

Search `world.js` for `gl_Position = vec4(position.xy, 0.0, 1.0)` — copy the enclosing template literal (`Ue`, a 3-line shader) into `src/lib/shaders/segerman-bg/planet/trail-vertex.glsl`.

- [ ] **Step 2: Add the trail ping-pong system to `Planet`**

Ported from `Le`'s constructor trail setup (search anchor: `this.trailRTA=new k(512,256,{minFilter:w,magFilter:w,format:D,type:R})`) and `render()`'s crack-mode block (search anchor: `if(this.crackMode>.001)`) and `mousemove()` (search anchor: `this.raycaster.setFromCamera(this.mouseVec,e.W.camera)`).

Deviation from the original (documented per spec Section 4): the original only shows cracks on the `"work"` page. Phase 1 has no pages, so crack-mode is **always active** — `crackMode` ramps toward `1` unconditionally instead of being gated by `pageId==="work"`.

In `src/lib/three/scenes/segerman-bg/planet.ts`, add these imports:

```typescript
import trailVertex from '$lib/shaders/segerman-bg/planet/trail-vertex.glsl';
import trailFragment from '$lib/shaders/segerman-bg/planet/trail-fragment.glsl';
```

Add these fields to the `Planet` class (alongside the existing `blurTextureValue` field):

```typescript
	private raycaster = new THREE.Raycaster();
	private pointerNDC = new THREE.Vector2();
	private mouseWorldTarget = new THREE.Vector3();
	private mouseUVTarget = new THREE.Vector2();
	private mouseHoverTarget = 0;
	private mouseHover = 0;
	private crackMode = 0;
	private trailRTA: THREE.WebGLRenderTarget;
	private trailRTB: THREE.WebGLRenderTarget;
	private trailMaterial: THREE.ShaderMaterial;
	private trailMesh: THREE.Mesh;
	private trailScene = new THREE.Scene();
	private trailCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
```

In the constructor, after the existing `this.mesh`/`this.innerScene.add(this.mesh)` lines, add:

```typescript
		this.trailRTA = new THREE.WebGLRenderTarget(512, 256, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RedFormat, type: THREE.HalfFloatType });
		this.trailRTB = this.trailRTA.clone();
		this.trailMaterial = new THREE.ShaderMaterial({
			uniforms: {
				tTrail: { value: null },
				uRes: { value: new THREE.Vector2(512, 256) },
				uMouseUV: { value: new THREE.Vector2(0.5, 0.5) },
				uDecay: { value: 0.995 },
				uStampRadius: { value: 0.06 },
				uActive: { value: 0 }
			},
			vertexShader: trailVertex,
			fragmentShader: trailFragment
		});
		this.trailMesh = new THREE.Mesh(scene.fullScreenTriangle, this.trailMaterial);
		this.trailScene.add(this.trailMesh);
```

Add a method to receive normalized pointer coordinates each frame (called from the route, since `Scene` doesn't know about the planet mesh):

```typescript
	setPointerNDC(nx: number, ny: number): void {
		this.pointerNDC.set(nx, ny);
		this.raycaster.setFromCamera(this.pointerNDC, this.scene.camera);
		const hits = this.raycaster.intersectObject(this.mesh);
		if (hits.length > 0 && hits[0].uv) {
			this.mouseWorldTarget.copy(hits[0].point);
			this.mouseUVTarget.copy(hits[0].uv);
			this.mouseHoverTarget = 1;
		} else {
			this.mouseHoverTarget = 0;
		}
	}
```

Replace the `render()` method's body (keep the terrain-time/rotation lines at the top) by inserting the trail-stamp and hover-lerp logic right after the existing rotation update and before the `this.scene.renderer.setRenderTarget(this.renderTarget)` line:

```typescript
		this.crackMode += (1 - this.crackMode) * 0.03;
		this.mouseHover += (this.mouseHoverTarget - this.mouseHover) * 0.04;
		if (this.mouseHoverTarget === 1) {
			this.material.uniforms.uMouseWorld.value.lerp(this.mouseWorldTarget, 0.06);
		}
		this.material.uniforms.uMouseStrength.value = this.mouseHover * this.crackMode * 0.9;
		this.material.uniforms.uCrackActive.value = this.crackMode;

		if (this.crackMode > 0.001) {
			this.trailMaterial.uniforms.tTrail.value = this.trailRTA.texture;
			this.trailMaterial.uniforms.uActive.value = this.mouseHoverTarget * this.crackMode;
			this.trailMaterial.uniforms.uMouseUV.value.copy(this.mouseUVTarget);
			this.scene.renderer.setRenderTarget(this.trailRTB);
			this.scene.renderer.render(this.trailScene, this.trailCamera);
			[this.trailRTA, this.trailRTB] = [this.trailRTB, this.trailRTA];
			this.material.uniforms.uTrailMap.value = this.trailRTA.texture;
		}
```

Update `dispose()` to also clean up the trail RTs/material:

```typescript
		this.trailRTA.dispose();
		this.trailRTB.dispose();
		this.trailMaterial.dispose();
```

- [ ] **Step 3: Wire pointer NDC into the planet each frame**

In `src/routes/test/+page.svelte`, add a `pointermove` handler (alongside the existing fluid one from Task 6) that also updates the planet:

```typescript
canvasRef?.addEventListener('pointermove', (event) => {
	const nx = (event.clientX / window.innerWidth) * 2 - 1;
	const ny = -(event.clientY / window.innerHeight) * 2 + 1;
	planet.setPointerNDC(nx, ny);
});
```

- [ ] **Step 4: Typecheck**

Run: `npm run check`

- [ ] **Step 5: Verify visually**

Dev server + Playwright: navigate to `/test`, hover the pointer over the visible planet sphere for ~1-2 seconds, screenshot; then move away and screenshot again after another second.
Expected: crack texture (a fine grid pattern with a lit rim) fades in at the cursor's projected position on the sphere while hovering, and fades back out after the pointer moves off. No console errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/shaders/segerman-bg/planet/trail-vertex.glsl src/lib/shaders/segerman-bg/planet/trail-fragment.glsl src/lib/three/scenes/segerman-bg/planet.ts src/routes/test/+page.svelte
git commit -m "feat(test-bg): add planet hover-reveal crack trail"
```

---

### Task 9: Compositor — combine all layers, replace debug preview

**Files:**
- Create: `src/lib/shaders/segerman-bg/compositor/back-fragment.glsl`
- Create: `src/lib/shaders/segerman-bg/compositor/output-fragment.glsl`
- Create: `src/lib/three/scenes/segerman-bg/compositor.ts`
- Modify: `src/routes/test/+page.svelte` (remove all the per-layer debug `setOutput` blocks from Tasks 4–7, replace with the real compositor)

**Interfaces:**
- Consumes: `Stars.texture`, `Fog.texture`, `Fluid.texture`, `Planet.texture`/`.blurTexture` (Tasks 4-8), `createPlaceholderTexture` (Task 1).
- Produces: `class Compositor { constructor(scene: Scene, layers: {...}); render(): void }` — the route calls `compositor.render()` from `scene.setOutput(() => compositor.render())`.

- [ ] **Step 1: Extract and strip the back-compositor fragment shader**

Search `world.js` for `uniform sampler2D tImagesBackBloom` — this string appears twice (once in the back-compositor `Re`, once in the near-duplicate `Se` used only for the page-transition capture pass, which is out of phase-1 scope). Use the **first** occurrence's enclosing template literal (`Re` — it's the one whose class immediately above it in the file is `Me`, i.e. it directly follows the `Me`/Output class definition; the second occurrence's literal, `Se`, is the one immediately preceding `class ke extends B` — skip that one entirely).

Copy `Re`'s full literal (starts with `vec4 over(vec4 src, vec4 dst) {` through `gl_FragColor = vec4(col, 1.);`) into `src/lib/shaders/segerman-bg/compositor/back-fragment.glsl`, then make these phase-3 strips (page-transition burn effect, out of scope per spec):

1. Delete the line `uniform sampler2D tNoise;`
2. Delete the line `uniform sampler2D tTransBackContent;`
3. Delete the line `uniform float uTransProgress;`
4. Delete the entire function:
   ```glsl
   float burnFBM(vec2 p) {
       float v = 0., a = 0.5;
       for (int i = 0; i < 4; i++) {
           v += a * texture2D(tNoise, p / 100. + uTime * 0.001).r;
           p *= 2.2; a *= 0.5;
       }
       return v;
   }
   ```
5. Delete the block between (and including) `float aspect =  uRes.y / uRes.x;` and `col = mix(col, transContent.rgb, transContent.a);` (11 lines — the burn-transition edge/glow computation and its `mix` into `col`). **Keep** the surrounding `float grainy = grain(...)` line above it and `col += grainy;` / `gl_FragColor = vec4(col, 1.);` lines below it — those two survive untouched.

- [ ] **Step 2: Author the output fragment shader**

This is new, phase-1-specific code — the original's `be`/Output shader implements a front↔back page-toggle crossfade that doesn't apply here (spec Section 3: `uMode` fixed at `0`, no toggle). Phase 1's output is a direct passthrough of the back-compositor's result:

```glsl
// src/lib/shaders/segerman-bg/compositor/output-fragment.glsl
varying vec2 vUv;
uniform sampler2D tBack;

void main() {
    gl_FragColor = texture2D(tBack, vUv);
}
```

- [ ] **Step 3: Write `compositor.ts`**

Ported from class `ke`'s constructor (search anchor: `this.glowStr={home:.9,work:.4,info:.1,error:0}`) minus the transition-texture/gui-control/front-scale machinery (all out of phase-1 scope), and the `Me`/Output pattern simplified to the passthrough from Step 2.

```typescript
// src/lib/three/scenes/segerman-bg/compositor.ts
import * as THREE from 'three';
import type { Scene } from './scene';
import type { Stars } from './stars';
import type { Fog } from './fog';
import type { FluidSim } from './fluid';
import type { Planet } from './planet';
import { createPlaceholderTexture } from './placeholder-textures';
import backFragment from '$lib/shaders/segerman-bg/compositor/back-fragment.glsl';
import outputFragment from '$lib/shaders/segerman-bg/compositor/output-fragment.glsl';
import fullscreenVertex from '$lib/shaders/segerman-bg/common/fullscreen-triangle.glsl';

export interface CompositorLayers {
	stars: Stars;
	fog: Fog;
	fluid: FluidSim;
	planet: Planet;
}

export class Compositor {
	private scene: Scene;
	private backRT: THREE.WebGLRenderTarget;
	private backMaterial: THREE.ShaderMaterial;
	private backMesh: THREE.Mesh;
	private outputMaterial: THREE.ShaderMaterial;
	private outputMesh: THREE.Mesh;
	private placeholder = createPlaceholderTexture();

	constructor(scene: Scene, layers: CompositorLayers) {
		this.scene = scene;
		this.backRT = scene.createRenderTarget(scene.isMobile ? scene.dpr : Math.min(scene.dpr, 1.5));

		this.backMaterial = new THREE.ShaderMaterial({
			uniforms: {
				uMode: scene.uniforms.uMode,
				tFluid: { value: layers.fluid.texture },
				tStars: { value: layers.stars.texture },
				tPlanet: { value: layers.planet.texture },
				tPlanetBlur: { value: layers.planet.blurTexture },
				tFog: { value: layers.fog.texture },
				tTexts: { value: this.placeholder },
				tTitlesSoft: { value: this.placeholder },
				tTitlesBlur: { value: this.placeholder },
				tImagesBack: { value: this.placeholder },
				tImagesBackBloom: { value: this.placeholder },
				tVideo: { value: this.placeholder },
				uTime: scene.uniforms.uTime,
				uRes: scene.uniforms.uRes,
				uDpr: scene.uniforms.uDpr,
				uIsMobile: { value: scene.isMobile ? 1 : 0 },
				uHasFog: { value: 1 },
				uTextColor: { value: new THREE.Color('#ffffff').convertLinearToSRGB() },
				uLabelColor: { value: new THREE.Color('#93949f').convertLinearToSRGB() },
				uGrainAmount: { value: 0.025 },
				uFogFloor: { value: 0.3 },
				uFogColorStr: { value: 1.9 },
				uBloomTint: { value: 0.01 },
				uBloomTintThreshold: { value: 0.95 },
				uBloomBleed: { value: 0.6 },
				uGlowStrength: { value: 0.9 },
				uGlowFogDull: { value: 0.05 },
				uOnPlaneBloom: { value: 0.3 },
				uFogAmbient: { value: 2 },
				uProjMaskMin: { value: 0 },
				uProjMaskMax: { value: 0 },
				uCentreProxMin: { value: 0 },
				uCentreProxMax: { value: 0.8 },
				uFogErosionEdge: { value: 0.9 },
				uFogErosionCentre: { value: 0.1 },
				uMediaCurveEdge: { value: 1.5 },
				uSmokeBrightness: { value: 0.7 },
				uSmokeFogMod: { value: 0.6 },
				uSmokeDesat: { value: 0.3 },
				uStarsRGB: { value: 0.001 },
				uImagesRGB: { value: 0.001 },
				uVideoRGB: { value: 0.001 },
				uFogRGB: { value: 0.007 },
				uPlanetBlurAmt: { value: 1 }
			},
			vertexShader: fullscreenVertex,
			fragmentShader: backFragment
		});
		this.backMesh = new THREE.Mesh(scene.fullScreenTriangle, this.backMaterial);
		this.backMesh.frustumCulled = false;

		this.outputMaterial = new THREE.ShaderMaterial({
			uniforms: { tBack: { value: this.backRT.texture } },
			vertexShader: fullscreenVertex,
			fragmentShader: outputFragment
		});
		this.outputMesh = new THREE.Mesh(scene.fullScreenTriangle, this.outputMaterial);
		this.outputMesh.frustumCulled = false;
	}

	/** Always renders every frame in phase 1 — the scene is permanently in "back"/3D mode (uMode=0), which is the original's always-render branch (see spec Section 3). */
	render(): void {
		const renderer = this.scene.renderer;
		renderer.setRenderTarget(this.backRT);
		renderer.render(this.backMesh, this.scene.camera);

		renderer.setRenderTarget(null);
		renderer.render(this.outputMesh, this.scene.camera);
	}

	dispose(): void {
		this.backMaterial.dispose();
		this.outputMaterial.dispose();
	}
}
```

- [ ] **Step 4: Replace the route's debug preview with the real compositor**

In `src/routes/test/+page.svelte`, delete every `scene.setOutput(() => { const blitMaterial = ... })` block introduced in Tasks 4-7 (there should be exactly one active at a time if each task's Step was followed in order — remove whichever is currently there), and delete the inline blit-shader strings entirely. Replace with:

```typescript
import { Compositor } from '$lib/three/scenes/segerman-bg/compositor';

const compositor = new Compositor(scene, { stars, fog, fluid, planet });
scene.setOutput(() => compositor.render());
```

Keep all the layer construction (`stars`, `fog`, `fluid`, `planet`) and `scene.addLayer(...)` calls, and both `pointermove` listeners from Tasks 6 and 8 — those are permanent. The full `onMount` body should now read, in order: create scene → create noise/planet textures → construct `stars`/`fog`/`fluid`/`planet` → `scene.addLayer(...)` each → wire `fog.setFluidTexture`/`fluid.setAspect`/resize listener → attach the two `pointermove` listeners → construct `compositor` → `scene.setOutput(...)` → `scene.start()`.

Also add compositor disposal to `onDestroy`:

```typescript
compositor?.dispose();
```

(adjust variable scoping so `compositor`, `stars`, `fog`, `fluid`, `planet` are all declared in the same enclosing scope as `scene` so `onDestroy` can reach them — e.g. hoist them to module-level `let` bindings inside the component, matching how `scene` is already handled.)

- [ ] **Step 5: Typecheck**

Run: `npm run check`

- [ ] **Step 6: Verify visually**

Dev server + Playwright: navigate to `/test`, screenshot immediately, then move the pointer around for a couple seconds (touching both empty space and the planet) and screenshot again.
Expected first screenshot: stars, drifting fog, and the glowing rotating planet all visible together in one composited image (this is the real end-to-end pipeline — not a single-layer preview). Expected second screenshot: fluid ink trail visible where the pointer moved, plus planet cracks if the pointer crossed the sphere. No console errors, no `webgl.title` fallback text.

- [ ] **Step 7: Commit**

```bash
git add src/lib/shaders/segerman-bg/compositor/ src/lib/three/scenes/segerman-bg/compositor.ts src/routes/test/+page.svelte
git commit -m "feat(test-bg): add back-compositor, wire full scene end-to-end"
```

---

### Task 10: Resize / DPR / dispose audit

**Files:**
- Modify: `src/lib/three/scenes/segerman-bg/scene.ts` (only if gaps are found — see Step 3)
- Modify: `src/routes/test/+page.svelte` (only if gaps are found)

**Interfaces:** none new — this task verifies Sections 5-6 of the spec's checklist against what Tasks 1-9 actually built, and patches any gap found.

- [ ] **Step 1: Resize check**

Dev server + Playwright: navigate to `/test`, screenshot, then `browser_resize` to a noticeably different viewport size (e.g. from 1280x720 to 800x1400), screenshot again.
Expected: canvas fills the new viewport exactly (no letterboxing/stretching), scene content re-renders at the new aspect ratio without stale/frozen content from the old size, no console errors during or after resize.

- [ ] **Step 2: Remount / context-leak check**

Dev server + Playwright: navigate to `/test`, then navigate to `/` (SvelteKit client-side nav), then navigate back to `/test`, repeat this cycle 3 times total.
Expected: no console errors on any transition, no growing memory/context warnings. Confirm via `browser_evaluate`:

```javascript
() => {
	const canvas = document.querySelector('canvas');
	const gl = canvas?.getContext('webgl2');
	// WEBGL_lose_context extension presence + a basic getParameter call succeeding
	// confirms a live, non-exhausted context after repeated mount/unmount.
	return gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) > 0 : 'no context';
}
```

Expected: a positive number (not `'no context'`, not a thrown error).

- [ ] **Step 3: Fix any gap found**

If Step 1 or Step 2 surfaced an issue, fix it in `scene.ts`/`+page.svelte` now (common culprits: forgetting to call `layer.dispose()` for a specific layer inside `Scene.dispose()` — cross-check every layer constructed in `+page.svelte`'s `onMount` has a matching disposal call in `onDestroy`; or a render target not resized in `Scene.resize()` because it was created outside `scene.createRenderTarget()`, e.g. `Planet`'s `blurRTA`/`blurRTB` or `Compositor`'s `backRT` — confirm these were created via `scene.createRenderTarget()` so they're in the tracked `rts` array and auto-resize).

If no gap was found, skip to Step 4 with no changes.

- [ ] **Step 4: Typecheck**

Run: `npm run check`

- [ ] **Step 5: Final full-checklist pass**

Re-run the spec's Section 7 checklist end-to-end in one Playwright session: load `/test`, confirm stars/planet/fog/fluid all visible, move pointer to confirm ink trail + planet cracks, resize once, navigate away and back once. Screenshot the final state.

- [ ] **Step 6: Commit** (only if Step 3 made changes; otherwise skip — nothing to commit)

```bash
git add -A
git commit -m "fix(test-bg): patch resize/dispose gaps found during phase-1 verification pass"
```

---

## Self-Review Notes

- **Spec coverage:** Section 1 (route/mounting) → Task 3. Section 2 (directory layout) → Task 1 file structure + every task's file paths. Section 3 (data flow) → Tasks 2 (RT registry/shared uniforms), 9 (compositor sampling all RTs). Section 4 (interactivity) → Tasks 6 (fluid splats) and 8 (planet hover). Section 5 (dirty-flag perf) → Task 1 (`Layer` base), Task 7's `Planet.loop()` override (always-render, matching original's back-mode branch), Task 9's compositor `render()` note. Section 6 (error handling) → Task 3 (WebGL2 fallback), Task 10 (dispose audit); texture-load-failure fallback is *not* separately implemented — `THREE.TextureLoader` without an `onError` handler will leave a blank texture rather than throwing, which satisfies "proceeds with a flat placeholder color rather than throwing" without extra code; noted here rather than silently dropped. Section 7 (testing checklist) → Task 10 Step 5.
- **Placeholder scan:** no TBD/TODO markers; every code block is complete, runnable TypeScript or a precise, unambiguous GLSL-extraction instruction with a verified-unique search anchor.
- **Type consistency:** `Scene`, `Layer`, `RTPair`, `SceneUniforms`, `PointerState` names and shapes are identical everywhere they're referenced across Tasks 2-9. Every layer class exposes `.texture` (Stars, Fog, Fluid, Planet) consistently for Task 9 to consume, plus `Planet.blurTexture` as the one legitimate extra getter (needed for `tPlanetBlur`). `isMobile` gap (needed by Task 7, missing from Task 2's original `Scene`) is patched in Task 7 Step 5b rather than left dangling.
- **Scope check:** single subsystem (the background scene), consistent with the spec's phase-1 boundary. Gallery, transitions, routing, Lenis remain explicitly deferred (spec's "Out of Scope" section, unchanged).

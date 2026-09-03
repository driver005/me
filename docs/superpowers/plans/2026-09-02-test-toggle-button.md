# `/test` Toggle Button (Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a toggle button to `/test` that tweens the shared `uMode` uniform between `1` (front/white) and `0` (back/immersive), with a circular blob-reveal window effect in the output shader and a matching swap of the fluid cursor-trail's feel.

**Architecture:** A new `Toggle.svelte` component owns click state and drives a GSAP timeline against the already-shared `scene.uniforms.uMode` object (the same live-shared-uniform pattern established in phases 1–2b). Two new scalar/vector uniforms (`uToggleCoords`, `uToggleProgress`) ride the same sharing pattern into a ported shader block in the existing output compositor. `FluidSim` gains a `setMode()` method swapping its dissipation/radius constants between two source-verified presets.

**Tech Stack:** SvelteKit 2 / Svelte 5 (runes), Three.js, GSAP, `vite-plugin-glsl`.

**Spec:** docs/superpowers/specs/2026-09-02-test-toggle-button-design.md

## Global Constraints

- `uMode` convention (established phases 1/2a): `0` = back/immersive, `1` = front/white. Current default `1`.
- GSAP `.to()` targets a uniform object directly (`{value: number}`) and tweens its `.value` property — the established pattern from `card.ts`/`gallery.ts` (e.g. `gsap.to(this.material.uniforms.uHover, {value:1,...})`), not a wrapper object.
- Shared uniforms (`uTime`, `uIsTouch`, `uMode`, `uCurveX`, `uCurveZ`) are passed into materials by direct object reference (`scene.uniforms.uMode`) — mutating `.value` anywhere updates every material holding that reference, no live-read-per-frame needed for scalars/vectors that don't change identity (unlike `tFluid`'s ping-pong texture swap, which does need live reads).
- `// @ts-ignore` above every `.glsl` import (established convention, `vite-plugin-glsl` has no ambient type).
- Work directly on `main`, no worktree (established convention for this whole project this session).
- Verification: `npm run check` must be clean (0 errors); Playwright is known-broken in this session's sandbox (Chromium distribution error) — try once, fall back to manual diff review, as every prior phase task has.

---

### Task 1: Shared uniforms + FluidSim mode-swap

**Files:**
- Modify: `src/lib/three/scenes/segerman-bg/types.ts`
- Modify: `src/lib/three/scenes/segerman-bg/scene.ts`
- Modify: `src/lib/three/scenes/segerman-bg/fluid.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `SceneUniforms.uToggleCoords: { value: THREE.Vector2 }`, `SceneUniforms.uToggleProgress: { value: number }` (Task 2/3 read/write these). `FluidSim.setMode(isBackMode: boolean): void` (Task 3 calls this).

- [ ] **Step 1: Add the two new uniforms to `SceneUniforms`**

In `src/lib/three/scenes/segerman-bg/types.ts`, add to the `SceneUniforms` interface (after `uCurveZ`):

```typescript
	uToggleCoords: { value: THREE.Vector2 };
	uToggleProgress: { value: number };
```

- [ ] **Step 2: Initialize them in `Scene`'s constructor**

In `src/lib/three/scenes/segerman-bg/scene.ts`, in the `this.uniforms = {...}` object literal (after `uCurveZ: { value: 0.01 }`), add:

```typescript
			uToggleCoords: { value: new THREE.Vector2(0.9, 0.9) },
			uToggleProgress: { value: 0 }
```

(The `uToggleCoords` default is arbitrary — it's overwritten by `Toggle`'s click handler, Task 3, before it's ever read with `uToggleProgress > 0`.)

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/three/scenes/segerman-bg/types.ts src/lib/three/scenes/segerman-bg/scene.ts
git commit -m "feat(test-bg): add uToggleCoords/uToggleProgress shared uniforms"
```

- [ ] **Step 5: Refactor `FluidSim`'s dissipation constants into a front/back preset pair**

In `src/lib/three/scenes/segerman-bg/fluid.ts`, replace the four module-level constants:

```typescript
const DENSITY_DISSIPATION = 0.83;
const VELOCITY_DISSIPATION = 0.9;
const PRESSURE_DISSIPATION = 0.97;
const MAX_RADIUS = 16;
```

with:

```typescript
const DISSIPATION = {
	front: { density: 0.73, velocity: 0.98, pressure: 0.7, maxRadius: 6 },
	back: { density: 0.83, velocity: 0.9, pressure: 0.97, maxRadius: 16 }
};
```

(These are the original site's actual front/back values, sourced from `world.js`'s `initFluid()`/`onToggleStart()` — this port's existing hardcoded constants happen to equal the `back` preset, a leftover from phase 1 when `uMode` briefly defaulted to `0` before phase 2a corrected it to `1`.)

- [ ] **Step 6: Add instance fields, initialized from the `front` preset**

Add these four private fields directly after `private radius = 0;`:

```typescript
	private densityDissipation = DISSIPATION.front.density;
	private velocityDissipation = DISSIPATION.front.velocity;
	private pressureDissipation = DISSIPATION.front.pressure;
	private maxRadius = DISSIPATION.front.maxRadius;
```

(Class field initializers run immediately after `super()` returns, before any constructor-body statement — so these are already set by the time the constructor body below constructs `this.clearMaterial`.)

- [ ] **Step 7: Switch every use-site from the old constants to the new instance fields**

Four call sites change:

```typescript
// In the clearMaterial uniforms object (constructor):
this.clearMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, uTexture: { value: null }, value: { value: this.pressureDissipation } }, fragmentShader: clearFragment });
```

```typescript
// In update(), where PRESSURE_DISSIPATION was assigned:
this.clearMaterial.uniforms.value.value = this.pressureDissipation;
```

```typescript
// In update(), where VELOCITY_DISSIPATION was assigned:
this.advectionMaterial.uniforms.dissipation.value = this.velocityDissipation;
```

```typescript
// In update(), where DENSITY_DISSIPATION was assigned:
this.advectionMaterial.uniforms.dissipation.value = this.densityDissipation;
```

```typescript
// In updateRadiusFromSpeed(), where MAX_RADIUS was used:
updateRadiusFromSpeed(speed: number): void {
	const target = Math.min(Math.max(speed, 0), this.maxRadius) * 0.01;
	this.radius += (target - this.radius) * 0.1;
}
```

- [ ] **Step 8: Add `setMode()`**

Add this public method, near `pushSplat`/`setAspect`:

```typescript
	/** Swaps the fluid trail's feel to match the destination mode — called once by Toggle's click handler. */
	setMode(isBackMode: boolean): void {
		const preset = isBackMode ? DISSIPATION.back : DISSIPATION.front;
		this.densityDissipation = preset.density;
		this.velocityDissipation = preset.velocity;
		this.pressureDissipation = preset.pressure;
		this.maxRadius = preset.maxRadius;
	}
```

- [ ] **Step 9: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add src/lib/three/scenes/segerman-bg/fluid.ts
git commit -m "feat(test-bg): FluidSim.setMode() — front/back dissipation preset swap"
```

---

### Task 2: Blob-reveal shader + Compositor wiring

**Files:**
- Modify: `src/lib/shaders/segerman-bg/compositor/output-fragment.glsl`
- Modify: `src/lib/three/scenes/segerman-bg/compositor.ts`

**Interfaces:**
- Consumes: `Scene.uniforms.uRes`/`uToggleCoords`/`uToggleProgress` (Task 1).
- Produces: nothing new consumed by later tasks — this task is self-contained.

- [ ] **Step 1: Add the three new uniforms to the shader**

In `src/lib/shaders/segerman-bg/compositor/output-fragment.glsl`, the current uniform block is:

```glsl
uniform sampler2D tFront;
uniform sampler2D tBack;
uniform sampler2D tFluid;
uniform float uTime;
uniform float uIsTouch;
```

Change it to:

```glsl
uniform sampler2D tFront;
uniform sampler2D tBack;
uniform sampler2D tFluid;
uniform float uTime;
uniform float uIsTouch;
uniform vec2 uRes;
uniform vec2 uToggleCoords;
uniform float uToggleProgress;
```

- [ ] **Step 2: Insert the blob-reveal block**

The current `main()` ends with:

```glsl
    vec4 final = mix(back, front, edgeFront * fluidMask);

    gl_FragColor = vec4(final.rgb, 1.0);
}
```

Insert the ported blob-reveal block between those two lines, so `main()` ends with:

```glsl
    vec4 final = mix(back, front, edgeFront * fluidMask);

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

    gl_FragColor = vec4(final.rgb, 1.0);
}
```

This block references `uMode` — **the file does not currently declare `uniform float uMode;`** (the existing shader never needed it directly; `edgeFront`/`fluidMask` don't use it). Add it to the uniform block from Step 1 too, so the full block reads:

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
```

(`n` and `uv0` are already computed earlier in `main()` — the snoise value and the base UV. No other new variables are needed.)

- [ ] **Step 3: Wire the three new uniforms (plus the now-required `uMode`) into `Compositor`'s `outputMaterial`**

In `src/lib/three/scenes/segerman-bg/compositor.ts`, the `outputMaterial`'s uniforms object is currently:

```typescript
		this.outputMaterial = new THREE.ShaderMaterial({
			uniforms: {
				tBack: { value: this.backRT.texture },
				tFront: { value: layers.front.texture },
				tFluid: { value: layers.fluid.texture },
				uTime: scene.uniforms.uTime,
				uIsTouch: scene.uniforms.uIsTouch
			},
```

Change it to:

```typescript
		this.outputMaterial = new THREE.ShaderMaterial({
			uniforms: {
				tBack: { value: this.backRT.texture },
				tFront: { value: layers.front.texture },
				tFluid: { value: layers.fluid.texture },
				uTime: scene.uniforms.uTime,
				uIsTouch: scene.uniforms.uIsTouch,
				uMode: scene.uniforms.uMode,
				uRes: scene.uniforms.uRes,
				uToggleCoords: scene.uniforms.uToggleCoords,
				uToggleProgress: scene.uniforms.uToggleProgress
			},
```

All four are shared-by-reference (matching the existing `uTime`/`uIsTouch` pattern on this exact material) — no live-read-per-frame code is needed in `render()`, since `Toggle` (Task 3) will mutate `.value` on these same objects directly and every material holding the reference sees it immediately.

- [ ] **Step 4: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/shaders/segerman-bg/compositor/output-fragment.glsl src/lib/three/scenes/segerman-bg/compositor.ts
git commit -m "feat(test-bg): port toggle blob-reveal shader into output compositor"
```

---

### Task 3: `Toggle` component

**Files:**
- Create: `src/lib/components/sites/segerman/Toggle.svelte`

**Interfaces:**
- Consumes: `Scene` (`src/lib/three/scenes/segerman-bg/scene.ts`, its `.uniforms.uToggleCoords`/`.uMode`/`.uToggleProgress`), `FluidSim.setMode()` (Task 1).
- Produces: a Svelte component with props `{ scene: Scene; fluid: FluidSim }` — Task 4 renders it.

- [ ] **Step 1: Write the component**

```svelte
<!-- src/lib/components/sites/segerman/Toggle.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import gsap from 'gsap';
	import type { Scene } from '$lib/three/scenes/segerman-bg/scene';
	import type { FluidSim } from '$lib/three/scenes/segerman-bg/fluid';

	let { scene, fluid }: { scene: Scene; fluid: FluidSim } = $props();

	let buttonRef: HTMLButtonElement | null = $state(null);
	let isBackMode = $state(false);
	let timeline: gsap.core.Timeline | null = null;

	function handleClick(): void {
		if (!buttonRef) return;

		const rect = buttonRef.getBoundingClientRect();
		const x = (rect.left + rect.width / 2) / window.innerWidth;
		const y = 1 - (rect.top + rect.height / 2) / window.innerHeight;
		scene.uniforms.uToggleCoords.value.set(x, y);

		isBackMode = !isBackMode;
		const targetMode = isBackMode ? 0 : 1;
		fluid.setMode(isBackMode);

		timeline?.kill();
		timeline = gsap.timeline({
			onComplete: () => {
				scene.uniforms.uToggleProgress.value = 0;
			}
		});
		timeline.to(scene.uniforms.uMode, { value: targetMode, duration: 1.2, ease: 'power2.inOut' }, 0);
		timeline.to(scene.uniforms.uToggleProgress, { value: 1, duration: 1.2, ease: 'power2.inOut' }, 0);
	}

	onDestroy(() => {
		timeline?.kill();
	});
</script>

<button
	bind:this={buttonRef}
	type="button"
	onclick={handleClick}
	class="fixed right-6 bottom-6 z-10 rounded-full bg-white/90 px-5 py-3 text-sm font-medium text-black shadow-lg transition hover:bg-white"
>
	{isBackMode ? 'Front' : 'Back'}
</button>
```

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/sites/segerman/Toggle.svelte
git commit -m "feat(test-bg): add Toggle component — uMode transition + blob-reveal trigger"
```

---

### Task 4: Wire `Toggle` into the route + verify

**Files:**
- Modify: `src/routes/test/+page.svelte`

**Interfaces:**
- Consumes: `Toggle` (Task 3), `Scene`/`FluidSim` (already imported in this file).

- [ ] **Step 1: Add a reactive readiness flag**

In `src/routes/test/+page.svelte`, add a new `$state` flag alongside the existing `webglFailed` one:

```typescript
	let webglFailed = $state(false);
	let webglReady = $state(false);
```

(`scene`/`fluid`/etc. are intentionally plain `let`, not `$state` — mutating Three.js objects every frame through Svelte's reactivity would be wasteful. That means the template can't reactively gate on `scene`/`fluid` directly; `webglReady` is the trigger.)

- [ ] **Step 2: Import `Toggle`**

Add near the other imports:

```typescript
	import Toggle from '$lib/components/sites/segerman/Toggle.svelte';
```

- [ ] **Step 3: Set `webglReady = true` once setup completes**

At the end of the successful branch in `onMount` — immediately after `scene.start();` — add:

```typescript
			scene.start();
			webglReady = true;
```

- [ ] **Step 4: Reset it in `onDestroy`**

Add `webglReady = false;` to the block of null-outs at the end of `onDestroy`, alongside the existing `scene = null;` etc:

```typescript
		webglReady = false;
		scene = null;
```

- [ ] **Step 5: Render `Toggle` in the template**

The current template is:

```svelte
{#if webglFailed}
	...
{:else}
	<canvas bind:this={canvasRef} class="fixed inset-0 h-full w-full"></canvas>
{/if}
```

Change the `{:else}` branch to also render `Toggle` once ready:

```svelte
{#if webglFailed}
	...
{:else}
	<canvas bind:this={canvasRef} class="fixed inset-0 h-full w-full"></canvas>
	{#if webglReady && scene && fluid}
		<Toggle {scene} {fluid} />
	{/if}
{/if}
```

(Leave the `webglFailed` branch's contents exactly as they are — only the `{:else}` branch changes.)

- [ ] **Step 6: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 7: Verify**

Check the dev server: `curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/test` — start `npm run dev` in the background if the response isn't `200`.

Try Playwright once (per this session's established pattern — one attempt, then fall back). Expected if it works: a button visible in the bottom-right corner reading "Back"; clicking it crossfades the scene from the white front view toward the immersive 3D back view over about a second, with a brief circular window expanding from the button; the button's label flips to "Front"; clicking again reverses it. If Playwright fails with the known Chromium error (or any error), fall back to `npm run check` (already clean) plus careful manual diff review of all four tasks' changes together, and say which path you used in your report.

- [ ] **Step 8: Commit**

```bash
git add src/routes/test/+page.svelte
git commit -m "feat(test-bg): wire Toggle button into /test route, complete phase 3"
```

---

## Self-Review Notes

- **Spec coverage:** Section 1 (`Toggle` component) → Task 3-4. Section 2 (blob-reveal shader) → Task 2. Section 3 (fluid dissipation swap) → Task 1. Section 4 (wiring) → Task 4.
- **Placeholder scan:** none found — every step has literal code.
- **Type consistency:** `FluidSim.setMode(isBackMode: boolean): void` (Task 1) matches its call in `Toggle.svelte` (Task 3) exactly. `SceneUniforms.uToggleCoords`/`uToggleProgress` (Task 1) match their reads/writes in `compositor.ts` (Task 2) and `Toggle.svelte` (Task 3) exactly — same field names, same shapes (`{value: THREE.Vector2}`/`{value: number}`).
- **Scope check:** single subsystem (the toggle and its two directly-dependent effects), matching the spec's own phase-3 boundary. Render-gating, `isToggleTransitioning`-gated `uSpeed`, page-transition shader machinery, and `Gallery` scroll-locking all remain explicitly out of scope per the spec.

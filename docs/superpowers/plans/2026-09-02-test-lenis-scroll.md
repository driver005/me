# `/test` Real Lenis Scroll (Phase 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `Gallery`'s temporary wheel-event accumulator with a real `Scroll` manager wrapping Lenis for normalized, lerped scroll input (wheel/trackpad/touch, plus `j`/`k` keyboard nudging).

**Architecture:** A new `Scroll` class (`Layer` subclass, no visual output) wraps a `Lenis` instance purely as an input normalizer — it listens to Lenis's `virtual-scroll` event, accumulates a target value, and applies its own simple per-frame lerp toward it, writing the result into `Gallery.scrollPosition` every frame. `Gallery`'s old wheel-listener code is deleted.

**Tech Stack:** SvelteKit 2 / Svelte 5 (runes), Three.js, `lenis` (already a dependency, `^1.3.23`).

**Spec:** docs/superpowers/specs/2026-09-02-test-lenis-scroll-design.md

## Global Constraints

- `Layer` base class pattern: constructor takes `(isTouch: boolean)`, calls `super(isTouch)` first; continuously-updating layers override `loop()` directly rather than relying on the base class's `needsRender`/`dirty()` gating (established convention, confirmed across every other layer in this port).
- Layers with no visual output still need to satisfy the abstract `render(): void` method — give it an empty body.
- Work directly on `main`, no worktree (established convention this session).
- Verification: `npm run check` must be clean (0 errors); Playwright is known-broken in this session's sandbox — try once, fall back to manual diff review.

---

### Task 1: `Scroll` class + wiring + `Gallery` cleanup

**Files:**
- Create: `src/lib/three/scenes/segerman-bg/scroll.ts`
- Modify: `src/lib/three/scenes/segerman-bg/gallery.ts`
- Modify: `src/routes/test/+page.svelte`

**Interfaces:**
- Consumes: `Layer` base class, `Gallery.scrollPosition` (existing public field).
- Produces: `class Scroll extends Layer { constructor(scene: Scene, gallery: Gallery); render(): void; loop(): void; dispose(): void }` — this task is self-contained; nothing later in this plan depends on it (single-task plan).

- [ ] **Step 1: Write `scroll.ts`**

```typescript
// src/lib/three/scenes/segerman-bg/scroll.ts
import Lenis from 'lenis';
import { Layer } from './layer';
import type { Scene } from './scene';
import type { Gallery } from './gallery';

export class Scroll extends Layer {
	private gallery: Gallery;
	private lenis: Lenis;
	private target = 0;
	private current = 0;
	private readonly ease = 0.1;
	private unsubscribeVirtualScroll: () => void;

	constructor(scene: Scene, gallery: Gallery) {
		super(scene.isTouch);
		this.gallery = gallery;

		this.lenis = new Lenis({
			smoothWheel: true,
			syncTouch: true,
			syncTouchLerp: 0.2,
			touchInertiaExponent: 1.7,
			wheelMultiplier: 1,
			touchMultiplier: 1,
			autoRaf: false
		});
		this.unsubscribeVirtualScroll = this.lenis.on('virtual-scroll', (data) => {
			this.target += Math.max(-100, Math.min(100, data.deltaY));
		});
		window.addEventListener('keydown', this.onKeyDown);
	}

	private onKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'k') {
			this.target -= 100;
			event.preventDefault();
		} else if (event.key === 'j') {
			this.target += 100;
			event.preventDefault();
		}
	};

	render(): void {}

	loop(): void {
		this.current += (this.target - this.current) * this.ease;
		this.gallery.scrollPosition = this.current;
	}

	dispose(): void {
		this.unsubscribeVirtualScroll();
		this.lenis.destroy();
		window.removeEventListener('keydown', this.onKeyDown);
	}
}
```

(`lenis`'s package ships its own TypeScript types — no `// @ts-ignore` needed, unlike the `.glsl` imports elsewhere in this codebase.)

- [ ] **Step 2: Remove `Gallery`'s temporary scroll substitute**

In `src/lib/three/scenes/segerman-bg/gallery.ts`, delete these three members entirely (currently at lines 207-219):

```typescript
	private onWheel = (event: WheelEvent): void => {
		this.scrollPosition += event.deltaY * 0.05;
	};

	/** TEMPORARY substitute for Lenis-driven scroll (not built yet). A future phase replaces this
	 *  entire method with real smooth-scroll input — do not extend this, replace it wholesale. */
	attachScrollListener(): void {
		window.addEventListener('wheel', this.onWheel, { passive: true });
	}

	detachScrollListener(): void {
		window.removeEventListener('wheel', this.onWheel);
	}
```

In `dispose()`, remove the `this.detachScrollListener();` line — the method currently reads:

```typescript
	dispose(): void {
		this.detachScrollListener();
		for (const timeline of this.entranceTimelines) timeline.kill();
```

Change it to:

```typescript
	dispose(): void {
		for (const timeline of this.entranceTimelines) timeline.kill();
```

(Everything else in `gallery.ts` — `scrollPosition` itself, `updateItems()`, all other methods — stays exactly as-is. `scrollPosition` is still a public field; it's now written by `Scroll` each frame instead of by `Gallery`'s own wheel listener, the same external-write pattern already used by `setMouseTarget()`.)

- [ ] **Step 3: Wire the route**

In `src/routes/test/+page.svelte`, add the import:

```typescript
	import { Scroll } from '$lib/three/scenes/segerman-bg/scroll';
```

Add the outer `let` declaration alongside the other layer declarations:

```typescript
	let scroll: Scroll | null = null;
```

In `onMount`, the current code is:

```typescript
			gallery = new Gallery(scene, projects);
			gallery.playEntrance();
			gallery.attachScrollListener();
```

Change it to (constructing `Scroll` right after `gallery` exists, registering it, and removing the old `attachScrollListener()` call):

```typescript
			gallery = new Gallery(scene, projects);
			gallery.playEntrance();

			scroll = new Scroll(scene, gallery);
			scene.addLayer(scroll);
```

Add `scroll = null;` to the block of null-outs in `onDestroy`, alongside the existing `gallery = null;` etc:

```typescript
		scroll = null;
```

(`scroll` is a `Layer` registered via `scene.addLayer()`, so its `dispose()` runs automatically via `Scene.dispose()`'s existing `layer.dispose?.()` loop — no explicit `scroll?.dispose()` call needed, matching the `images`/`video`/`texts` pattern exactly.)

- [ ] **Step 4: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 5: Verify**

Check the dev server: `curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/test` — start `npm run dev` in the background if the response isn't `200`.

Try Playwright once (per this session's established pattern). Expected if it works: scrolling with the mouse wheel or trackpad smoothly moves the gallery strip (no per-tick snapping like before); pressing `j`/`k` also nudges it. Fall back to `npm run check` (already clean) plus careful manual diff review if Playwright fails, and say which path was used.

- [ ] **Step 6: Commit**

```bash
git add src/lib/three/scenes/segerman-bg/scroll.ts src/lib/three/scenes/segerman-bg/gallery.ts src/routes/test/+page.svelte
git commit -m "feat(test-bg): add Scroll — real Lenis-driven gallery scroll, complete phase 4"
```

---

## Self-Review Notes

- **Spec coverage:** Section 1 (`Scroll` class) → Task 1 Step 1. Section 2 (wiring) → Task 1 Step 3. Section 3 (remove `Gallery`'s temporary substitute) → Task 1 Step 2. Single task, since all three pieces are tightly coupled — `Scroll` alone does nothing without wiring, and wiring without removing `Gallery`'s old listener would leave two competing writers of `scrollPosition`. No reviewer could meaningfully approve one piece while rejecting another.
- **Placeholder scan:** none found — every step has literal code.
- **Type consistency:** `Scroll`'s constructor `(scene: Scene, gallery: Gallery)` is defined once (Step 1) and its one call site (Step 3) matches exactly. `Gallery.scrollPosition` (pre-existing public field, unchanged) is the only interface `Scroll` touches on `Gallery`.
- **Scope check:** single subsystem (gallery scroll input), matching the spec's own phase-4 boundary. The original's dual-path touch/desktop system, `speed`/`velocity` tracking, real page scroll, and navigation-reset behavior all remain explicitly out of scope per the spec's own "Out of Scope" section.

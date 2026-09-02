# `/test` Phase 4: Real Lenis Scroll Design

**Date:** 2026-09-02
**Scope:** Replace `Gallery`'s temporary wheel-event accumulator (explicitly documented in `gallery.ts` as "TEMPORARY substitute for Lenis-driven scroll... do not extend this, replace it wholesale") with a real `Scroll` manager wrapping `lenis` (already a project dependency, `^1.3.23`).

**Relationship to the original roadmap:** the original site's "page transitions" phase doesn't apply to this port — `/test` has one route, no Work/Info pages exist to transition between. This phase skips straight to Lenis.

**Source of truth:** `app.js`'s `ca extends ha` class (the site's `Scroll` manager, fully captured earlier this session) — cited for the Lenis construction options and the general shape (virtual-scroll input, per-frame lerp toward a target), NOT ported verbatim. The original runs a dual-path system (native Lenis smoothing on touch, a hand-rolled lerp/velocity system on desktop that exists mainly to feed a `speed` value this port's `Card`/`VideoCard` never wired up — see phase 2b's final review, "uSpeed never driven," still true). Per your approval, this phase uses ONE simplified path for both touch and desktop: Lenis solely as a cross-browser wheel/touch input normalizer (its `virtual-scroll` event), with this port's own simple lerp doing the easing — verified against the installed `node_modules/lenis/dist/lenis.d.ts` (v1.3.23) that `virtual-scroll` fires independent of whether the page has real scrollable height, so no DOM scroll-spacer is needed.

---

## Goal

Replace the gallery's per-wheel-tick snap-scrolling with real smoothed, lerped scroll input — wheel, trackpad, and touch gestures all normalized through Lenis, plus `j`/`k` keyboard nudging (vim-style, per your request — not the original's arrow keys).

---

## Section 1 — `Scroll` class

New file `src/lib/three/scenes/segerman-bg/scroll.ts`, extending `Layer` (matching this port's established per-frame-hook pattern — everything that needs a frame tick goes through `scene.addLayer()`). It has no visual output, so `render()` is a required-but-unused no-op; the real work happens in an overridden `loop()`.

```typescript
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

(The `smoothWheel`/`syncTouch`/`syncTouchLerp`/`touchInertiaExponent`/`wheelMultiplier`/`touchMultiplier` options are copied verbatim from the original's Lenis construction, since they govern Lenis's own internal touch-gesture recognition and virtual-scroll delta shaping — independent of the dual-path-vs-single-path simplification, which only concerns what consumes the normalized output. `autoRaf: false` is kept for consistency with the original and because this port drives every per-frame concern through its own `Scene.loop()`/`Layer` system, not Lenis's internal one — and since only `virtual-scroll` is consumed, Lenis's own rAF-driven scroll-application logic is never exercised regardless of this flag, but setting it `false` avoids Lenis starting a second, unused internal rAF loop.)

## Section 2 — Wiring

`src/routes/test/+page.svelte`: construct `scroll = new Scroll(scene, gallery)` right after `gallery` exists (after `gallery.playEntrance()`), register via `scene.addLayer(scroll)`. Remove the `gallery.attachScrollListener()` call. `Scroll` is `Layer`-registered so its `dispose()` runs automatically via `Scene.dispose()` — no explicit call needed in `onDestroy`, matching the `images`/`video`/`texts` pattern.

## Section 3 — Remove `Gallery`'s temporary scroll substitute

In `src/lib/three/scenes/segerman-bg/gallery.ts`, delete: the `onWheel` private method, `attachScrollListener()`, `detachScrollListener()`, and their doc comment. Remove `this.detachScrollListener();` from `Gallery.dispose()`. `scrollPosition` itself (the public field `updateItems()` reads) stays exactly as-is — it's now written by `Scroll` instead of `Gallery`'s own wheel listener, an external-write pattern already established (e.g. `setMouseTarget()`).

---

## Testing

Visual-only, same approach as prior phases. New checklist items: mouse-wheel and trackpad scrolling smoothly moves the gallery strip (no more per-tick snapping); `j`/`k` keys nudge it; `npm run check` clean.

## Out of Scope

- The original's dual-path (native-Lenis-smoothing-on-touch vs. hand-rolled-lerp-on-desktop) and its `speed`/`velocity` tracking — simplified to one path per your approval; `speed`/`uSpeed` remain unwired (pre-existing, tracked since phase 2b's final review).
- Real page scroll / scrollbar — this phase is purely virtual input normalization, no DOM scroll spacer, no `lenis.raf()` driving.
- `reset()`-on-navigation behavior — no routing exists in this port.

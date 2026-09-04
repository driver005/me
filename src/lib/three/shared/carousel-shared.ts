// Shared constants + math for Gallery (home strip) and MediaCarousel (other rows).

export type CarouselAxis = 'horizontal' | 'vertical';

/** Card size, shared by every carousel in this port — home gallery and any MediaCarousel alike. */
export const CARD_WIDTH = 52;
export const CARD_HEIGHT = 32;

// Derived at ~0.95 units/rem ratio matching CARD_WIDTH.
export const GAP_FRONT = 2.28;
export const GAP_BACK = 7.59;

/** How far an item sinks in Z, at saturation, as it scrolls away from a carousel's centre. */
export const DEPTH_CURVE = 40;

/** Damping constant for scroll deltas before they reach the warp term (distanceFromCentre²). */
export const SPEED_LIMIT = 5e-5;

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

/** Parabolic depth arc: 0 at centre, -depthCurve at saturation. */
export function computeDepthOffset(position: number, step: number, depthCurve: number = DEPTH_CURVE): number {
	const depthRange = step * 2;
	const normalized = depthRange > 0 ? Math.max(-1, Math.min(1, position / depthRange)) : 0;
	return -depthCurve * normalized * normalized;
}

export interface CarouselLayoutOptions {
	axis: CarouselAxis;
	/** The item's own extent along the scroll axis — CARD_HEIGHT for a vertical strip (items stack by
	 *  height), CARD_WIDTH for a horizontal one (items sit side by side by width). */
	itemSize: number;
	itemCount: number;
	/** Gap at uMode=1 (front) and uMode=0 (back) — pass the same value for both to disable the lerp
	 *  (a fixed gap, e.g. an in-page carousel that isn't itself part of the front/back toggle). */
	gapFront: number;
	gapBack: number;
	depthCurve?: number;
}

export interface CarouselItemPlacement {
	/** Local offset along the scroll axis, already wrapped into [-totalSpan/2, totalSpan/2). */
	position: number;
	/** Local Z offset from computeDepthOffset(). */
	depth: number;
}

/**
 * The one shared per-item positioning algorithm — infinite wrap-around, front/back gap lerp, and the
 * depth arc — that both Gallery (the home strip) and MediaCarousel (any other row) delegate to,
 * instead of each keeping its own copy. Stateless per call other than the gap lerp's current value
 * (exposed as `.gap`, matching Gallery's own pre-merge field of the same name/purpose).
 */
export class CarouselLayout {
	gap: number;

	private axis: CarouselAxis;
	private itemSize: number;
	private itemCount: number;
	private gapFront: number;
	private gapBack: number;
	private depthCurve: number;

	constructor(options: CarouselLayoutOptions) {
		this.axis = options.axis;
		this.itemSize = options.itemSize;
		this.itemCount = options.itemCount;
		this.gapFront = options.gapFront;
		this.gapBack = options.gapBack;
		this.depthCurve = options.depthCurve ?? DEPTH_CURVE;
		this.gap = options.gapFront;
	}

	/** Recomputes item `i`'s wrapped position + depth for the current scroll position and uMode. */
	computeItem(i: number, scrollPosition: number, uMode: number): CarouselItemPlacement {
		this.gap = lerp(this.gapBack, this.gapFront, uMode);
		const step = this.itemSize + this.gap;
		const totalSpan = step * this.itemCount;
		const wrapped = ((scrollPosition % totalSpan) + totalSpan) % totalSpan;

		let position = step * i - wrapped;
		position = ((position + totalSpan / 2) % totalSpan + totalSpan) % totalSpan - totalSpan / 2;

		const depth = computeDepthOffset(position, step, this.depthCurve);
		return { position, depth };
	}

	/** Which world axis `position` above maps onto — 'y' for a vertical strip, 'x' for horizontal. */
	get positionAxis(): 'x' | 'y' {
		return this.axis === 'vertical' ? 'y' : 'x';
	}
}

/** Scroll speed with damping, callable from any carousel's per-frame update. */
export function computeScrollSpeed(scrollPosition: number, previousScrollPosition: number): number {
	return (scrollPosition - previousScrollPosition) * SPEED_LIMIT;
}

// Shared constants + math between Gallery (the home strip, vertical) and MediaCarousel (any other
// row, horizontal or vertical) — one definition, not two independently-tuned copies. Previous drift
// between them (card size, depth-curve strength/scale) is exactly the class of bug this exists to
// prevent. CarouselLayout below is the actual merge point: both classes delegate every per-item
// wrap/gap/depth calculation to the same instance-configured object, not their own parallel math.

export type CarouselAxis = 'horizontal' | 'vertical';

/** Card size, shared by every carousel in this port — home gallery and any MediaCarousel alike. */
export const CARD_WIDTH = 52;
export const CARD_HEIGHT = 32;

// Derived at the same ~0.95 units/rem ratio CARD_WIDTH itself uses (52 units for the original's
// 54.8rem card element) — the original gaps are 2.4rem/8rem. Phase 2b's final review flagged the
// previous values (26.7/89) as using an ~11.1 units/rem ratio instead, an ~11.7x mismatch that spread
// the strip out far more than the source (only ~2 cards visible on screen at 16:9 instead of several).
export const GAP_FRONT = 2.28;
export const GAP_BACK = 7.59;

/** How far an item sinks in Z, at saturation, as it scrolls away from a carousel's centre. */
export const DEPTH_CURVE = 40;

/** Raw scroll-position deltas need damping before they reach card/vertex.glsl's warp term (which
 *  multiplies by distanceFromCentre² — easily thousands once squared) — see Gallery.updateItems()'s
 *  own comment on this from when the undamped version was a real bug. Same constant, same reasoning,
 *  for any carousel that wants speed-reactive warp on its cards. */
export const SPEED_LIMIT = 5e-5;

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

/**
 * Parabolic depth arc: 0 at `position === 0` (centre), `-depthCurve` once `|position|` reaches
 * `depthRange` (saturates beyond that, rather than diving deeper) — an item rises toward the camera
 * as it scrolls toward centre, sinks back as it scrolls away. `depthRange` defaults to two
 * item-widths (`step * 2`) — the scale at which this effect concentrates in both carousels, matching
 * how localized the original's own shader-driven curve is (it reacts to a card's own screen-space
 * distance from centre, not the whole strip's span).
 */
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

/** Same damping + delta this port has used since the uSpeed fix — one implementation, callable from
 *  any carousel's own per-frame update alongside a `previousScrollPosition` field it owns. */
export function computeScrollSpeed(scrollPosition: number, previousScrollPosition: number): number {
	return (scrollPosition - previousScrollPosition) * SPEED_LIMIT;
}

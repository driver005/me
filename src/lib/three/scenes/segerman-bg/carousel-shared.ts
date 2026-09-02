// Shared constants + math between Gallery (the home strip, vertical) and MediaCarousel (any other
// row, horizontal or vertical) — one definition, not two independently-tuned copies. Previous drift
// between them (card size, depth-curve strength/scale) is exactly the class of bug this exists to
// prevent.

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

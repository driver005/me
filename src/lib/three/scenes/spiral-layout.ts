import type { Scene } from './scene';

/** Below this viewport width, the spiral carousel (and, on Home, the cube living inside it — see
 *  spiral-carousel.ts's own `centerpiece` option) recenters to the middle of the screen instead of
 *  its usual right-two-thirds split — that split assumes room for two side-by-side regions, which a
 *  narrow phone doesn't have. */
export const SPIRAL_MOBILE_BREAKPOINT = 1000;

/** World-space x the spiral carousel should be centered on right now — right two-thirds of the
 *  viewport above SPIRAL_MOBILE_BREAKPOINT, dead center below it. A pure function of the scene's own
 *  live uRes/widthAtZ (both driven by Threlte's own ResizeObserver-backed size tracking — see
 *  EngineRoot.svelte — not a raw `window.resize` listener), so every caller (spiral-carousel.ts's own
 *  `getCenter` option, called fresh every frame; +layout.svelte's click-hit exclusion around Home's
 *  cube) recomputes the exact same value independently, with no shared mutable state to keep in sync.
 *  Deliberately NOT `window.innerWidth`: that only updates on a genuine top-level `resize` DOM event,
 *  which a scaled or embedded preview (the canvas's own rendered size changing without the browser
 *  window itself resizing) never fires — uRes tracks the canvas's actual rendered size instead,
 *  correctly either way. */
export function getSpiralCenterX(scene: Scene): number {
	return scene.uniforms.uRes.value.x < SPIRAL_MOBILE_BREAKPOINT ? 0 : scene.widthAtZ / 6;
}

/** World-space x Home's own centerpiece cube should sit at — the LEFT third of the viewport above
 *  SPIRAL_MOBILE_BREAKPOINT (the same spot the old "ADRIAN" text used to occupy, now empty since the
 *  spiral itself sits over on the right two-thirds — see getSpiralCenterX()), dead center alongside
 *  the spiral below it (there's no room for a two-region split on a narrow phone, so the cube moves
 *  in to share the spiral's own center there instead — see spiral-carousel.ts's own `centerpiece`
 *  option). The viewport spans world x [-widthAtZ/2, +widthAtZ/2]; the left third of that is
 *  [-widthAtZ/2, -widthAtZ/2 + widthAtZ/3], whose own center is -widthAtZ/3. */
export function getCubeCenterX(scene: Scene): number {
	return scene.uniforms.uRes.value.x < SPIRAL_MOBILE_BREAKPOINT ? 0 : -scene.widthAtZ / 3;
}

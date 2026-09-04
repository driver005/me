import type { Scene } from '../scene';

/** Below this width, spiral carousel centers to screen middle instead of right two-thirds. */
export const SPIRAL_MOBILE_BREAKPOINT = 1000;

/** World-space x for spiral carousel center — right two-thirds above breakpoint, center below. */
export function getSpiralCenterX(scene: Scene): number {
	return scene.uniforms.uRes.value.x < SPIRAL_MOBILE_BREAKPOINT ? 0 : scene.widthAtZ / 6;
}

/** World-space x for Home's centerpiece cube — left third above breakpoint, center below. */
export function getCubeCenterX(scene: Scene): number {
	return scene.uniforms.uRes.value.x < SPIRAL_MOBILE_BREAKPOINT ? 0 : -scene.widthAtZ / 3;
}

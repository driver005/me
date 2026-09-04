import { Effect } from 'postprocessing';
import { Uniform } from 'three';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it
import fragmentShader from '$lib/shaders/posterize/fragment.glsl';

/**
 * Quantizes the graded frame's colors down to `levels` bands per channel — the flat-color-banding
 * half of a cartoon look (the outline half is outline-hull.ts's inverted-hull mesh technique).
 * Pure color-in/color-out fullscreen pass, no depth texture, no render target of its own — same
 * "avoid anything depth-texture-based" rule as postprocessing.ts's own comment on why OutlineEffect
 * and the custom depth-edge effect both crashed this GPU/driver.
 */
export class PosterizeEffect extends Effect {
	constructor(levels = 6) {
		super('PosterizeEffect', fragmentShader, {
			uniforms: new Map([['levels', new Uniform(levels)]])
		});
	}
}

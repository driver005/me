import * as THREE from 'three';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/effects/coffee-steam.ts for the same pattern)
import starsFragment from '$lib/shaders/stars/fragment.glsl';
// @ts-ignore
import fullscreenVertex from '$lib/shaders/common/fullscreen-triangle.glsl';

export interface StarfieldUniformOverrides {
	uRes?: { value: THREE.Vector2 };
	uMode?: { value: number };
	uTime?: { value: number };
	uIsIntro?: { value: number };
}

/**
 * The procedural starfield shader's own JS-side setup — used by layers/stars.ts (the (bg) engine's
 * main background), which renders `$lib/shaders/stars/fragment.glsl` into an offscreen target every
 * frame. /home's own dark-mode background used to share this (plus a camera-parallax variant of it),
 * but now uses a real 3D THREE.Points cloud instead (see effects/starfield-3d.ts) — a flat 2D noise
 * pattern read as visibly wrong once actually looked at, no matter how its parallax was faked.
 *
 * `uRes`/`uMode`/`uTime`/`uIsIntro` stay overridable: the (bg) engine drives them from its own
 * centrally-owned `scene.uniforms` (one shared object reused across every layer).
 */
export function createStarfieldMaterial(overrides: StarfieldUniformOverrides = {}): THREE.ShaderMaterial {
	return new THREE.ShaderMaterial({
		uniforms: {
			uRes: overrides.uRes ?? { value: new THREE.Vector2(1, 1) },
			uMode: overrides.uMode ?? { value: 0 },
			uTime: overrides.uTime ?? { value: 0 },
			uColor: { value: new THREE.Color('#001524').convertLinearToSRGB() },
			uDustColor: { value: new THREE.Color('#064c9a').convertLinearToSRGB() },
			uBrightness: { value: 2.8 },
			uStarBrightness: { value: 1.3 },
			uDustBrightness: { value: 0.1 },
			uFrontBoost: { value: 1.3 },
			uIsIntro: overrides.uIsIntro ?? { value: 0 }
		},
		vertexShader: fullscreenVertex,
		fragmentShader: starsFragment
	});
}

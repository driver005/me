import * as THREE from 'three';
import type { Scene } from './scene';
import { Blur } from './blur';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it
import raymarchVertex from '$lib/shaders/jsulpis-planet/vertex.glsl';
// @ts-ignore
import earthFragment from '$lib/shaders/jsulpis-planet/earth.fragment.glsl';
// @ts-ignore
import planetFragment from '$lib/shaders/jsulpis-planet/planet.fragment.glsl';

/**
 * A raymarched fullscreen-quad planet — jsulpis/realtime-planet-shader (GPL-3.0), ported as-is; see
 * the shader files' own header comments and CREDITS.md at the repo root. Architecturally unrelated to
 * this engine's own mesh-based `Planet` (a real sphere with vertex-displaced terrain): this one is a
 * self-contained 2D effect with its own fake camera baked into the shader math, rendered to an
 * offscreen texture exactly like Fog/Stars/Fluid are, not part of the real 3D scene graph at all.
 * `.texture`/`.blurTexture`/`.loop()`/`.dispose()` match the shape PlanetSwitcher (and, through it,
 * Compositor) expect from *any* planet source — this and the mesh Planet are interchangeable there.
 */

/** The unit quad [0,1]x[0,1] this shader's own vertex math expects (`2.0*position-1.0` reaching
 *  NDC) — not this engine's usual `createFullscreenTriangle()`, which is already NDC-ready and would
 *  double the remap. Matches jsulpis's own renderer.ts geometry (two triangles, same six verts). */
function createUnitQuad(): THREE.BufferGeometry {
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute(
		'position',
		new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0], 3)
	);
	return geometry;
}

export interface EarthTextures {
	color: THREE.Texture;
	clouds: THREE.Texture;
	specular: THREE.Texture;
	bump: THREE.Texture;
	night: THREE.Texture;
	stars: THREE.Texture;
}

export interface PlanetTextureVariant {
	color: THREE.Texture;
	stars: THREE.Texture;
}

/** Per-planet look, mirroring each planet page's own uniform overrides in the source repo
 *  (src/pages/{mercury,venus,mars,jupiter,moon}.astro). */
export interface RaymarchPlanetLook {
	atmosphereColor: [number, number, number];
	atmosphereDensity: number;
	bumpStrength?: number;
	sunIntensity?: number;
	ambientLight?: number;
}

/** Must match earth.fragment.glsl's own `#define MAX_MOONS 20` — the uMoonPositions array's
 *  fixed GLSL size. */
const MAX_MOONS = 20;

/** '#rrggbb' -> [r,g,b] in 0-1, for feeding a CSS-style hex color (e.g. a skill's `primaryColor`)
 *  into a shader's vec3 uniform. */
export function hexToRgb(hex: string): [number, number, number] {
	const value = parseInt(hex.replace('#', ''), 16);
	return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

export const PLANET_LOOKS: Record<string, RaymarchPlanetLook> = {
	mercury: { atmosphereColor: [1, 1, 1], atmosphereDensity: 0.05 },
	venus: { atmosphereColor: [0.9, 0.3, 0], atmosphereDensity: 0.1, bumpStrength: 0.005 },
	mars: { atmosphereColor: [0.9, 0.15, 0], atmosphereDensity: 0.2 },
	jupiter: { atmosphereColor: [0.36, 0.92, 0.95], atmosphereDensity: 0.05, bumpStrength: 0.003 },
	moon: { atmosphereColor: [1, 1, 1], atmosphereDensity: 0.05 }
};

export class RaymarchPlanet {
	renderTarget: THREE.WebGLRenderTarget;
	private scene: Scene;
	private material: THREE.RawShaderMaterial;
	private geometry: THREE.BufferGeometry;
	private mesh: THREE.Mesh;
	private blur: Blur;
	private blurRTA: THREE.WebGLRenderTarget;
	private blurRTB: THREE.WebGLRenderTarget;
	private blurTextureValue: THREE.Texture | null = null;

	/** `variant: 'earth'` uses earth.fragment.glsl with its 5 real textures; `'planet'` uses the
	 *  shared planet.fragment.glsl (mercury/venus/mars/jupiter/moon) with a single color texture plus
	 *  a `look` (atmosphere color/density and the other per-planet overrides the source repo's own
	 *  pages set). */
	constructor(
		scene: Scene,
		variant: { type: 'earth'; textures: EarthTextures } | { type: 'planet'; textures: PlanetTextureVariant; look: RaymarchPlanetLook },
		// Screen-space offset within this shader's own fake camera (world_x = 6 * uv.x at the planet's
		// depth — see the constant derivation in the layout that calls this), defaulting to dead center.
		// The mesh-based Planet class positions itself off-center per page (see planet.ts's
		// PLANET_PAGES) specifically so it doesn't sit under the gallery/hero content; without an
		// equivalent offset here, this planet renders centered and gets hidden behind whatever else is
		// drawn on top of the back layer at screen-center.
		screenPosition: { x: number; y: number } = { x: 0, y: 0 }
	) {
		this.scene = scene;
		this.renderTarget = scene.createRenderTarget(scene.isMobile ? 1 : 0.75);
		this.blur = new Blur(scene);
		this.blurRTA = scene.createRenderTarget(0.15);
		this.blurRTB = scene.createRenderTarget(0.15);
		this.geometry = createUnitQuad();

		const commonUniforms = {
			uTime: scene.uniforms.uTime,
			uQuality: { value: scene.dpr },
			uResolution: { value: new THREE.Vector2() },
			sunDirectionXY: { value: new THREE.Vector2(1, 1) },
			uPlanetPosition: { value: new THREE.Vector3(screenPosition.x, screenPosition.y, -10) },
			uRotationOffset: { value: 0.6 },
			uPlanetRadius: { value: 2 },
			uSunIntensity: { value: 3 },
			uAmbientLight: { value: 0.01 }
		};

		if (variant.type === 'earth') {
			// RawShaderMaterial, not ShaderMaterial: ShaderMaterial auto-prepends THREE's own vertex/
			// fragment boilerplate (its own `in vec3 position;` attribute declaration, a built-in `uv`
			// varying, etc.) ahead of the supplied source — jsulpis's shader declares those same names
			// itself for its own unrelated purposes (a raw fullscreen-quad position, a custom UV-like
			// varying used by its fake camera math), so under ShaderMaterial the two collided and the
			// vertex shader failed to compile every single frame (redefinition errors), meaning this
			// planet has never actually rendered anything since it was first added. RawShaderMaterial
			// skips all of that injected boilerplate, so our shader's own declarations stand alone.
			this.material = new THREE.RawShaderMaterial({
				glslVersion: THREE.GLSL3,
				uniforms: {
					...commonUniforms,
					uBumpStrength: { value: 0.01 },
					uCloudsDensity: { value: 0.5 },
					uAtmosphereColor: { value: new THREE.Vector3(0.05, 0.3, 0.9) },
					uAtmosphereDensity: { value: 0.3 },
					uEarthColor: { value: variant.textures.color },
					uEarthClouds: { value: variant.textures.clouds },
					uEarthSpecular: { value: variant.textures.specular },
					uEarthBump: { value: variant.textures.bump },
					uEarthNight: { value: variant.textures.night },
					uStars: { value: variant.textures.stars },
					// Orbiting moons (see earth.fragment.glsl's own comment) — off by default
					// (uMoonCount: 0), so Home's Earth renders byte-identical to before this existed.
					// The array must still be MAX_MOONS long even while unused, or THREE errors setting
					// a shorter array against the shader's fixed-size uniform declaration.
					uMoonCount: { value: 0 },
					uMoonPositions: { value: Array.from({ length: MAX_MOONS }, () => new THREE.Vector3()) },
					uMoonRadius: { value: 1 },
					uMoonTexture: { value: variant.textures.color }
				},
				vertexShader: raymarchVertex,
				fragmentShader: earthFragment
			});
		} else {
			const look = variant.look;
			this.material = new THREE.RawShaderMaterial({
				glslVersion: THREE.GLSL3,
				uniforms: {
					...commonUniforms,
					uBumpStrength: { value: look.bumpStrength ?? 0.01 },
					uSunIntensity: { value: look.sunIntensity ?? 3 },
					uAmbientLight: { value: look.ambientLight ?? 0.01 },
					uAtmosphereColor: { value: new THREE.Vector3(...look.atmosphereColor) },
					uAtmosphereDensity: { value: look.atmosphereDensity },
					uPlanetColor: { value: variant.textures.color },
					uStars: { value: variant.textures.stars }
				},
				vertexShader: raymarchVertex,
				fragmentShader: planetFragment
			});
		}

		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.frustumCulled = false;
	}

	/** Retints this planet's atmosphere at runtime — used for the single shared "skill" planet
	 *  (/skills/[slug]) instead of constructing a fresh RaymarchPlanet (with its own render targets,
	 *  blur passes, texture loads) per skill. Only meaningful for `type: 'planet'` instances — the
	 *  'earth' variant's uAtmosphereColor exists too but nothing currently retints it. */
	setAtmosphereColor(rgb: [number, number, number]): void {
		(this.material.uniforms.uAtmosphereColor.value as THREE.Vector3).set(...rgb);
	}

	/** Only meaningful for `type: 'earth'` instances — feeds the /skills page's orbiting moons into
	 *  the raymarch scene itself (see earth.fragment.glsl's intersectScene()) for real depth/occlusion
	 *  against the planet, called every frame by SkillMoons.update() while active. `positions` are in
	 *  this shader's own fake-camera space (world_x = 6 * uv.x — same space `screenPosition` above is
	 *  in), capped silently at MAX_MOONS. Pass an empty array (or just don't call this) to turn moons
	 *  back off — e.g. when navigating away from /skills while this same shared earthPlanet is still
	 *  active on Home. */
	setMoons(positions: THREE.Vector3[], radius: number, texture: THREE.Texture): void {
		const uniforms = this.material.uniforms;
		if (!uniforms.uMoonPositions) return; // no-op on the 'planet' variant, which has no moon uniforms
		const count = Math.min(positions.length, MAX_MOONS);
		uniforms.uMoonCount.value = count;
		const target = uniforms.uMoonPositions.value as THREE.Vector3[];
		for (let i = 0; i < count; i++) target[i].copy(positions[i]);
		uniforms.uMoonRadius.value = radius;
		uniforms.uMoonTexture.value = texture;
	}

	get texture(): THREE.Texture {
		return this.renderTarget.texture;
	}

	get blurTexture(): THREE.Texture {
		return this.blurTextureValue ?? this.renderTarget.texture;
	}

	loop(): void {
		this.material.uniforms.uResolution.value.set(this.scene.uniforms.uRes.value.x, this.scene.uniforms.uRes.value.y);

		this.scene.renderer.setRenderTarget(this.renderTarget);
		this.scene.renderer.clear();
		this.scene.renderer.render(this.mesh, this.scene.camera);

		this.blurTextureValue = this.blur.apply(this.renderTarget.texture, this.blurRTA, this.blurRTB, 1);
	}

	dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
		this.blur.dispose();
		this.blurRTA.dispose();
		this.blurRTB.dispose();
	}
}

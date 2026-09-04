import * as THREE from 'three';
import type { Scene } from '../scene';
import { Blur } from '../shared/blur';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it
import raymarchVertex from '$lib/shaders/jsulpis-planet/vertex.glsl';
// @ts-ignore
import earthFragment from '$lib/shaders/jsulpis-planet/earth.fragment.glsl';
// @ts-ignore
import planetFragment from '$lib/shaders/jsulpis-planet/planet.fragment.glsl';
// @ts-ignore
import proceduralFragment from '$lib/shaders/jsulpis-planet/procedural.fragment.glsl';

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

export interface ProceduralPlanetTextures {
	stars: THREE.Texture;
}

/** Look for the 'procedural' variant (procedural.fragment.glsl) — no colour texture (the terrain is
 *  fully generated, see procedural-terrain.glsl), so instead of a bump strength it exposes the
 *  generator's own tunables. All optional fields default to the values the upstream demo's own
 *  planet page used. */
export interface ProceduralPlanetLook {
	atmosphereColor: [number, number, number];
	atmosphereDensity: number;
	sunIntensity?: number;
	ambientLight?: number;
	terrainScale?: number;
	noiseStrength?: number;
	cloudsScale?: number;
	cloudsSpeed?: number;
	cloudsDensity?: number;
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

/** Every planet.fragment.glsl/earth.fragment.glsl/procedural.fragment.glsl variant shares the same
 *  fake-camera convention (`#define CAMERA_POSITION vec3(0., 0., 6.0)`) — see raycastHit() below. */
const RAYMARCH_CAMERA_Z = 6;

/** '#rrggbb' -> [r,g,b] in 0-1, for feeding a CSS-style hex color (e.g. a skill's `primaryColor`)
 *  into a shader's vec3 uniform. */
export function hexToRgb(hex: string): [number, number, number] {
	const value = parseInt(hex.replace('#', ''), 16);
	return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

/** Maps a skill's own typeSafety (see $lib/types/ui.ts's SKILL) to the procedural terrain generator's
 *  uHillBias / uMoonHillBias (see procedural-terrain.glsl's terrainBandColor) — 'dynamic' languages
 *  (JavaScript, Python) read as mostly-water "fluid" planets, 'typed' ones (TypeScript, Rust, C++,
 *  Java, Go) read as mostly-rock/ice hilly ones, and everything else (frameworks/tools/services,
 *  which aren't really "languages" in the sense this distinction is about) stays at the generator's
 *  own neutral default mix. */
export function getHillBiasForSkill(skill: { typeSafety?: 'typed' | 'dynamic' }): number {
	if (skill.typeSafety === 'typed') return 0.8;
	if (skill.typeSafety === 'dynamic') return -0.8;
	return 0;
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
		variant:
			| { type: 'earth'; textures: EarthTextures }
			| { type: 'planet'; textures: PlanetTextureVariant; look: RaymarchPlanetLook }
			| { type: 'procedural'; textures: ProceduralPlanetTextures; look: ProceduralPlanetLook },
		// Screen-space offset within this shader's own fake camera (world_x = 6 * uv.x at the planet's
		// depth — see the constant derivation in the layout that calls this), defaulting to dead center.
		// The mesh-based Planet class positions itself off-center per page (see planet.ts's
		// PLANET_PAGES) specifically so it doesn't sit under the gallery/hero content; without an
		// equivalent offset here, this planet renders centered and gets hidden behind whatever else is
		// drawn on top of the back layer at screen-center.
		screenPosition: { x: number; y: number } = { x: 0, y: 0 },
		// Per-instance tweaks away from the defaults every other planet on the site uses — e.g. /about's
		// own close-up, frozen-rotation Earth (see +layout.svelte's own aboutEarthPlanet). radius is
		// world-space (bigger = fills more of the screen, i.e. "closer"); rotationOffset is the same
		// static-phase uniform every variant's PLANET_ROTATION macro already had, just now settable
		// per-instance instead of hardcoded; spinSpeed only affects the 'earth' variant (its own
		// uPlanetSpinSpeed uniform — see earth.fragment.glsl) — 0 freezes the live uTime-driven spin
		// entirely, leaving rotationOffset as a fixed final angle instead of a moving phase. latitudeTilt
		// only affects the 'earth' variant too (uLatitudeTilt) — rotationOffset alone only ever spins
		// the sphere around its poles (can bring any longitude into view, never a different latitude);
		// this is the second axis that can, e.g. aiming at a specific real-world latitude.
		overrides: { radius?: number; rotationOffset?: number; spinSpeed?: number; latitudeTilt?: number } = {}
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
			uRotationOffset: { value: overrides.rotationOffset ?? 0.6 },
			uPlanetRadius: { value: overrides.radius ?? 2 },
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
					// See earth.fragment.glsl's own PLANET_ROTATION comment — 0.1 matches every existing
					// Earth's own always-spinning look; only overrides.spinSpeed (e.g. /about's frozen
					// close-up) ever sets this to 0.
					uPlanetSpinSpeed: { value: overrides.spinSpeed ?? 0.1 },
					// See rotateX()'s own comment in earth.fragment.glsl — 0 (every existing Earth) leaves
					// the equator facing the camera, same as before this uniform existed.
					uLatitudeTilt: { value: overrides.latitudeTilt ?? 0 },
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
					// Per-moon tint (a skill's own primaryColor) — see setMoons()'s own comment. White by
					// default (a no-op multiply) so an unset slot never renders black.
					uMoonColors: { value: Array.from({ length: MAX_MOONS }, () => new THREE.Vector3(1, 1, 1)) },
					// Per-moon water/hills bias (a skill's own typeSafety) — see setMoons()'s own comment
					// and procedural-terrain.glsl's terrainBandColor(). 0 by default (the generator's own
					// neutral mix) for an unset slot.
					uMoonHillBias: { value: new Array(MAX_MOONS).fill(0) }
				},
				vertexShader: raymarchVertex,
				fragmentShader: earthFragment
			});
		} else if (variant.type === 'procedural') {
			const look = variant.look;
			this.material = new THREE.RawShaderMaterial({
				glslVersion: THREE.GLSL3,
				uniforms: {
					...commonUniforms,
					uSunIntensity: { value: look.sunIntensity ?? 3 },
					uAmbientLight: { value: look.ambientLight ?? 0.01 },
					uAtmosphereColor: { value: new THREE.Vector3(...look.atmosphereColor) },
					uAtmosphereDensity: { value: look.atmosphereDensity },
					// See planet.fragment.glsl's own comment — (1,1,1) is a no-op multiply, only
					// setTintColor() (the shared skill planet) ever changes this.
					uSurfaceTint: { value: new THREE.Vector3(1, 1, 1) },
					// See procedural-terrain.glsl's terrainBandColor() — 0 is a no-op (the reference
					// shader's own original mix), only setTerrainBias() (the shared skill planet) ever
					// changes this.
					uHillBias: { value: 0 },
					uTerrainScale: { value: look.terrainScale ?? 1 },
					uNoiseStrength: { value: look.noiseStrength ?? 1 },
					uCloudsScale: { value: look.cloudsScale ?? 1 },
					uCloudsSpeed: { value: look.cloudsSpeed ?? 1 },
					uCloudsDensity: { value: look.cloudsDensity ?? 0.5 },
					uStars: { value: variant.textures.stars }
				},
				vertexShader: raymarchVertex,
				fragmentShader: proceduralFragment
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
					// See planet.fragment.glsl's own comment — (1,1,1) is a no-op multiply, only
					// setTintColor() (the shared skill planet) ever changes this.
					uSurfaceTint: { value: new THREE.Vector3(1, 1, 1) },
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

	/** Retints this planet's SURFACE (a straight multiply on the sampled colour — see
	 *  planet.fragment.glsl's own comment; effectively colourises the moon-cratered texture the way a
	 *  duotone tints a grayscale photo) as well as its atmosphere edge-glow, at runtime — used for the
	 *  single shared "skill" planet (/skills/[slug]) instead of constructing a fresh RaymarchPlanet
	 *  (with its own render targets, blur passes, texture loads) per skill. Only meaningful for
	 *  `type: 'planet'` instances — the 'earth' variant's uAtmosphereColor exists too but nothing
	 *  currently retints it, and it has no uSurfaceTint at all (Home's own Earth colours are real
	 *  photographic textures, not something a flat tint should touch). */
	setTintColor(rgb: [number, number, number]): void {
		(this.material.uniforms.uAtmosphereColor.value as THREE.Vector3).set(...rgb);
		(this.material.uniforms.uSurfaceTint.value as THREE.Vector3).set(...rgb);
	}

	/** Water/hills bias for this planet's own procedural terrain (see getHillBiasForSkill() and
	 *  procedural-terrain.glsl's terrainBandColor()) — only meaningful for `type: 'procedural'`
	 *  instances (the shared skill planet); a no-op on 'earth'/'planet' variants, which have no
	 *  uHillBias uniform at all. */
	setTerrainBias(bias: number): void {
		const uniform = this.material.uniforms.uHillBias;
		if (!uniform) return;
		uniform.value = bias;
	}

	/** Only meaningful for `type: 'earth'` instances — feeds the /skills page's orbiting moons into
	 *  the raymarch scene itself (see earth.fragment.glsl's intersectScene()) for real depth/occlusion
	 *  against the planet, called every frame by SkillMoons.update() while active. `positions` are in
	 *  this shader's own fake-camera space (world_x = 6 * uv.x — same space `screenPosition` above is
	 *  in), capped silently at MAX_MOONS. Pass an empty array (or just don't call this) to turn moons
	 *  back off — e.g. when navigating away from /skills while this same shared earthPlanet is still
	 *  active on Home. No texture parameter — earth.fragment.glsl's own intersectMoonFull() colours
	 *  each moon procedurally (the same generator procedural.fragment.glsl uses for skillPlanet — see
	 *  procedural-terrain.glsl), tinted per-moon by `colors` (that skill's own primaryColor). A moon
	 *  past `colors`' own length falls back to white (a no-op tint), so callers that don't care about
	 *  colour (or pass none at all) still render instead of going black. `hillBias` (see
	 *  getHillBiasForSkill()) is the same per-moon water/hills bias — a moon past its own length
	 *  falls back to 0, the generator's own neutral mix. */
	setMoons(
		positions: THREE.Vector3[],
		radius: number,
		colors: THREE.Vector3[] = [],
		hillBias: number[] = []
	): void {
		const uniforms = this.material.uniforms;
		if (!uniforms.uMoonPositions) return; // no-op on the 'planet'/'procedural' variants, which have no moon uniforms
		const count = Math.min(positions.length, MAX_MOONS);
		uniforms.uMoonCount.value = count;
		const target = uniforms.uMoonPositions.value as THREE.Vector3[];
		const colorTarget = uniforms.uMoonColors.value as THREE.Vector3[];
		const hillBiasTarget = uniforms.uMoonHillBias.value as number[];
		for (let i = 0; i < count; i++) {
			target[i].copy(positions[i]);
			colorTarget[i].copy(colors[i] ?? { x: 1, y: 1, z: 1 });
			hillBiasTarget[i] = hillBias[i] ?? 0;
		}
		uniforms.uMoonRadius.value = radius;
	}

	/** Whether a click at the given NDC coords (screen-space, aspect-corrected — same convention as
	 *  scene.pointer.nx/ny and skill-moons.ts's own raycastHit()/isOccludedByPlanet()) hits this
	 *  planet's own raymarched sphere — the exact ray-sphere test the shader's own sphIntersect() uses
	 *  (uPlanetPosition/uPlanetRadius, the same CAMERA_POSITION every variant's fragment shader
	 *  defines), computed here in JS since there's no real GPU hit-test available from a route's click
	 *  handler. Generic across every variant on purpose — "the shader's own geometry, exposed as a
	 *  method on the object that wraps it" — so a caller (+layout.svelte's handleCanvasClick,
	 *  /skills's own click handler) never needs to re-derive this math itself, the way
	 *  skill-moons.ts's own isOccludedByPlanet() had to before this method existed. */
	raycastHit(ndcX: number, ndcY: number, aspect: number): boolean {
		const planetPosition = this.material.uniforms.uPlanetPosition.value as THREE.Vector3;
		const planetRadius = this.material.uniforms.uPlanetRadius.value as number;

		const cameraPosition = new THREE.Vector3(0, 0, RAYMARCH_CAMERA_Z);
		// A world point on the plane z=planetPosition.z under this shader's own fake-camera projection
		// — see skill-moons.ts's projectToNdc() for the forward direction of this same derivation;
		// substituting z=planetPosition.z into its depthFactor collapses FOCAL_LENGTH's own dependence
		// on planetPosition.z out entirely, leaving depthFactor = RAYMARCH_CAMERA_Z always, regardless
		// of which planet/screenPosition this is.
		const worldPointAtPlanetZ = new THREE.Vector3(
			(ndcX * aspect * RAYMARCH_CAMERA_Z) / 2,
			(ndcY * RAYMARCH_CAMERA_Z) / 2,
			planetPosition.z
		);
		const rd = worldPointAtPlanetZ.sub(cameraPosition).normalize();

		const oc = cameraPosition.sub(planetPosition);
		const b = oc.dot(rd);
		const c = oc.dot(oc) - planetRadius * planetRadius;
		const h = b * b - c;
		if (h < 0) return false;
		return -b - Math.sqrt(h) >= 0;
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

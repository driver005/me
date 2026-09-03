import * as THREE from 'three';
import gsap from 'gsap';
import { Layer } from './layer';
import type { Scene } from './scene';
import type { Scrollable } from './scroll';
import { Blur } from './blur';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/extra/caffee.svelte for the same pattern)
import planetVertex from '$lib/shaders/planet/vertex.glsl';
// @ts-ignore
import planetFragment from '$lib/shaders/planet/fragment.glsl';
// @ts-ignore
import trailVertex from '$lib/shaders/planet/trail-vertex.glsl';
// @ts-ignore
import trailFragment from '$lib/shaders/planet/trail-fragment.glsl';

/** Which route the planet is dressing — mirrors the source's own per-page config table
 *  (world.js's `this.pages`), read verbatim off the live site (see planet-shaders.ts's own note on
 *  where this class's shaders came from). 'error' exists for parity with the source but nothing in
 *  this port currently routes to it. */
export type PlanetPageId = 'home' | 'work' | 'info' | 'error';

interface PlanetPageConfig {
	position: { x: number; y: number; z: number };
	/** World-space radius the source's own mesh uses for this page — see HOME_SCALE_UNIT below for
	 *  how this port converts it into a scale multiplier against our already-tuned geometry. */
	scale: number;
	uniforms: {
		uGlowBiasX: number;
		uRimPow: number;
		uGlowPow: number;
		uGlowStr: number;
		uRimStr: number;
		uTerrainScale: number;
	};
}

// Real per-page position/scale/uniform values, pulled verbatim from the live site's world.js
// (`this.pages = {...}` in its Planet class) — position and the shader uniforms are unit-independent
// and port 1:1 (home's own values here are exactly what this class already shipped with before this
// per-page config existed, confirming the two scenes' world units already agree). `scale` is the one
// exception: our geometry's radius (93, below) was tuned earlier by eye to match the source's home
// view, not copied from it — 90 here is the source's own home `scale`, so HOME_SCALE_UNIT calibrates
// every other page's radius against our 93 using the source's own ratios, rather than trusting 93 to
// equal 90.
const PLANET_PAGES: Record<PlanetPageId, PlanetPageConfig> = {
	home: {
		position: { x: 62, y: -26, z: -10 },
		scale: 90,
		uniforms: { uGlowBiasX: -0.6, uRimPow: 4.5, uGlowPow: 3.2, uGlowStr: 1, uRimStr: 0, uTerrainScale: 3.9 }
	},
	work: {
		// Deliberately bigger/closer than the source's own {scale: 50, z: -60} — verified accurate to
		// world.js and to a matching camera setup (fov 50, position.z 100, same as here), but the user
		// found the source's own version too small/far away on this page and asked for it more
		// prominent, a conscious deviation rather than a bug fix.
		position: { x: 0, y: -32, z: -25 },
		scale: 80,
		uniforms: { uGlowBiasX: 0.6, uRimPow: 4.2, uGlowPow: 3.2, uGlowStr: 0.4, uRimStr: 1, uTerrainScale: 3.5 }
	},
	info: {
		position: { x: -38, y: -40, z: -26.6 },
		scale: 150,
		uniforms: { uGlowBiasX: 0.6, uRimPow: 4.2, uGlowPow: 0.5, uGlowStr: 0.6, uRimStr: 1, uTerrainScale: 3.9 }
	},
	error: {
		position: { x: 0, y: 0, z: -200 },
		scale: 50,
		uniforms: { uGlowBiasX: 0.6, uRimPow: 4.2, uGlowPow: 3.2, uGlowStr: 0.4, uRimStr: 1, uTerrainScale: 3.5 }
	}
};

/** The source's home-page `scale` — see PLANET_PAGES's own comment. */
const HOME_SCALE_UNIT = 90;

// Base tint + default light/dark gradient colors, verbatim from world.js. Every page except Work
// uses these; Work overrides them per-project (see animate()'s `projectColors` param and
// WorkProject.lightColor/darkColor in work-content.ts, themselves pulled from the site's own
// content.CFZxyfkA.js).
const PLANET_COLOR_DEFAULT = new THREE.Color('#00060a').convertLinearToSRGB();
const PLANET_COLOR_WORK = new THREE.Color('#0b0d0f').convertLinearToSRGB();
const PLANET_LIGHT_DEFAULT = new THREE.Color('#81aeca');
const PLANET_DARK_DEFAULT = new THREE.Color('#436eb1');

/** Baseline auto-rotation, always applied on top of any scroll-driven spin below. */
const IDLE_SPIN = 0.0008;
/** Scroll-position-delta -> extra rotation. Gallery/carousel scroll deltas run roughly single- to
 *  low-double-digits per frame during an active scroll gesture (Scroll's own 0.1 lerp ease against a
 *  clamped ±100 wheel target) — this keeps a brisk scroll a few times faster than the idle spin
 *  without spinning the planet like a coin. */
const SCROLL_SPIN_FACTOR = 0.001;

export interface PlanetTextures {
	map: THREE.Texture;
	cracked: THREE.Texture;
	crackedNormal: THREE.Texture;
}

export class Planet extends Layer {
	mesh: THREE.Mesh;
	renderTarget: THREE.WebGLRenderTarget;
	private scene: Scene;
	private material: THREE.ShaderMaterial;
	private innerScene = new THREE.Scene();
	private blur: Blur;
	private blurRTA: THREE.WebGLRenderTarget;
	private blurRTB: THREE.WebGLRenderTarget;
	private blurTextureValue: THREE.Texture | null = null;
	private raycaster = new THREE.Raycaster();
	private pointerNDC = new THREE.Vector2();
	private mouseWorldTarget = new THREE.Vector3();
	private mouseUVTarget = new THREE.Vector2();
	private mouseHoverTarget = 0;
	private mouseHover = 0;
	private crackMode = 0;
	private trailRTA: THREE.WebGLRenderTarget;
	private trailRTB: THREE.WebGLRenderTarget;
	private trailMaterial: THREE.ShaderMaterial;
	private trailMesh: THREE.Mesh;
	private trailScene = new THREE.Scene();
	private trailCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	private pageTimeline: gsap.core.Timeline | null = null;
	private scrollSource: Scrollable | null = null;
	private previousScrollPosition = 0;

	constructor(scene: Scene, textures: PlanetTextures) {
		super(scene.isTouch);
		this.scene = scene;

		const scale = scene.isMobile ? 1 : 0.8;
		this.renderTarget = scene.createRenderTarget(scale);
		this.blur = new Blur(scene);
		this.blurRTA = scene.createRenderTarget(0.15);
		this.blurRTB = scene.createRenderTarget(0.15);

		const geometry = new THREE.SphereGeometry(93, 128, 128);
		geometry.computeTangents();

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				uColor: { value: new THREE.Color('#00060a').convertLinearToSRGB() },
				uRimPow: { value: 4.5 },
				uGlowPow: { value: 3.2 },
				uGlowStr: { value: 1 },
				uRimStr: { value: 0 },
				uLightColor: { value: new THREE.Color('#81aeca') },
				uDarkColor: { value: new THREE.Color('#436eb1') },
				uLightStart: { value: 0.4 },
				uLightEnd: { value: 1 },
				uTerrainScale: { value: 3.9 },
				uTerrainHeight: { value: 0.7 },
				uTerrainDetail: { value: 1.5 },
				uTerrainTime: { value: 0 },
				uGlowBiasX: { value: -0.6 },
				uGlowBiasY: { value: 0 },
				uBiasGlowStr: { value: 1.5 },
				uBiasGlowPow: { value: 7 },
				uMouseWorld: { value: new THREE.Vector3(0, 0, 1000) },
				uMouseRadius: { value: 0.9 },
				uMouseStrength: { value: 0 },
				uTime: scene.uniforms.uTime,
				uMode: scene.uniforms.uMode,
				uIsIntro: { value: 0 },
				uIsMobile: { value: scene.isMobile ? 1 : 0 },
				uRes: scene.uniforms.uRes,
				tMap: { value: textures.map },
				tCracked: { value: textures.cracked },
				tCrackedNormal: { value: textures.crackedNormal },
				uTrailMap: { value: null },
				uRevealRadius: { value: 1.5 },
				uCrackStr: { value: 2 },
				uCrackActive: { value: 0 },
				uNormalStr: { value: 1.2 }
			},
			vertexShader: planetVertex,
			fragmentShader: planetFragment
		});

		this.mesh = new THREE.Mesh(geometry, this.material);
		this.mesh.position.set(62, -26, -10);
		this.innerScene.add(this.mesh);

		this.trailRTA = new THREE.WebGLRenderTarget(512, 256, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RedFormat, type: THREE.HalfFloatType });
		this.trailRTB = this.trailRTA.clone();
		this.trailMaterial = new THREE.ShaderMaterial({
			uniforms: {
				tTrail: { value: null },
				uRes: { value: new THREE.Vector2(512, 256) },
				uMouseUV: { value: new THREE.Vector2(0.5, 0.5) },
				uDecay: { value: 0.995 },
				uStampRadius: { value: 0.06 },
				uActive: { value: 0 }
			},
			vertexShader: trailVertex,
			fragmentShader: trailFragment
		});
		this.trailMesh = new THREE.Mesh(scene.fullScreenTriangle, this.trailMaterial);
		this.trailScene.add(this.trailMesh);
	}

	get texture(): THREE.Texture {
		return this.renderTarget.texture;
	}

	get blurTexture(): THREE.Texture {
		return this.blurTextureValue ?? this.renderTarget.texture;
	}

	/** Exposed for Task 8 (hover-crack trail) to set the trail render target's texture and drive uCrackActive/uMouseStrength. */
	get uniforms() {
		return this.material.uniforms;
	}

	/** Drives extra rotation from cursor-scroll input — pass the home Gallery's own persistent Scroll
	 *  target (its Lenis instance keeps capturing wheel/touch input on every route, home included or
	 *  not, since it's never torn down between navigations) so the planet keeps spinning with whatever
	 *  scroll gesture is happening, not just its own idle rotation. */
	setScrollSource(target: Scrollable): void {
		this.scrollSource = target;
		this.previousScrollPosition = target.scrollPosition;
	}

	setPointerNDC(nx: number, ny: number): void {
		this.pointerNDC.set(nx, ny);
		this.raycaster.setFromCamera(this.pointerNDC, this.scene.camera);
		const hits = this.raycaster.intersectObject(this.mesh);
		if (hits.length > 0 && hits[0].uv) {
			this.mouseWorldTarget.copy(hits[0].point);
			this.mouseUVTarget.copy(hits[0].uv);
			this.mouseHoverTarget = 1;
		} else {
			this.mouseHoverTarget = 0;
		}
	}

	/** Tweens position/scale/uniforms/color to the given page's config (PLANET_PAGES) — called by the
	 *  route layout on every navigation, matching the source's own per-page planet recolor/reposition.
	 *  `projectColors` (a Work project's lightColor/darkColor) only applies when pageId is 'work';
	 *  ignored otherwise, and falls back to the default light/dark gradient if omitted on a work page
	 *  (a slug the site doesn't recognize). */
	animate(pageId: PlanetPageId, projectColors?: { light: string; dark: string }): void {
		const config = PLANET_PAGES[pageId];
		const scale = config.scale / HOME_SCALE_UNIT;

		this.pageTimeline?.kill();
		this.pageTimeline = gsap.timeline({ defaults: { duration: 2.3, ease: 'power3.inOut' } });
		this.pageTimeline.to(this.mesh.position, { x: config.position.x, y: config.position.y, z: config.position.z }, 0);
		this.pageTimeline.to(this.mesh.scale, { x: scale, y: scale, z: scale }, 0);
		for (const [key, value] of Object.entries(config.uniforms)) {
			this.pageTimeline.to(this.material.uniforms[key], { value }, 0);
		}

		const baseColor = pageId === 'work' ? PLANET_COLOR_WORK : PLANET_COLOR_DEFAULT;
		const lightColor = pageId === 'work' && projectColors ? new THREE.Color(projectColors.light) : PLANET_LIGHT_DEFAULT;
		const darkColor = pageId === 'work' && projectColors ? new THREE.Color(projectColors.dark) : PLANET_DARK_DEFAULT;
		this.pageTimeline.to(this.material.uniforms.uColor.value, { r: baseColor.r, g: baseColor.g, b: baseColor.b }, 0);
		this.pageTimeline.to(this.material.uniforms.uLightColor.value, { r: lightColor.r, g: lightColor.g, b: lightColor.b }, 0);
		this.pageTimeline.to(this.material.uniforms.uDarkColor.value, { r: darkColor.r, g: darkColor.g, b: darkColor.b }, 0);
	}

	render(): void {
		this.material.uniforms.uTerrainTime.value += (1 / 60) * 0.1;

		let spin = IDLE_SPIN;
		if (this.scrollSource) {
			const scrollDelta = this.scrollSource.scrollPosition - this.previousScrollPosition;
			this.previousScrollPosition = this.scrollSource.scrollPosition;
			spin += scrollDelta * SCROLL_SPIN_FACTOR;
		}
		this.mesh.rotation.y += spin;

		this.crackMode += (1 - this.crackMode) * 0.03;
		this.mouseHover += (this.mouseHoverTarget - this.mouseHover) * 0.04;
		if (this.mouseHoverTarget === 1) {
			this.material.uniforms.uMouseWorld.value.lerp(this.mouseWorldTarget, 0.06);
		}
		this.material.uniforms.uMouseStrength.value = this.mouseHover * this.crackMode * 0.9;
		this.material.uniforms.uCrackActive.value = this.crackMode;

		if (this.crackMode > 0.001) {
			this.trailMaterial.uniforms.tTrail.value = this.trailRTA.texture;
			this.trailMaterial.uniforms.uActive.value = this.mouseHoverTarget * this.crackMode;
			this.trailMaterial.uniforms.uMouseUV.value.copy(this.mouseUVTarget);
			this.scene.renderer.setRenderTarget(this.trailRTB);
			this.scene.renderer.render(this.trailScene, this.trailCamera);
			[this.trailRTA, this.trailRTB] = [this.trailRTB, this.trailRTA];
			this.material.uniforms.uTrailMap.value = this.trailRTA.texture;
		}

		this.scene.renderer.setRenderTarget(this.renderTarget);
		this.scene.renderer.clear();
		this.scene.renderer.render(this.innerScene, this.scene.camera);

		this.blurTextureValue = this.blur.apply(this.renderTarget.texture, this.blurRTA, this.blurRTB, 1);
	}

	loop(): void {
		this.render();
	}

	dispose(): void {
		this.pageTimeline?.kill();
		this.mesh.geometry.dispose();
		this.material.dispose();
		this.blur.dispose();
		this.trailRTA.dispose();
		this.trailRTB.dispose();
		this.trailMaterial.dispose();
	}
}

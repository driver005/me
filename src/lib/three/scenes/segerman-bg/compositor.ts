import * as THREE from 'three';
import gsap from 'gsap';
import type { Scene } from './scene';
import type { PlanetPageId } from './planet';
import type { Stars } from './stars';
import type { Fog } from './fog';
import type { FluidSim } from './fluid';
import type { PlanetSource } from './planet-switcher';
import type { Front } from './front';
import type { Images } from './images';
import type { Video } from './video';
import type { Texts } from './texts';
import { createPlaceholderTexture } from './placeholder-textures';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/extra/caffee.svelte for the same pattern)
import backFragment from '$lib/shaders/segerman-bg/compositor/back-fragment.glsl';
// @ts-ignore
import outputFragment from '$lib/shaders/segerman-bg/compositor/output-fragment.glsl';
// @ts-ignore
import fullscreenVertex from '$lib/shaders/segerman-bg/common/fullscreen-triangle.glsl';

export interface CompositorLayers {
	stars: Stars;
	fog: Fog;
	fluid: FluidSim;
	planet: PlanetSource;
	front: Front;
	images: Images;
	video: Video;
	texts: Texts;
}

// Real per-page glow strength, verbatim from world.js's own back-compositor class (`this.glowStr`) —
// the strength of the bloom halo the back-fragment shader adds around media/planet edges. Home was
// already ported as this class's uGlowStrength default (0.9); the other pages never were.
const GLOW_STRENGTH_BY_PAGE: Record<PlanetPageId, number> = { home: 0.9, work: 0.4, info: 0.1, error: 0 };

/** Fog only shows on the home page — sub-pages (their own DOM content over the immersive view) drop it. */
const HAS_FOG_BY_PAGE: Record<PlanetPageId, number> = { home: 1, work: 0, info: 0, error: 0 };

export class Compositor {
	private scene: Scene;
	private backRT: THREE.WebGLRenderTarget;
	private backMaterial: THREE.ShaderMaterial;
	private backMesh: THREE.Mesh;
	private outputMaterial: THREE.ShaderMaterial;
	private outputMesh: THREE.Mesh;
	private placeholder = createPlaceholderTexture();
	private fluidSim: FluidSim;
	private frontLayer: Front;
	private planetLayer: PlanetSource;
	private imagesLayer: Images;
	private videoLayer: Video;
	private textsLayer: Texts;
	private pageTimeline: gsap.core.Timeline | null = null;

	constructor(scene: Scene, layers: CompositorLayers) {
		this.scene = scene;
		this.fluidSim = layers.fluid;
		this.frontLayer = layers.front;
		this.planetLayer = layers.planet;
		this.imagesLayer = layers.images;
		this.videoLayer = layers.video;
		this.textsLayer = layers.texts;
		this.backRT = scene.createRenderTarget(scene.isMobile ? scene.dpr : Math.min(scene.dpr, 1.5));

		this.backMaterial = new THREE.ShaderMaterial({
			uniforms: {
				uMode: scene.uniforms.uMode,
				tFluid: { value: layers.fluid.texture },
				tStars: { value: layers.stars.texture },
				tPlanet: { value: layers.planet.texture },
				tPlanetBlur: { value: layers.planet.blurTexture },
				tFog: { value: layers.fog.texture },
				tTexts: { value: layers.texts.texture },
				tTitlesSoft: { value: this.placeholder },
				tTitlesBlur: { value: this.placeholder },
				tImagesBack: { value: layers.images.backTexture },
				tImagesBackBloom: { value: layers.images.backBloomTexture },
				tVideo: { value: layers.video.texture },
				uTime: scene.uniforms.uTime,
				uRes: scene.uniforms.uRes,
				uDpr: scene.uniforms.uDpr,
				uIsMobile: { value: scene.isMobile ? 1 : 0 },
				uHasFog: { value: 1 },
				uTextColor: { value: new THREE.Color('#ffffff').convertLinearToSRGB() },
				uLabelColor: { value: new THREE.Color('#93949f').convertLinearToSRGB() },
				uGrainAmount: { value: 0.025 },
				uFogFloor: { value: 0.3 },
				uFogColorStr: { value: 1.9 },
				uBloomTint: { value: 0.01 },
				uBloomTintThreshold: { value: 0.95 },
				uBloomBleed: { value: 0.6 },
				uGlowStrength: { value: 0.9 },
				uGlowFogDull: { value: 0.05 },
				uOnPlaneBloom: { value: 0.3 },
				uFogAmbient: { value: 2 },
				uProjMaskMin: { value: 0 },
				uProjMaskMax: { value: 0 },
				uCentreProxMin: { value: 0 },
				uCentreProxMax: { value: 0.8 },
				uFogErosionEdge: { value: 0.9 },
				uFogErosionCentre: { value: 0.1 },
				uMediaCurveEdge: { value: 1.5 },
				uSmokeBrightness: { value: 0.7 },
				uSmokeFogMod: { value: 0.6 },
				uSmokeDesat: { value: 0.3 },
				uStarsRGB: { value: 0.001 },
				uImagesRGB: { value: 0.001 },
				uVideoRGB: { value: 0.001 },
				uFogRGB: { value: 0.007 },
				uPlanetBlurAmt: { value: 1 }
			},
			vertexShader: fullscreenVertex,
			fragmentShader: backFragment
		});
		this.backMesh = new THREE.Mesh(scene.fullScreenTriangle, this.backMaterial);
		this.backMesh.frustumCulled = false;

		this.outputMaterial = new THREE.ShaderMaterial({
			uniforms: {
				tBack: { value: this.backRT.texture },
				tFront: { value: layers.front.texture },
				tFluid: { value: layers.fluid.texture },
				uTime: scene.uniforms.uTime,
				uIsTouch: scene.uniforms.uIsTouch,
				uMode: scene.uniforms.uMode,
				uRes: scene.uniforms.uRes,
				uToggleCoords: scene.uniforms.uToggleCoords,
				uToggleProgress: scene.uniforms.uToggleProgress,
				uDirection: scene.uniforms.uDirection,
				uProgressFront: scene.uniforms.uProgressFront,
				uProgressBack: scene.uniforms.uProgressBack,
				uWarp: scene.uniforms.uWarp
			},
			vertexShader: fullscreenVertex,
			fragmentShader: outputFragment
		});
		this.outputMesh = new THREE.Mesh(scene.fullScreenTriangle, this.outputMaterial);
		this.outputMesh.frustumCulled = false;
	}

	/** Tweens the back layer's glow strength and fog visibility to the given page's values
	 *  (GLOW_STRENGTH_BY_PAGE, HAS_FOG_BY_PAGE) — called by the route layout alongside
	 *  Planet.animate(), on every navigation. */
	setPage(pageId: PlanetPageId): void {
		this.pageTimeline?.kill();
		this.pageTimeline = gsap.timeline();
		this.pageTimeline.to(
			this.backMaterial.uniforms.uGlowStrength,
			{ value: GLOW_STRENGTH_BY_PAGE[pageId], duration: 2.3, ease: 'power3.inOut' },
			0
		);
		this.pageTimeline.to(
			this.backMaterial.uniforms.uHasFog,
			{ value: HAS_FOG_BY_PAGE[pageId], duration: 2.3, ease: 'power3.inOut' },
			0
		);
	}

	render(): void {
		const renderer = this.scene.renderer;
		this.backMaterial.uniforms.tFluid.value = this.fluidSim.texture;
		// tPlanet, like tPlanetBlur below, must be re-read every frame, not just captured once at
		// construction — `layers.planet` is a PlanetSwitcher now, not a single stable Planet instance,
		// so which texture ".texture" resolves to changes as the route swaps the active planet
		// (Earth/Moon/Mars/mesh). A stale reference here freezes on whichever planet was active when
		// Compositor was constructed instead of following the switch, mismatching the (already
		// per-frame) tPlanetBlur and reading as a half-transparent, wrong-planet composite.
		this.backMaterial.uniforms.tPlanet.value = this.planetLayer.texture;
		this.backMaterial.uniforms.tPlanetBlur.value = this.planetLayer.blurTexture;
		this.backMaterial.uniforms.tImagesBack.value = this.imagesLayer.backTexture;
		this.backMaterial.uniforms.tImagesBackBloom.value = this.imagesLayer.backBloomTexture;
		this.backMaterial.uniforms.tVideo.value = this.videoLayer.texture;
		this.backMaterial.uniforms.tTexts.value = this.textsLayer.texture;
		this.outputMaterial.uniforms.tFluid.value = this.fluidSim.texture;
		// tFront's texture identity is actually stable frame-to-frame (unlike tFluid's ping-pong swap) — this
		// live-read isn't strictly required today, but it mirrors the original site's own per-frame assignment
		// and costs one property write, so it's kept for fidelity and to stay correct if Front's RT strategy changes.
		this.outputMaterial.uniforms.tFront.value = this.frontLayer.texture;
		renderer.setRenderTarget(this.backRT);
		renderer.render(this.backMesh, this.scene.camera);

		renderer.setRenderTarget(null);
		renderer.render(this.outputMesh, this.scene.camera);
	}

	dispose(): void {
		this.pageTimeline?.kill();
		this.backMaterial.dispose();
		this.outputMaterial.dispose();
		this.placeholder.dispose();
	}
}

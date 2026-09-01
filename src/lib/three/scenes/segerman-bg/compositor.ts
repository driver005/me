import * as THREE from 'three';
import type { Scene } from './scene';
import type { Stars } from './stars';
import type { Fog } from './fog';
import type { FluidSim } from './fluid';
import type { Planet } from './planet';
import type { Front } from './front';
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
	planet: Planet;
	front: Front;
}

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

	constructor(scene: Scene, layers: CompositorLayers) {
		this.scene = scene;
		this.fluidSim = layers.fluid;
		this.frontLayer = layers.front;
		this.backRT = scene.createRenderTarget(scene.isMobile ? scene.dpr : Math.min(scene.dpr, 1.5));

		this.backMaterial = new THREE.ShaderMaterial({
			uniforms: {
				uMode: scene.uniforms.uMode,
				tFluid: { value: layers.fluid.texture },
				tStars: { value: layers.stars.texture },
				tPlanet: { value: layers.planet.texture },
				tPlanetBlur: { value: layers.planet.blurTexture },
				tFog: { value: layers.fog.texture },
				tTexts: { value: this.placeholder },
				tTitlesSoft: { value: this.placeholder },
				tTitlesBlur: { value: this.placeholder },
				tImagesBack: { value: this.placeholder },
				tImagesBackBloom: { value: this.placeholder },
				tVideo: { value: this.placeholder },
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
				uRes: scene.uniforms.uRes,
				uTime: scene.uniforms.uTime,
				uIsTouch: scene.uniforms.uIsTouch
			},
			vertexShader: fullscreenVertex,
			fragmentShader: outputFragment
		});
		this.outputMesh = new THREE.Mesh(scene.fullScreenTriangle, this.outputMaterial);
		this.outputMesh.frustumCulled = false;
	}

	render(): void {
		const renderer = this.scene.renderer;
		this.backMaterial.uniforms.tFluid.value = this.fluidSim.texture;
		this.outputMaterial.uniforms.tFluid.value = this.fluidSim.texture;
		this.outputMaterial.uniforms.tFront.value = this.frontLayer.texture;
		renderer.setRenderTarget(this.backRT);
		renderer.render(this.backMesh, this.scene.camera);

		renderer.setRenderTarget(null);
		renderer.render(this.outputMesh, this.scene.camera);
	}

	dispose(): void {
		this.backMaterial.dispose();
		this.outputMaterial.dispose();
		this.placeholder.dispose();
	}
}

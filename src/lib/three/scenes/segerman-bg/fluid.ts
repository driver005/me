// src/lib/three/scenes/segerman-bg/fluid.ts
import * as THREE from 'three';
import { Layer } from './layer';
import type { Scene } from './scene';
import { createRTPair, type RTPair } from './rt-pair';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/extra/caffee.svelte for the same pattern)
import fluidVertex from '$lib/shaders/segerman-bg/fluid/vertex.glsl';
// @ts-ignore
import clearFragment from '$lib/shaders/segerman-bg/fluid/clear-fragment.glsl';
// @ts-ignore
import splatFragment from '$lib/shaders/segerman-bg/fluid/splat-fragment.glsl';
// @ts-ignore
import advectionFragment from '$lib/shaders/segerman-bg/fluid/advection-fragment.glsl';
// @ts-ignore
import divergenceFragment from '$lib/shaders/segerman-bg/fluid/divergence-fragment.glsl';
// @ts-ignore
import curlFragment from '$lib/shaders/segerman-bg/fluid/curl-fragment.glsl';
// @ts-ignore
import vorticityFragment from '$lib/shaders/segerman-bg/fluid/vorticity-fragment.glsl';
// @ts-ignore
import pressureFragment from '$lib/shaders/segerman-bg/fluid/pressure-fragment.glsl';
// @ts-ignore
import gradientSubtractFragment from '$lib/shaders/segerman-bg/fluid/gradient-subtract-fragment.glsl';

interface Splat {
	x: number;
	y: number;
	dx: number;
	dy: number;
}

const SIM_RES = 128;
const DYE_RES = 512;
const ITERATIONS = 1;
const CURL_STRENGTH = 0;
const DISSIPATION = {
	front: { density: 0.73, velocity: 0.98, pressure: 0.7, maxRadius: 6 },
	back: { density: 0.83, velocity: 0.9, pressure: 0.97, maxRadius: 16 }
};

export class FluidSim extends Layer {
	private scene: Scene;
	private density: RTPair;
	private velocity: RTPair;
	private pressure: RTPair;
	private divergenceRT: THREE.WebGLRenderTarget;
	private curlRT: THREE.WebGLRenderTarget;
	private splats: Splat[] = [];
	private radius = 0;
	private densityDissipation = DISSIPATION.front.density;
	private velocityDissipation = DISSIPATION.front.velocity;
	private pressureDissipation = DISSIPATION.front.pressure;
	private maxRadius = DISSIPATION.front.maxRadius;
	private mesh: THREE.Mesh;

	private clearMaterial: THREE.RawShaderMaterial;
	private splatMaterial: THREE.RawShaderMaterial;
	private advectionMaterial: THREE.RawShaderMaterial;
	private divergenceMaterial: THREE.RawShaderMaterial;
	private curlMaterial: THREE.RawShaderMaterial;
	private vorticityMaterial: THREE.RawShaderMaterial;
	private pressureMaterial: THREE.RawShaderMaterial;
	private gradientSubtractMaterial: THREE.RawShaderMaterial;

	constructor(scene: Scene) {
		super(scene.isTouch);
		this.scene = scene;

		const texelSize = { value: new THREE.Vector2(1 / SIM_RES, 1 / SIM_RES) };

		this.density = createRTPair(DYE_RES, DYE_RES, { type: THREE.HalfFloatType, depthBuffer: false });
		this.velocity = createRTPair(SIM_RES, SIM_RES, { type: THREE.HalfFloatType, format: THREE.RGFormat, depthBuffer: false });
		this.pressure = createRTPair(SIM_RES, SIM_RES, {
			type: THREE.HalfFloatType,
			format: THREE.RedFormat,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter,
			depthBuffer: false
		});
		this.divergenceRT = new THREE.WebGLRenderTarget(SIM_RES, SIM_RES, {
			type: THREE.HalfFloatType,
			format: THREE.RedFormat,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter,
			depthBuffer: false
		});
		this.curlRT = new THREE.WebGLRenderTarget(SIM_RES, SIM_RES, {
			type: THREE.HalfFloatType,
			format: THREE.RedFormat,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter,
			depthBuffer: false
		});

		const common = { glslVersion: THREE.GLSL3, vertexShader: fluidVertex, blending: THREE.NoBlending, depthTest: false, depthWrite: false };

		this.clearMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, uTexture: { value: null }, value: { value: this.pressureDissipation } }, fragmentShader: clearFragment });
		this.splatMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, uTarget: { value: null }, uAspect: { value: 1 }, color: { value: new THREE.Vector3() }, point: { value: new THREE.Vector2() }, radius: { value: 1 } }, fragmentShader: splatFragment });
		this.advectionMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, dyeTexelSize: { value: new THREE.Vector2(1 / DYE_RES, 1 / DYE_RES) }, uVelocity: { value: null }, uSource: { value: null }, dt: { value: 0.016 }, dissipation: { value: 1 } }, fragmentShader: advectionFragment });
		this.divergenceMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, uVelocity: { value: null } }, fragmentShader: divergenceFragment });
		this.curlMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, uVelocity: { value: null } }, fragmentShader: curlFragment });
		this.vorticityMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, uVelocity: { value: null }, uCurl: { value: null }, curl: { value: CURL_STRENGTH }, dt: { value: 0.016 } }, fragmentShader: vorticityFragment });
		this.pressureMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, uPressure: { value: null }, uDivergence: { value: null } }, fragmentShader: pressureFragment });
		this.gradientSubtractMaterial = new THREE.RawShaderMaterial({ ...common, uniforms: { texelSize, uPressure: { value: null }, uVelocity: { value: null } }, fragmentShader: gradientSubtractFragment });

		this.mesh = new THREE.Mesh(scene.fullScreenTriangle, this.clearMaterial);
		this.mesh.frustumCulled = false;
	}

	get texture(): THREE.Texture {
		return this.density.read.texture;
	}

	/** dx/dy are already scaled (see Scene pointer wiring in Task 6 Step 3). */
	pushSplat(x: number, y: number, dx: number, dy: number): void {
		this.splats.push({ x, y, dx, dy });
	}

	setAspect(aspect: number): void {
		this.splatMaterial.uniforms.uAspect.value = aspect;
	}

	/** Swaps the fluid trail's feel to match the destination mode — called once by Toggle's click handler. */
	setMode(isBackMode: boolean): void {
		const preset = isBackMode ? DISSIPATION.back : DISSIPATION.front;
		this.densityDissipation = preset.density;
		this.velocityDissipation = preset.velocity;
		this.pressureDissipation = preset.pressure;
		this.maxRadius = preset.maxRadius;
	}

	private renderPass(material: THREE.RawShaderMaterial, target: THREE.WebGLRenderTarget): void {
		this.mesh.material = material;
		this.scene.renderer.setRenderTarget(target);
		this.scene.renderer.render(this.mesh, this.scene.camera);
	}

	/** Called every frame by Layer.loop() via render(), but the sim also needs a real dt — Scene passes it through `render`. */
	render(): void {
		this.update(1 / 60);
	}

	loop(): void {
		this.render();
	}

	update(dtSeconds: number): void {
		const renderer = this.scene.renderer;
		const prevTarget = renderer.getRenderTarget();
		const prevAutoClear = renderer.autoClear;
		renderer.autoClear = false;

		for (const splat of this.splats.splice(0)) {
			this.splatMaterial.uniforms.uTarget.value = this.velocity.read.texture;
			this.splatMaterial.uniforms.point.value.set(splat.x, splat.y);
			this.splatMaterial.uniforms.color.value.set(splat.dx, splat.dy, 1);
			this.splatMaterial.uniforms.radius.value = this.radius / 100;
			this.renderPass(this.splatMaterial, this.velocity.write);
			this.velocity.swap();

			this.splatMaterial.uniforms.uTarget.value = this.density.read.texture;
			this.renderPass(this.splatMaterial, this.density.write);
			this.density.swap();
		}

		this.curlMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
		this.renderPass(this.curlMaterial, this.curlRT);

		this.vorticityMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
		this.vorticityMaterial.uniforms.uCurl.value = this.curlRT.texture;
		this.vorticityMaterial.uniforms.dt.value = dtSeconds;
		this.renderPass(this.vorticityMaterial, this.velocity.write);
		this.velocity.swap();

		this.divergenceMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
		this.renderPass(this.divergenceMaterial, this.divergenceRT);

		this.clearMaterial.uniforms.uTexture.value = this.pressure.read.texture;
		this.clearMaterial.uniforms.value.value = this.pressureDissipation;
		this.renderPass(this.clearMaterial, this.pressure.write);
		this.pressure.swap();

		this.pressureMaterial.uniforms.uDivergence.value = this.divergenceRT.texture;
		for (let i = 0; i < ITERATIONS; i++) {
			this.pressureMaterial.uniforms.uPressure.value = this.pressure.read.texture;
			this.renderPass(this.pressureMaterial, this.pressure.write);
			this.pressure.swap();
		}

		this.gradientSubtractMaterial.uniforms.uPressure.value = this.pressure.read.texture;
		this.gradientSubtractMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
		this.renderPass(this.gradientSubtractMaterial, this.velocity.write);
		this.velocity.swap();

		this.advectionMaterial.uniforms.dt.value = dtSeconds;
		this.advectionMaterial.uniforms.dyeTexelSize.value.set(1 / SIM_RES, 1 / SIM_RES);
		this.advectionMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
		this.advectionMaterial.uniforms.uSource.value = this.velocity.read.texture;
		this.advectionMaterial.uniforms.dissipation.value = this.velocityDissipation;
		this.renderPass(this.advectionMaterial, this.velocity.write);
		this.velocity.swap();

		this.advectionMaterial.uniforms.dyeTexelSize.value.set(1 / DYE_RES, 1 / DYE_RES);
		this.advectionMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
		this.advectionMaterial.uniforms.uSource.value = this.density.read.texture;
		this.advectionMaterial.uniforms.dissipation.value = this.densityDissipation;
		this.renderPass(this.advectionMaterial, this.density.write);
		this.density.swap();

		renderer.autoClear = prevAutoClear;
		renderer.setRenderTarget(prevTarget);
	}

	/** Called once per frame from the route before layer.loop() runs — see Task 6 Step 3. */
	updateRadiusFromSpeed(speed: number): void {
		const target = Math.min(Math.max(speed, 0), this.maxRadius) * 0.01;
		this.radius += (target - this.radius) * 0.1;
	}

	dispose(): void {
		this.density.dispose();
		this.velocity.dispose();
		this.pressure.dispose();
		this.divergenceRT.dispose();
		this.curlRT.dispose();
		for (const m of [this.clearMaterial, this.splatMaterial, this.advectionMaterial, this.divergenceMaterial, this.curlMaterial, this.vorticityMaterial, this.pressureMaterial, this.gradientSubtractMaterial]) {
			m.dispose();
		}
	}
}

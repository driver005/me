import * as THREE from 'three';
import { Layer } from './layer';
import type { Scene } from './scene';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/extra/caffee.svelte for the same pattern)
import fogFragment from '$lib/shaders/segerman-bg/fog/fragment.glsl';
// @ts-ignore
import fullscreenVertex from '$lib/shaders/segerman-bg/common/fullscreen-triangle.glsl';

export class Fog extends Layer {
	renderTarget: THREE.WebGLRenderTarget;
	private mesh: THREE.Mesh;
	private material: THREE.ShaderMaterial;
	private scene: Scene;

	constructor(scene: Scene, noiseTexture: THREE.Texture) {
		super(scene.isTouch);
		this.scene = scene;
		this.renderTarget = scene.createRenderTarget(0.3);

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				uMode: scene.uniforms.uMode,
				uRes: scene.uniforms.uRes,
				uTime: scene.uniforms.uTime,
				tNoise: { value: noiseTexture },
				tFluid: { value: null },
				uHasFog: { value: 1 },
				uColor: { value: new THREE.Color('#20447e').convertLinearToSRGB() },
				uScale: { value: 1.6 },
				uQSpeed: { value: 0.02 },
				uQYSpeed: { value: 0 },
				uRXSpeed: { value: 0.08 },
				uRYSpeed: { value: 0.08 },
				uFluidStr: { value: 0.003 },
				uDarkMul: { value: 1 },
				uMidMul: { value: 1 },
				uLightLift: { value: 1 },
				uDensityMin: { value: 0.1 },
				uDensityMax: { value: 1 },
				uOffsetX: { value: 0 },
				uOffsetY: { value: 0 }
			},
			vertexShader: fullscreenVertex,
			fragmentShader: fogFragment
		});
		this.mesh = new THREE.Mesh(scene.fullScreenTriangle, this.material);
		this.mesh.frustumCulled = false;
	}

	/** Called by the Fluid layer's owner once fluid exists (Task 6) so fog can distort around the pointer trail. */
	setFluidTexture(texture: THREE.Texture): void {
		this.material.uniforms.tFluid.value = texture;
	}

	get texture(): THREE.Texture {
		return this.renderTarget.texture;
	}

	render(): void {
		this.scene.renderer.setRenderTarget(this.renderTarget);
		this.scene.renderer.render(this.mesh, this.scene.camera);
	}

	dispose(): void {
		this.material.dispose();
	}
}

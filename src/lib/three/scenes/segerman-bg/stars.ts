import * as THREE from 'three';
import { Layer } from './layer';
import type { Scene } from './scene';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/extra/caffee.svelte for the same pattern)
import starsFragment from '$lib/shaders/segerman-bg/stars/fragment.glsl';
// @ts-ignore
import fullscreenVertex from '$lib/shaders/segerman-bg/common/fullscreen-triangle.glsl';

export class Stars extends Layer {
	renderTarget: THREE.WebGLRenderTarget;
	private mesh: THREE.Mesh;
	private material: THREE.ShaderMaterial;
	private scene: Scene;

	constructor(scene: Scene) {
		super(scene.isTouch);
		this.scene = scene;
		this.renderTarget = scene.createRenderTarget(scene.isTouch ? 0.6 : 0.7);

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				uRes: scene.uniforms.uRes,
				uMode: scene.uniforms.uMode,
				uTime: scene.uniforms.uTime,
				uColor: { value: new THREE.Color('#001524').convertLinearToSRGB() },
				uDustColor: { value: new THREE.Color('#064c9a').convertLinearToSRGB() },
				uBrightness: { value: 2.8 },
				uStarBrightness: { value: 1.3 },
				uDustBrightness: { value: 0.1 },
				uFrontBoost: { value: 1.3 },
				uIsIntro: { value: 0 }
			},
			vertexShader: fullscreenVertex,
			fragmentShader: starsFragment
		});
		this.mesh = new THREE.Mesh(scene.fullScreenTriangle, this.material);
		this.mesh.frustumCulled = false;
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

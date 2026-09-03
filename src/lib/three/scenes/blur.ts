import * as THREE from 'three';
import type { Scene } from './scene';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/extra/caffee.svelte for the same pattern)
import blurFragment from '$lib/shaders/blur/fragment.glsl';
// @ts-ignore
import fullscreenVertex from '$lib/shaders/common/fullscreen-triangle.glsl';

export class Blur {
	private scene: Scene;
	private hMaterial: THREE.ShaderMaterial;
	private vMaterial: THREE.ShaderMaterial;
	private mesh: THREE.Mesh;

	constructor(scene: Scene) {
		this.scene = scene;
		this.hMaterial = new THREE.ShaderMaterial({
			uniforms: { tMap: { value: null }, uBluriness: { value: 1 }, uDirection: { value: new THREE.Vector2(1, 0) }, uResolution: { value: new THREE.Vector2() } },
			vertexShader: fullscreenVertex,
			fragmentShader: blurFragment
		});
		this.vMaterial = new THREE.ShaderMaterial({
			uniforms: { tMap: { value: null }, uBluriness: { value: 1 }, uDirection: { value: new THREE.Vector2(0, 1) }, uResolution: { value: new THREE.Vector2() } },
			vertexShader: fullscreenVertex,
			fragmentShader: blurFragment
		});
		this.mesh = new THREE.Mesh(scene.fullScreenTriangle, this.hMaterial);
		this.mesh.frustumCulled = false;
	}

	apply(source: THREE.Texture, rtA: THREE.WebGLRenderTarget, rtB: THREE.WebGLRenderTarget, strength = 1): THREE.Texture {
		const renderer = this.scene.renderer;
		this.hMaterial.uniforms.uBluriness.value = strength;
		this.vMaterial.uniforms.uBluriness.value = strength;
		this.hMaterial.uniforms.uResolution.value.set(rtA.width, rtA.height);
		this.vMaterial.uniforms.uResolution.value.set(rtB.width, rtB.height);

		this.hMaterial.uniforms.tMap.value = source;
		this.mesh.material = this.hMaterial;
		renderer.setRenderTarget(rtA);
		renderer.render(this.mesh, this.scene.camera);

		this.vMaterial.uniforms.tMap.value = rtA.texture;
		this.mesh.material = this.vMaterial;
		renderer.setRenderTarget(rtB);
		renderer.render(this.mesh, this.scene.camera);

		return rtB.texture;
	}

	dispose(): void {
		this.hMaterial.dispose();
		this.vMaterial.dispose();
	}
}

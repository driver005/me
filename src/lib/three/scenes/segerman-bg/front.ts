import * as THREE from 'three';
import { Layer } from './layer';
import type { Scene } from './scene';
import { createPlaceholderTexture } from './placeholder-textures';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/extra/caffee.svelte for the same pattern)
import frontFragment from '$lib/shaders/segerman-bg/front/fragment.glsl';
// @ts-ignore
import fullscreenVertex from '$lib/shaders/segerman-bg/common/fullscreen-triangle.glsl';

export class Front extends Layer {
	renderTarget: THREE.WebGLRenderTarget;
	private mesh: THREE.Mesh;
	private material: THREE.ShaderMaterial;
	private scene: Scene;
	private placeholder = createPlaceholderTexture();

	constructor(scene: Scene) {
		super(scene.isTouch);
		this.scene = scene;
		this.renderTarget = scene.createRenderTarget(scene.dpr);

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				tTitles: { value: this.placeholder },
				tTexts: { value: this.placeholder },
				tImagesFront: { value: this.placeholder },
				tVideo: { value: this.placeholder },
				uTime: scene.uniforms.uTime,
				uRes: scene.uniforms.uRes,
				uTextColor: { value: new THREE.Color('#00031f').convertLinearToSRGB() },
				uLabelColor: { value: new THREE.Color('#93949f').convertLinearToSRGB() },
				uBgOffset: { value: 1 }
			},
			vertexShader: fullscreenVertex,
			fragmentShader: frontFragment
		});
		this.mesh = new THREE.Mesh(scene.fullScreenTriangle, this.material);
		this.mesh.frustumCulled = false;
	}

	get texture(): THREE.Texture {
		return this.renderTarget.texture;
	}

	loop(): void {
		this.render();
	}

	render(): void {
		this.scene.renderer.setRenderTarget(this.renderTarget);
		this.scene.renderer.render(this.mesh, this.scene.camera);
	}

	dispose(): void {
		this.material.dispose();
		this.placeholder.dispose();
	}
}

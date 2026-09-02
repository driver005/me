import * as THREE from 'three';
import { Layer } from './layer';
import type { Scene } from './scene';
import type { Images } from './images';
import type { Video } from './video';
import type { Texts } from './texts';
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
	private imagesLayer: Images;
	private videoLayer: Video;
	private textsLayer: Texts;

	constructor(scene: Scene, images: Images, video: Video, texts: Texts) {
		super(scene.isTouch);
		this.scene = scene;
		this.imagesLayer = images;
		this.videoLayer = video;
		this.textsLayer = texts;
		this.renderTarget = scene.createRenderTarget(scene.dpr);

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				// tTitles is a deliberate placeholder — real content (project titles) lands in a future phase.
				tTitles: { value: this.placeholder },
				tTexts: { value: texts.texture },
				tImagesFront: { value: images.frontTexture },
				tVideo: { value: video.texture },
				uTime: scene.uniforms.uTime,
				uRes: scene.uniforms.uRes,
				uTextColor: { value: new THREE.Color('#00031f').convertLinearToSRGB() },
				uLabelColor: { value: new THREE.Color('#93949f').convertLinearToSRGB() },
				// Settled post-intro-loader value; the original site animates this from 0 during its loader,
				// which this port doesn't have yet.
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
		this.material.uniforms.tImagesFront.value = this.imagesLayer.frontTexture;
		this.material.uniforms.tVideo.value = this.videoLayer.texture;
		this.material.uniforms.tTexts.value = this.textsLayer.texture;
		this.scene.renderer.setRenderTarget(this.renderTarget);
		this.scene.renderer.render(this.mesh, this.scene.camera);
	}

	dispose(): void {
		this.material.dispose();
		this.placeholder.dispose();
	}
}

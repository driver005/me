import * as THREE from 'three';
import { Layer } from '../shared/layer';
import type { Scene } from '../scene';
import type { Gallery } from '../gallery/gallery';
import { Blur } from '../shared/blur';

export class Images extends Layer {
	private scene: Scene;
	private gallery: Gallery;
	private blur: Blur;

	private backRT: THREE.WebGLRenderTarget;
	private frontRT: THREE.WebGLRenderTarget;
	private tightBlurA: THREE.WebGLRenderTarget;
	private tightBlurB: THREE.WebGLRenderTarget;

	constructor(scene: Scene, gallery: Gallery) {
		super(scene.isTouch);
		this.scene = scene;
		this.gallery = gallery;
		this.blur = new Blur(scene);

		const scale = scene.isMobile ? scene.dpr : Math.min(scene.dpr, 1.4);
		this.backRT = scene.createRenderTarget(scale);
		this.frontRT = scene.createRenderTarget(scale);
		this.tightBlurA = scene.createRenderTarget(0.5);
		this.tightBlurB = scene.createRenderTarget(0.5);
	}

	get backTexture(): THREE.Texture {
		return this.backRT.texture;
	}

	get backBloomTexture(): THREE.Texture {
		return this.tightBlurB.texture;
	}

	get frontTexture(): THREE.Texture {
		return this.frontRT.texture;
	}

	loop(): void {
		this.render();
	}

	render(): void {
		this.gallery.update(this.scene.pointer.nx, this.scene.pointer.ny);
		const renderer = this.scene.renderer;

		// Back pass (uImageMode=0): direct color, bloom-composited — feeds the immersive back compositor.
		for (const card of this.gallery.cards) card.setImageMode(0);
		renderer.setRenderTarget(this.backRT);
		renderer.clear();
		renderer.render(this.gallery.imageScene, this.scene.camera);
		this.blur.apply(this.backRT.texture, this.tightBlurA, this.tightBlurB, 1);

		// Front pass (uImageMode=1): grain/duotone treatment, no bloom — feeds the white front compositor.
		for (const card of this.gallery.cards) card.setImageMode(1);
		renderer.setRenderTarget(this.frontRT);
		renderer.clear();
		renderer.render(this.gallery.imageScene, this.scene.camera);
	}

	dispose(): void {
		this.blur.dispose();
	}
}

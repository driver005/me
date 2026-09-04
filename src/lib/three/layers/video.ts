import * as THREE from 'three';
import { Layer } from '../shared/layer';
import type { Scene } from '../scene';
import type { Gallery } from '../gallery/gallery';

export class Video extends Layer {
	private scene: Scene;
	private gallery: Gallery;
	private renderTarget: THREE.WebGLRenderTarget;

	constructor(scene: Scene, gallery: Gallery) {
		super(scene.isTouch);
		this.scene = scene;
		this.gallery = gallery;
		const scale = scene.isMobile ? scene.dpr : Math.min(scene.dpr, 1.25);
		this.renderTarget = scene.createRenderTarget(scale);
	}

	get texture(): THREE.Texture {
		return this.renderTarget.texture;
	}

	loop(): void {
		this.render();
	}

	render(): void {
		const renderer = this.scene.renderer;
		renderer.setRenderTarget(this.renderTarget);
		renderer.clear();
		renderer.render(this.gallery.videoScene, this.scene.camera);
	}
}

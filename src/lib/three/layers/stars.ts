import * as THREE from 'three';
import { Layer } from '../shared/layer';
import type { Scene } from '../scene';
import { createStarfieldMaterial } from '../shared/starfield';

export class Stars extends Layer {
	renderTarget: THREE.WebGLRenderTarget;
	private mesh: THREE.Mesh;
	private material: THREE.ShaderMaterial;
	private scene: Scene;

	constructor(scene: Scene) {
		super(scene.isTouch);
		this.scene = scene;
		this.renderTarget = scene.createRenderTarget(scene.isTouch ? 0.6 : 0.7);

		this.material = createStarfieldMaterial({
			uRes: scene.uniforms.uRes,
			uMode: scene.uniforms.uMode,
			uTime: scene.uniforms.uTime
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

	loop(): void {
		this.render();
	}

	dispose(): void {
		this.material.dispose();
	}
}

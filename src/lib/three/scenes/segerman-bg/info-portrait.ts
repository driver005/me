import * as THREE from 'three';
import type { Scene } from './scene';
import type { Gallery } from './gallery';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it
import portraitVertex from '$lib/shaders/segerman-bg/info-portrait/vertex.glsl';
// @ts-ignore
import portraitFragment from '$lib/shaders/segerman-bg/info-portrait/fragment.glsl';

/**
 * The Info page's author-portrait mesh (Info.CPeBr9yW.js's class `x`, fetched via Firecrawl) —
 * curves/scales up in back mode, flat in front mode. The original DOM-position-syncs a front-mode
 * resting position via a real `.media-wrapper` element this port never scraped; simplified to a
 * fixed world position using the same tuned backState offset the original applies in back mode.
 */
export class InfoPortrait {
	mesh: THREE.Mesh;
	private material: THREE.ShaderMaterial;
	private texture: THREE.Texture;
	private gallery: Gallery;

	constructor(scene: Scene, gallery: Gallery) {
		this.gallery = gallery;

		this.texture = new THREE.TextureLoader().load('/textures/segerman-bg/rafi-info.webp');
		this.texture.generateMipmaps = false;
		this.texture.minFilter = THREE.LinearFilter;
		this.texture.magFilter = THREE.LinearFilter;

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				tMap: { value: this.texture },
				uMode: scene.uniforms.uMode,
				uScale: { value: scene.isTouch ? 0 : 1 },
				uCurveStrength: { value: scene.isTouch ? 0 : 3.5 }
			},
			vertexShader: portraitVertex,
			fragmentShader: portraitFragment
		});

		const geometry = new THREE.PlaneGeometry(1, 1, 30, 30);
		this.mesh = new THREE.Mesh(geometry, this.material);
		this.mesh.scale.set(20, 26, 1);
		this.mesh.position.set(-18, 3, 0);
		this.mesh.rotation.y = -0.42;
		this.mesh.frustumCulled = false;

		this.gallery.imageScene.add(this.mesh);
	}

	dispose(): void {
		this.gallery.imageScene.remove(this.mesh);
		this.texture.dispose();
		this.material.dispose();
		this.mesh.geometry.dispose();
	}
}

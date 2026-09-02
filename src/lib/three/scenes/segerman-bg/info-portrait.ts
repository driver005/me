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
/** Matches Tailwind's `md` breakpoint — the Info page's own text column (info/+page.svelte) switches
 *  from full-width/overlaid to a left-half column at the same width, so the portrait needs to move
 *  in lockstep or the two would either overlap unintentionally or leave a gap. */
const SPLIT_BREAKPOINT_PX = 768;

export class InfoPortrait {
	mesh: THREE.Mesh;
	private material: THREE.ShaderMaterial;
	private texture: THREE.Texture;
	private gallery: Gallery;
	private scene: Scene;
	private handleResize = (): void => this.updatePosition();

	constructor(scene: Scene, gallery: Gallery) {
		this.scene = scene;
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
				// 0, not the source's own CRT-style curve — flat instead of bulging in the middle.
				uCurveStrength: { value: 0 }
			},
			vertexShader: portraitVertex,
			fragmentShader: portraitFragment
		});

		const geometry = new THREE.PlaneGeometry(1, 1, 30, 30);
		this.mesh = new THREE.Mesh(geometry, this.material);
		this.mesh.scale.set(20, 26, 1);
		// Facing the camera head-on — the previous rotation.y:-0.42 (an approximated backState offset,
		// per this class's own comment) turned it away from the camera instead.
		this.mesh.position.set(0, 3, 0);
		this.mesh.rotation.y = 0;
		this.mesh.frustumCulled = false;

		this.gallery.imageScene.add(this.mesh);

		this.updatePosition();
		window.addEventListener('resize', this.handleResize);
	}

	/** Right half of the viewport at/above SPLIT_BREAKPOINT_PX (pairs with the Info page's own text
	 *  column, which occupies the left half there) — centered below it, where the two merge and the
	 *  text lays directly over the portrait instead (info/+page.svelte switches its text to black in
	 *  that state, for legibility against the bright portrait instead of the dark space background). */
	private updatePosition(): void {
		const isSplit = window.innerWidth >= SPLIT_BREAKPOINT_PX;
		this.mesh.position.x = isSplit ? this.scene.widthAtZ / 4 : 0;
	}

	dispose(): void {
		window.removeEventListener('resize', this.handleResize);
		this.gallery.imageScene.remove(this.mesh);
		this.texture.dispose();
		this.material.dispose();
		this.mesh.geometry.dispose();
	}
}

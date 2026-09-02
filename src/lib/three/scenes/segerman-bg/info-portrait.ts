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
/** The original fixed size's own proportions (20×26) — kept as the aspect ratio while the actual size
 *  becomes viewport-responsive. */
const PORTRAIT_ASPECT = 26 / 20;

export class InfoPortrait {
	mesh: THREE.Mesh;
	private material: THREE.ShaderMaterial;
	private texture: THREE.Texture;
	private gallery: Gallery;
	private scene: Scene;
	private handleResize = (): void => this.updateLayout();

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
		// Facing the camera head-on — the previous rotation.y:-0.42 (an approximated backState offset,
		// per this class's own comment) turned it away from the camera instead.
		this.mesh.position.set(0, 3, 0);
		this.mesh.rotation.y = 0;
		this.mesh.frustumCulled = false;

		this.gallery.imageScene.add(this.mesh);

		this.updateLayout();
		window.addEventListener('resize', this.handleResize);
	}

	/** Sizes the portrait to fill its half of the viewport (rather than a fixed 20×26) and repositions
	 *  it to match: right half at/above SPLIT_BREAKPOINT_PX (pairs with the Info page's own text column,
	 *  which occupies the left half there), centered and smaller below it, where the two merge and the
	 *  text lays directly over the portrait instead (info/+page.svelte switches its text to black in
	 *  that state, for legibility against the bright portrait instead of the dark space background). */
	private updateLayout(): void {
		const isSplit = window.innerWidth >= SPLIT_BREAKPOINT_PX;
		// Leaves a little breathing room within its half/three-quarters rather than touching edge to edge.
		const targetWidth = (isSplit ? this.scene.widthAtZ / 2 : this.scene.widthAtZ * 0.75) * 0.85;
		const maxHeight = this.scene.heightAtZ * 0.85;

		let width = targetWidth;
		let height = width * PORTRAIT_ASPECT;
		if (height > maxHeight) {
			height = maxHeight;
			width = height / PORTRAIT_ASPECT;
		}

		this.mesh.scale.set(width, height, 1);
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

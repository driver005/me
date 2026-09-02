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
	private handleResize = (): void => this.updateLayout();

	constructor(scene: Scene, gallery: Gallery) {
		this.scene = scene;
		this.gallery = gallery;

		this.texture = new THREE.TextureLoader().load('/textures/segerman-bg/rafi-info.webp', (loaded) => {
			this.material.uniforms.uSizes.value.set(loaded.image.width, loaded.image.height);
		});
		this.texture.generateMipmaps = false;
		this.texture.minFilter = THREE.LinearFilter;
		this.texture.magFilter = THREE.LinearFilter;

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				tMap: { value: this.texture },
				uMode: scene.uniforms.uMode,
				uScale: { value: scene.isTouch ? 0 : 1 },
				// 0, not the source's own CRT-style curve — flat instead of bulging in the middle.
				uCurveStrength: { value: 0 },
				// "Cover" UV mapping (fragment.glsl, same formula as Card's) — the plane now stretches to
				// fill its half/full viewport exactly (updateLayout(), below), so without this the image
				// would distort instead of cropping. uSizes is set once the real image dims load, above;
				// uPlaneSizes is kept in sync with mesh.scale by updateLayout() itself.
				uSizes: { value: new THREE.Vector2(1, 1) },
				uPlaneSizes: { value: new THREE.Vector2(1, 1) }
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

	/** Sizes the portrait to exactly fill its zone (rather than a fixed 20×26) and repositions it to
	 *  match: right HALF of the viewport, full height, at/above SPLIT_BREAKPOINT_PX (pairs with the Info
	 *  page's own text column, which occupies the left half there); the FULL viewport below it, where
	 *  the two merge and the text lays directly over the portrait instead (info/+page.svelte switches
	 *  its text to black in that state, for legibility against the bright portrait instead of the dark
	 *  space background). Filling exactly (not aspect-fit) relies on the fragment shader's own "cover"
	 *  UV mapping to crop the image instead of stretching it — see uPlaneSizes below and fragment.glsl.
	 */
	private updateLayout(): void {
		const isSplit = window.innerWidth >= SPLIT_BREAKPOINT_PX;
		const width = isSplit ? this.scene.widthAtZ / 2 : this.scene.widthAtZ;
		const height = this.scene.heightAtZ;

		this.mesh.scale.set(width, height, 1);
		this.mesh.position.x = isSplit ? this.scene.widthAtZ / 4 : 0;
		this.material.uniforms.uPlaneSizes.value.set(width, height);
	}

	dispose(): void {
		window.removeEventListener('resize', this.handleResize);
		this.gallery.imageScene.remove(this.mesh);
		this.texture.dispose();
		this.material.dispose();
		this.mesh.geometry.dispose();
	}
}

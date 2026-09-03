import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Scene } from './scene';

/** Radians/second around the Y axis — a plain, constant spin (no easing/physics), since this is a
 *  placeholder standing in for a real 3D scan later, not a piece of interactive UI in its own right. */
const ROTATION_SPEED = 0.6;

/**
 * Home's centerpiece — a plain spinning cube standing in for a real 3D scan of the user, added later
 * (see spiral-carousel.ts's own `centerpiece` option, which owns constructing/positioning/disposing
 * this: it lives as a child of SpiralCarousel's own `group`, so it always sits at the spiral's own
 * center point and renders in the exact same pass/camera the cards do — no separate scene, camera, or
 * `scene.appendOutput()` registration needed here, SpiralCarousel's own tick() drives spin()).
 *
 * Glass-like MeshPhysicalMaterial + a procedural environment map (the same recipe name-text.ts's own
 * ADRIAN glyphs used, before this cube replaced them) plus a small emissive floor — its specular
 * highlights read clearly against both the white front-mode plate and the dark back-mode scene (see
 * +layout.svelte's Toggle-driven crossfade), unlike a flat unlit color which would vanish against one
 * or the other. It doesn't actually need to survive that crossfade at all in practice — SpiralCarousel
 * renders after the compositor's own front/back blend, on top of the final image either way (see
 * Scene.appendOutput's own doc comment) — but the material still needs its own contrast against
 * whatever ends up behind it, light or dark.
 */
export class CenterCube {
	readonly mesh: THREE.Mesh;
	private geometry: THREE.BoxGeometry;
	private material: THREE.MeshPhysicalMaterial;
	private envMap: THREE.Texture;
	private pmrem: THREE.PMREMGenerator;

	constructor(scene: Scene, size: number) {
		this.pmrem = new THREE.PMREMGenerator(scene.renderer);
		this.envMap = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

		this.geometry = new THREE.BoxGeometry(size, size, size);
		this.material = new THREE.MeshPhysicalMaterial({
			color: 0xe8ecf5,
			metalness: 0.15,
			roughness: 0.2,
			clearcoat: 1,
			clearcoatRoughness: 0.1,
			envMap: this.envMap,
			envMapIntensity: 1.6,
			emissive: 0x1a1a1a,
			emissiveIntensity: 0.5
		});
		this.mesh = new THREE.Mesh(this.geometry, this.material);
	}

	/** Called once per frame by the owning SpiralCarousel's own tick(). */
	spin(deltaSeconds: number): void {
		this.mesh.rotation.y += ROTATION_SPEED * deltaSeconds;
	}

	dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
		this.envMap.dispose();
		this.pmrem.dispose();
	}
}

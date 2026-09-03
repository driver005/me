import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Scene } from './scene';

export interface SkillMoonItem {
	name: string;
}

const ORBIT_RADIUS = 48;
const MOON_RADIUS = 4;
/** How many full turns the whole orbit makes across the page's entire scroll range. */
const ROTATIONS_PER_SCROLL = 1.5;

/**
 * The /skills page's skills as small "moons" arranged in a ring, driven by scroll progress (see the
 * page's own GSAP ScrollTrigger, which feeds `.update()`) rather than continuous time — scrolling
 * down visibly orbits them around the Earth raymarch planet (see the route layout's
 * planetSwitcher.setActive(earthPlanet) for '/skills').
 *
 * Real moon look: the same 2k_moon.jpeg texture the raymarched Moon (/about) uses, on a
 * MeshStandardMaterial lit by a procedural PMREM environment (RoomEnvironment) — this engine has no
 * scene lights, so without an environment map a standard/physical material renders flat black; a
 * first version used a plain canvas texture (flat color + the skill's name) instead, which worked
 * but looked nothing like a moon.
 *
 * Earth itself is a fullscreen-quad raymarch effect with its own baked-in fake camera (see
 * raymarch-planet.ts) — not a real Object3D with a scene position — so these moons can't be literal
 * children of it. Instead they orbit real-3D world origin at a radius comfortably outside Earth's
 * own on-screen radius; since Earth always renders dead-center under this engine's static, unpanned
 * camera, a same-space circle around the real origin lines up with it on screen.
 */
export class SkillMoons {
	private group = new THREE.Group();
	private texture: THREE.Texture;
	private envMap: THREE.Texture;
	private pmrem: THREE.PMREMGenerator;
	private material: THREE.MeshStandardMaterial;
	private geometry = new THREE.SphereGeometry(MOON_RADIUS, 32, 24);
	private meshes: THREE.Mesh[] = [];

	constructor(engineScene: Scene, targetScene: THREE.Scene, skills: SkillMoonItem[], position: { x: number; y: number; z: number }) {
		this.group.position.set(position.x, position.y, position.z);
		targetScene.add(this.group);

		this.pmrem = new THREE.PMREMGenerator(engineScene.renderer);
		this.envMap = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

		this.texture = new THREE.TextureLoader().load('/textures/planets/2k_moon.jpeg');
		this.texture.colorSpace = THREE.SRGBColorSpace;

		// One shared material for every moon — same texture/lighting, so no reason to duplicate it
		// per-instance the way the (now-removed) per-skill canvas textures had to.
		this.material = new THREE.MeshStandardMaterial({
			map: this.texture,
			roughness: 0.95,
			metalness: 0,
			envMap: this.envMap,
			envMapIntensity: 1.1
		});

		skills.forEach((_skill, index) => {
			const angle = (index / skills.length) * Math.PI * 2;
			const mesh = new THREE.Mesh(this.geometry, this.material);
			mesh.position.set(Math.cos(angle) * ORBIT_RADIUS, Math.sin(angle) * ORBIT_RADIUS, 0);
			mesh.userData.baseAngle = angle;
			// Random starting rotation per moon so the same texture doesn't look identically aligned
			// on all 20 of them.
			mesh.rotation.y = Math.random() * Math.PI * 2;
			this.meshes.push(mesh);
			this.group.add(mesh);
		});
	}

	/** `progress` is 0-1 scroll-through-page progress (from the page's own ScrollTrigger) — the whole
	 *  ring rotates with it; each moon also spins slowly on its own so it doesn't read as a flat static
	 *  cutout once you stop scrolling. */
	update(progress: number): void {
		this.group.rotation.z = progress * ROTATIONS_PER_SCROLL * Math.PI * 2;
		for (const mesh of this.meshes) {
			mesh.rotation.y += 0.003;
		}
	}

	setVisible(visible: boolean): void {
		this.group.visible = visible;
	}

	dispose(): void {
		this.texture.dispose();
		this.envMap.dispose();
		this.pmrem.dispose();
		this.material.dispose();
		this.geometry.dispose();
		this.group.parent?.remove(this.group);
	}
}

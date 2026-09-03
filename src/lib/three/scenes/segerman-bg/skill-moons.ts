import * as THREE from 'three';
import type { RaymarchPlanet } from './raymarch-planet';

export interface SkillMoonItem {
	name: string;
	slug: string;
}

/** Must match RaymarchPlanet's own uPlanetRadius default for the earth variant. */
const PLANET_RADIUS = 2;
const ORBIT_RADIUS = PLANET_RADIUS * 1.8;
const MOON_RADIUS = PLANET_RADIUS * 0.16;
/** How many full turns the whole orbit makes across the page's entire scroll range. */
const ROTATIONS_PER_SCROLL = 1.5;
/** Matches earth.fragment.glsl's CAMERA_POSITION.z and the FOCAL_LENGTH that macro computes for
 *  uPlanetPosition.z always being -10 for the Earth variant — see the projection math below. */
const CAMERA_Z = 6;
const FOCAL_LENGTH = CAMERA_Z / (CAMERA_Z - -10);

/**
 * The /skills page's skills as real orbiting moons — raymarched directly into the shared earthPlanet
 * (RaymarchPlanet.setMoons(), driving new uniforms added to earth.fragment.glsl) rather than
 * separate mesh geometry, so they get genuine depth: one swinging in front of Earth from the
 * camera's view naturally occludes it, one swinging behind naturally gets occluded by it, decided by
 * the same nearest-hit raymarch that already resolves the planet itself.
 *
 * A first version rendered these as real THREE.Mesh spheres composited as their own 2D layer
 * (Images' back pass) — quick and safe, but since that compositing happens after the shader's own
 * planet render, the moons always drew in front of Earth regardless of where they actually were in
 * the orbit; this version trades that safety for correctness.
 *
 * The orbit is a real 3D circle in the planet's XZ plane (not the XY "flat ring facing the camera"
 * that would have been simpler) — angle drives both x AND z, so half the orbit sits nearer the
 * camera than the planet (passes in front) and half sits farther (passes behind).
 */
export class SkillMoons {
	private texture: THREE.Texture;
	private planet: RaymarchPlanet;
	private slugs: string[];
	private baseAngles: number[];
	private positions: THREE.Vector3[];
	private planetPosition: THREE.Vector3;

	constructor(planet: RaymarchPlanet, planetPosition: { x: number; y: number; z: number }, skills: SkillMoonItem[]) {
		this.planet = planet;
		this.planetPosition = new THREE.Vector3(planetPosition.x, planetPosition.y, planetPosition.z);
		this.slugs = skills.map((s) => s.slug);
		this.baseAngles = skills.map((_s, index) => (index / skills.length) * Math.PI * 2);
		this.positions = skills.map(() => new THREE.Vector3());

		this.texture = new THREE.TextureLoader().load('/textures/planets/2k_moon.jpeg');
		this.texture.colorSpace = THREE.SRGBColorSpace;
	}

	/** `progress` is 0-1 scroll-through-page progress (from the page's own ScrollTrigger) — the whole
	 *  orbit rotates with it. Recomputes every moon's real 3D position and pushes them into the shared
	 *  earthPlanet's shader uniforms each frame. */
	update(progress: number): void {
		const rotation = progress * ROTATIONS_PER_SCROLL * Math.PI * 2;
		for (let i = 0; i < this.baseAngles.length; i++) {
			const angle = this.baseAngles[i] + rotation;
			this.positions[i].set(
				this.planetPosition.x + Math.cos(angle) * ORBIT_RADIUS,
				this.planetPosition.y,
				this.planetPosition.z + Math.sin(angle) * ORBIT_RADIUS
			);
		}
		this.planet.setMoons(this.positions, MOON_RADIUS, this.texture);
	}

	/** Slug of the moon nearest the given NDC click coordinates, or null if none are close enough —
	 *  used for click-to-navigate to /skills/[slug]. There's no real GPU raymarch hit-test available
	 *  from JS, so this projects each moon's current 3D position (as of the last update() call) into
	 *  the shader's own fake-camera NDC space (inverting earth.fragment.glsl's vertex-shader math) and
	 *  picks the nearest within a fixed screen-space radius — an approximation, not a pixel-exact
	 *  match to what's actually rendered, but a decent one at this scale. A moon farther from the
	 *  camera than the planet's own center (more likely occluded by it, per the same GPU raymarch this
	 *  doesn't have access to here) is excluded, rather than risk navigating to a moon that isn't
	 *  actually visible. */
	raycastHit(ndcX: number, ndcY: number, aspect: number): string | null {
		let bestSlug: string | null = null;
		let bestDist = Infinity;
		for (let i = 0; i < this.positions.length; i++) {
			const pos = this.positions[i];
			if (pos.z < this.planetPosition.z) continue; // farther than the planet's own center — likely occluded

			const depthFactor = FOCAL_LENGTH * (CAMERA_Z - pos.z);
			const moonNdcX = ((pos.x / depthFactor) * 2) / aspect;
			const moonNdcY = (pos.y / depthFactor) * 2;

			const dist = Math.hypot(ndcX - moonNdcX, ndcY - moonNdcY);
			if (dist < 0.06 && dist < bestDist) {
				bestDist = dist;
				bestSlug = this.slugs[i];
			}
		}
		return bestSlug;
	}

	dispose(): void {
		this.texture.dispose();
		this.planet.setMoons([], MOON_RADIUS, this.texture);
	}
}

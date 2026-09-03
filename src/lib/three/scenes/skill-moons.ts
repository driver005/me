import * as THREE from 'three';
import type { RaymarchPlanet } from './raymarch-planet';
import type { Scrollable } from './scroll';

export interface SkillMoonItem {
	name: string;
	slug: string;
	/** That skill's own primaryColor (see raymarch-planet.ts's hexToRgb) — tints its moon via
	 *  RaymarchPlanet.setMoons()/uMoonColors, the same procedural terrain generator's tint contract
	 *  the /skills/[slug] skillPlanet already uses for setTintColor(). */
	color: [number, number, number];
	/** That skill's own water/hills bias (see raymarch-planet.ts's getHillBiasForSkill()) — same
	 *  contract as setTerrainBias() on the /skills/[slug] skillPlanet, per-moon here. */
	hillBias: number;
}

export interface SkillMoonScreenPosition {
	slug: string;
	name: string;
	x: number;
	y: number;
	/** From isOccludedByPlanet() — a real ray-sphere test, not the coarser "farther than the planet's
	 *  own centre" heuristic an earlier version used (which wrongly hid/disabled moons the real
	 *  raymarch actually shows fine, near the planet's own limb). */
	visible: boolean;
}

/** Must match RaymarchPlanet's own uPlanetRadius default for the earth variant. */
const PLANET_RADIUS = 2;
const ORBIT_RADIUS = PLANET_RADIUS * 1.8;
const MOON_RADIUS = PLANET_RADIUS * 0.16;
/** Per-moon orbit radius spread, as a multiple of ORBIT_RADIUS — each moon gets its own distance
 *  from Earth (some closer, some farther) instead of sharing one ring. Floor of 0.75x keeps even the
 *  closest orbit clear of the planet surface + moon radius (2 + 0.32 world units) with margin to spare. */
const ORBIT_RADIUS_MIN_FACTOR = 0.75;
const ORBIT_RADIUS_MAX_FACTOR = 1.35;
/** Per-moon orbit INCLINATION (radians, tilting the orbital plane around the x-axis) — without this
 *  every moon's own y stayed pinned to the planet's own y always (a flat ring, all coplanar with the
 *  equator); each moon now traces its own tilted circle instead, rising above/dipping below the
 *  equator by a different amount as it swings around, rather than all sharing one flat plane. An
 *  earlier, much smaller value (±29°) kept every moon's own vertical swing too close to the equator
 *  to visibly reach anywhere near the top/bottom of the frame — this is close to a full polar tilt
 *  (±80°, not the full ±90° a truly edge-on orbit would need, which degenerates: at exactly 90° the
 *  orbit's own radius contributes nothing to x/z any more, reading as a thin vertical line rather
 *  than a circle) so the full moon scatter actually spans close to the frame's own full height. */
const ORBIT_INCLINATION_MAX = 1.4;
/** scrollPosition (raw, unbounded — see Scroll/Scrollable) units per full radian of orbit rotation.
 *  Tuned by feel against Scroll's own SCROLL_SPEED-scaled deltas, not derived from anything. */
const SCROLL_TO_RADIANS = 0.01;
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
 *
 * Implements Scrollable (see scroll.ts) so the page can drive it with the engine's existing Scroll
 * class — the same infinite, unbounded wheel/touch accumulator the Home gallery and Work's media
 * carousel already use — instead of a finite scroll-through-a-tall-div ScrollTrigger setup, which
 * necessarily caps out once you reach the bottom of that div.
 */
export class SkillMoons implements Scrollable {
	private planet: RaymarchPlanet;
	private skills: SkillMoonItem[];
	private baseAngles: number[];
	/** Each moon's own fixed distance from Earth — see ORBIT_RADIUS_MIN/MAX_FACTOR. Spread via a
	 *  golden-ratio sequence rather than index order, so neighboring moons (adjacent in the click-order
	 *  ring) don't end up at near-identical radii — a deterministic, dependency-free stand-in for
	 *  shuffled/random spacing. */
	private orbitRadii: number[];
	/** Each moon's own fixed orbital tilt — see ORBIT_INCLINATION_MAX. Spread via the golden ratio's
	 *  own square (a standard low-discrepancy-sequence trick, R2-ish) rather than reusing orbitRadii's
	 *  own sequence directly, so a moon's radius and its inclination don't end up correlated (e.g.
	 *  every close-orbit moon also happening to be a flat/uninclined one). */
	private orbitInclinations: number[];
	private positions: THREE.Vector3[];
	private moonColors: THREE.Vector3[];
	private moonHillBias: number[];
	private planetPosition: THREE.Vector3;
	private rotation = 0;

	constructor(planet: RaymarchPlanet, planetPosition: { x: number; y: number; z: number }, skills: SkillMoonItem[]) {
		this.planet = planet;
		this.planetPosition = new THREE.Vector3(planetPosition.x, planetPosition.y, planetPosition.z);
		this.skills = skills;
		this.baseAngles = skills.map((_s, index) => (index / skills.length) * Math.PI * 2);
		const GOLDEN_RATIO_CONJUGATE = 0.6180339887498949;
		const GOLDEN_RATIO_CONJUGATE_SQUARED = 0.3819660112501051;
		this.orbitRadii = skills.map((_s, index) => {
			const spread = (index * GOLDEN_RATIO_CONJUGATE) % 1;
			const factor = ORBIT_RADIUS_MIN_FACTOR + spread * (ORBIT_RADIUS_MAX_FACTOR - ORBIT_RADIUS_MIN_FACTOR);
			return ORBIT_RADIUS * factor;
		});
		this.orbitInclinations = skills.map((_s, index) => {
			const spread = (index * GOLDEN_RATIO_CONJUGATE_SQUARED) % 1;
			return (spread * 2 - 1) * ORBIT_INCLINATION_MAX;
		});
		this.positions = skills.map(() => new THREE.Vector3());
		this.moonColors = skills.map((s) => new THREE.Vector3(...s.color));
		this.moonHillBias = skills.map((s) => s.hillBias);

		this.recomputePositions();
	}

	/** Scrollable's own contract — Scroll (see scroll.ts) sets this every frame from its own eased,
	 *  unbounded accumulator. Raw units, not radians directly (see SCROLL_TO_RADIANS). */
	get scrollPosition(): number {
		return this.rotation / SCROLL_TO_RADIANS;
	}

	set scrollPosition(value: number) {
		this.rotation = value * SCROLL_TO_RADIANS;
		this.recomputePositions();
	}

	private recomputePositions(): void {
		for (let i = 0; i < this.baseAngles.length; i++) {
			const angle = this.baseAngles[i] + this.rotation;
			const radius = this.orbitRadii[i];
			const inclination = this.orbitInclinations[i];
			// Flat XZ-plane circle (x = cos(angle)*radius, y = 0, z = sin(angle)*radius), then that
			// whole circle rotated by this moon's own inclination around the x-axis — y and z both
			// pick up a component of the other, so as the moon swings around its y now also rises
			// above/dips below the equator instead of staying pinned to it (x is unaffected by an
			// x-axis rotation).
			const z0 = Math.sin(angle) * radius;
			const y = -z0 * Math.sin(inclination);
			const z = z0 * Math.cos(inclination);
			this.positions[i].set(
				this.planetPosition.x + Math.cos(angle) * radius,
				this.planetPosition.y + y,
				this.planetPosition.z + z
			);
		}
		this.planet.setMoons(this.positions, MOON_RADIUS, this.moonColors, this.moonHillBias);
	}

	private projectToNdc(pos: THREE.Vector3, aspect: number): { x: number; y: number } {
		const depthFactor = FOCAL_LENGTH * (CAMERA_Z - pos.z);
		return { x: ((pos.x / depthFactor) * 2) / aspect, y: (pos.y / depthFactor) * 2 };
	}

	/** Whether the planet's own sphere blocks the camera's line of sight to `pos` — a real ray-sphere
	 *  intersection test (the exact math earth.fragment.glsl's own sphIntersect() uses), not the
	 *  cruder "z less than the planet's own centre" check an earlier version used here. That crude
	 *  version was wrong in both directions: it excluded moons near the planet's limb that the real
	 *  raymarch shows perfectly fine (a sphere doesn't occlude everything behind its own centre, only
	 *  what's actually behind its visible disc from the camera's own viewpoint), while a moon TRULY
	 *  hidden behind the disc does need to stay unclickable, or a click could silently navigate
	 *  somewhere the viewer can't actually see happening. */
	private isOccludedByPlanet(pos: THREE.Vector3): boolean {
		const cameraPosition = new THREE.Vector3(0, 0, CAMERA_Z);
		const rd = pos.clone().sub(cameraPosition).normalize();
		const oc = cameraPosition.clone().sub(this.planetPosition);
		const b = oc.dot(rd);
		const c = oc.dot(oc) - PLANET_RADIUS * PLANET_RADIUS;
		const h = b * b - c;
		if (h < 0) return false; // this ray never hits the planet at all
		const planetHitDist = -b - Math.sqrt(h);
		if (planetHitDist < 0) return false; // the planet is behind the camera, not blocking anything
		const moonDist = pos.distanceTo(cameraPosition);
		// Small epsilon: a moon sitting exactly on the planet's own near surface shouldn't count as
		// self-occluding due to floating-point noise between the two nearly-equal distances.
		return planetHitDist < moonDist - 1e-4;
	}

	/** Slug of the moon nearest the given NDC click coordinates, or null if none are close enough —
	 *  used for click-to-navigate to /skills/[slug]. There's no real GPU raymarch hit-test available
	 *  from JS, so this projects each moon's current 3D position into the shader's own fake-camera
	 *  NDC space (inverting earth.fragment.glsl's vertex-shader math) and picks the nearest within a
	 *  fixed screen-space radius — an approximation, not a pixel-exact match to what's actually
	 *  rendered, but a decent one at this scale. isOccludedByPlanet() above excludes anything the
	 *  planet's own sphere is genuinely between the camera and, rather than the coarser "farther than
	 *  the planet's own centre" heuristic an earlier version used. */
	raycastHit(ndcX: number, ndcY: number, aspect: number): string | null {
		let bestSlug: string | null = null;
		let bestDist = Infinity;
		for (let i = 0; i < this.positions.length; i++) {
			const pos = this.positions[i];
			if (this.isOccludedByPlanet(pos)) continue;

			const ndc = this.projectToNdc(pos, aspect);
			const dist = Math.hypot(ndcX - ndc.x, ndcY - ndc.y);
			if (dist < 0.06 && dist < bestDist) {
				bestDist = dist;
				bestSlug = this.skills[i].slug;
			}
		}
		return bestSlug;
	}

	/** Every moon's current on-screen CSS-pixel position, for a caller to render name labels over
	 *  them (so it's clear which moon is which skill before clicking) — same projection raycastHit()
	 *  uses, just in pixels instead of NDC and for every moon rather than a nearest-match search. */
	getScreenPositions(viewportWidth: number, viewportHeight: number): SkillMoonScreenPosition[] {
		const aspect = viewportWidth / viewportHeight;
		return this.positions.map((pos, i) => {
			const ndc = this.projectToNdc(pos, aspect);
			return {
				slug: this.skills[i].slug,
				name: this.skills[i].name,
				x: (ndc.x * 0.5 + 0.5) * viewportWidth,
				y: (1 - (ndc.y * 0.5 + 0.5)) * viewportHeight,
				visible: !this.isOccludedByPlanet(pos)
			};
		});
	}

	dispose(): void {
		this.planet.setMoons([], MOON_RADIUS);
		// Belt-and-suspenders alongside skills/+page.svelte's own pathname guard on its click listener:
		// setMoons([], ...) above only clears the GPU-side uMoonCount/uMoonPositions (nothing renders),
		// but raycastHit()/getScreenPositions() work off this.positions directly, in JS, independent of
		// that — clearing it too means even a stray call into an already-disposed instance can't
		// resolve a hit against moons that no longer visibly exist anywhere.
		this.positions = [];
	}
}

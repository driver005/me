import * as THREE from 'three';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it
import vertexShader from '$lib/shaders/stars-3d/vertex.glsl';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it
import fragmentShader from '$lib/shaders/stars-3d/fragment.glsl';

const STAR_COUNT = 3000;
// Well beyond the room/camera-orbit distance (room's own bbox tops out around ±2.5, see room.ts's own
// gltf-transform inspect output) so the sphere always reads as "infinite" background, never something
// the camera can orbit past or into.
const SPHERE_RADIUS = 400;
const COLD_COLOR = new THREE.Color(0.55, 0.7, 1.0);
const WARM_COLOR = new THREE.Color(1.0, 0.85, 0.65);

/**
 * A real 3D starfield — an actual THREE.Points cloud distributed on a large sphere around the camera,
 * replacing the previous approach (a flat fullscreen-quad shader with a hand-rolled camera-yaw/pitch
 * parallax fake, rendered into an offscreen target and swapped in as `scene.background`). Points are
 * real geometry in world space, so perspective/parallax comes from the camera's own projection matrix
 * for free as it orbits — no uniform trickery needed, and no offscreen render target either (this
 * renders as part of the normal scene, over the solid DARK_BG color skybox.ts already sets as
 * `scene.background`).
 *
 * `depthWrite: false` + a render order pinned behind everything else (see skybox.ts's own `renderOrder`
 * assignment) — stars sit at a fixed huge radius, but nothing about them should ever occlude or be
 * occluded by real depth-tested room geometry; they're a backdrop, not a real object at that distance.
 */
export class Starfield3D {
	readonly points: THREE.Points;
	private readonly geometry: THREE.BufferGeometry;
	private readonly material: THREE.ShaderMaterial;
	private time = 0;

	constructor() {
		this.geometry = Starfield3D.createGeometry();
		this.material = new THREE.ShaderMaterial({
			uniforms: {
				uTime: { value: 0 },
				uPixelRatio: { value: 1 }
			},
			vertexShader,
			fragmentShader,
			vertexColors: true,
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending
		});

		this.points = new THREE.Points(this.geometry, this.material);
		this.points.frustumCulled = false;
		this.points.renderOrder = -1;
	}

	private static createGeometry(): THREE.BufferGeometry {
		const positions = new Float32Array(STAR_COUNT * 3);
		const colors = new Float32Array(STAR_COUNT * 3);
		const sizes = new Float32Array(STAR_COUNT);
		const phases = new Float32Array(STAR_COUNT);
		const color = new THREE.Color();

		for (let i = 0; i < STAR_COUNT; i++) {
			// Uniform distribution on a sphere shell (not box-rejection or naive lat/long, which both
			// clump at the poles) — inverse-transform sampling on theta/phi.
			const u = Math.random();
			const v = Math.random();
			const theta = u * Math.PI * 2;
			const phi = Math.acos(2 * v - 1);
			const radius = SPHERE_RADIUS * (0.85 + Math.random() * 0.15);

			positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
			positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
			positions[i * 3 + 2] = radius * Math.cos(phi);

			color.copy(COLD_COLOR).lerp(WARM_COLOR, Math.random());
			colors[i * 3] = color.r;
			colors[i * 3 + 1] = color.g;
			colors[i * 3 + 2] = color.b;

			// Occasional bright star among mostly dim ones, matching the plain 2D shader's own mix of
			// faint background stars and a few standout points.
			sizes[i] = Math.random() < 0.05 ? 2.5 + Math.random() * 2.0 : 0.6 + Math.random() * 1.2;
			phases[i] = Math.random();
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
		geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
		geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
		return geometry;
	}

	setPixelRatio(pixelRatio: number): void {
		this.material.uniforms.uPixelRatio.value = pixelRatio;
	}

	loop(delta: number): void {
		this.time += delta;
		this.material.uniforms.uTime.value = this.time;
	}

	dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
	}
}

import * as THREE from 'three';
import { m } from '$lib/paraglide/messages';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it
import smokeVertexShader from '$lib/shaders/smoke/vertex.glsl';
// @ts-ignore
import smokeFragmentShader from '$lib/shaders/smoke/fragment.glsl';

/** A fixed coffee-cup steam plane, previously extra/caffee.svelte — same perlin-noise-driven smoke
 *  shader the standalone Smoke class uses for its own particle cloud (src/lib/shaders/smoke/), here
 *  driving a single plane mesh instead of a point cloud. */
export class CoffeeSteam {
	readonly mesh: THREE.Mesh;
	private scene: THREE.Scene;
	private material: THREE.ShaderMaterial;
	private geometry: THREE.PlaneGeometry;
	private perlinTexture: THREE.Texture;

	constructor(scene: THREE.Scene) {
		this.scene = scene;

		this.geometry = new THREE.PlaneGeometry(1, 1, 16, 64);
		this.geometry.translate(0, 0.5, 0);
		this.geometry.scale(0.33, 1, 0.33);

		this.perlinTexture = new THREE.TextureLoader().load(m['assets.perlin_noise'](), (texture) => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		});

		this.material = new THREE.ShaderMaterial({
			vertexShader: smokeVertexShader,
			fragmentShader: smokeFragmentShader,
			uniforms: {
				uTime: { value: 0 },
				uPerlinTexture: { value: this.perlinTexture }
			},
			side: THREE.DoubleSide,
			transparent: true,
			depthWrite: false
		});

		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.position.set(-0.5, 1, -1.575);
		scene.add(this.mesh);
	}

	loop(delta: number): void {
		this.material.uniforms.uTime.value += delta;
	}

	dispose(): void {
		this.scene.remove(this.mesh);
		this.geometry.dispose();
		this.material.dispose();
		this.perlinTexture.dispose();
	}
}

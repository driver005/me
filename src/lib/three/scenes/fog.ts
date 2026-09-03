import * as THREE from 'three';
import gsap from 'gsap';
import { Layer } from './layer';
import type { Scene } from './scene';
import type { FluidSim } from './fluid';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/extra/caffee.svelte for the same pattern)
import fogFragment from '$lib/shaders/fog/fragment.glsl';
// @ts-ignore
import fullscreenVertex from '$lib/shaders/common/fullscreen-triangle.glsl';

export class Fog extends Layer {
	renderTarget: THREE.WebGLRenderTarget;
	private mesh: THREE.Mesh;
	private material: THREE.ShaderMaterial;
	private scene: Scene;
	private fluidSim: FluidSim | null = null;
	private colorTween: gsap.core.Tween | null = null;
	private enabledTween: gsap.core.Tween | null = null;

	constructor(scene: Scene, noiseTexture: THREE.Texture) {
		super(scene.isTouch);
		this.scene = scene;
		this.renderTarget = scene.createRenderTarget(0.3);

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				uMode: scene.uniforms.uMode,
				uRes: scene.uniforms.uRes,
				uTime: scene.uniforms.uTime,
				tNoise: { value: noiseTexture },
				tFluid: { value: null },
				uHasFog: { value: 1 },
				uColor: { value: new THREE.Color('#20447e').convertLinearToSRGB() },
				uScale: { value: 1.6 },
				uQSpeed: { value: 0.02 },
				uQYSpeed: { value: 0 },
				uRXSpeed: { value: 0.08 },
				uRYSpeed: { value: 0.08 },
				uFluidStr: { value: 0.003 },
				uDarkMul: { value: 1 },
				uMidMul: { value: 1 },
				uLightLift: { value: 1 },
				uDensityMin: { value: 0.1 },
				uDensityMax: { value: 1 },
				uOffsetX: { value: 0 },
				uOffsetY: { value: 0 }
			},
			vertexShader: fullscreenVertex,
			fragmentShader: fogFragment
		});
		this.mesh = new THREE.Mesh(scene.fullScreenTriangle, this.material);
		this.mesh.frustumCulled = false;
	}

	/**
	 * Called by the Fluid layer's owner once fluid exists (Task 6) so fog can distort around the pointer trail.
	 * Stores the FluidSim instance rather than a texture: FluidSim's render targets ping-pong every frame
	 * (RTPair.swap() swaps object references, not buffer contents), so a texture captured once here would go
	 * stale as soon as the sim swaps. render() re-reads fluidSim.texture fresh every frame instead (Task 9 fix).
	 */
	setFluidSim(fluidSim: FluidSim): void {
		this.fluidSim = fluidSim;
	}

	get texture(): THREE.Texture {
		return this.renderTarget.texture;
	}

	/** Tweens the fog's own tint (default '#20447e') to `hex` — called by the route layout alongside
	 *  Planet.animate(), on every navigation. The fog's color is what actually reaches the planet
	 *  visually: back-fragment.glsl blends litFog over everything at a floor of uFogFloor (0.3) even
	 *  where the fog texture's own density is low, so a fog color that doesn't track the planet's
	 *  current per-page/per-project tint visibly washes it out toward a fixed navy instead. */
	/** Fades this layer's own fog density in/out (its `uHasFog`, which raises the density threshold when
	 *  0 — see fog/fragment.glsl's `smoothstep(uDensityMin - (1.0 - uHasFog), ...)`) — the fog only
	 *  shows on the home page; sub-pages drop it. Compositor.setPage() tweens the compositing side
	 *  (its own uHasFog, gating whether fog blends into the final image at all) the same way — both are
	 *  needed since either alone would leave the other's fog computation/blend still partially active. */
	setEnabled(enabled: boolean): void {
		this.enabledTween?.kill();
		this.enabledTween = gsap.to(this.material.uniforms.uHasFog, {
			value: enabled ? 1 : 0,
			duration: 2.3,
			ease: 'power3.inOut'
		});
	}

	setColor(hex: string): void {
		this.colorTween?.kill();
		const target = new THREE.Color(hex);
		this.colorTween = gsap.to(this.material.uniforms.uColor.value, {
			r: target.r,
			g: target.g,
			b: target.b,
			duration: 2.3,
			ease: 'power3.inOut'
		});
	}

	render(): void {
		if (this.fluidSim) {
			this.material.uniforms.tFluid.value = this.fluidSim.texture;
		}
		this.scene.renderer.setRenderTarget(this.renderTarget);
		this.scene.renderer.render(this.mesh, this.scene.camera);
	}

	loop(): void {
		this.render();
	}

	dispose(): void {
		this.colorTween?.kill();
		this.enabledTween?.kill();
		this.material.dispose();
	}
}

import * as THREE from 'three';
import gsap from 'gsap';
import { Layer } from '../shared/layer';
import type { Scene } from '../scene';
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
	private coverageTween: gsap.core.Tween | null = null;

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
				// 0, not 1 — this used to default full-strength, so the FIRST real setEnabled()/setCoverage()
				// call (route effect, on mount) visibly tweened it DOWN to whatever the page actually wants,
				// reading as "fog starts strong then fades weaker" instead of a clean fade-in from nothing.
				uHasFog: { value: 0 },
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
				uCoverage: { value: 0 },
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
	/** Fades this layer's own fog density in/out (its `uHasFog`, which multiplies straight into density
	 *  in fog/fragment.glsl — 0 zeroes the whole layer regardless of uCoverage) — the fog only
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

	/** How much of the screen shows fog at all — separate from Compositor.setFogIntensity()'s own
	 *  brightness dial (that one scales a patch's OPACITY/COLOR once it's already showing; this one
	 *  decides whether a given noise value counts as a patch in the first place). `coverage` is a plain
	 *  0..1 fraction: 0 is almost no coverage (only the noise field's own sparsest, densest peaks show
	 *  at all), 1 is the whole page covered.
	 *
	 *  Genuinely linear: fragment.glsl's spatial SHAPE is now fixed (a smoothstep confirmed earlier as
	 *  the "full" pattern, baked in rather than tuned by this method at all) — `coverage` only scales
	 *  that one shape's opacity, a plain multiply. `coverage` IS `uCoverage`; this method just tweens it
	 *  there. 0 is exactly none, 1 is exactly the full shape, 0.5 is exactly half its opacity everywhere,
	 *  same for every value between — true linear scaling, not an approximation of it.
	 *
	 *  Three earlier versions moved the shader's THRESHOLD instead of its opacity, chasing "coverage"
	 *  meaning literal on-screen area rather than brightness: a two-constant min/max threshold shift, a
	 *  pow()-curve, and a single linearly-tweened threshold. All three failed the same way — how much
	 *  AREA clears a threshold depends on the noise field's own distribution, which was never measured
	 *  and has no simple closed form, so no threshold position is linear in the resulting visible area.
	 *  Scaling a fixed shape's opacity sidesteps that entirely: multiplication is linear regardless of
	 *  what the underlying distribution looks like. */
	setCoverage(coverage: number): void {
		this.coverageTween?.kill();
		this.coverageTween = gsap.to(this.material.uniforms.uCoverage, {
			value: coverage,
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
		this.coverageTween?.kill();
		this.material.dispose();
	}
}

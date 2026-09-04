import * as THREE from 'three';
import { m } from '$lib/paraglide/messages';
import { Starfield3D } from '../effects/starfield-3d';

const LIGHT_BG = new THREE.Color('#D9CAD1');
const DARK_BG = new THREE.Color('#000000');

/**
 * /home's background — a solid light/dark background color, a static starfield (dark mode only, per
 * the original's own `{#if mode.current === 'dark'}<Stars />{/if}`), and a nebula equirect texture set
 * as the scene's own IBL environment (not the background — the solid color stays that).
 *
 * The env map goes through an explicit `THREE.PMREMGenerator` pass here rather than a bare
 * `scene.environment = texture` assignment. Assigning the raw equirect texture directly does NOT skip
 * PMREM generation — three.js's own renderer still builds the prefiltered mip-mapped cubemap
 * internally, lazily, the moment any material first actually samples `scene.environment`. That's a
 * genuinely heavy one-shot GPU operation (render-to-cubemap, then GGX convolution across several mip
 * levels), and happening implicitly means it lands on whatever frame the first environment-sampling
 * material happens to render on — which showed up as `EquirectangularToCubeUV`/`PMREMGGXConvolution`
 * programs in a `renderer.info` snapshot taken right at a real context-loss crash, undoing room.ts's own
 * staggered mesh reveal (that only spreads out per-mesh shader compiles, not this global one-shot step).
 * Generating it explicitly, once, up front, makes it happen at a moment this code controls.
 *
 * The starfield is a real THREE.Points cloud (see effects/starfield-3d.ts) added directly into the
 * scene graph, over the solid DARK_BG background — a genuine replacement for an earlier flat
 * fullscreen-quad shader (offscreen-rendered, then swapped in as `scene.background`, with a hand-rolled
 * camera-yaw/pitch uniform faking parallax): that version read as flat/wrong once actually looked at,
 * since a 2D noise pattern shifted by a uniform never quite matches how a real 3D scene's perspective
 * moves. Real points in world space get correct perspective/parallax from the camera's own projection
 * matrix for free, and only cost one shader program either way.
 */
export class Skybox {
	private scene: THREE.Scene;

	private stars: Starfield3D;

	private isDark = false;
	private envRenderTarget: THREE.WebGLRenderTarget | null = null;

	constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, _camera: THREE.Camera) {
		this.scene = scene;
		scene.background = LIGHT_BG.clone();

		this.stars = new Starfield3D();
		this.stars.setPixelRatio(renderer.getPixelRatio());
		this.stars.points.visible = false;
		scene.add(this.stars.points);

		new THREE.TextureLoader().load(m['assets.nebula'](), (texture) => {
			texture.mapping = THREE.EquirectangularReflectionMapping;

			const pmremGenerator = new THREE.PMREMGenerator(renderer);
			this.envRenderTarget = pmremGenerator.fromEquirectangular(texture);
			scene.environment = this.envRenderTarget.texture;
			pmremGenerator.dispose();
			// Baked into envRenderTarget's own cubemap now — the raw equirect source isn't held onto or
			// referenced anywhere else after this.
			texture.dispose();
		});
	}

	setSize(_width: number, _height: number): void {
		// No-op now that stars are real 3D geometry instead of an offscreen render target sized to the
		// viewport — kept as a method since HomeScene's own setSize() calls it unconditionally.
	}

	/** Called whenever mode-watcher's own `mode.current` changes (see HomeEngineRoot's own $effect —
	 *  this class has no direct dependency on mode-watcher itself, matching the rest of this engine's
	 *  own "caller passes state in" style rather than each layer reading global state independently). */
	setDark(isDark: boolean): void {
		if (this.isDark === isDark) return;
		this.isDark = isDark;
		this.stars.points.visible = isDark;
		// Applied instantly rather than tweened — no per-frame loop() drives this anymore (stars are
		// static too, no more twinkle), so there's nothing left to progress a tween.
		this.scene.background = (isDark ? DARK_BG : LIGHT_BG).clone();
	}

	dispose(): void {
		this.scene.remove(this.stars.points);
		this.stars.dispose();
		if (this.scene.environment === this.envRenderTarget?.texture) this.scene.environment = null;
		this.envRenderTarget?.dispose();
	}
}

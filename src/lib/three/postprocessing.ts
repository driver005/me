import * as THREE from 'three';
import {
	EffectComposer,
	EffectPass,
	RenderPass,
	BloomEffect,
	HueSaturationEffect,
	BrightnessContrastEffect,
	ChromaticAberrationEffect,
	VignetteEffect,
	ToneMappingEffect,
	KernelSize,
	ToneMappingMode
} from 'postprocessing';
import { PosterizeEffect } from './effects/posterize';

/** Ported from postprocessing/default.svelte — same effect chain/values per mode, retuned whenever the
 *  mode flips. The original (and this file, until this fix) rebuilt with `composer.removeAllPasses()` +
 *  brand-new Effect/Pass instances on every toggle — `removeAllPasses()` only detaches passes from the
 *  composer's own array, it never calls their `dispose()`, so every dark/light toggle (right-click/
 *  two-finger-tap, no debounce) leaked a full render-target chain (BloomEffect's mip chain alone is the
 *  expensive one). Enough leaked toggles exhausts the GPU process and can crash/blocklist WebGL for the
 *  rest of the browser session ("Could not create a WebGL context ... GL_VENDOR = Disabled"). Fixed by
 *  explicitly disposing the previous RenderPass/EffectPass before replacing them.
 *
 *  No outline effect here in the post chain — two different approaches were tried (a custom
 *  depth-buffer edge-detection effect, then `postprocessing`'s own selection-based OutlineEffect) and
 *  BOTH eventually crashed the same way: cascading `WebGLProgram` VALIDATE_STATUS failures across
 *  unrelated scene materials, ending in a real `CONTEXT_LOST_WEBGL`. Root cause, confirmed by grepping
 *  `postprocessing`'s own source: OutlineEffect builds its selection mask via an internal
 *  `DepthComparisonMaterial` + its own depth pass — i.e. it depends on depth-texture rendering exactly
 *  like the custom version did. The outline actually in use now lives in room.ts (see its own
 *  outlineMaterial) as an inverted-hull mesh technique instead — duplicate backface-rendered geometry,
 *  no depth texture anywhere, sidestepping this entirely. PosterizeEffect below is the same story:
 *  color-in/color-out only, no depth texture, so it doesn't reopen that risk either. */
export class Postprocessing {
	private composer: EffectComposer;
	private camera: THREE.PerspectiveCamera;
	private renderPass: RenderPass | null = null;
	private gradingPass: EffectPass | null = null;

	constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
		this.camera = camera;
		this.composer = new EffectComposer(renderer);
		this.rebuild(scene, false);
	}

	setSize(width: number, height: number): void {
		this.composer.setSize(width, height);
	}

	setDark(isDark: boolean, scene: THREE.Scene): void {
		this.rebuild(scene, isDark);
	}

	private rebuild(scene: THREE.Scene, isDark: boolean): void {
		if (this.renderPass) {
			this.composer.removePass(this.renderPass);
			this.renderPass.dispose();
		}
		if (this.gradingPass) {
			this.composer.removePass(this.gradingPass);
			this.gradingPass.dispose();
		}

		this.renderPass = new RenderPass(scene, this.camera);
		this.composer.addPass(this.renderPass, 0);

		const toneMapping = new ToneMappingEffect({
			mode: isDark ? ToneMappingMode.REINHARD2_ADAPTIVE : ToneMappingMode.ACES_FILMIC,
			resolution: isDark ? 512 : 256,
			whitePoint: isDark ? 3.0 : 4.0,
			middleGrey: isDark ? 0.35 : 0.6,
			minLuminance: isDark ? 0.001 : 0.01,
			averageLuminance: isDark ? 0.25 : 1.0,
			adaptationRate: isDark ? 2.0 : 1.0
		});
		const colorBoost = new HueSaturationEffect({
			hue: isDark ? 0.5 : 0.0,
			saturation: isDark ? 0.2 : 0.3
		});
		const contrast = new BrightnessContrastEffect({
			brightness: isDark ? 0.0 : -0.03,
			contrast: isDark ? 0.2 : 0.15
		});
		const bloom = new BloomEffect({
			intensity: isDark ? 2.5 : 10.0,
			luminanceThreshold: isDark ? 0.5 : 0.8,
			luminanceSmoothing: isDark ? 0.7 : 0.8,
			mipmapBlur: true,
			kernelSize: isDark ? KernelSize.LARGE : KernelSize.VERY_LARGE,
			height: isDark ? 720 : 1048,
			width: isDark ? 720 : 1048
		});
		const chromaticAberration = new ChromaticAberrationEffect({
			offset: new THREE.Vector2(isDark ? 0.0004 : 0.0002, isDark ? 0.0004 : 0.0002),
			radialModulation: true,
			modulationOffset: isDark ? 0.1 : 0.5
		});
		const vignette = new VignetteEffect({
			eskil: false,
			offset: isDark ? 0.4 : 0.3,
			darkness: isDark ? 0.7 : 0.6
		});
		// Dark mode's own lights (see lights.ts) are deliberately dim — the moody look depends on adaptive
		// tone mapping lifting detail out of near-black values rather than the scene being bright to begin
		// with. PosterizeEffect runs after tone mapping and floors anything under half a quantization band
		// straight to 0, which was crushing most of dark mode's own visible range to solid black. A very
		// fine band count here keeps posterize's contribution to that near-invisible rather than trying to
		// find a level count that both bands visibly AND doesn't eat the shadows — lights.ts's own
		// intensities got a real bump instead (see its own comment) since that's the actual light source,
		// not a quantization side effect. Light mode's posterize is back at its original, unmodified level
		// — it was never the thing making light mode "a little too bright"; only dark mode's band count
		// needed touching.
		const posterize = new PosterizeEffect(isDark ? 24 : 6);

		this.gradingPass = new EffectPass(
			this.camera,
			toneMapping,
			colorBoost,
			contrast,
			bloom,
			chromaticAberration,
			posterize,
			vignette
		);
		this.composer.addPass(this.gradingPass, 1);
	}

	render(): void {
		this.composer.render();
	}

	dispose(): void {
		this.composer.dispose();
	}
}

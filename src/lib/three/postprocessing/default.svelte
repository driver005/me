<script>
	import { useThrelte, useTask } from '@threlte/core';
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
	import { Vector2 } from 'three';

	const { scene, renderer, camera, size, autoRender } = useThrelte();
	const composer = new EffectComposer(renderer);

	$effect(() => {
		const cam = camera.current;
		if (!cam) return;

		composer.removeAllPasses();
		composer.addPass(new RenderPass(scene, cam));

		// 1. Tone mapping — gives the whole scene a cinematic color grade
		//    ACES Filmic makes lights bloom naturally and shadows stay rich
		const toneMapping = new ToneMappingEffect({
			mode: ToneMappingMode.ACES_FILMIC,
			resolution: 256,
			whitePoint: 4.0,
			middleGrey: 0.6,
			minLuminance: 0.01,
			averageLuminance: 1.0,
			adaptationRate: 1.0
		});

		// 2. Vibrant but not overdone colors
		const colorBoost = new HueSaturationEffect({
			saturation: 0.3
		});

		// 3. Slight contrast punch — makes lit areas feel warmer and shadows deeper
		const contrast = new BrightnessContrastEffect({
			brightness: -0.03,
			contrast: 0.15
		});

		// 4. Bloom — wide spread so light influence bleeds onto walls visibly
		const bloom = new BloomEffect({
			intensity: 10,
			luminanceThreshold: 0.8,
			luminanceSmoothing: 0.8,
			mipmapBlur: true,
			kernelSize: KernelSize.VERY_LARGE,
			height: 1048,
			width: 1048
		});

		// 5. Chromatic aberration — subtle RGB fringing on bright edges,
		//    gives a slightly cinematic/lens feel without being distracting
		const chromaticAberration = new ChromaticAberrationEffect({
			offset: new Vector2(0.0008, 0.0008),
			radialModulation: true, // stronger at screen edges like a real lens
			modulationOffset: 0.15
		});

		// 7. Vignette — darkens screen edges, naturally draws the eye inward
		//    and makes light sources in the center feel even brighter by contrast
		const vignette = new VignetteEffect({
			eskil: false,
			offset: 0.3,
			darkness: 0.6
		});

		composer.addPass(
			new EffectPass(cam, toneMapping, colorBoost, contrast, bloom, chromaticAberration, vignette)
		);
	});

	$effect(() => {
		composer.setSize(size.current.width, size.current.height);
		autoRender.set(false);
		return () => autoRender.set(true);
	});

	useTask(() => composer.render(), { autoInvalidate: false });
</script>

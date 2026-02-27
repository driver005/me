<script lang="ts">
	import { useThrelte, useTask } from '@threlte/core';
	import { getContext } from 'svelte';
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
	const theme = getContext<{ value: string }>('theme');
	const composer = new EffectComposer(renderer);

	$effect(() => {
		const cam = camera.current;
		if (!cam) return;

		const isDark = theme.value === 'dark';

		composer.removeAllPasses();
		composer.addPass(new RenderPass(scene, cam));

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
			offset: new Vector2(isDark ? 0.0004 : 0.0002, isDark ? 0.0004 : 0.0002),
			radialModulation: true,
			modulationOffset: isDark ? 0.1 : 0.5
		});

		const vignette = new VignetteEffect({
			eskil: false,
			offset: isDark ? 0.4 : 0.3,
			darkness: isDark ? 0.7 : 0.6
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

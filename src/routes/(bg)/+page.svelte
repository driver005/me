<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { SpiralCarousel, type SpiralCarouselItem } from '$lib/three/scenes/spiral-carousel';
	import { WORK_PROJECTS } from '$lib/three/scenes/work-content';
	import { SEGERMAN_BG_CONTEXT, type SegermanBgContext } from '$lib/three/scenes/context';
	import { getSpiralCenterX, getCubeCenterX } from '$lib/three/scenes/spiral-layout';

	const items: SpiralCarouselItem[] = Object.values(WORK_PROJECTS).map((p) => ({
		src: p.textureUrl,
		href: `/works/${p.slug}`
	}));

	const bgContext = getContext<SegermanBgContext>(SEGERMAN_BG_CONTEXT);

	// The project carousel — right two-thirds of the viewport above spiral-layout.ts's own
	// SPIRAL_MOBILE_BREAKPOINT, dead center below it (see getSpiralCenterX()). A spinning placeholder
	// cube (standing in for a real 3D scan later — see center-cube.ts) lives in the LEFT third
	// alongside it — the same spot the old "ADRIAN" glass text +layout.svelte used to render — sharing
	// the spiral's own dead-center below the breakpoint instead, where there's no room for a two-region
	// split (see getCubeCenterX()). Both are re-evaluated every frame via `getCenter`/centerpiece's own
	// `getCenter` rather than a one-off `center` + a `window.resize` listener (see
	// SpiralCarouselOptions.getCenter's own comment on why). Clicking the cube goes to /skills.
	// Clicking the Earth backdrop itself (not owned by this carousel) goes to /about instead — see
	// +layout.svelte's own handleCanvasClick and RaymarchPlanet.raycastHit().
	$effect(() => {
		const ready = bgContext.getReady();
		const scene = bgContext.getScene();
		if (!ready || !scene) return;

		const carousel = new SpiralCarousel(scene, items, {
			getCenter: () => ({ x: getSpiralCenterX(scene), y: 0, z: 0 }),
			duotone: true,
			fluidTexture: bgContext.getFluidTexture(),
			centerpiece: {
				onClick: () => goto('/skills'),
				getCenter: () => ({ x: getCubeCenterX(scene), y: 0, z: 0 })
			},
			onItemClick: (item) => {
				if (item.href) goto(item.href);
			}
		});

		// Fully self-driving via scene.appendOutput() (see spiral-carousel.ts) — no manual rAF loop
		// needed here any more.
		return () => carousel.dispose();
	});
</script>

<!-- Home content: the Earth backdrop + the project carousel (with its centerpiece cube) above are all
     owned by the shared WebGL scene now — this page's own script just constructs the carousel into
     it (see spiral-carousel.ts). No DOM overlay needed. -->

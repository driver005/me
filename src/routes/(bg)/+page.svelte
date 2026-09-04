<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { SpiralCarousel, type SpiralCarouselItem } from '$lib/three/spiral/spiral-carousel';
	import { WORK_PROJECTS } from '$lib/three/shared/work-content';
	import { BG_ENGINE_CONTEXT, type BgEngineContext } from '$lib/three/shared/context';
	import { getSpiralCenterX, getCubeCenterX } from '$lib/three/spiral/spiral-layout';

	// Placeholders until real photos exist: skills reuses preview_skills.png (already skills-themed);
	// gallery reuses preview_home.png (generic existing preview, no gallery-specific shot yet); house
	// reuses me_selfie.jpg (closest existing "person in a photo" stand-in). /house isn't a real route
	// yet either — this link 404s until one exists.
	const EXTRA_ITEMS: SpiralCarouselItem[] = [
		{ src: '/images/me.jpeg', href: '/about' },
		{ src: '/images/preview_home.png', href: '/home' },
		{ src: '/images/preview_skills.png', href: '/skills' },
		{ src: '/images/mascot/mascot-wave.png', href: '/gallery' }
	];

	const items: SpiralCarouselItem[] = [
		...Object.values(WORK_PROJECTS).map((p) => ({
			src: p.textureUrl,
			href: `/works/${p.slug}`
		})),
		...EXTRA_ITEMS
	];

	const bgContext = getContext<BgEngineContext>(BG_ENGINE_CONTEXT);

	// Spiral carousel — right two-thirds above mobile breakpoint, centered below.
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

		return () => carousel.dispose();
	});
</script>

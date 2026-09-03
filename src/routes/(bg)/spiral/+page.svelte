<!-- src/routes/(bg)/spiral/+page.svelte -->
<script lang="ts">
	import { getContext } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import SvelteSeo from 'svelte-seo';
	import { buildGalleryImages } from '$lib/data/gallery-images';
	import { SpiralCarousel, type SpiralCarouselItem } from '$lib/three/scenes/spiral-carousel';
	import { SEGERMAN_BG_CONTEXT, type SegermanBgContext } from '$lib/three/scenes/context';
	import { getSpiralCenterX } from '$lib/three/scenes/spiral-layout';

	// Same random photo set /gallery uses (its own masonry-grid treatment of the same data) — this
	// page's own treatment is the twisted spiral column instead. `href` set to the image itself so
	// clicking opens the full-res photo in a new tab, matching what this page has always done.
	const items: SpiralCarouselItem[] = buildGalleryImages().map((g) => ({ src: g.src, href: g.src }));

	const bgContext = getContext<SegermanBgContext>(SEGERMAN_BG_CONTEXT);

	// A real Layer sharing the shared engine's own canvas/camera (see spiral-carousel.ts's own header
	// comment) — this page no longer stands up its own separate WebGLRenderer/camera; Mars (the (bg)
	// layout's own default backdrop for a route it doesn't otherwise recognize) sits behind it now,
	// where the standalone version had its own solid #0A0A0A background.
	$effect(() => {
		const ready = bgContext.getReady();
		const scene = bgContext.getScene();
		if (!ready || !scene) return;

		// Right two-thirds of the viewport above spiral-layout.ts's own SPIRAL_MOBILE_BREAKPOINT, dead
		// center below it (a narrow phone has no room for a side split) — see getSpiralCenterX(),
		// re-evaluated every frame via `getCenter` rather than a one-off `center` + a `window.resize`
		// listener (see SpiralCarouselOptions.getCenter's own comment on why).
		const carousel = new SpiralCarousel(scene, items, {
			getCenter: () => ({ x: getSpiralCenterX(scene), y: 0, z: 0 }),
			duotone: true,
			fluidTexture: bgContext.getFluidTexture(),
			onItemClick: (item) => {
				if (item.href) window.open(item.href, '_blank', 'noopener,noreferrer');
			}
		});

		return () => carousel.dispose();
	});
</script>

<svelte:head>
	<SvelteSeo
		title={m['seo.spiral.title']()}
		description={m['seo.spiral.description']()}
		canonical={`${m.url()}/spiral`}
		openGraph={{
			title: m['seo.spiral.title'](),
			description: m['seo.spiral.description'](),
			url: `${m.url()}/spiral`,
			type: 'website',
			images: [{ url: `${m.url()}/images/preview_home.jpg`, width: 800, height: 600, alt: m['seo.og_image_alt']() }],
			site_name: m['seo.author']()
		}}
		twitter={{
			card: 'summary_large_image',
			site: m['seo.twitter_handle'](),
			title: m['seo.spiral.title'](),
			description: m['seo.spiral.description'](),
			image: `${m.url()}/images/preview_home.jpg`
		}}
	/>
</svelte:head>

<div class="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 p-8 text-white">
	<a href="/" class="pointer-events-auto w-fit text-sm text-white/60 underline hover:text-white">← Back</a>
	<p class="max-w-md text-sm text-white/70">{m['spiral.meta_sub']()}</p>
</div>

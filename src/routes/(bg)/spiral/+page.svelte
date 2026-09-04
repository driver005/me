<!-- src/routes/(bg)/spiral/+page.svelte -->
<script lang="ts">
	import { getContext } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import SvelteSeo from 'svelte-seo';
	import { buildGalleryImages } from '$lib/data/gallery-images';
	import { SpiralCarousel, type SpiralCarouselItem } from '$lib/three/spiral/spiral-carousel';
	import { BG_ENGINE_CONTEXT, type BgEngineContext } from '$lib/three/shared/context';
	import { getSpiralCenterX } from '$lib/three/spiral/spiral-layout';

	const items: SpiralCarouselItem[] = buildGalleryImages().map((g) => ({ src: g.src, href: g.src }));

	const bgContext = getContext<BgEngineContext>(BG_ENGINE_CONTEXT);
	const isBack = $derived(bgContext.getIsBackMode());

	$effect(() => {
		const ready = bgContext.getReady();
		const scene = bgContext.getScene();
		if (!ready || !scene) return;

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
			images: [{ url: `${m.url()}${m['assets.seo_preview']()}`, width: 800, height: 600, alt: m['seo.og_image_alt']() }],
			site_name: m['seo.author']()
		}}
		twitter={{
			card: 'summary_large_image',
			site: m['seo.twitter_handle'](),
			title: m['seo.spiral.title'](),
			description: m['seo.spiral.description'](),
			image: `${m.url()}${m['assets.seo_preview']()}`
		}}
	/>
</svelte:head>

<div class="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 p-8 {isBack ? 'text-white' : 'text-black'}">
	<a href="/" class="pointer-events-auto w-fit text-sm underline {isBack ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}">{m['common.back_link']()}</a>
	<p class="max-w-md text-sm {isBack ? 'text-white/70' : 'text-black/70'}">{m['spiral.meta_sub']()}</p>
</div>

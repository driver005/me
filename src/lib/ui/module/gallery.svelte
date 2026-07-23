<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { browser } from '$app/environment';
	import { onScrollBounded } from '$lib/util/scroll-manager.svelte';
	import { useScrollStretchY } from '$lib/util/scroll-stretch.svelte';
	import { buildGalleryImages } from '$lib/data/gallery-images';
	import InfiniteGallerySection from './infinite-gallery-section.svelte';
	import SectionHeaderMarquee from './section-header-marquee.svelte';

	const IMAGES = buildGalleryImages();

	let headingRef: HTMLElement | null = $state(null);
	let visualX = $state('-8%');
	let archiveX = $state('8%');

	$effect(() => {
		if (!browser || !headingRef) return;
		const unsub = onScrollBounded(headingRef, (scrollY, vh, rect) => {
			const progress = Math.max(0, Math.min(1, (vh * 0.9 - rect.top) / (vh * 0.7)));
			visualX = `${-8 + progress * 8}%`;
			archiveX = `${8 - progress * 8}%`;
		});
		return unsub;
	});

	let scaleY = useScrollStretchY({ amount: 0.07 });
</script>

<section class="relative border-b border-[#F3F2EE]/20 bg-[#0A0A0A] text-[#F3F2EE]">
	<SectionHeaderMarquee text="{m['gallery.meta']()} × {m['gallery.meta_sub']()}" dark reverse separator="◆" />
	<div bind:this={headingRef} class="px-4 py-12 sm:px-8 sm:py-20">
		<h2
			class="font-display text-wh overflow-hidden text-[14vw] leading-[0.85] tracking-tighter uppercase sm:text-[11vw]"
		>
			<span
				class="block"
				style="transform: scaleY({scaleY.value}) translateX({visualX}); transform-origin: 50% 100%; will-change: transform;"
			>
				{m['gallery.title_visual']()}
			</span>
			<span
				class="text-stroke-inverted block italic"
				style="transform: scaleY({scaleY.value}) translateX({archiveX}); transform-origin: 50% 0%; will-change: transform;"
			>
				{@html m['gallery.title_archive']()}
			</span>
		</h2>
	</div>
</section>

<InfiniteGallerySection {IMAGES} />

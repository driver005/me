<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import GalleryItem from './gallery-item.svelte';

	let {
		IMAGES
	}: {
		IMAGES: Array<{ src: string; row: number; col: number; randomY: number }>;
	} = $props();
	let gridRef = $state<HTMLElement | null>(null);
	let focusIndex = $state(-1);

	function handleKeydown(e: KeyboardEvent) {
		if (!gridRef) return;
		const items = gridRef.querySelectorAll('[role="gridcell"]');
		if (items.length === 0) return;

		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			e.preventDefault();
			focusIndex = Math.min(focusIndex + 1, items.length - 1);
			(items[focusIndex] as HTMLElement).focus();
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			e.preventDefault();
			focusIndex = Math.max(focusIndex - 1, 0);
			(items[focusIndex] as HTMLElement).focus();
		}
	}
</script>

<section id="gallery" class="relative bg-[#0A0A0A]" style="padding-block: 8vw; overflow: clip;">
	<a
		href="/spiral"
		class="pointer-cursor sticky top-0 z-20 flex h-screen items-center justify-center"
		style="margin-bottom: -100vh;"
	>
		<div
			class="relative flex items-end justify-start p-4"
			style="width: clamp(160px, 28vw, 420px); aspect-ratio: 3/4; border: 1px solid rgba(243,242,238,0.25);"
		>
			{#each [['0', '0'], ['0', 'auto'], ['auto', '0'], ['auto', 'auto']] as [t, b], i}
				<span
					class="absolute h-3 w-3"
					style="top: {t === '0' ? '-1px' : 'auto'}; bottom: {b === '0'
						? '-1px'
						: 'auto'}; left: {i % 2 === 0 ? '-1px' : 'auto'}; right: {i % 2 === 1
						? '-1px'
						: 'auto'}; border-top: {t === '0' ? '2px solid #FF3B00' : 'none'}; border-bottom: {b ===
					'0'
						? '2px solid #FF3B00'
						: 'none'}; border-left: {i % 2 === 0 ? '2px solid #FF3B00' : 'none'}; border-right: {i %
						2 ===
					1
						? '2px solid #FF3B00'
						: 'none'};"
				></span>
			{/each}
			<span
				class="font-mono text-[0.6rem] tracking-[0.25em] uppercase"
				style="color: rgba(243,242,238,0.3);"
			>
				{m['gallery.meta']()}
			</span>
		</div>
	</a>

	<div
		bind:this={gridRef}
		role="grid"
		aria-label={m['gallery.title']()}
		tabindex="0"
		onkeydown={handleKeydown}
		class="grid focus:outline-none"
		style="grid-template-columns: repeat(8, 1fr); grid-auto-rows: 15vw; gap: 2vw; padding: 0 2vw;"
	>
		{#each IMAGES as img, i}
			<GalleryItem {img} shapeIndex={i} />
		{/each}
	</div>
</section>

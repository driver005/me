<script lang="ts">
	import GalleryItem from './gallery-item.svelte';

	let { IMAGES }: { IMAGES: Array<{ src: string; row: number; col: number; randomY: number }> } = $props();
</script>

<section id="gallery" class="relative bg-[#0A0A0A]" style="padding-block: 8vw; overflow: clip;">
	<div
		class="sticky top-0 h-screen flex items-center justify-center pointer-events-none z-20"
		style="margin-bottom: -100vh;"
	>
		<div
			class="relative flex items-end justify-start p-4"
			style="width: clamp(160px, 28vw, 420px); aspect-ratio: 3/4; border: 1px solid rgba(243,242,238,0.25);"
		>
			{#each [['0','0'],['0','auto'],['auto','0'],['auto','auto']] as [t, b], i}
				<span
					class="absolute w-3 h-3"
					style="top: {t === '0' ? '-1px' : 'auto'}; bottom: {b === '0' ? '-1px' : 'auto'}; left: {i % 2 === 0 ? '-1px' : 'auto'}; right: {i % 2 === 1 ? '-1px' : 'auto'}; border-top: {t === '0' ? '2px solid #FF3B00' : 'none'}; border-bottom: {b === '0' ? '2px solid #FF3B00' : 'none'}; border-left: {i % 2 === 0 ? '2px solid #FF3B00' : 'none'}; border-right: {i % 2 === 1 ? '2px solid #FF3B00' : 'none'};"
				></span>
			{/each}
			<span class="font-mono text-[0.6rem] tracking-[0.25em] uppercase" style="color: rgba(243,242,238,0.3);">
				§ 06 — Gallery
			</span>
		</div>
	</div>

	<div
		class="grid"
		style="grid-template-columns: repeat(8, 1fr); grid-auto-rows: 15vw; gap: 2vw; padding: 0 2vw;"
	>
		{#each IMAGES as img, i}
			<GalleryItem {img} shapeIndex={i} />
		{/each}
	</div>
</section>

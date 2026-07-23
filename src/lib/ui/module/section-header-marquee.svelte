<script lang="ts">
	let {
		text,
		dark = false,
		accent = '#FF3B00',
		reverse = false,
		separator = '×'
	}: {
		text: string;
		dark?: boolean;
		accent?: string;
		reverse?: boolean;
		separator?: string;
	} = $props();

	const words = $derived(text.split(' × '));
	const mainColor = $derived(dark ? '#F3F2EE' : '#0A0A0A');
	const fadedColor = $derived(dark ? 'rgba(243,242,238,0.2)' : 'rgba(10,10,10,0.2)');
</script>

<div class="overflow-hidden border-b border-black py-4 sm:py-6">
	<div
		class="flex gap-0 whitespace-nowrap will-change-transform"
		style="animation: marquee 20s linear infinite {reverse ? 'reverse' : 'normal'}; --gap: 0rem;"
	>
		{#each Array(12) as _, i}
			{#each words as word, j}
				{@const idx = i * words.length + j}
				<span class="flex items-center gap-6 sm:gap-10">
					<span
						class="font-display uppercase text-5xl sm:text-7xl mx-6 sm:mx-10 tracking-tighter whitespace-nowrap"
						style="color: {idx % 4 === 0 ? accent : mainColor}"
					>{word}</span>
					<span class="text-5xl sm:text-7xl" style="color: {fadedColor}">{separator}</span>
				</span>
			{/each}
		{/each}
	</div>
</div>

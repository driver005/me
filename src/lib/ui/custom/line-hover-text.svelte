<script lang="ts">
	let { text, class: className = '' }: { text: string; class?: string } = $props();
	const chars = $derived(text.split(''));
</script>

<span class="inline-flex overflow-hidden align-bottom {className}" style="height: 1.15em;">
	{#each chars as ch, i}
		<span
			class="inline-block transition-transform duration-300 ease-out group-hover:-translate-y-full"
			style="transition-delay: {i * 18}ms;"
		>{ch === ' ' ? ' ' : ch}</span>
	{/each}
</span>
<span class="inline-flex overflow-hidden align-bottom absolute" style="height: 1.15em;" aria-hidden="true">
	{#each chars as ch, i}
		<span
			class="inline-block translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0 text-[#FF3B00]"
			style="transition-delay: {i * 18}ms;"
		>{ch === ' ' ? ' ' : ch}</span>
	{/each}
</span>

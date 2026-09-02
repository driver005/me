<script lang="ts">
	import { page } from '$app/state';
	import SegermanChrome from '$lib/components/sites/segerman/SegermanChrome.svelte';
	import SegermanWork from '$lib/components/sites/segerman/SegermanWork.svelte';
	import { SEGERMAN_WORKS } from '$lib/components/sites/segerman/data';

	const work = $derived(SEGERMAN_WORKS.find((w) => w.slug === page.params.slug));
</script>

<svelte:head>
	<title>{work ? `${work.title} | Raphael Segerman (clone)` : 'Not found'}</title>
</svelte:head>

{#if work}
	<SegermanChrome>
		<SegermanWork {work} />
	</SegermanChrome>
{:else}
	<p style="padding: 4rem; font-family: sans-serif;">
		Work not found. <a href="/segerman">Back home</a>.
	</p>
{/if}

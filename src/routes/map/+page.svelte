<script lang="ts">
	import PageShell from '$lib/ui/module/page-shell.svelte';
	import MapEntryGate from '$lib/ui/module/map-entry-gate.svelte';
	import ScrollMap from '$lib/ui/module/scroll-map.svelte';
	import SvelteSeo from 'svelte-seo';

	let entered = $state(false);
</script>

<svelte:head>
	<SvelteSeo
		title="The Route So Far — Adrian Fernández"
		description="Places I've worked and traveled, on a scroll-driven map."
	/>
</svelte:head>

<MapEntryGate bind:entered />

<PageShell>
	{#if entered}
		<ScrollMap />
	{/if}
</PageShell>

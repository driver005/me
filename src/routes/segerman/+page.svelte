<script lang="ts">
	import SegermanChrome from '$lib/components/sites/segerman/SegermanChrome.svelte';
	import SegermanHome from '$lib/components/sites/segerman/SegermanHome.svelte';
</script>

<svelte:head>
	<title>Raphael Segerman | Creative Developer (clone)</title>
	<meta
		name="description"
		content="Svelte recreation of segerman.dev's layout, built from a Firecrawl design scrape."
	/>
</svelte:head>

<SegermanChrome>
	<SegermanHome />
</SegermanChrome>

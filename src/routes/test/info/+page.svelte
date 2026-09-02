<!-- src/routes/test/info/+page.svelte -->
<script lang="ts">
	import { getContext } from 'svelte';
	import { SEGERMAN_INFO } from '$lib/components/sites/segerman/data';
	import { InfoPortrait } from '$lib/three/scenes/segerman-bg/info-portrait';
	import { SEGERMAN_BG_CONTEXT, type SegermanBgContext } from '$lib/three/scenes/segerman-bg/context';

	const bgContext = getContext<SegermanBgContext>(SEGERMAN_BG_CONTEXT);

	$effect(() => {
		const ready = bgContext.getReady();
		const scene = bgContext.getScene();
		const gallery = bgContext.getGallery();
		if (!ready || !scene || !gallery) return;

		const portrait = new InfoPortrait(scene, gallery);
		return () => portrait.dispose();
	});
</script>

<svelte:head>
	<title>Info — WebGL Background Test</title>
</svelte:head>

<div class="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col gap-4 p-8 text-white sm:max-w-xl">
	<a href="/test" class="pointer-events-auto w-fit text-sm text-white/60 underline hover:text-white">← Back</a>
	{#each SEGERMAN_INFO.paragraphs as paragraph (paragraph)}
		<p class="leading-relaxed text-white/90">{paragraph}</p>
	{/each}
	<div class="flex flex-wrap gap-2 text-xs text-white/60">
		{#each SEGERMAN_INFO.tools as tool (tool)}
			<span class="rounded-full border border-white/20 px-2 py-1">{tool}</span>
		{/each}
	</div>
	<div class="flex flex-wrap gap-2 text-xs text-white/60">
		{#each SEGERMAN_INFO.awards as award (award)}
			<span>{award}</span>
		{/each}
	</div>
</div>

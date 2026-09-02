<!-- src/routes/test/info/+page.svelte -->
<script lang="ts">
	import { getContext } from 'svelte';
	import { INFO_CONTENT } from '$lib/three/scenes/segerman-bg/info-content';
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

<!-- Left half above md (768px, matching InfoPortrait's own SPLIT_BREAKPOINT_PX — the portrait moves
     to the right half in lockstep); below that the two merge — full-width text laid directly over the
     portrait, so it switches to black there instead of white (illegible against the bright portrait
     over the same dark space background that white was tuned for). -->
<div
	class="pointer-events-none fixed bottom-0 left-0 z-20 flex w-full flex-col gap-4 p-8 sm:max-w-xl md:w-1/2 md:max-w-none"
>
	<a
		href="/test"
		class="pointer-events-auto w-fit text-sm text-black/60 underline hover:text-black md:text-white/60 md:hover:text-white"
	>
		← Back
	</a>
	{#each INFO_CONTENT.paragraphs as paragraph (paragraph)}
		<p class="leading-relaxed text-black/90 md:text-white/90">{paragraph}</p>
	{/each}
	<div class="flex flex-wrap gap-2 text-xs text-black/60 md:text-white/60">
		{#each INFO_CONTENT.tools as tool (tool)}
			<span class="rounded-full border border-black/20 px-2 py-1 md:border-white/20">{tool}</span>
		{/each}
	</div>
	<div class="flex flex-wrap gap-2 text-xs text-black/60 md:text-white/60">
		{#each INFO_CONTENT.awards as award (award)}
			<span>{award}</span>
		{/each}
	</div>
</div>

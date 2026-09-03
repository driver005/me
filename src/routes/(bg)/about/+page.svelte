<!-- src/routes/(bg)/about/+page.svelte -->
<script lang="ts">
	import { getContext } from 'svelte';
	import { INFO_CONTENT } from '$lib/three/scenes/info-content';
	import { InfoPortrait } from '$lib/three/scenes/info-portrait';
	import { SEGERMAN_BG_CONTEXT, type SegermanBgContext } from '$lib/three/scenes/context';

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
	<title>About — Adrian Fernández</title>
</svelte:head>

<!-- Left half above md (768px, matching InfoPortrait's own SPLIT_BREAKPOINT_PX — the portrait moves
     to the right half in lockstep); below that the two merge — full-width text laid directly over the
     portrait, so it switches to black there instead of white (illegible against the bright portrait
     over the same dark space background that white was tuned for). -->
<div
	class="pointer-events-none fixed bottom-0 left-0 z-20 flex w-full flex-col gap-4 p-8 sm:max-w-xl md:w-1/2 md:max-w-none"
>
	<a
		href="/"
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
	<div class="pointer-events-auto flex flex-wrap gap-x-4 gap-y-1 text-xs">
		{#each INFO_CONTENT.links as link (link.href)}
			<a
				href={link.href}
				target="_blank"
				rel="noopener noreferrer"
				class="underline text-black/70 hover:text-black md:text-white/70 md:hover:text-white"
			>
				{link.label}
			</a>
		{/each}
	</div>
</div>

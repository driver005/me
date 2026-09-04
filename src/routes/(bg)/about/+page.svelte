<!-- src/routes/(bg)/about/+page.svelte -->
<script lang="ts">
	import { getContext } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import { INFO_CONTENT } from '$lib/three/info/info-content';
	import { InfoPortrait } from '$lib/three/info/info-portrait';
	import { BG_ENGINE_CONTEXT, type BgEngineContext } from '$lib/three/shared/context';

	const bgContext = getContext<BgEngineContext>(BG_ENGINE_CONTEXT);

	// Text color follows isBackMode (the bottom-right Toggle.svelte button — the only control actually
	// on this page) — white over the dark immersive back scene, black over the white front plate.
	// mode.current (the separate light/dark theme, only togglable from /home) was tried instead; wrong
	// call, since it isn't what anyone testing this page from here is actually changing.
	//
	// Desktop follows isBackMode directly; mobile stays black regardless of it — it lays text directly
	// over the portrait image (see the template's own comment below), which reads as bright at every
	// width, not over the back-scene/front-plate split desktop shows.
	const isBack = $derived(bgContext.getIsBackMode());
	const textClass = $derived(isBack ? 'text-black/90 md:text-white/90' : 'text-black/90');
	const mutedClass = $derived(isBack ? 'text-black/60 md:text-white/60' : 'text-black/60');
	const borderClass = $derived(isBack ? 'border-black/20 md:border-white/20' : 'border-black/20');
	const linkClass = $derived(
		isBack
			? 'text-black/70 hover:text-black md:text-white/70 md:hover:text-white'
			: 'text-black/70 hover:text-black'
	);
	const backLinkClass = $derived(
		isBack
			? 'text-black/60 hover:text-black md:text-white/60 md:hover:text-white'
			: 'text-black/60 hover:text-black'
	);

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
	<title>{m['about.meta']()} {m['common.title_suffix']()}</title>
</svelte:head>

<!-- Left half above md (768px, matching InfoPortrait's own SPLIT_BREAKPOINT_PX — the portrait moves
     to the right half in lockstep); below that the two merge — full-width text laid directly over the
     portrait, so it switches to black there instead of white (illegible against the bright portrait).
     Text color otherwise follows isBackMode (see the script's own textClass etc). -->
<div
	class="pointer-events-none fixed bottom-0 left-0 z-20 flex w-full flex-col gap-4 p-8 sm:max-w-xl md:w-1/2 md:max-w-none"
>
	<a href="/" class="pointer-events-auto w-fit text-sm underline {backLinkClass}">
		{m['common.back_link']()}
	</a>
	{#each INFO_CONTENT.paragraphs as paragraph (paragraph)}
		<p class="leading-relaxed {textClass}">{paragraph}</p>
	{/each}
	<div class="flex flex-wrap gap-2 text-xs {mutedClass}">
		{#each INFO_CONTENT.tools as tool (tool)}
			<span class="rounded-full border px-2 py-1 {borderClass}">{tool}</span>
		{/each}
	</div>
	<div class="flex flex-wrap gap-2 text-xs {mutedClass}">
		{#each INFO_CONTENT.awards as award (award)}
			<span>{award}</span>
		{/each}
	</div>
	<div class="pointer-events-auto flex flex-wrap gap-x-4 gap-y-1 text-xs">
		{#each INFO_CONTENT.links as link (link.href)}
			<a href={link.href} target="_blank" rel="noopener noreferrer" class="underline {linkClass}">
				{link.label}
			</a>
		{/each}
	</div>
</div>

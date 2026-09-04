<!-- src/routes/(bg)/works/[slug]/+page.svelte -->
<script lang="ts">
	import { getContext } from 'svelte';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import { WORK_PROJECTS } from '$lib/three/shared/work-content';
	import { SpiralCarousel } from '$lib/three/spiral/spiral-carousel';
	import { BG_ENGINE_CONTEXT, type BgEngineContext } from '$lib/three/shared/context';

	const project = $derived(WORK_PROJECTS[page.params.slug ?? '']);
	const bgContext = getContext<BgEngineContext>(BG_ENGINE_CONTEXT);
	const isBack = $derived(bgContext.getIsBackMode());
	const textClass = $derived(isBack ? 'text-white' : 'text-black');
	const mutedClass = $derived(isBack ? 'text-white/70' : 'text-black/70');
	const linkClass = $derived(isBack ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black');
	const subtleLinkClass = $derived(isBack ? 'hover:text-white/80' : 'hover:text-black/80');

	$effect(() => {
		const slug = page.params.slug;
		const ready = bgContext.getReady();
		const scene = bgContext.getScene();
		const currentProject = slug ? WORK_PROJECTS[slug] : undefined;
		if (!ready || !scene || !currentProject) return;

		// TODO: real per-project media clips don't exist yet.
		const carousel = new SpiralCarousel(scene, [{ src: currentProject.textureUrl }], {
			mode: 'horizontal',
			duotone: true,
			fluidTexture: bgContext.getFluidTexture()
		});

		return () => carousel.dispose();
	});
</script>

<svelte:head>
	<title>{project ? `${project.title} ${m['common.title_suffix']()}` : m['common.not_found_title']()}</title>
</svelte:head>

{#if project}
	<div class="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col gap-3 p-8 {textClass} sm:max-w-xl">
		<a href="/" class="pointer-events-auto w-fit text-sm {linkClass} underline">{m['common.back_link']()}</a>
		<h1 class="text-6xl leading-none font-black tracking-tight uppercase sm:text-8xl">{project.title}</h1>
		<p class="text-sm {mutedClass}">{project.role} · {project.year}</p>
		<p class="leading-relaxed {isBack ? 'text-white/90' : 'text-black/90'}">{project.description}</p>
		<a
			href={project.url}
			target="_blank"
			rel="noopener noreferrer"
			class="pointer-events-auto w-fit text-sm underline {subtleLinkClass}"
		>
			{m['common.visit_site']()}
		</a>
	</div>
{:else}
	<div class="pointer-events-none fixed inset-x-0 bottom-0 z-20 p-8 {textClass}">
		<a href="/" class="pointer-events-auto underline">{m['common.not_found_back']()}</a>
	</div>
{/if}

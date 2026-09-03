<!-- src/routes/(bg)/works/[slug]/+page.svelte -->
<script lang="ts">
	import { getContext } from 'svelte';
	import { page } from '$app/state';
	import { WORK_PROJECTS } from '$lib/three/scenes/work-content';
	import { SpiralCarousel } from '$lib/three/scenes/spiral-carousel';
	import { SEGERMAN_BG_CONTEXT, type SegermanBgContext } from '$lib/three/scenes/context';

	const project = $derived(WORK_PROJECTS[page.params.slug ?? '']);
	const bgContext = getContext<SegermanBgContext>(SEGERMAN_BG_CONTEXT);

	$effect(() => {
		const slug = page.params.slug;
		const ready = bgContext.getReady();
		const scene = bgContext.getScene();
		const currentProject = slug ? WORK_PROJECTS[slug] : undefined;
		if (!ready || !scene || !currentProject) return;

		// TODO: real per-project media clips don't exist yet (WorkProject.videoUrl points at a file
		// that isn't there) — one item (the project's real screenshot) instead of a real multi-clip
		// filmstrip. Switch to a real per-project image array once those exist.
		const carousel = new SpiralCarousel(scene, [{ src: currentProject.textureUrl }], {
			mode: 'horizontal',
			duotone: true,
			fluidTexture: bgContext.getFluidTexture()
		});

		// Fully self-driving via scene.appendOutput() (see spiral-carousel.ts) — no manual rAF loop
		// needed here any more.
		return () => carousel.dispose();
	});
</script>

<svelte:head>
	<title>{project ? `${project.title} — Adrian Fernández` : 'Project not found'}</title>
</svelte:head>

{#if project}
	<div class="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col gap-3 p-8 text-white sm:max-w-xl">
		<a href="/" class="pointer-events-auto w-fit text-sm text-white/60 underline hover:text-white">← Back</a>
		<h1 class="text-6xl leading-none font-black tracking-tight uppercase sm:text-8xl">{project.title}</h1>
		<p class="text-sm text-white/70">{project.role} · {project.year}</p>
		<p class="leading-relaxed text-white/90">{project.description}</p>
		<a
			href={project.url}
			target="_blank"
			rel="noopener noreferrer"
			class="pointer-events-auto w-fit text-sm underline hover:text-white/80"
		>
			Visit site ↗
		</a>
	</div>
{:else}
	<div class="pointer-events-none fixed inset-x-0 bottom-0 z-20 p-8 text-white">
		<a href="/" class="pointer-events-auto underline">← Back — project not found</a>
	</div>
{/if}

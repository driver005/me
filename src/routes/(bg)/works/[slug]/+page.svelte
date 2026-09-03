<!-- src/routes/(bg)/works/[slug]/+page.svelte -->
<script lang="ts">
	import { getContext } from 'svelte';
	import { page } from '$app/state';
	import { WORK_PROJECTS } from '$lib/three/scenes/segerman-bg/work-content';
	import { Gallery } from '$lib/three/scenes/segerman-bg/gallery';
	import { Scroll } from '$lib/three/scenes/segerman-bg/scroll';
	import { SEGERMAN_BG_CONTEXT, type SegermanBgContext } from '$lib/three/scenes/segerman-bg/context';

	const project = $derived(WORK_PROJECTS[page.params.slug ?? '']);
	const bgContext = getContext<SegermanBgContext>(SEGERMAN_BG_CONTEXT);

	$effect(() => {
		const slug = page.params.slug;
		const ready = bgContext.getReady();
		const scene = bgContext.getScene();
		const gallery = bgContext.getGallery();
		const currentProject = slug ? WORK_PROJECTS[slug] : undefined;
		if (!ready || !slug || !scene || !gallery || !currentProject) return;

		// TODO: real per-project media clips don't exist yet (WorkProject.videoUrl points at a file
		// that isn't there) — shows the project's real screenshot as a single-item image row instead of
		// a broken video placeholder. Switch mediaType back to 'video' with a real multi-clip array once
		// those exist (matches the source's own 5-clips-per-project carousel).
		const carousel = new Gallery(
			scene,
			[{ textureUrl: currentProject.textureUrl }],
			{
				axis: 'horizontal',
				mediaType: 'image',
				titles: false,
				hoverNav: false,
				groupTilt: false,
				gapFront: 4,
				gapBack: 4,
				center: { x: 0, y: 0, z: 5 },
				// Renders through the home Gallery's own persistent image layer instead of standing up a
				// new scene/layer for this route — dispose() removes this instance's whole subtree from it
				// on navigation away.
				imageScene: gallery.imageScene
			}
		);
		const scroll = new Scroll(scene, carousel);

		// Not registered via scene.addLayer() — Scene has no removeLayer(), and this carousel/scroll
		// pair is scoped to this page (a fresh pair gets created on every slug change), so a manual
		// rAF loop scoped to this effect's own lifetime avoids leaking phantom layers across
		// navigation.
		let rafId = requestAnimationFrame(function tick() {
			scroll.loop();
			carousel.update(0, 0);
			rafId = requestAnimationFrame(tick);
		});

		return () => {
			cancelAnimationFrame(rafId);
			scroll.dispose();
			carousel.dispose();
		};
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

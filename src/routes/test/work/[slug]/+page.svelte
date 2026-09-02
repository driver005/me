<!-- src/routes/test/work/[slug]/+page.svelte -->
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
		if (!ready || !slug || !scene || !gallery || !WORK_PROJECTS[slug]) return;

		const mediaUrls = [1, 2, 3, 4, 5].map((i) => `/videos/segerman-bg/work-media/${slug}-${i}.mp4`);
		const carousel = new Gallery(
			scene,
			mediaUrls.map((videoUrl) => ({ videoUrl })),
			{
				axis: 'horizontal',
				mediaType: 'video',
				titles: false,
				hoverNav: false,
				groupTilt: false,
				gapFront: 4,
				gapBack: 4,
				center: { x: 0, y: 0, z: 5 },
				// Renders through the home Gallery's own persistent video layer instead of standing up a
				// new scene/layer for this route — dispose() removes this instance's whole subtree from it
				// on navigation away.
				videoScene: gallery.videoScene
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
	<title>{project ? `${project.title} — WebGL Background Test` : 'Project not found'}</title>
</svelte:head>

{#if project}
	<div class="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col gap-3 p-8 text-white sm:max-w-xl">
		<a href="/test" class="pointer-events-auto w-fit text-sm text-white/60 underline hover:text-white">← Back</a>
		<h1 class="text-3xl font-black uppercase">{project.title}</h1>
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
		<a href="/test" class="pointer-events-auto underline">← Back — project not found</a>
	</div>
{/if}

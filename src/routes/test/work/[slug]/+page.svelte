<!-- src/routes/test/work/[slug]/+page.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { WORK_PROJECTS } from '$lib/three/scenes/segerman-bg/work-content';

	const project = $derived(WORK_PROJECTS[page.params.slug ?? '']);
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

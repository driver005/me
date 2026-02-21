<script lang="ts">
	import { projects } from '$lib/data';
	import ProjectCard from './project-card.svelte';
</script>

{#each projects as project, i}
	<ProjectCard {project} number={i} />
{/each}

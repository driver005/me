<script lang="ts">
	import '../app.css';
	import { type Snippet } from 'svelte';
	import { setMode } from 'mode-watcher';
	import { pageTransition } from '$lib/stores/page-transition';
	import { fade } from 'svelte/transition';
	import { afterNavigate } from '$app/navigation';

	setMode('light');

	let { children }: { children: Snippet } = $props();

	afterNavigate(() => {
		pageTransition.set(false);
	});
</script>

{#if $pageTransition}
	<div transition:fade={{ duration: 200 }} class="fixed inset-0 z-[200] bg-[#F3F2EE] pointer-events-none"></div>
{/if}

{@render children()}

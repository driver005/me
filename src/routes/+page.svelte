<script lang="ts">
	import CanvasPortal from '$lib/three/canvas/portal.svelte';
	import DevHelper from '$lib/three/dev/helper.svelte';
	import Sceens from '$lib/three/sceens/default.svelte';
	import { Grid, PerfMonitor } from '@threlte/extras';
	import { World } from '@threlte/rapier';
	import { useBreakpoint } from '$lib/util/screen.svelte';
	import { Home } from '$lib/ui/page';
	import { browser } from '@threlte/core';
	import { getContext, onMount } from 'svelte';

	let isMounted = $state(false);
	let active = $state('home');

	let helper: 'Studio' | 'Theatre' = $state('Theatre');

	let isDesktop = useBreakpoint('768px');

	onMount(() => {
		if (!browser) return;

		isMounted = true;
	});

	const manual_override = getContext<{ value: boolean }>('manual_override');
</script>

{#if isMounted}
	{#if isDesktop.value && manual_override.value === false}
		{#if import.meta.env.MODE === 'development'}
			<button class="btn" onclick={() => (helper = helper === 'Studio' ? 'Theatre' : 'Studio')}>
				Toggle Helper
			</button>
		{/if}
		<CanvasPortal>
			<World>
				{#if import.meta.env.MODE === 'development'}
					<DevHelper {helper}>
						<PerfMonitor anchorX={'left'} anchorY={'bottom'} logsPerSecond={30} />
						<Sceens />
						<Grid sectionColor="#ff3e00" sectionThickness={1} cellColor="#cccccc" gridSize={40} />
					</DevHelper>
				{:else}
					<Sceens />
				{/if}
			</World>
		</CanvasPortal>
	{:else}
		<Home bind:manual_override={manual_override.value} bind:active />
	{/if}
{/if}

<style>
	.btn {
		position: absolute;
		top: 10px;
		left: 0;
		z-index: 999;
	}
</style>

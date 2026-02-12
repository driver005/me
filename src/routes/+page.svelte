<script lang="ts">
	import CanvasPortal from '$lib/three/canvas/portal.svelte';
	import DevHelper from '$lib/three/dev/helper.svelte';
	import Sceens from '$lib/three/sceens/default.svelte';
	import { Grid, PerfMonitor } from '@threlte/extras';
	import Deepspace from '$lib/three/skybox/deepspace.svelte';
	import { World } from '@threlte/rapier';

	// Toggle between Studio and Theatre in development
	let helper: 'Studio' | 'Theatre' = 'Theatre';
</script>

{#if import.meta.env.MODE === 'development'}
	<button class="btn" on:click={() => (helper = helper === 'Studio' ? 'Theatre' : 'Studio')}>
		Toggle Helper
	</button>
{/if}

<CanvasPortal>
	<World>
		<DevHelper {helper}>
			<PerfMonitor anchorX={'left'} anchorY={'bottom'} logsPerSecond={30} />
			<Sceens />
			<Deepspace />
			<Grid sectionColor="#ff3e00" sectionThickness={1} cellColor="#cccccc" gridSize={40} />
		</DevHelper>
	</World>
</CanvasPortal>

<style>
	.btn {
		position: absolute;
		z-index: 999;
	}
</style>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Canvas, T } from '@threlte/core';
	import PlanetMesh from './PlanetMesh.svelte';

	// Ambient, non-interactive planet — same mesh/shaders as the interactive
	// one on /segerman/work/[slug], just parked at a different position/scale
	// per page (matching the real `pages` config in world.js's planet class:
	// home/work/info/error each get their own spot). Cursor interactivity
	// (terrain bump + crack reveal) only turns on for pageId==="work" on the
	// real site, so it stays off here.
	let {
		position,
		scale,
		uRimPow,
		uGlowPow,
		uGlowStr,
		uRimStr,
		uGlowBiasX,
		uTerrainScale,
	}: {
		position: [number, number, number];
		scale: number;
		uRimPow: number;
		uGlowPow: number;
		uGlowStr: number;
		uRimStr: number;
		uGlowBiasX: number;
		uTerrainScale: number;
	} = $props();

	let webglOk = $state(true);

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			webglOk = false;
			return;
		}
		try {
			if (!document.createElement('canvas').getContext('webgl2')) webglOk = false;
		} catch {
			webglOk = false;
		}
	});
</script>

{#if webglOk}
	<div class="planet-bg" aria-hidden="true">
		<Canvas>
			<T.PerspectiveCamera makeDefault position={[0, 0, 0]} fov={45} near={0.1} far={1000} />
			<PlanetMesh
				{position}
				{scale}
				interactive={false}
				{uGlowBiasX}
				{uRimPow}
				{uGlowPow}
				{uGlowStr}
				{uRimStr}
				{uTerrainScale}
			/>
		</Canvas>
	</div>
{/if}

<style>
	.planet-bg {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}
</style>

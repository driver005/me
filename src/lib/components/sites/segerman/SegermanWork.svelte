<script lang="ts">
	import { Canvas, T } from '@threlte/core';
	import PlanetMesh from './PlanetMesh.svelte';
	import type { SegermanWork } from './data';

	let { work }: { work: SegermanWork } = $props();
</script>

<div class="work-planet" aria-hidden="true">
	<Canvas>
		<T.PerspectiveCamera makeDefault position={[0, 0, 0]} fov={45} near={0.1} far={1000} />
		<!--
			Real pages.work config from world.js's planet class — this is the
			ONLY route where pageId==="work", the one condition their own code
			checks before enabling raycasting, terrain bump, and the crack trail
			(see PlanetMesh.svelte's `interactive` prop / mousemove() gate).
		-->
		<PlanetMesh
			position={[0, -32, -60]}
			scale={50}
			interactive
			uGlowBiasX={0.6}
			uRimPow={4.2}
			uGlowPow={3.2}
			uGlowStr={0.4}
			uRimStr={1}
			uTerrainScale={3.5}
		/>
	</Canvas>
</div>

<main class="page-content work-page">
	<h1 class="work-title" data-reveal>
		<span class="line">{work.title}</span>
	</h1>
	<p class="work-hint" data-reveal style="--reveal-delay: 80ms">Move your cursor over the planet — it cracks where you touch it.</p>

	<div class="work-media" data-reveal style="--reveal-delay: 140ms">
		<div class="media-wrapper">
			<video class="media" src={work.video} poster={work.image} autoplay muted loop playsinline preload="auto"></video>
		</div>
	</div>

	<a class="work-visit link" href="https://segerman.dev/work/{work.slug}" target="_blank" rel="noopener noreferrer" data-reveal style="--reveal-delay: 200ms">
		View full case study on segerman.dev
		<span class="underline"></span>
	</a>
</main>

<style>
	.work-planet {
		position: fixed;
		inset: 0;
		z-index: 0;
	}
	.work-page {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 2.4rem;
		min-height: 100dvh;
		padding: 0 var(--unit) 12rem;
	}
	.work-title {
		text-shadow: 0 0.2rem 2rem rgba(0, 0, 0, 0.4);
	}
	.work-hint {
		max-width: 40rem;
		opacity: 0.8;
	}
	.work-media {
		width: min(60rem, 90vw);
	}
	.work-media .media-wrapper {
		aspect-ratio: 1.736/1;
		margin-bottom: 0;
	}
	.work-visit {
		font-size: 1.5rem;
	}
</style>

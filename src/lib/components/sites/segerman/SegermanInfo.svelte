<script lang="ts">
	import SegermanPlanetBackground from './SegermanPlanetBackground.svelte';
	import { SEGERMAN_INFO } from './data';
</script>

<SegermanPlanetBackground
	position={[-38, -40, -26.6]}
	scale={150}
	uGlowBiasX={0.6}
	uRimPow={4.2}
	uGlowPow={0.5}
	uGlowStr={0.6}
	uRimStr={1}
	uTerrainScale={3.9}
/>

<main class="page-content">
	<h1 class="info-title" data-reveal>
		<span class="line">About</span>
	</h1>

	<div class="info-text-wrapper" data-reveal style="--reveal-delay: 80ms">
		{#each SEGERMAN_INFO.paragraphs as paragraph}
			<p class="text">{paragraph}</p>
		{/each}
	</div>

	<div class="info-metas" data-reveal style="--reveal-delay: 140ms">
		<dl class="meta">
			<dt class="label">Tools</dt>
			<dd class="text">{SEGERMAN_INFO.tools.join(', ')}</dd>
		</dl>
		<dl class="meta">
			<dt class="label">Awards</dt>
			<dd class="text">{SEGERMAN_INFO.awards.join(', ')}</dd>
		</dl>
	</div>
</main>

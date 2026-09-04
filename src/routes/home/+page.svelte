<script lang="ts">
	import * as THREE from 'three';
	import { Canvas } from '@threlte/core';
	import HomeEngineRoot from '$lib/three/HomeEngineRoot.svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { m } from '$lib/paraglide/messages';
	import SvelteSeo from 'svelte-seo';
	import { toggleMode, mode } from 'mode-watcher';

	let isMounted = $state(false);
	/** True from mount until HomeEngineRoot's own onReady fires — the room's GLTF has loaded AND every
	 *  one of its meshes has been revealed (see room.ts's own revealQueue/onFullyRevealed: staggered one
	 *  mesh at a time, specifically so their shaders compile gradually instead of in one burst — see that
	 *  file's own comment for why). Drives the loading overlay below. */
	let loading = $state(true);
	/** "Safe mode" — hides the room model's own joint/rig meshes and its idle smoke curl while on
	 *  (the default). No UI to flip this in the app currently (the old friendly-mode password gate —
	 *  see messages/*.json's own now-deleted friendlymode.* keys — was never wired to this page), so
	 *  it just stays true; kept as real state (not a constant) since HomeEngineRoot already accepts it
	 *  reactively via a prop, ready for a real toggle later. */
	let friendly = $state(true);

	/** Threlte's own default renderer creation asks for `antialias: true` — real, non-trivial GPU cost
	 *  (MSAA), and largely redundant here anyway once postprocessing.ts's own EffectPass chain (bloom/
	 *  tone mapping/vignette) runs over the output — a full-scene multi-effect post pass already softens
	 *  edges somewhat, so paying for hardware MSAA on top buys little. Every other renderer creation
	 *  option stays at Threlte's own default (see @threlte/core's own renderer.svelte.js). */
	function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
		return new THREE.WebGLRenderer({ canvas, powerPreference: 'high-performance', antialias: false, alpha: true });
	}

	onMount(() => {
		if (!browser) return;
		isMounted = true;
	});
</script>

<svelte:head>
	<SvelteSeo
		title={m['seo.home.title']()}
		description={m['seo.home.description']()}
		keywords={m['seo.keywords']()}
		canonical={m.url()}
		openGraph={{
			title: m['seo.home.title'](),
			description: m['seo.home.description'](),
			url: m.url(),
			type: 'website',
			images: [
				{
					url: `${m.url()}${m['assets.seo_preview']()}`,
					width: 800,
					height: 600,
					alt: m['seo.og_image_alt']()
				}
			],
			site_name: m['seo.author']()
		}}
		twitter={{
			card: 'summary_large_image',
			site: m['seo.twitter_handle'](),
			title: m['seo.home.title'](),
			description: m['seo.home.description'](),
			image: `${m.url()}${m['assets.seo_preview']()}`
		}}
	/>
</svelte:head>

{#if isMounted}
	<div
		class="absolute inset-0"
		aria-hidden="true"
		oncontextmenu={(e) => { e.preventDefault(); toggleMode(); }}
		ontouchstart={(e) => { if (e.touches.length >= 2) { e.preventDefault(); toggleMode(); } }}
	>
		<Canvas {createRenderer}>
			<HomeEngineRoot {friendly} onReady={() => (loading = false)} />
		</Canvas>
	</div>

	{#if loading}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-[#D9CAD1] font-mono text-[10px] uppercase tracking-[0.3em] text-[#555]"
			transition:fade={{ duration: 400 }}
		>
			{m['common.loading_model']()}
		</div>
	{/if}

	<div
		class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 font-mono text-[9px] uppercase tracking-[0.3em] text-center pointer-events-none animate-[fadeIn_0.6s_ease-out,autoHide_4s_2s_ease-out_forwards] {mode.current === 'dark' ? 'text-white' : 'text-[#555]'}"
	>
		{m['common.dark_mode_hint']()}
	</div>
{/if}

<style>
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}
	@keyframes autoHide {
		0% { opacity: 1; }
		100% { opacity: 0; pointer-events: none; }
	}
</style>

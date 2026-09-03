<script lang="ts">
	import CanvasPortal from '$lib/three/canvas/portal.svelte';
	import Target from '$lib/three/canvas/target.svelte';
	import { Canvas } from '@threlte/core';
	import Sceens from '$lib/three/sceens/default.svelte';
	import { World } from '@threlte/rapier';
	import { browser } from '$app/environment';
	import { onMount, setContext } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import SvelteSeo from 'svelte-seo';
	import { toggleMode, setMode } from 'mode-watcher';

	let isMounted = $state(false);

	let helper = $state({ value: true });
	let friendly = $state({ value: false });
	let manualOverride = $state({ value: false });

	setContext('helper', helper);
	setContext('friendly', friendly);
	setContext('manual_override', manualOverride);

	onMount(() => {
		if (!browser) return;
		isMounted = true;
		// Dark/light mode (right-click / two-finger-tap to toggle, below) only really means anything on
		// this page — its skybox/lighting/postprocessing are the only things that read `mode.current`
		// (see skybox/default.svelte etc.) anywhere in the app. Reset to light on every entry so a
		// dark-mode toggle from an earlier visit doesn't carry over via mode-watcher's own persisted
		// state (the root layout's own setMode('light') only runs once, on the very first page load —
		// not on a later client-side navigation back to this route).
		setMode('light');
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
					url: `${m.url()}/images/preview_home.jpg`,
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
			image: `${m.url()}/images/preview_home.jpg`
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
		<Canvas>
			<Target />
		</Canvas>
		<CanvasPortal>
			<World>
				<Sceens />
			</World>
		</CanvasPortal>
	</div>

	<div
		class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 font-mono text-[9px] uppercase tracking-[0.3em] text-[#555] text-center pointer-events-none animate-[fadeIn_0.6s_ease-out,autoHide_4s_2s_ease-out_forwards]"
	>
		right click · two-finger tap → toggle dark mode
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

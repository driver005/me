<script lang="ts">
	import '../app.css';
	import { type Snippet } from 'svelte';
	import { pageTransition } from '$lib/stores/page-transition';
	import { fade } from 'svelte/transition';
	import { afterNavigate, beforeNavigate, onNavigate } from '$app/navigation';
	import { m } from '$lib/paraglide/messages';
	import { social_links } from '$lib/data';

	// No setMode('light') here any more — mode-watcher already persists dark/light to localStorage on
	// its own (confirmed by reading its own source: ThemeState/ModeState both write through a #persisted
	// $state backed by localStorage). This call used to force light on every full page load regardless
	// of what was saved, which is exactly what made it LOOK like dark mode never persisted — it was
	// being persisted correctly the whole time, then immediately overwritten back to light right after.

	let { children }: { children: Snippet } = $props();

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: m['footer.copyright'](),
		jobTitle: m['common.job_title'](),
		url: m['links.site_url'](),
		sameAs: Object.values(social_links)
	};

	// pageTransition existed as scaffolding only — the store, the overlay below, and this reset were all
	// already here, but nothing ever called .set(true), so the overlay never actually rendered on any
	// navigation. beforeNavigate is that missing trigger: fades a solid cover in right as navigation
	// starts (across every route in the site, not just the (bg) group — this layout wraps all of them),
	// afterNavigate fades it back out once the new page is in. Runs alongside onNavigate's own View
	// Transitions cross-fade below, not instead of it — that one handles the actual old/new DOM
	// crossfade where the browser supports it; this one covers the moment in between for the (bg)
	// group's very different-looking sub-pages (a WebGL canvas vs. imprint/privacy's plain content),
	// where the fade the browser API does isn't so dependent on the two DOM states' visuals lining up.
	beforeNavigate(() => {
		pageTransition.set(true);
	});

	afterNavigate(() => {
		pageTransition.set(false);
	});

	onNavigate((navigation) => {
		if (typeof document === 'undefined' || !document.startViewTransition) return;
		return new Promise<void>((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

{#if $pageTransition}
	<div
		transition:fade={{ duration: 200 }}
		class="pointer-events-none fixed inset-0 z-[200] bg-[#F3F2EE]"
	></div>
{/if}

<!-- {#if !isClonedSite} -->
<!-- 	<img -->
<!-- 		src="/images/mascot/mascot-idle.png" -->
<!-- 		alt="" -->
<!-- 		aria-hidden="true" -->
<!-- 		class="site-mascot fixed bottom-2 sm:bottom-4 right-2 sm:right-4 z-[150] w-14 sm:w-20 pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]" -->
<!-- 	/> -->
<!-- {/if} -->

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

{@render children()}

<style>
	:global(::view-transition-old(root)) {
		animation: fade-out 0.2s ease-in both;
	}
	:global(::view-transition-new(root)) {
		animation: fade-in 0.3s ease-out both;
	}
	@keyframes fade-out {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.site-mascot {
		animation: site-mascot-bob 2.8s ease-in-out infinite;
	}
	@keyframes site-mascot-bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-5px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.site-mascot {
			animation: none;
		}
	}
</style>

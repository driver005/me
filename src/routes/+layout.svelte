<script lang="ts">
	import '../app.css';
	import { type Snippet } from 'svelte';
	import PageTransitions from '$lib/design/module/page-transitions.svelte';
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

	// The native View Transitions crossfade that used to live here (its own onNavigate calling
	// document.startViewTransition) is gone — PageTransitions' opaque curtain now covers the screen
	// for the entire DOM-swap window on every navigation, so that crossfade was 100% hidden behind it
	// already, and having two independent onNavigate hooks both awaiting the same navigation.complete
	// (one to gate a View Transition callback, one to gate the curtain's reveal) is exactly the setup
	// that produced "TimeoutError: Transition was aborted because of timeout in DOM update" — an
	// abandoned/superseded navigation could leave the View Transition's update callback dangling on a
	// navigation.complete that never resolved, which the browser aborts on its own ~4s timeout as an
	// unhandled rejection. One system owning the swap is more robust than two racing each other.
</script>

<PageTransitions />

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

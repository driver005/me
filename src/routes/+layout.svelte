<script lang="ts">
	import '../app.css';
	import { type Snippet } from 'svelte';
	import PageTransitions from '$lib/design/module/page-transitions.svelte';
	import { m } from '$lib/paraglide/messages';
	import { social_links } from '$lib/data';

	let { children }: { children: Snippet } = $props();

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: m['footer.copyright'](),
		jobTitle: m['common.job_title'](),
		url: m['links.site_url'](),
		sameAs: Object.values(social_links)
	};
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

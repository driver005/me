<script lang="ts">
	import '../app.css';
	import { type Snippet } from 'svelte';
	import { setMode } from 'mode-watcher';
	import { pageTransition } from '$lib/stores/page-transition';
	import { fade } from 'svelte/transition';
	import { afterNavigate, onNavigate } from '$app/navigation';
	import { social_links } from '$lib/data';

	setMode('light');

	let { children }: { children: Snippet } = $props();

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: 'Adrian Fernández',
		jobTitle: 'Creative Developer',
		url: 'https://a42n.com',
		sameAs: Object.values(social_links)
	};

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

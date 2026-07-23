<script lang="ts">
	import { onMount } from 'svelte';
	import Lenis from 'lenis';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';

	let { children }: { children: import('svelte').Snippet } = $props();

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);

		const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const lenis = new Lenis({
			duration: prefersReduced ? 0 : 1.2,
			easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			smoothWheel: !prefersReduced
		});

		// Keep GSAP's ScrollTrigger in sync with Lenis's virtual scroll position
		lenis.on('scroll', ScrollTrigger.update);

		let rafId: number;
		const raf = (time: number) => {
			lenis.raf(time);
			rafId = requestAnimationFrame(raf);
		};
		rafId = requestAnimationFrame(raf);

		return () => {
			cancelAnimationFrame(rafId);
			lenis.destroy();
		};
	});
</script>

{@render children()}

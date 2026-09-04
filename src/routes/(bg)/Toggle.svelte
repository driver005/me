<!-- src/routes/(bg)/Toggle.svelte -->
<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import gsap from 'gsap';
	import { mode, setMode } from 'mode-watcher';
	import { m } from '$lib/paraglide/messages';
	import type { Scene } from '$lib/three/scene';
	import type { FluidSim } from '$lib/three/layers/fluid';
	import type { Texts } from '$lib/three/layers/texts';

	let { scene, fluid, texts }: { scene: Scene; fluid: FluidSim; texts: Texts } = $props();

	const isBackMode = $derived(mode.current === 'dark');

	let buttonRef: HTMLButtonElement | null = $state(null);
	let isToggleTransitioning = false;
	let timeline: gsap.core.Timeline | null = null;

	function syncRect(): void {
		if (!buttonRef) return;
		const rect = buttonRef.getBoundingClientRect();
		texts.syncButtonRect(rect);
		const x = (rect.left + rect.width / 2) / window.innerWidth;
		const y = 1 - (rect.top + rect.height / 2) / window.innerHeight;
		scene.uniforms.uToggleCoords.value.set(x, y);
	}

	function handleClick(): void {
		if (isToggleTransitioning) return;
		isToggleTransitioning = true;
		const next = !isBackMode;
		setMode(next ? 'dark' : 'light');
		fluid.setMode(next);
		syncRect();

		timeline?.kill();
		timeline = gsap.timeline();
		timeline.to(scene.uniforms.uMode, { value: next ? 0 : 1, duration: 0.8, ease: 'power3.out' }, 0);
		timeline.set(scene.uniforms.uDirection, { value: next ? 0 : 1 }, 0);
		timeline.fromTo(scene.uniforms.uWarp, { value: 0 }, { value: 1, duration: 0.05, ease: 'none' }, 0);
		timeline.to(scene.uniforms.uWarp, { value: 0, duration: 0.5, ease: 'none' }, 0.4);
		timeline.fromTo(
			scene.uniforms.uProgressFront,
			{ value: next ? 0 : 1 },
			{ value: next ? 1 : 0, duration: 3.2, ease: 'power4.out' },
			0
		);
		timeline.fromTo(
			scene.uniforms.uProgressBack,
			{ value: next ? 0 : 1 },
			{ value: next ? 1 : 0, duration: next ? 3.3 : 3, ease: 'power4.out' },
			0
		);
		timeline.add(() => {
			isToggleTransitioning = false;
		}, 1.2);
	}

	// Touch devices skip hover (no real hover phase).
	function handleMouseEnter(): void {
		if (scene.isTouch) return;
		if (isBackMode) {
			texts.handleOut(isBackMode);
		} else {
			texts.handleIn(isBackMode);
		}
	}

	function handleMouseLeave(): void {
		if (scene.isTouch) return;
		if (isBackMode) {
			texts.handleIn(isBackMode);
		} else {
			texts.handleOut(isBackMode);
		}
	}

	onMount(() => {
		syncRect();
		window.addEventListener('resize', syncRect);
	});

	onDestroy(() => {
		window.removeEventListener('resize', syncRect);
		timeline?.kill();
		scene.uniforms.uToggleProgress.value = 0;
	});
</script>

<button
	bind:this={buttonRef}
	type="button"
	onclick={handleClick}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	class="fixed right-6 bottom-6 z-10 h-11 w-11 rounded-full"
	aria-label={m['common.toggle_background_mode']()}
></button>

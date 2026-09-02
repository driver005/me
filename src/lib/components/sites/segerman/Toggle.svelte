<!-- src/lib/components/sites/segerman/Toggle.svelte -->
<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import gsap from 'gsap';
	import type { Scene } from '$lib/three/scenes/segerman-bg/scene';
	import type { FluidSim } from '$lib/three/scenes/segerman-bg/fluid';
	import type { Texts } from '$lib/three/scenes/segerman-bg/texts';

	// isBackMode is bindable, not owned locally — the route layout also drives it (forcing back mode on
	// every sub-route). A locally-owned copy here previously went stale on navigation: this button's
	// own state stayed `false` regardless of route, so one click on a sub-page (already in back mode
	// via the route effect) flipped the whole scene to front/white — with the sub-page's own DOM text
	// hardcoded white, that made it vanish into the white plate.
	let {
		scene,
		fluid,
		texts,
		isBackMode = $bindable(false)
	}: { scene: Scene; fluid: FluidSim; texts: Texts; isBackMode?: boolean } = $props();

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
		isBackMode = !isBackMode;
		fluid.setMode(isBackMode);
		syncRect();

		timeline?.kill();
		timeline = gsap.timeline();
		timeline.to(scene.uniforms.uMode, { value: isBackMode ? 0 : 1, duration: 0.8, ease: 'power3.out' }, 0);
		timeline.set(scene.uniforms.uDirection, { value: isBackMode ? 0 : 1 }, 0);
		timeline.fromTo(scene.uniforms.uWarp, { value: 0 }, { value: 1, duration: 0.05, ease: 'none' }, 0);
		timeline.to(scene.uniforms.uWarp, { value: 0, duration: 0.5, ease: 'none' }, 0.4);
		timeline.fromTo(
			scene.uniforms.uProgressFront,
			{ value: isBackMode ? 0 : 1 },
			{ value: isBackMode ? 1 : 0, duration: 3.2, ease: 'power4.out' },
			0
		);
		timeline.fromTo(
			scene.uniforms.uProgressBack,
			{ value: isBackMode ? 0 : 1 },
			{ value: isBackMode ? 1 : 0, duration: isBackMode ? 3.3 : 3, ease: 'power4.out' },
			0
		);
		timeline.add(() => {
			isToggleTransitioning = false;
		}, 1.2);
	}

	// The mouseenter/mouseleave dispatch is inverted by mode — see the spec's Section 5.
	// Skipped on touch (matches the original's `isTouch || (...)` guard around these listeners) — touch
	// devices don't have a real hover phase, and simulated mouseenter/mouseleave from taps would otherwise
	// fire the peek-preview animation right before (or instead of) the click transition.
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
	aria-label="Toggle background mode"
></button>

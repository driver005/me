<!-- src/lib/components/sites/segerman/Toggle.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import gsap from 'gsap';
	import type { Scene } from '$lib/three/scenes/segerman-bg/scene';
	import type { FluidSim } from '$lib/three/scenes/segerman-bg/fluid';

	let { scene, fluid }: { scene: Scene; fluid: FluidSim } = $props();

	let buttonRef: HTMLButtonElement | null = $state(null);
	let isBackMode = $state(false);
	let timeline: gsap.core.Timeline | null = null;

	function handleClick(): void {
		if (!buttonRef) return;

		const rect = buttonRef.getBoundingClientRect();
		const x = (rect.left + rect.width / 2) / window.innerWidth;
		const y = 1 - (rect.top + rect.height / 2) / window.innerHeight;
		scene.uniforms.uToggleCoords.value.set(x, y);

		isBackMode = !isBackMode;
		const targetMode = isBackMode ? 0 : 1;
		fluid.setMode(isBackMode);

		// uToggleProgress ramps toward the direction-appropriate endpoint (not always toward 1) so the
		// blob-reveal gate (uToggleProgress * uMode, in the output shader) is the same symmetric
		// pop-free bump in both directions and self-terminates at exactly 0 — no onComplete reset needed.
		scene.uniforms.uToggleProgress.value = isBackMode ? 0 : 1;

		timeline?.kill();
		timeline = gsap.timeline();
		timeline.to(scene.uniforms.uMode, { value: targetMode, duration: 1.2, ease: 'power2.inOut' }, 0);
		timeline.to(scene.uniforms.uToggleProgress, { value: isBackMode ? 1 : 0, duration: 1.2, ease: 'power2.inOut' }, 0);
	}

	onDestroy(() => {
		timeline?.kill();
		scene.uniforms.uToggleProgress.value = 0;
	});
</script>

<button
	bind:this={buttonRef}
	type="button"
	onclick={handleClick}
	class="fixed right-6 bottom-6 z-10 rounded-full bg-white/90 px-5 py-3 text-sm font-medium text-black shadow-lg transition hover:bg-white"
>
	{isBackMode ? 'Front' : 'Back'}
</button>

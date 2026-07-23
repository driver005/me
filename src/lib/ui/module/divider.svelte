<script lang="ts">
	import { browser } from '$app/environment';
	import { onScrollBounded } from '$lib/util/scroll-manager.svelte';

	let { from = '#0A0A0A', to = '#F3F2EE' }: { from?: string; to?: string } = $props();

	let ref: HTMLElement | null = $state(null);
	let clipPath = $state('inset(0 100% 0 0)');

	$effect(() => {
		if (!browser || !ref) return;
		const unsub = onScrollBounded(ref, (scrollY, vh, rect) => {
			const start = vh * 0.8;
			const end = vh * 0.2;
			const p = 1 - (rect.top - end) / (start - end);
			const clamped = Math.max(0, Math.min(1, p));
			clipPath = `inset(0 ${(1 - clamped) * 100}% 0 0)`;
		});
		return unsub;
	});
</script>

<div
	bind:this={ref}
	class="h-16 sm:h-24 w-full"
	style:clip-path={clipPath}
	style:background="linear-gradient(to right, {from}, {to})"
	style:transition="clip-path 0.15s var(--ease-out-expo)"
	style:will-change="clip-path"
	aria-hidden="true"
></div>

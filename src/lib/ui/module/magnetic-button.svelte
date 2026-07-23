<script lang="ts">
	import { Motion, useMotionValue, useSpring } from 'svelte-motion';
	import type { Snippet } from 'svelte';

	let { children, strength = 0.4 }: { children: Snippet; strength?: number } = $props();

	const prefersReduced = typeof window !== 'undefined'
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;

	let x = useMotionValue(0);
	let y = useMotionValue(0);
	let sx = useSpring(x, prefersReduced ? { stiffness: 9999, damping: 9999 } : { stiffness: 200, damping: 22 });
	let sy = useSpring(y, prefersReduced ? { stiffness: 9999, damping: 9999 } : { stiffness: 200, damping: 22 });
	let pressing = $state(false);

	function onMove(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		x.set((e.clientX - cx) * strength);
		y.set((e.clientY - cy) * strength);
	}

	function onLeave() {
		x.set(0);
		y.set(0);
		pressing = false;
	}

	function onDown() { pressing = true; }
	function onUp() { pressing = false; }
</script>

<Motion style={{ x: sx, y: sy, scale: pressing ? 0.95 : 1 }} let:motion>
	<div
		use:motion
		onmousemove={onMove}
		onmouseleave={onLeave}
		onmousedown={onDown}
		onmouseup={onUp}
		role="button"
		tabindex="-1"
		class="inline-block"
		style="transition: transform 150ms ease-out;"
	>
		{@render children()}
	</div>
</Motion>

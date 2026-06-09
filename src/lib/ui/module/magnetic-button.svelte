<script lang="ts">
	import { Motion, useMotionValue, useSpring } from 'svelte-motion';
	import type { Snippet } from 'svelte';

	let { children, strength = 0.4 }: { children: Snippet; strength?: number } = $props();

	let x = useMotionValue(0);
	let y = useMotionValue(0);
	let sx = useSpring(x, { stiffness: 200, damping: 22 });
	let sy = useSpring(y, { stiffness: 200, damping: 22 });

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
	}
</script>

<Motion style={{ x: sx, y: sy }} let:motion>
	<div use:motion onmousemove={onMove} onmouseleave={onLeave} role="button" tabindex="-1" class="inline-block">
		{@render children()}
	</div>
</Motion>

<script lang="ts">
	import { Motion } from 'svelte-motion';
	import { cva } from 'class-variance-authority';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		magnification = 60,
		distance = 140,
		direction = 'middle' as 'top' | 'middle' | 'bottom',
		class: className = '',
		children,
	}: {
		magnification?: number;
		distance?: number;
		direction?: 'top' | 'middle' | 'bottom';
		class?: string;
		children: Snippet<[number, number, number]>;
	} = $props();

	const dockVariants = cva(
		'w-max p-2 flex gap-2 rounded-2xl border supports-backdrop-blur:bg-white/10 supports-backdrop-blur:dark:bg-black/10 backdrop-blur-md'
	);

	let dockElement: HTMLDivElement;
	let mouseX = $state(Infinity);
	function handleMouseMove(e: MouseEvent) {
		mouseX = e.pageY;
	}

	function handleMouseLeave() {
		mouseX = Infinity;
	}

	const dockClass = $derived(cn(dockVariants({ className }), {
		'items-start': direction === 'top',
		'items-center': direction === 'middle',
		'items-end': direction === 'bottom'
	}));
</script>

<Motion let:motion>
	<div
		role="presentation"
		use:motion
		bind:this={dockElement}
		onmousemove={(e) => handleMouseMove(e)}
		onmouseleave={handleMouseLeave}
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.stopPropagation();
			}
		}}
		class={dockClass}
	>
		{@render children(mouseX, magnification, distance)}
	</div>
</Motion>

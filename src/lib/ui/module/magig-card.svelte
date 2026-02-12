<script lang="ts">
	import { Motion, useMotionValue, useMotionTemplate } from 'svelte-motion';
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	// Svelte 5 Props + Snippets
	let {
		children,
		extra, // Our second child
		gradientSize = 200,
		gradientColor = '#262626',
		gradientOpacity = 0.8,
		class: className = ''
	}: {
		children: Snippet;
		extra?: Snippet; // Optional second child
		gradientSize?: number;
		gradientColor?: string;
		gradientOpacity?: number;
		class?: string;
	} = $props();

	let gradSize = useMotionValue(gradientSize);
	let gradColor = useMotionValue(gradientColor);
	let mouseX = useMotionValue(-gradientSize);
	let mouseY = useMotionValue(-gradientSize);

	function handleMouseMove(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
		mouseX.set(e.clientX - rect.left);
		mouseY.set(e.clientY - rect.top);
	}

	function handleMouseLeave() {
		mouseX.set(-gradientSize);
		mouseY.set(-gradientSize);
	}

	onMount(() => {
		mouseX.set(-gradientSize);
		mouseY.set(-gradientSize);
	});

	let bg = useMotionTemplate`radial-gradient(${gradSize}px circle at ${mouseX}px ${mouseY}px, ${gradColor}, transparent 100%)`;
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- I have added py-4 in below code, you can customize the component as per needs -->
<div
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
	class={cn(
		'group relative flex size-full flex-col justify-center rounded-xl border bg-neutral-100 py-4 text-black transition-all duration-300 dark:bg-neutral-900 dark:text-white',
		className
	)}
>
	<div class="relative z-10">
		{@render children()}
	</div>
	{#if extra}
		{@render extra()}
	{/if}
	<Motion
		style={{
			background: bg,
			opacity: gradientOpacity
		}}
		let:motion
	>
		<div
			use:motion
			class="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
		></div>
	</Motion>
</div>

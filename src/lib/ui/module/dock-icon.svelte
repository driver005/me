<script lang="ts">
	import { cn } from '$lib/utils';
	import { Motion, useMotionValue, useSpring, useTransform } from 'svelte-motion';
	import type { Snippet } from 'svelte';

	let {
		magnification = 60,
		distance = 160,
		mouseX: mouseXVal = 0,
		onclick = () => {},
		class: className = '',
		children,
	}: {
		magnification?: number;
		distance?: number;
		mouseX?: number;
		onclick?: () => void;
		class?: string;
		children: Snippet;
	} = $props();

	// svelte-ignore state_referenced_locally — synced via $effect below
	let mint = useMotionValue(mouseXVal);
	$effect(() => { mint.set(mouseXVal); });

	let iconElement: HTMLDivElement;

	// svelte-ignore state_referenced_locally
	let distanceCalc = useTransform(mint, (val: number) => {
		const bounds = iconElement?.getBoundingClientRect() ?? { y: 0, width: 0 };
		return val - bounds.y - bounds.width / 2;
	});

	// svelte-ignore state_referenced_locally
	let widthSync = useTransform(distanceCalc, [-distance, 0, distance], [38, magnification, 38]);

	let width = useSpring(widthSync, {
		mass: 0.1,
		stiffness: 150,
		damping: 12
	});

	const iconClass = $derived(cn(
		'flex aspect-square cursor-pointer items-center justify-center rounded-full',
		className
	));
</script>

<Motion style={{ height: width }} let:motion>
	<div
		role="presentation"
		use:motion
		bind:this={iconElement}
		{onclick}
		onkeydown={(e) => e.key === 'Enter' && onclick()}
		class={iconClass}
	>
		{@render children()}
	</div>
</Motion>

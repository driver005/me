<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		index = 0,
		step = 0.06,
		duration = 0.5,
		class: className = '',
		children
	}: {
		index?: number;
		step?: number;
		duration?: number;
		class?: string;
		children: Snippet;
	} = $props();

	const delay = $derived(index * step);
</script>

<div
	class={cn('opacity-0', className)}
	style:animation="fadeUp {duration}s {delay}s var(--ease-out-expo) both"
>
	{@render children?.()}
</div>

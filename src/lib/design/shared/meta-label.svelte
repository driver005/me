<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	let {
		class: className = '',
		children,
		...restProps
	}: {
		class?: string;
		children: Snippet;
	} & HTMLAttributes<HTMLSpanElement> = $props();
</script>

<span
	class={cn('font-mono text-[10px] tracking-[0.25em] uppercase', className)}
	{...restProps}
>
	{@render children?.()}
</span>

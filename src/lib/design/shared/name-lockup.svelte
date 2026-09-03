<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	let {
		/** 0..100 clip-path fill progress. When omitted, only the outline layer renders. */
		fillPct = null,
		class: className = '',
		children,
		...restProps
	}: {
		fillPct?: number | null;
		class?: string;
		children: Snippet;
	} & HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
	class={cn(
		'font-display relative leading-[0.8] overflow-hidden tracking-tighter uppercase select-none',
		className
	)}
	{...restProps}
>
	<!-- Outline base (always visible) -->
	<span
		class="block"
		style="-webkit-text-stroke: 1.5px #F3F2EE; color: transparent;"
	>
		{@render children?.()}
	</span>

	<!-- Solid fill — clip-path wipes in from left -->
	{#if fillPct !== null}
		<span
			aria-hidden="true"
			class="absolute inset-0"
			style="display: block; color: #F3F2EE; -webkit-text-stroke: 0; clip-path: inset(0 {100 - fillPct}% 0 0); will-change: clip-path;"
		>
			{@render children?.()}
		</span>
	{/if}
</div>

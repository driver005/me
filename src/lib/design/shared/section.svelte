<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	let {
		id,
		testid,
		dark = false,
		class: className = '',
		children,
		...restProps
	}: {
		id?: string;
		testid?: string;
		dark?: boolean;
		class?: string;
		children: Snippet;
	} & HTMLAttributes<HTMLElement> = $props();
</script>

<section
	{id}
	data-testid={testid}
	class={cn(
		'border-b border-black',
		dark ? 'bg-[#0A0A0A] text-[#F3F2EE]' : 'bg-[#F3F2EE] text-[#0A0A0A]',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</section>

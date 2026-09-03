<script lang="ts">
	import { socialItems } from '$lib/data';
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		size = 18,
		class: className = '',
		...restProps
	}: {
		size?: number;
		class?: string;
	} & HTMLAttributes<HTMLDivElement> = $props();
</script>

<div class={cn('flex items-center gap-4', className)} {...restProps}>
	{#each socialItems as s}
		<a
			href={s.href}
			target="_blank"
			rel="noopener noreferrer"
			class="text-[#F3F2EE]/40 transition-colors duration-500 ease-[var(--ease-out-expo)] hover:text-[#FF3B00]"
			aria-label={s.label}
		>
			<s.icon {size} />
		</a>
	{/each}
</div>

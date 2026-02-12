<script lang="ts">
	import MagicCard from '$lib/ui/module/magig-card.svelte';
	import type { Snippet } from 'svelte';
	import Borderbeam from '$lib/ui/helper/borderbeam.svelte';

	let {
		name,
		children,
		icon,
		aligment = 'center',
		justify = 'center',
		color = '#043634',
		size = 1000,
		gradient = { active: true, size: 400, duration: 12, borderWidth: 2, delay: 0 }
	}: {
		name: string;
		aligment?: 'left' | 'center' | 'right';
		justify?: 'left' | 'center' | 'right';
		children?: Snippet;
		icon?: Snippet;
		color?: string;
		size?: number;
		gradient?: {
			active: boolean;
			size: number;
			duration: number;
			borderWidth: number;
			delay: number;
		};
	} = $props();
</script>

<MagicCard
	class={`group relative cursor-pointer flex-col items-${aligment} justify-${justify} 'hover:border-[#2effbd9e]' text-4xl whitespace-nowrap shadow-2xl transition-all duration-300`}
	gradientColor={color}
	gradientSize={size}
>
	{#snippet extra()}
		{#if gradient.active}
			<div class="group-hover:hidden">
				<Borderbeam
					size={gradient.size}
					duration={gradient.duration}
					borderWidth={gradient.borderWidth}
					delay={gradient.delay}
				/>
			</div>
		{/if}
	{/snippet}
	<div
		class="flex items-center justify-center gap-1.5 font-semibold transition-all duration-500 group-hover:text-[#2EFFBD]"
	>
		{#if icon}
			{@render icon()}
		{/if}
		{name}
	</div>
	{#if children}
		{@render children()}
	{/if}
</MagicCard>

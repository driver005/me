<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		text = '',
		items = [],
		separator = '×',
		separatorClass = '',
		separatorSizeClass = 'text-5xl sm:text-7xl',
		dark = false,
		accent = '#FF3B00',
		accentEvery = 4,
		mainColor = '',
		reverse = false,
		outline = false,
		duration = 20,
		repeat = 12,
		itemClass = '',
		sizeClass = 'text-5xl sm:text-7xl',
		gapClass = 'gap-6 sm:gap-10',
		border = true,
		spacing = true,
		pauseOnHover = false,
		class: className = '',
		...restProps
	}: {
		/** Big display words. When empty, `text` is split on " × " instead. */
		items?: { text: string; className?: string }[];
		/** Alternative to `items`: plain string split on " × ". */
		text?: string;
		separator?: string;
		separatorClass?: string;
		separatorSizeClass?: string;
		dark?: boolean;
		accent?: string;
		/** Every nth word is painted with `accent`. Set 0 to disable accent words. */
		accentEvery?: number;
		/** Overrides the computed main word color (dark ? #F3F2EE : #0A0A0A). */
		mainColor?: string;
		reverse?: boolean;
		/** Outline (text-stroke) variant for the words. */
		outline?: boolean;
		duration?: number;
		repeat?: number;
		itemClass?: string;
		sizeClass?: string;
		gapClass?: string;
		border?: boolean;
		spacing?: boolean;
		pauseOnHover?: boolean;
		class?: string;
	} & HTMLAttributes<HTMLDivElement> = $props();

	const main = $derived(mainColor || (dark ? '#F3F2EE' : '#0A0A0A'));
	const faded = $derived(dark ? 'rgba(243,242,238,0.2)' : 'rgba(10,10,10,0.2)');
	const words = $derived<{ text: string; className?: string }[]>(
		items.length > 0 ? items : text.split(' × ').map((t) => ({ text: t }))
	);
</script>

<div
	class={cn(
		'overflow-hidden',
		border && 'border-b border-black',
		spacing && 'py-4 sm:py-6',
		pauseOnHover && 'group/marquee',
		className
	)}
	{...restProps}
>
	<div
		class={cn(
			'flex gap-0 whitespace-nowrap will-change-transform',
			pauseOnHover && 'group-hover/marquee:[animation-play-state:paused]'
		)}
		style="animation: marquee {duration}s linear infinite {reverse ? 'reverse' : 'normal'}; --gap: 0rem;"
	>
		{#each Array(repeat) as _, i}
			{#each words as word, j}
				{@const idx = i * words.length + j}
				{@const isAccent = accentEvery > 0 && idx % accentEvery === 0}
				<span class={cn('flex items-center', gapClass)}>
					<span
						class={cn(
							'font-display mx-6 sm:mx-10 tracking-tighter whitespace-nowrap uppercase',
							sizeClass,
							itemClass,
							word.className
						)}
						style="color: {isAccent ? accent : outline ? 'transparent' : main};{outline
							? `-webkit-text-stroke: ${isAccent ? 'none' : `1.5px ${main}`};`
							: ''}"
					>{word.text}</span>
					<span class={cn(separatorSizeClass, separatorClass)} style="color: {faded}">{separator}</span>
				</span>
			{/each}
		{/each}
	</div>
</div>

<script lang="ts">
	import SmoothScroll from './smooth-scroll.svelte';
	import Cursor from './cursor.svelte';
	import ScrollProgress from './scroll-progress.svelte';
	import AppNav from './app-nav.svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		dark = false,
		class: className = '',
		children
	}: {
		dark?: boolean;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<SmoothScroll>
	<div
		class={cn(
			'grain min-h-screen backdrop-blur-sm',
			dark ? 'bg-[#0A0A0A]/85 text-[#F3F2EE]' : 'bg-[#F3F2EE]/85 text-[#0A0A0A]',
			className
		)}
	>
		<Cursor />
		<ScrollProgress />
		<AppNav scrollHide={true} />
		<a
			href="/"
			class={cn(
				'fixed top-16 left-4 z-50 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] no-underline transition-colors duration-500 ease-[var(--ease-out-expo)] sm:left-8',
				dark ? 'text-[#F3F2EE]/60 hover:text-[#FF3B00]' : 'text-[#0A0A0A]/60 hover:text-[#FF3B00]'
			)}
		>
			<ArrowLeft size={14} />
			{m['nav.back']()}
		</a>
		<main>
			{@render children?.()}
		</main>
	</div>
</SmoothScroll>

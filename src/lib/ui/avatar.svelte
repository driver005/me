<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AspectRatio } from '$lib/ui/cn/aspect-ratio';

	let {
		children,
		url,
		alt,
		email = 'yourname@example.com' // Added default email or pass it as a prop
	}: {
		children?: Snippet;
		url: string;
		alt: string;
		email?: string;
	} = $props();
</script>

<AspectRatio ratio={1 / 1} class="overflow-hidden rounded-xl">
	<a
		href="mailto:{email}"
		class="block h-full w-full cursor-pointer overflow-hidden"
		aria-label="Send an email to {alt}"
	>
		<img
			src={url}
			{alt}
			class="h-full w-full object-cover grayscale-20 transition-all duration-500 group-hover:grayscale-0 hover:scale-105"
		/>
	</a>

	{#if children}
		<div class="pointer-events-none absolute inset-0">
			{@render children()}
		</div>
	{/if}
</AspectRatio>

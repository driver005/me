<script lang="ts">
	import Button from '$lib/ui/cn/button/button.svelte';
	import { cn } from '$lib/utils';
	let className: any = '';
	export { className as class };
	export let name;
	export let background;
	export let background_props = {};
	export let Icon; // lucide Icon
	export let description;
	export let href;
	export let cta;
</script>

<div
	id={name}
	class={cn(
		'group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl',
		className
	)}
>
	<div>
		<svelte:component this={background} {...background_props} />
	</div>
	<div
		class="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10"
	>
		<svelte:component
			this={Icon}
			class="h-12 w-12 origin-left transform-gpu text-black transition-all duration-300 ease-in-out group-hover:scale-75"
		/>

		<h3 class="text-xl font-semibold text-black dark:text-neutral-300">
			{name}
		</h3>
		<p class="max-w-lg text-black">{description}</p>
	</div>

	<div
		class={cn(
			'pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100'
		)}
	>
		<Button variant="ghost" size="sm" class="pointer-events-auto">
			<a {href} class="flex items-center justify-center">
				{cta}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="ml-2 h-4 w-4"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg
				>
			</a>
		</Button>
	</div>
	<div
		class="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/3 group-hover:dark:bg-neutral-800/10"
	></div>
</div>

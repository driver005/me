<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	interface Props {
		collapseDelay?: number;
		data?: Array<{
			id: number;
			title: string;
			content: string;
			image?: string;
		}>;
	}

	let { collapseDelay = 5000, data = [] }: Props = $props();
	let currentIndex = $state(0);
	let isMounted = $state(false);

	onMount(() => {
		isMounted = true;
		const interval = setInterval(() => {
			currentIndex = (currentIndex + 1) % data.length;
		}, collapseDelay);
		return () => clearInterval(interval);
	});
</script>

<section class="py-4 font-mono sm:py-20 xl:py-25">
	<div class="container mx-auto max-w-4xl px-0 sm:px-4">
		{#if data.length > 0 && isMounted}
			<div class="relative flex items-center justify-center">
				<div
					class="absolute hidden h-100 w-full rounded-xl border-4 border-black bg-white p-2 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all duration-500 ease-in-out sm:flex md:h-125 md:w-[80%] lg:left-1/6 dark:bg-violet-400
				{currentIndex % 2 === 0 ? 'rotate-1' : '-rotate-1'} 
				lg:translate-x-[-20%] lg:rotate-0"
				>
					<div class="h-full w-full overflow-hidden rounded border-2 border-black">
						{#if data[currentIndex]?.image}
							<img src={data[currentIndex].image} alt="" class="h-full w-full" />
						{/if}
					</div>
				</div>

				<div
					class="z-10 w-[90%] rounded-xl border-4 border-black bg-yellow-400 p-6 shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] transition-all duration-500 ease-in-out md:w-[60%] lg:translate-x-[35%] lg:translate-y-12"
				>
					<div class="mb-4 h-2 w-full border-2 border-black bg-white">
						<div
							class="h-full bg-black transition-all ease-linear"
							style="width: 100%; transition-duration: {collapseDelay}ms"
						></div>
					</div>

					<div class="mb-2 inline-block bg-black px-2 py-1 text-xs font-black text-white uppercase">
						Step 0{currentIndex + 1}
					</div>

					<h2 class="text-3xl leading-none font-black uppercase md:text-5xl dark:text-black">
						{data[currentIndex].title}
					</h2>

					<p class="mx-4 mt-4 space-y-2 text-sm leading-tight font-bold md:text-lg dark:text-black">
						{@html data[currentIndex].content}
					</p>

					<div class="mt-8 flex flex-wrap gap-2">
						{#each data as _, i}
							<button
								onclick={() => (currentIndex = i)}
								class="rounded-xl border-2 border-black bg-violet-400 px-3 py-1 text-xs font-black transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
							{currentIndex === i ? 'text-white dark:text-black' : ''}"
							>
								0{i + 1}
							</button>
						{/each}
					</div>
				</div>
			</div>
		{:else}
			<div
				class="flex h-100 items-center justify-center rounded-xl border-4 border-dashed border-zinc-300"
			>
				<p class="font-black text-zinc-400">NO DATA LOADED</p>
			</div>
		{/if}
	</div>
</section>

<style>
	/* Make the text extra chunky for the neubrutalist vibe */
	h2 {
		-webkit-text-stroke: 1px black;
	}
</style>

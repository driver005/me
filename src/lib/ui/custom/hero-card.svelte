<script lang="ts">
	import { GridBeam } from '$lib/ui/module';
	import Avatar from './avatar.svelte';

	let {
		name,
		image,
		tagline
	}: {
		name: string;
		image: string;
		tagline: string;
	} = $props();
</script>

<div class="group relative p-4">
	<div
		class="absolute inset-0 translate-x-4 translate-y-4 rounded-xl border-4 border-black bg-lime-400 transition-transform group-hover:translate-x-2 group-hover:translate-y-2 dark:bg-indigo-500"
	></div>

	<div
		class="relative w-full overflow-hidden rounded-xl border-4 border-black bg-white p-1 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-colors duration-300 dark:bg-zinc-950"
	>
		<div
			class="pointer-events-none absolute inset-0 bg-[radial-gradient(#000_1.5px,transparent_1.5px)] bg-size-[12px_12px] opacity-[0.15] dark:bg-[radial-gradient(#fff_1.5px,transparent_1.5px)]"
		></div>

		<GridBeam class="relative flex items-start justify-start p-4">
			<div
				class="flex w-full flex-col items-start justify-between gap-8 md:flex-row md:items-center"
			>
				<div class="grid -rotate-1 gap-2">
					<div class="flex justify-center bg-black px-4 py-1 sm:justify-start dark:bg-indigo-500">
						<h1
							class="text-2xl font-black tracking-tighter text-white uppercase italic sm:text-6xl dark:text-black"
						>
							{name}
						</h1>
					</div>

					<p class="mt-4 max-w-lg text-xl leading-tight font-black text-black dark:text-white">
						<span class="bg-yellow-300 px-1 dark:bg-cyan-400 dark:text-black">{tagline}</span>
					</p>
				</div>

				<div class="relative hidden rotate-3 transition-transform hover:rotate-0 xl:block xl:w-1/8">
					<Avatar url={image} alt={name} />
				</div>
			</div>
		</GridBeam>
	</div>
</div>

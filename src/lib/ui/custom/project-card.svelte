<script lang="ts">
	import type { PROJECT } from '$lib/types/ui';

	let { project, number }: { project: PROJECT; number: number } = $props();
</script>

<div
	class="group relative isolate cursor-pointer overflow-hidden rounded-4xl border-4 border-black bg-background p-4 brutal-shadow transition-transform transition-shadow duration-500 ease-[var(--ease-out-expo)] lg:p-8"
	style:opacity="0"
	style:animation="fadeUp 0.5s {number * 0.08}s var(--ease-out-expo) forwards"
>
	<a
		href={project.href}
		target="_blank"
		rel="noopener noreferrer"
		class="h-full w-full cursor-pointer"
	>
		{#if project.iframe_url}
			<div class="absolute inset-0 isolate h-full w-full overflow-hidden">
				<div class="animate-infinite-scroll relative z-0 h-[500%] w-full">
					<iframe
						src={project.iframe_url}
						title={project.title}
						class="pointer-events-none h-full w-full border-none"
						scrolling="no"
					></iframe>
				</div>
				<div
					class="pointer-events-none absolute inset-0 z-10 border border-white/20 bg-white/20 backdrop-blur-[2px]"
				></div>
			</div>
		{:else}
			<div
				class="absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
			>
				<div class="animate-blob1 absolute -top-12 -left-12 h-80 w-80 rounded-full bg-indigo-400/20 mix-blend-multiply blur-[60px]"></div>
				<div class="animate-blob2 absolute inset-0 m-auto h-80 w-80 rounded-full bg-rose-400/10 mix-blend-multiply blur-[70px]"></div>
				<div class="animate-blob3 absolute -right-12 -bottom-12 h-80 w-80 rounded-full bg-amber-400/20 mix-blend-multiply blur-[60px]"></div>
				<div class="absolute inset-0 bg-white/10 backdrop-blur-xs"></div>
			</div>
		{/if}
		<span class="pointer-events-none absolute -right-2 -bottom-4 z-10 text-7xl font-black text-slate-100 italic transition-transform transition-colors duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-x-3.75 group-hover:-translate-y-2.5 group-hover:text-indigo-500/30 lg:text-8xl dark:group-hover:text-indigo-500/70">
			{number < 9 ? `0${number + 1}` : number + 1}
		</span>
		<div class="relative z-20 flex h-full min-h-35 flex-col lg:min-h-40">
			<div class="mb-auto flex flex-wrap gap-2">
				{#each project.tags as tag}
					<span class="inline-block rounded-lg border-2 border-slate-200 bg-white/80 px-2.5 py-1 text-[8px] font-black tracking-widest text-slate-400 uppercase transition-colors transition-shadow duration-500 ease-[var(--ease-out-expo)] group-hover:border-transparent group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-md lg:text-[9px]">
						{tag}
					</span>
				{/each}
			</div>
			<div class="mt-4">
				<h3 class="truncate text-xl leading-tight font-black text-black transition-colors duration-500 group-hover:text-indigo-950 lg:text-3xl dark:text-slate-300">
					{project.title}
				</h3>
				<p class="mt-1 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase transition-colors duration-500 group-hover:text-rose-600/80 lg:text-[11px] dark:text-slate-400">
					{project.description}
				</p>
			</div>
		</div>
	</a>
</div>

<style>
	.animate-infinite-scroll {
		animation: scroll-vertical 40s linear infinite;
	}
	@keyframes scroll-vertical {
		0% { transform: translateY(0); }
		50% { transform: translateY(-75%); }
		100% { transform: translateY(0); }
	}
	.group:hover .animate-infinite-scroll {
		animation-play-state: paused;
	}
</style>

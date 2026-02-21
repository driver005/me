<script lang="ts">
	import type { PROJECT } from '$lib/types/ui';

	let { project, number }: { project: PROJECT; number: number } = $props();
</script>

<div
	class="group relative isolate cursor-pointer overflow-hidden rounded-4xl border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-700 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none lg:p-8"
>
	<a href={project.href} class="h-full w-full cursor-pointer">
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
				class="absolute inset-0 z-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
			>
				<div
					class="animate-blob1 absolute -top-12 -left-12 h-80 w-80 rounded-full bg-indigo-400/20 mix-blend-multiply blur-[60px]"
				></div>
				<div
					class="animate-blob2 absolute inset-0 m-auto h-80 w-80 rounded-full bg-rose-400/10 mix-blend-multiply blur-[70px]"
				></div>
				<div
					class="animate-blob3 absolute -right-12 -bottom-12 h-80 w-80 rounded-full bg-amber-400/20 mix-blend-multiply blur-[60px]"
				></div>

				<div class="absolute inset-0 bg-white/10 backdrop-blur-xs"></div>
			</div>
		{/if}
		<span
			class="pointer-events-none absolute -right-2 -bottom-4 z-10 text-7xl font-black text-slate-100 italic transition-all duration-700 group-hover:-translate-x-3.75 group-hover:-translate-y-2.5 group-hover:text-indigo-500/10 lg:text-8xl"
		>
			{number < 9 ? `0${number + 1}` : number + 1}
		</span>

		<div class="relative z-20 flex h-full min-h-35 flex-col lg:min-h-40">
			<div class="mb-auto flex flex-wrap gap-2">
				{#each project.tags as tag}
					<span
						class="inline-block rounded-lg border-2 border-slate-200 bg-white/80 px-2.5 py-1 text-[8px] font-black tracking-widest text-slate-400 uppercase transition-all duration-500 group-hover:border-transparent group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-md lg:text-[9px]"
					>
						{tag}
					</span>
				{/each}
			</div>

			<div class="mt-4">
				<h3
					class="truncate text-xl leading-tight font-black text-black transition-all duration-500 group-hover:text-indigo-950 lg:text-3xl"
				>
					{project.title}
				</h3>
				<p
					class="mt-1 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase transition-colors duration-500 group-hover:text-rose-600/80 lg:text-[11px]"
				>
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
		0% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-75%); /* Moves the bottom of the iframe into view */
		}
		100% {
			transform: translateY(0);
		}
	}

	.group:hover .animate-infinite-scroll {
		animation-play-state: paused;
	}

	@keyframes blob1 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		33% {
			transform: translate(40px, -30px) scale(1.2);
		}
		66% {
			transform: translate(-20px, 20px) scale(0.9);
		}
	}
	@keyframes blob2 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(-40px, 50px) scale(1.3);
		}
	}
	@keyframes blob3 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		40% {
			transform: translate(-50px, -20px) scale(1.2);
		}
		80% {
			transform: translate(30px, 40px) scale(0.8);
		}
	}

	.animate-blob1 {
		animation: blob1 12s infinite ease-in-out;
	}
	.animate-blob2 {
		animation: blob2 16s infinite ease-in-out;
	}
	.animate-blob3 {
		animation: blob3 10s infinite ease-in-out;
	}
</style>

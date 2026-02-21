<script lang="ts">
	import type { SONG } from '$lib/types/ui';

	let { song, number }: { song: SONG; number: number } = $props();
</script>

<div
	class="group relative cursor-pointer overflow-hidden rounded-4xl border-4 border-black bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-700 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none lg:p-8"
>
	<a
		href={song.href}
		target="_blank"
		rel="noopener noreferrer"
		class="h-full w-full cursor-pointer"
	>
		{#if song.image}
			<div class="absolute top-0 left-0 aspect-4/3">
				<img
					src={song.image}
					placeholder="blur"
					alt={song.artist}
					class="m-0 w-full object-cover"
				/>
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
			class="pointer-events-none absolute -right-2 -bottom-4 z-10 text-7xl font-black text-slate-100 italic transition-all duration-700 group-hover:-translate-x-3.75 group-hover:-translate-y-2.5 group-hover:text-indigo-500/30 lg:text-8xl dark:group-hover:text-indigo-500/70"
		>
			{number < 9 ? `0${number + 1}` : number + 1}
		</span>

		<div class="relative z-20 flex h-full min-h-35 flex-col lg:min-h-40">
			<div class="mb-auto">
				<span
					class="inline-block rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1 text-[8px] font-black tracking-widest text-slate-400 uppercase transition-all duration-500 group-hover:border-transparent group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-md lg:text-[9px]"
				>
					{song.tag}
				</span>
			</div>

			<div class="mt-4">
				<h3
					class="truncate text-xl leading-tight font-black text-black transition-all duration-500 group-hover:text-indigo-950 lg:text-3xl dark:text-slate-300"
				>
					{song.title ? song.title : song.artist}
				</h3>
				{#if song.title}
					<p
						class="mt-1 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase transition-colors duration-500 group-hover:text-rose-600/80 lg:text-[11px] dark:text-slate-400"
					>
						{song.artist}
					</p>
				{/if}
			</div>
		</div>
	</a>
</div>

<style>
	/* More dynamic floating animations */
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

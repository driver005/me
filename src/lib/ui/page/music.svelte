<script lang="ts">
	import { Disc, Sparkles } from 'lucide-svelte';
	import { MusicCard, Spotify } from '$lib/ui/custom';
	import { music } from '$lib/data';
	import { m } from '$lib/paraglide/messages.js';
	import { shuffle_array } from '$lib/utils';

	shuffle_array(music);
</script>

<div class="flex h-full flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
	<aside
		class="flex w-full shrink-0 flex-col border-b border-slate-100 md:bg-background lg:w-80 lg:border-r lg:border-b-0 dark:border-none"
	>
		<div class="p-5 lg:p-8 lg:py-12">
			<div class="space-y-2 pb-12">
				<div class="flex items-center gap-3">
					<Disc size={24} class="animate-spin-slow text-black dark:text-white" />
					<h1 class="text-xl font-black tracking-tighter uppercase italic lg:text-2xl">
						{m['music.title']()}
					</h1>
				</div>
				<p
					class="hidden items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase lg:flex"
				>
					<Sparkles size={12} />
					{m['music.subtitle']()}
				</p>
			</div>
			<Spotify />
		</div>
	</aside>

	<main class="flex grow flex-col lg:overflow-hidden">
		<header class="shrink-0 p-6 lg:px-10 lg:pt-10 lg:pb-6">
			<div class="flex items-end justify-between">
				<div class="space-y-1">
					<h2
						class="text-3xl leading-none font-black tracking-tighter text-black lg:text-5xl dark:text-white"
					>
						{m['music.subtitle_list']()}
					</h2>
					<p class="text-xs font-medium text-slate-400 italic lg:text-sm">
						{m['music.description']()}
					</p>
				</div>
			</div>
		</header>
		<div class="scrollbar-hide grow overflow-y-auto p-6 pb-10 lg:px-10">
			<div
				class="grid grid-cols-1 gap-4 min-[1400px]:grid-cols-3 md:grid-cols-2 lg:grid-cols-1 lg:gap-6 xl:grid-cols-2"
			>
				{#each music as song, i}
					<MusicCard {song} number={i} />
				{/each}
			</div>
		</div>
	</main>
</div>

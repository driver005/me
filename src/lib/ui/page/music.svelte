<script lang="ts">
	import { MusicCard } from '$lib/ui/custom';
	import { music } from '$lib/data';
	import { m } from '$lib/paraglide/messages.js';
	import { shuffle_array } from '$lib/utils';
	shuffle_array(music);
</script>

<div class="flex h-full flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
	<main class="flex grow flex-col lg:overflow-hidden">
		<header class="shrink-0 p-6 lg:px-10 lg:pt-10 lg:pb-6">
			<div class="flex items-end justify-between">
				<div class="space-y-1">
					<h2
						class="text-3xl leading-none font-black tracking-tighter text-black lg:text-5xl dark:text-white"
					>
						{m['music.title']()}
					</h2>
					<p class="text-xs font-medium text-slate-400 italic lg:text-sm">
						{m['music.description']()}
					</p>
				</div>
			</div>
		</header>
		<div class="scrollbar-hide grow overflow-y-auto p-6 pb-10 lg:px-10">
			<div class="grid grid-cols-1 gap-4 min-[1400px]:grid-cols-3 md:grid-cols-2 lg:gap-6">
				{#each music as song, i}
					<MusicCard {song} number={i} />
				{/each}
			</div>
		</div>
	</main>
</div>

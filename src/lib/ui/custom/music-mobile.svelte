<script lang="ts">
	import * as Card from '$lib/ui/cn/card';
	import { m } from '$lib/paraglide/messages';
	import { music } from '$lib/data';

	import { getLocale, localizeHref } from '$lib/paraglide/runtime.js';

	let { manual_override = $bindable() }: { manual_override: boolean } = $props();
</script>

<a
	href={localizeHref('/music', { locale: getLocale() })}
	class="group block no-underline {!manual_override && 'md:hidden'}"
>
	<Card.Root
		class="relative overflow-hidden rounded-xl border-4 border-black bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none"
	>
		<div
			class="absolute top-0 left-6 flex h-6 w-24 items-center justify-center rounded-b-md bg-black"
		>
			<span
				class="flex items-center gap-1.5 text-[10px] font-black tracking-tighter text-white uppercase"
			>
				<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"></span>
				{m['music_mobile.top_lable']()}
			</span>
		</div>

		<Card.Header class="pt-10 pb-4">
			<div class="flex items-start justify-between">
				<div>
					<Card.Title
						class="text-4xl leading-none font-black tracking-tighter text-black uppercase italic dark:text-white"
					>
						{m['music_mobile.title']()}
					</Card.Title>
					<Card.Description
						class="mt-2 font-bold text-black uppercase italic opacity-70 dark:text-white"
					>
						{m['music_mobile.description']()}
					</Card.Description>
				</div>
			</div>
		</Card.Header>

		<Card.Content>
			<div
				class="flex flex-wrap items-center justify-around rounded-lg border-2 border-black bg-white/40 p-4 dark:bg-yellow-400 dark:text-black"
			>
				<div class="text-center">
					<p class="text-[10px] font-black uppercase opacity-60">
						{m['music_mobile.music']()}
					</p>
					<p class="text-2xl font-black">{music.length}</p>
				</div>

				<div class="text-center">
					<p class="text-[10px] font-black uppercase opacity-60">
						{m['music_mobile.update']()}
					</p>
					<p class="text-2xl font-black">
						{m['music_mobile.update_time']()}
					</p>
				</div>
			</div>
		</Card.Content>

		<Card.Footer class="flex items-center justify-between bg-black px-6 py-3 text-yellow-400">
			<span class="text-xs font-black tracking-[0.2em] uppercase">
				{m['music_mobile.vault']()}
			</span>
			<span class="text-2xl transition-transform group-hover:translate-x-2">→</span>
		</Card.Footer>

		<div class="absolute right-4 bottom-16 flex h-10 items-end gap-1 opacity-20">
			{#each [40, 70, 45, 90, 65, 80, 30, 50] as height}
				<div class="w-1.5 bg-black" style="height: {height}%"></div>
			{/each}
		</div>
	</Card.Root>
</a>

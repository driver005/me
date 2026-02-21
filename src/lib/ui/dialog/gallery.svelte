<script lang="ts">
	import * as Dialog from '$lib/ui/cn/dialog';
	import { ExternalLink, Landmark } from 'lucide-svelte';
	import { Button } from '$lib/ui/cn/button';
	import { m } from '$lib/paraglide/messages.js';
	import { media_assets } from '$lib/data';
	import { shuffle_array } from '$lib/utils';

	let open = $state(false);

	shuffle_array(media_assets);
</script>

<Dialog.Root bind:open>
	<Button
		variant="outline"
		onclick={() => (open = true)}
		class="h-12 rounded-xl border-4 border-black bg-blue-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-blue-400 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:bg-blue-400 dark:hover:bg-blue-400"
	>
		<Landmark />
	</Button>

	<Dialog.Content
		class="max-w-xl overflow-hidden rounded-xl border-4 border-black bg-background p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
	>
		<div class="px-6 pt-6 pb-3 dark:text-white">
			<Dialog.Title class="text-3xl font-black tracking-widest uppercase italic">
				{m['gallery.title']()}
			</Dialog.Title>
			<Dialog.Description class="font-bold dark:text-white/80">
				{m['gallery.description']()}
			</Dialog.Description>
		</div>

		<div class="flex max-h-[60vh] flex-col gap-3 overflow-y-auto p-6">
			{#each media_assets as item}
				<a
					href={item.url}
					target="_blank"
					rel="noopener noreferrer"
					class="group flex items-center justify-between rounded-xl border-4 border-black p-4 transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] {item.color}"
				>
					<div class="flex items-center gap-4 text-black">
						<div class="rounded-xl border-2 border-black bg-white p-2">
							<item.icon size={20} strokeWidth={3} />
						</div>
						<div>
							<h4 class="text-sm leading-tight font-black uppercase">{item.name}</h4>
							<span class="text-[10px] font-bold uppercase opacity-70">{item.category}</span>
						</div>
					</div>

					<div class="flex gap-2">
						<div
							class="rounded-full bg-black p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
						>
							<ExternalLink size={18} />
						</div>
					</div>
				</a>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>

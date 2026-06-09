<script lang="ts">
	import { getLocale, setLocale } from '$lib/paraglide/runtime.js';
	import * as Dialog from '$lib/ui/cn/dialog';
	import { m } from '$lib/paraglide/messages';
	import { Button } from '$lib/ui/cn/button';
	import { languages } from '$lib/data';

	let open = $state(false);

	function handleSwitch(langId: any) {
		setLocale(langId);
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		<Button
			variant="outline"
			onclick={() => (open = true)}
			class="h-12 rounded-xl border-4 border-black bg-yellow-400 brutal-shadow transition-all hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:bg-yellow-400 dark:text-black dark:hover:bg-yellow-400"
		>
			<span>{getLocale().toUpperCase()}</span>
			<span class="text-xs">▼</span>
		</Button>
	</Dialog.Trigger>

	<Dialog.Content
		class="rounded-xl border-4 border-black bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:max-w-106.25"
	>
		<Dialog.Header>
			<Dialog.Title class="text-2xl font-black tracking-tighter uppercase">
				{m['lang.title']().toUpperCase()}
			</Dialog.Title>
			<Dialog.Description class="font-bold text-black/60 dark:text-white/60">
				{m['lang.description']()}
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-4 py-4">
			{#each languages as lang}
				<button
					onclick={() => handleSwitch(lang.id)}
					class="
						flex items-center justify-between rounded-xl border-4 border-black p-2 font-black transition-all
						{getLocale() === lang.id
						? 'translate-x-1 translate-y-1 bg-yellow-400 shadow-none dark:text-black'
						: 'bg-background brutal-shadow hover:bg-pink-200 active:translate-x-1 active:translate-y-1 active:shadow-none dark:hover:bg-zinc-900'}
					"
				>
					<div class="flex items-center gap-3">
						<span class="text-2xl">{lang.flag}</span>
						<span class="uppercase">{lang.label}</span>
					</div>

					{#if getLocale() === lang.id}
						<span class="rounded-sm bg-black p-1 text-white max-[300px]:hidden">
							{m['lang.active']()}
						</span>
					{/if}
				</button>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>

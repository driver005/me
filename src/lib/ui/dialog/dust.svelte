<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import * as Dialog from '$lib/ui/cn/dialog';
	import { getContext } from 'svelte';

	let { open = $bindable(), open_count = $bindable() }: { open: boolean; open_count: number } =
		$props();

	const message = $derived(open_count > 5 ? m['dust.help']() : m['dust.insult']());

	const helper = getContext<{ value: boolean }>('helper');

	function handleClose() {
		open = false;
		helper.value = true;
	}

	function handleOpenChange(value: boolean) {
		open_count += 1;
		open = value;
		helper.value = true;
	}
</script>

<div class="fixed bottom-4 left-1/4">
	<Dialog.Root bind:open onOpenChange={handleOpenChange}>
		<Dialog.Content
			class="
      rounded-none border-4 border-black {open_count > 5 ? 'bg-red-400' : 'bg-background'}
      rounded-xl p-6
      shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-none focus:ring-0
    "
		>
			<Dialog.Header>
				<Dialog.Title
					class="mb-4 border-b-4 border-black pb-2 text-2xl font-black uppercase italic"
				>
					👀
				</Dialog.Title>
				<Dialog.Description
					class="text-xl leading-tight font-bold text-black opacity-100 dark:text-white"
				>
					{message}
				</Dialog.Description>
			</Dialog.Header>

			<div class="mt-6 flex flex-col items-start gap-2">
				{#if open_count > 5}
					<button
						onclick={handleClose}
						class="mt-4 w-full rounded-xl bg-black p-3 font-bold text-white brutal-shadow transition-all hover:bg-zinc-800 active:translate-x-1 active:translate-y-1 active:shadow-none"
					>
						{m['dust.button']()}
					</button>
				{/if}
			</div>
		</Dialog.Content>
	</Dialog.Root>
</div>

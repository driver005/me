<script lang="ts">
	import { Button } from '$lib/ui/cn/button';
	import * as Dialog from '$lib/ui/cn/dialog';
	import { m } from '$lib/paraglide/messages';
	import { AspectRatio } from '$lib/ui/cn/aspect-ratio';
	import { getContext } from 'svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	const helper = getContext<{ value: boolean }>('helper');

	function handleClose() {
		open = false;
		helper.value = true;
	}

	function handleOpenChange(value: boolean) {
		open = value;
		helper.value = true;
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content
		class="max-w-100 overflow-hidden border-[3px] border-black bg-background p-0 shadow-[8px_8px_0px_black]"
	>
		<Dialog.Header class="border-b-[3px] border-black bg-yellow-300 p-6">
			<Dialog.Title class="text-3xl font-black tracking-tighter uppercase italic dark:text-black">
				{m['slides.title']()}
			</Dialog.Title>
		</Dialog.Header>

		<div class="space-y-6 p-6">
			<p class="text-xl leading-tight font-bold">
				{m['slides.description']()}
			</p>

			<div class="relative flex justify-center py-4">
				<div
					class="absolute inset-0 m-auto h-32 w-32 rotate-3 border-2 border-black bg-pink-300"
				></div>
				<AspectRatio ratio={1 / 1}>
					<img
						src="https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fwww.dallasdesignerhandbags.com%2Fcdn%2Fshop%2Ffiles%2FDSC0102_clipped_rev_1_f74a190b-f831-4866-ad62-090b76d396fe_1024x1024.jpg%3Fv%3D1687027374&f=1&nofb=1&ipt=9ca4490fa3785f858ec2684968282ba46df5e9015bab35234582c93f5dff2f9e"
						alt="Gucci Slides"
						class="relative z-10 h-auto -rotate-2 border-[3px] border-black bg-white shadow-[6px_6px_0px_black]"
					/>
				</AspectRatio>
			</div>
		</div>

		<Dialog.Footer class="border-t-[3px] border-black bg-slate-50 p-6 dark:bg-zinc-950">
			<Button
				onclick={handleClose}
				class="w-full border-[3px] border-black bg-green-400 py-6 text-xl font-black shadow-[4px_4px_0px_black] transition-all hover:bg-green-500 active:translate-x-1 active:translate-y-1 active:shadow-none"
			>
				{m['slides.button']()}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

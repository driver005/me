<script lang="ts">
	import * as Dialog from '$lib/ui/cn/dialog';
	import { getContext, type Snippet } from 'svelte';

	let { open = $bindable(), children }: { open: boolean; children: Snippet } = $props();

	const helper = getContext<{ value: boolean }>('helper');

	function handleOpenChange(value: boolean) {
		open = value;
		helper.value = true;
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content
		onclick={() => handleOpenChange(false)}
		class="flex h-[95vh] w-full max-w-[98vw] flex-col overflow-hidden border-none bg-background p-0 py-3 shadow-2xl md:w-[90vw] md:max-w-none md:py-0 2xl:w-[70vw]"
		showCloseButton={false}
	>
		{@render children()}
	</Dialog.Content>
</Dialog.Root>

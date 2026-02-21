<script lang="ts">
	import * as Dialog from '$lib/ui/cn/dialog';
	import { Dock } from '$lib/ui/custom';
	import { getContext, type Snippet } from 'svelte';

	let {
		active = $bindable(),
		open = $bindable(),
		children
	}: { active: string; open: boolean; children: Snippet } = $props();

	const helper = getContext<{ value: boolean }>('helper');

	function handleOpenChange(value: boolean) {
		open = value;
		helper.value = true;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content
		onclick={() => handleOpenChange(false)}
		class="flex flex-row justify-center gap-0 border-none bg-transparent p-0 shadow-none md:min-h-[77.5vh] md:w-[90vw] md:max-w-none lg:w-[70vw] lg:max-w-none xl:w-[67.5vw]"
		showCloseButton={false}
	>
		<div class="hidden w-full items-center justify-center md:flex">
			<Dock bind:active />
		</div>
		<div
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.stopPropagation();
				}
			}}
			class="flex max-h-[95vh] flex-col overflow-hidden rounded-xl border-primary/20 bg-background px-4 pt-2 pb-2 backdrop-blur-xl md:w-[75vw] md:min-w-[75vw] lg:w-[60vw] lg:min-w-[60vw]"
		>
			{@render children()}
		</div>
	</Dialog.Content>
</Dialog.Root>

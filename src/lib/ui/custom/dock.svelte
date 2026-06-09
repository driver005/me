<script lang="ts">
	import * as Tooltip from '$lib/ui/cn/tooltip';
	import Separator from '$lib/ui/cn/separator/separator.svelte';
	import { Dock, DockIcon } from '$lib/ui/module';
	import type { CONTACTITEM, NAVITEM } from '$lib/types/ui';
	import { dock } from '$lib/data';

	let { active = $bindable() }: { active: string } = $props();

	function handleClickContact(item: CONTACTITEM) {
		window.open(item.href, '_blank');
		return;
	}
	function handleClickNavitem(item: NAVITEM) {
		active = item.value;
		return;
	}
</script>

<Tooltip.Provider delayDuration={200}>
	<Dock
		direction="middle"
		class="absolute z-1000 flex flex-col border-2 border-black p-2 md:p-4"
		let:mouseX
		let:distance
		let:magnification
	>
		{#each dock.navbar as item}
			<DockIcon
				class="my-2"
				onclick={() => handleClickNavitem(item)}
				{mouseX}
				{magnification}
				{distance}
			>
				<Tooltip.Root>
					<Tooltip.Trigger
						class={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-black ${item.color} p-3 brutal-shadow transition-all duration-700 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none dark:text-black`}
					>
						<item.icon size={22} strokeWidth={2} />
					</Tooltip.Trigger>

					<Tooltip.Content
						arrowClasses={item.color}
						sideOffset={8}
						side="left"
						class={`${item.color} relative z-1000 px-3 py-1 font-bold text-black`}
					>
						<p>{item.label}</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</DockIcon>
		{/each}

		<Separator orientation="horizontal" class="mx-2 rounded-xl bg-black p-0.5" />

		{#each dock.contact as item}
			<DockIcon
				class="my-2"
				onclick={() => handleClickContact(item)}
				{mouseX}
				{magnification}
				{distance}
			>
				<Tooltip.Root>
					<Tooltip.Trigger
						class={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-black ${item.color} p-3 brutal-shadow transition-all duration-700 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none dark:text-black`}
					>
						<item.icon size={22} strokeWidth={2} />
					</Tooltip.Trigger>

					<Tooltip.Content
						arrowClasses={item.color}
						sideOffset={8}
						side="left"
						class={`${item.color} relative z-1000 px-3 py-1 font-bold text-black`}
					>
						<p>{item.label}</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</DockIcon>
		{/each}
	</Dock>
</Tooltip.Provider>

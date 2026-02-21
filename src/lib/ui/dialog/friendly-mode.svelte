<script lang="ts">
	import * as Dialog from '$lib/ui/cn/dialog';
	import { TriangleAlert, ChevronRight, ShieldCheck, ShieldOff, RefreshCw } from 'lucide-svelte';
	import { Button } from '$lib/ui/cn/button';
	import { m } from '$lib/paraglide/messages';
	import { getContext } from 'svelte';

	let open = $state(false);
	let sliderValue = $state(0);

	const friendly = getContext<{ value: boolean }>('friendly');

	$effect(() => {
		if (!open) sliderValue = 0;
	});

	function handleRelease() {
		if (sliderValue >= 98) {
			friendly.value = !friendly.value;
			open = false;
		} else {
			sliderValue = 0;
		}
	}
</script>

<Dialog.Root bind:open>
	<Button
		variant="outline"
		onclick={() => (open = true)}
		class="h-12 rounded-xl border-4 border-black px-6 font-black uppercase transition-all 
    {friendly.value
			? 'bg-yellow-400 shadow-[4px_4px_0px_0px_#000] hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:bg-yellow-400 dark:hover:bg-yellow-400'
			: 'cursor-default bg-zinc-400 text-zinc-800 italic line-through decoration-black decoration-2 shadow-none hover:bg-zinc-400 dark:bg-zinc-400 dark:hover:bg-zinc-400'}"
	>
		{#if friendly.value}
			<ShieldCheck />
		{:else}
			<ShieldOff />
		{/if}
	</Button>

	<Dialog.Content
		class="max-w-md overflow-hidden rounded-xl border-4 border-black bg-background p-0 shadow-[8px_8px_0px_0px_#000]"
	>
		<div
			class="{friendly.value
				? 'bg-red-500'
				: 'bg-green-500'} border-b-4 border-black p-6 text-black"
		>
			<div class="flex items-center gap-3">
				{#if friendly.value}
					<TriangleAlert size={32} strokeWidth={3} />
				{:else}
					<RefreshCw size={32} strokeWidth={3} />
				{/if}
				<Dialog.Title class="text-3xl font-black tracking-tighter uppercase italic">
					{friendly.value ? m['friendlymode.title_rougue']() : m['friendlymode.title_friendly']()}
				</Dialog.Title>
			</div>
		</div>

		<div class="bg-background p-6">
			<Dialog.Description class="text-lg leading-tight font-bold text-foreground">
				{#if friendly.value}
					{m['friendlymode.enabled']()}
					<span class="underline decoration-red-500 decoration-4">{m['friendlymode.name']()}</span>.
				{:else}
					{m['friendlymode.disabled']()}
					<span class="underline decoration-green-500 decoration-4">{m['friendlymode.name']()}</span
					>.
				{/if}
			</Dialog.Description>

			<div
				class="relative mt-8 h-16 w-full overflow-hidden rounded-xl border-4 border-black bg-muted/40 p-1"
			>
				<div
					class="absolute inset-y-0 left-0 transition-colors {friendly.value
						? 'bg-red-400'
						: 'bg-green-400'}"
					style:width="{sliderValue}%"
				></div>

				<div
					class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center font-black tracking-widest text-black uppercase opacity-90"
				>
					{sliderValue > 95 ? m['friendlymode.release']() : m['friendlymode.slide']()}
				</div>

				<div class="pointer-events-none relative h-full w-[calc(100%-3.5rem)]">
					<div
						class="absolute top-0 z-10 flex aspect-square h-full items-center justify-center rounded-lg border-4 border-black bg-white shadow-[2px_2px_0px_0px_#000]"
						style:left="{sliderValue}%"
					>
						<ChevronRight class="text-black" strokeWidth={4} />
					</div>
				</div>

				<input
					type="range"
					min="0"
					max="100"
					bind:value={sliderValue}
					onmouseup={handleRelease}
					ontouchend={handleRelease}
					class="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
				/>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

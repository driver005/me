<script lang="ts">
	import { dock } from '$lib/data';
	import { Button } from '$lib/ui/cn/button';

	let { manual_override = $bindable() }: { manual_override: boolean } = $props();
</script>

<div class="flex w-full flex-wrap justify-center gap-6 px-6 py-8 {!manual_override && 'md:hidden'}">
	{#each dock.contact as item, i}
		<div
			class="relative transition-transform active:scale-90"
			style="transform: rotate({i % 2 === 0 ? -4 : 4}deg);"
		>
			<Button
				class="relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border-4 border-black text-black {item.color} 
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                transition-all duration-75 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:{item.color}"
			>
				<div
					class="pointer-events-none absolute inset-0 rounded-[15px] bg-gradient-to-b from-white/20 to-transparent"
				></div>

				<item.icon
					class="relative z-10 size-7 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]"
					strokeWidth={2.5}
				/>

				<div
					class="absolute -right-2 -bottom-2 rounded border-none bg-black px-1.5 py-0.5 text-[10px] font-black tracking-tighter text-white uppercase"
				>
					{item.label || 'Go'}
				</div>
			</Button>
		</div>
	{/each}
</div>

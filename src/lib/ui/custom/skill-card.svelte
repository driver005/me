<script lang="ts">
	export let img: string;
	export let name: string;
	export let border: string;
	export let color: string;
	export let body: string;
</script>

<figure
	class={`relative min-w-32 cursor-pointer overflow-hidden rounded-2xl border-4 p-4 ${border} ${color} shadow-[4px_4px_0px_0px_currentColor] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none`}
>
	<div class="flex flex-row items-center gap-2">
		<div
			class="overflow-hidden rounded-xl border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
		>
			<img width="32" height="32" alt="" src={img} />
		</div>
		<div class="flex flex-col">
			<!-- svelte-ignore a11y-structure -->
			<figcaption class="text-base font-medium dark:text-white">
				{name}
			</figcaption>
		</div>
	</div>
	<blockquote class="mt-2 text-sm text-gray-700 dark:text-white">{body}</blockquote>
</figure>

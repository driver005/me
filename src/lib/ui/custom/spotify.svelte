<script lang="ts">
	import { onMount } from 'svelte';
	let tracks: any = [];

	onMount(async () => {
		const res = await fetch('/api/recently-played');
		tracks = await res.json();
	});
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1 lg:gap-6">
	{#each tracks as track}
		<a
			href={track.songUrl}
			target="_blank"
			class="flex items-center gap-4 rounded-xl border-2 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
		>
			<img src={track.albumImageUrl} alt={track.title} class="h-12 w-12" />
			<div>
				<p class="font-bold">{track.title}</p>
				<p class="text-sm">{track.artist}</p>
			</div>
		</a>
	{:else}
		<p>Loading the vibes...</p>
	{/each}
</div>

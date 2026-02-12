<script lang="ts">
	import type { ARTIST } from '$lib/types/ui';

	let { artist }: { artist: ARTIST; classname: string } = $props();
</script>

<div class="group relative aspect-4/2 overflow-hidden rounded-2xl lg:aspect-4/3">
	<a href={artist.href} class="h-full w-full cursor-pointer">
		<img src={artist.image} placeholder="blur" alt="don corleone" class="m-0 w-full object-cover" />
		<!--  overlay  -->
		<div class="absolute inset-0 bg-linear-to-t from-black/95 via-black/70 to-black/10"></div>
		<!-- Add Any Content inside Slot -->
		<div
			class={'absolute inset-x-0 bottom-2 flex size-full flex-col justify-end px-4 py-0 pb-1 text-left text-gray-100 sm:px-4 sm:pb-3 md:pb-4 '}
		>
			<h3 class="mt-3 mb-1 text-lg font-bold tracking-tighter">
				{artist.name}
			</h3>
			<p class="text-sm leading-5">{artist.genre}</p>
		</div>
	</a>
</div>

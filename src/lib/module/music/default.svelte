<script lang="ts">
	import * as Dialog from '$lib/ui/cn/dialog';
	import { Disc, Sparkles } from 'lucide-svelte';
	import { MusicCard, Spotify } from '$lib/ui/custom';

	const favorites = {
		artists: [
			{
				name: 'The Weeknd',
				genre: 'R&B',
				color: 'bg-rose-50',
				text: 'text-rose-600',
				initials: 'TW',
				image: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp',
				href: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp'
			},
			{
				name: 'Lana Del Rey',
				genre: 'Alternative',
				color: 'bg-blue-50',
				text: 'text-blue-600',
				initials: 'LR',
				image: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp',
				href: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp'
			},
			{
				name: 'Post Malone',
				genre: 'Hip Hop',
				color: 'bg-orange-50',
				text: 'text-orange-600',
				initials: 'PM',
				image: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp',
				href: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp'
			}
		],
		songs: [
			{
				artist: 'Pop Smoke',
				tag: 'Artist',
				href: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp',
				image: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp'
			},
			{
				title: 'Summertime Sadness',
				artist: 'Lana Del Rey',
				tag: 'Song',
				href: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp'
			},
			{
				title: 'Circles',
				artist: 'Post Malone',
				tag: 'Playlist',
				href: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp'
			},
			{
				title: 'Starboy',
				artist: 'The Weeknd',
				tag: 'Heavy',
				href: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp'
			},
			{
				title: 'Save Your Tears',
				artist: 'The Weeknd',
				tag: 'Chill',
				href: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp'
			},
			{
				title: 'Rockstar',
				artist: 'Post Malone',
				tag: 'Legend',
				href: 'https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp'
			}
		]
	};
</script>

<Dialog.Root open>
	<Dialog.Content
		class="flex h-[95vh] w-full max-w-[98vw] flex-col overflow-hidden border-none bg-white p-0 py-3 shadow-2xl md:w-[90vw] md:max-w-none md:py-0 lg:h-[85vh] 2xl:w-[70vw]"
	>
		<div class="flex h-full flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
			<aside
				class="flex w-full shrink-0 flex-col border-b border-slate-100 md:bg-slate-50 lg:w-64 lg:border-r lg:border-b-0 xl:w-80"
			>
				<div class="p-5 lg:p-8 lg:py-12">
					<div class="space-y-2 pb-12">
						<div class="flex items-center gap-3">
							<Disc size={24} class="animate-spin-slow text-black" />
							<h1 class="text-xl font-black tracking-tighter uppercase italic lg:text-2xl">
								Music
							</h1>
						</div>

						<p
							class="hidden items-center gap-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase lg:flex"
						>
							<Sparkles size={12} /> Rescently Played
						</p>
					</div>
					<Spotify />
				</div>
			</aside>

			<main class="flex grow flex-col bg-white lg:overflow-hidden">
				<header class="shrink-0 bg-white p-6 lg:px-10 lg:pt-10 lg:pb-6">
					<div class="flex items-end justify-between">
						<div class="space-y-1">
							<h2 class="text-3xl leading-none font-black tracking-tighter text-black lg:text-5xl">
								All time favorites
							</h2>
							<p class="text-xs font-medium text-slate-400 italic lg:text-sm">
								artists, songs, albums, and playlists
							</p>
						</div>
					</div>
				</header>
				<div class="scrollbar-hide grow overflow-y-auto p-6 pb-10 lg:px-10">
					<div class="grid grid-cols-1 gap-4 min-[1400px]:grid-cols-3 md:grid-cols-2 lg:gap-6">
						{#each favorites.songs as song, i}
							<MusicCard {song} number={i} />
						{/each}
					</div>
				</div>
			</main>
		</div>
	</Dialog.Content>
</Dialog.Root>

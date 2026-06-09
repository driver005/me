<script lang="ts">
	import { Music } from '$lib/ui/page';
	import PageShell from '$lib/ui/module/page-shell.svelte';
	import { m } from '$lib/paraglide/messages';
	import SvelteSeo from 'svelte-seo';
</script>

<svelte:head>
	<SvelteSeo
		title={m['seo.music.title']()}
		description={m['seo.music.description']()}
		keywords={m['seo.keywords']()}
		canonical={`${m.url()}/music`}
		openGraph={{
			title: m['seo.music.title'](),
			description: m['seo.music.description'](),
			url: `${m.url()}/music`,
			type: 'website',
			images: [
				{
					url: `${m.url()}/images/prewiew_music.jpg`,
					width: 800,
					height: 600,
					alt: m['seo.og_image_alt']()
				}
			],
			site_name: m['seo.author']()
		}}
		twitter={{
			card: 'summary_large_image',
			site: m['seo.twitter_handle'](),
			title: m['seo.music.title'](),
			description: m['seo.music.description'](),
			image: `${m.url()}/images/prewiew_music.jpg`
		}}
	/>
</svelte:head>

<PageShell>
	<Music />
</PageShell>

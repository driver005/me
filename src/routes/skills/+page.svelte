<script lang="ts">
	import { Skills } from '$lib/ui/page';
	import { m } from '$lib/paraglide/messages';
	import SvelteSeo from 'svelte-seo';
</script>

<svelte:head>
	<SvelteSeo
		title={m['seo.skills.title']()}
		description={m['seo.skills.description']()}
		keywords={m['seo.keywords']()}
		canonical={`${m.url()}/skills`}
		openGraph={{
			title: m['seo.skills.title'](),
			description: m['seo.skills.description'](),
			url: `${m.url()}/skills`,
			type: 'website',
			images: [
				{
					url: `${m.url()}/images/preview_skills.jpg`,
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
			title: m['seo.skills.title'](),
			description: m['seo.skills.description'](),
			image: `${m.url()}/images/preview_skills.jpg`
		}}
	/>
</svelte:head>

<Skills />

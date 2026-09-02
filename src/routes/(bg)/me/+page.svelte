<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import SmoothScroll from '$lib/design/module/smooth-scroll.svelte';
	import Cursor from '$lib/design/module/cursor.svelte';
	import ScrollProgress from '$lib/design/module/scroll-progress.svelte';
	import AppNav from '$lib/design/module/app-nav.svelte';
	import AdrianOverlay from '$lib/design/module/adrian-overlay.svelte';
	import HorizontalScroll from '$lib/design/module/horizontal-scroll.svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import SvelteSeo from 'svelte-seo';
</script>

<svelte:head>
	<SvelteSeo
		title={m['seo.me.title']()}
		description={m['seo.me.description']()}
		canonical={`${m.url()}/me`}
		openGraph={{
			title: m['seo.me.title'](),
			description: m['seo.me.description'](),
			url: `${m.url()}/me`,
			type: 'website',
			images: [{ url: `${m.url()}/images/preview_home.jpg`, width: 800, height: 600, alt: m['seo.og_image_alt']() }],
			site_name: m['seo.author']()
		}}
		twitter={{
			card: 'summary_large_image',
			site: m['seo.twitter_handle'](),
			title: m['seo.me.title'](),
			description: m['seo.me.description'](),
			image: `${m.url()}/images/preview_home.jpg`
		}}
	/>
</svelte:head>

<SmoothScroll>
	<div class="grain min-h-screen bg-[#0A0A0A]/85 text-[#F3F2EE] backdrop-blur-sm">
		<Cursor />
		<ScrollProgress />
		<AppNav scrollHide={true} />
		<a href="/" class="fixed top-16 left-4 sm:left-8 z-50 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-[#F3F2EE]/60 hover:text-[#FF3B00] transition-colors duration-500 ease-[var(--ease-out-expo)] no-underline">
			<ArrowLeft size={14} />
			{m['nav.back']()}
		</a>
		<main>
			<HorizontalScroll />
		</main>
		<AdrianOverlay />
	</div>
</SmoothScroll>

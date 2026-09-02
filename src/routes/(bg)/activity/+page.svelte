<script lang="ts">
	import SectionPage from '$lib/design/module/section-page.svelte';
	import RecentActivity from '$lib/design/module/recent-activity.svelte';
	import SvelteSeo from 'svelte-seo';
	import { m } from '$lib/paraglide/messages';
</script>

<svelte:head>
	<SvelteSeo title={`${m['activity.meta']()} — ${m['seo.author']()}`} />
</svelte:head>

<SectionPage>
	<RecentActivity />
</SectionPage>

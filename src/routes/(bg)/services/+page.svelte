<script lang="ts">
	import SectionPage from '$lib/design/module/section-page.svelte';
	import Services from '$lib/design/module/services.svelte';
	import SvelteSeo from 'svelte-seo';
	import { m } from '$lib/paraglide/messages';
</script>

<svelte:head>
	<SvelteSeo title={`${m['nav.services']()} — ${m['seo.author']()}`} />
</svelte:head>

<SectionPage>
	<Services />
</SectionPage>

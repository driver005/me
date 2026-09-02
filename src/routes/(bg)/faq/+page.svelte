<script lang="ts">
	import SectionPage from '$lib/design/module/section-page.svelte';
	import Faq from '$lib/design/module/faq.svelte';
	import SvelteSeo from 'svelte-seo';
	import { m } from '$lib/paraglide/messages';
</script>

<svelte:head>
	<SvelteSeo title={`FAQ — ${m['seo.author']()}`} />
</svelte:head>

<SectionPage>
	<Faq />
</SectionPage>

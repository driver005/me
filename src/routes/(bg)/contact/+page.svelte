<script lang="ts">
	import SectionPage from '$lib/design/module/section-page.svelte';
	import Contact from '$lib/design/module/contact.svelte';
	import SvelteSeo from 'svelte-seo';
	import { m } from '$lib/paraglide/messages';
</script>

<svelte:head>
	<SvelteSeo title={`${m['nav.contact']()} — ${m['seo.author']()}`} />
</svelte:head>

<SectionPage>
	<Contact />
</SectionPage>

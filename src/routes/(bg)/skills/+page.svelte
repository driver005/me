<script lang="ts">
	import SectionPage from '$lib/design/module/section-page.svelte';
	import TagMarquee from '$lib/design/module/tag-marquee.svelte';
	import SkillsGraph from '$lib/design/module/skills-graph.svelte';
	import SvelteSeo from 'svelte-seo';
	import { m } from '$lib/paraglide/messages';
</script>

<svelte:head>
	<SvelteSeo title={`${m['skills.title']()} — ${m['seo.author']()}`} />
</svelte:head>

<SectionPage dark>
	<TagMarquee />
	<SkillsGraph />
</SectionPage>

<script lang="ts">
	import PageShell from '$lib/ui/module/page-shell.svelte';
	import MotionPathGallery from '$lib/ui/module/motion-path-gallery.svelte';
	import SvelteSeo from 'svelte-seo';
</script>

<svelte:head>
	<SvelteSeo
		title="Motion Path — Adrian Fernández"
		description="Thumbnails flowing along motion paths using GSAP MotionPath plugin."
	/>
</svelte:head>

<PageShell>
	<MotionPathGallery />
</PageShell>

<script lang="ts">
	import { getContext, onDestroy } from 'svelte';
	import SectionPage from '$lib/design/module/section-page.svelte';
	import SvelteSeo from 'svelte-seo';
	import { m } from '$lib/paraglide/messages';
	import { skills } from '$lib/data';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { SkillMoons } from '$lib/three/scenes/segerman-bg/skill-moons';
	import { SEGERMAN_BG_CONTEXT, type SegermanBgContext } from '$lib/three/scenes/segerman-bg/context';

	const bgContext = getContext<SegermanBgContext>(SEGERMAN_BG_CONTEXT);

	let scrollSection: HTMLElement | null = $state(null);

	$effect(() => {
		const ready = bgContext.getReady();
		const scene = bgContext.getScene();
		const gallery = bgContext.getGallery();
		if (!ready || !scene || !gallery || !scrollSection) return;

		gsap.registerPlugin(ScrollTrigger);

		const moons = new SkillMoons(
			scene,
			gallery.imageScene,
			skills.map((s) => ({ name: s.name })),
			{ x: 0, y: 0, z: -10 }
		);

		let progress = 0;
		const trigger = ScrollTrigger.create({
			trigger: scrollSection,
			start: 'top top',
			end: 'bottom bottom',
			onUpdate: (self) => {
				progress = self.progress;
			}
		});

		let rafId = requestAnimationFrame(function tick() {
			moons.update(progress);
			rafId = requestAnimationFrame(tick);
		});

		return () => {
			cancelAnimationFrame(rafId);
			trigger.kill();
			moons.dispose();
		};
	});
</script>

<svelte:head>
	<SvelteSeo title={`${m['skills.title']()} — ${m['seo.author']()}`} />
</svelte:head>

<!-- SectionPage's default backdrop (bg-.../85 + blur) is there for pages with text over it — this
     page has none, so override it to transparent or it just dims/blurs the WebGL scene (moons/Earth)
     it exists to show. -->
<SectionPage dark class="bg-transparent backdrop-blur-none">
	<!-- The skill icons render as WebGL "moons" orbiting Earth (see the $effect above, SkillMoons) —
	     this section exists just to give scroll something to drive: its own height (2x viewport) sets
	     the 0-1 range ScrollTrigger reports as the moons' orbit progress. -->
	<div bind:this={scrollSection} class="h-[200vh]"></div>
</SectionPage>

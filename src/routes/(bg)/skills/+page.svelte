<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
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
		const earthPlanet = bgContext.getEarthPlanet();
		if (!ready || !scene || !earthPlanet || !scrollSection) return;

		gsap.registerPlugin(ScrollTrigger);

		// Same shader-space position the route layout gives earthPlanet on this route (screenPosition
		// param — dead center, {x:0,y:0}) at its fixed z:-10 (see raymarch-planet.ts's commonUniforms).
		const moons = new SkillMoons(earthPlanet, { x: 0, y: 0, z: -10 }, skills.map((s) => ({ name: s.name, slug: s.slug })));

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

		// Click-to-navigate: this page owns its own moons (constructed/torn down per visit, unlike
		// the layout's own long-lived canvas click handler for ADRIAN/gallery), so it wires its own
		// listener directly rather than threading SkillMoons through the root layout. No real THREE
		// object to raycast against any more (the moons are raymarched, not mesh geometry) — see
		// SkillMoons.raycastHit()'s own comment on the analytic projection this uses instead.
		const domCanvas = scene.renderer.domElement;
		const onCanvasClick = () => {
			const aspect = window.innerWidth / window.innerHeight;
			const slug = moons.raycastHit(scene.pointer.nx, scene.pointer.ny, aspect);
			if (slug) goto(`/skills/${slug}`);
		};
		domCanvas.addEventListener('click', onCanvasClick);

		return () => {
			cancelAnimationFrame(rafId);
			trigger.kill();
			domCanvas.removeEventListener('click', onCanvasClick);
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
	<!-- The skill icons render as real raymarched "moons" orbiting Earth, driven by SkillMoons above
	     (see its own comment for why they're raymarched into the planet's own shader now, not mesh
	     geometry) — this section exists just to give scroll something to drive: its own height (2x
	     viewport) sets the 0-1 range ScrollTrigger reports as the moons' orbit progress. -->
	<div bind:this={scrollSection} class="h-[200vh]"></div>
</SectionPage>

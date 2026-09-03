<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import SvelteSeo from 'svelte-seo';
	import { m } from '$lib/paraglide/messages';
	import { skills } from '$lib/data';
	import { SkillMoons, type SkillMoonScreenPosition } from '$lib/three/scenes/segerman-bg/skill-moons';
	import { Scroll } from '$lib/three/scenes/segerman-bg/scroll';
	import { SEGERMAN_BG_CONTEXT, type SegermanBgContext } from '$lib/three/scenes/segerman-bg/context';

	const bgContext = getContext<SegermanBgContext>(SEGERMAN_BG_CONTEXT);

	let labels: SkillMoonScreenPosition[] = $state([]);

	$effect(() => {
		const ready = bgContext.getReady();
		const scene = bgContext.getScene();
		const earthPlanet = bgContext.getEarthPlanet();
		if (!ready || !scene || !earthPlanet) return;

		// Same shader-space position the route layout gives earthPlanet on this route (screenPosition
		// param — dead center, {x:0,y:0}) at its fixed z:-10 (see raymarch-planet.ts's commonUniforms).
		const moons = new SkillMoons(earthPlanet, { x: 0, y: 0, z: -10 }, skills.map((s) => ({ name: s.name, slug: s.slug })));

		// Scroll (see scroll.ts) — the same infinite, unbounded wheel/touch-driven accumulator the
		// Home gallery and Work's media carousel already use, rather than a scroll-through-a-tall-div
		// setup that necessarily caps out at the bottom of that div.
		const scroll = new Scroll(scene, moons);

		let rafId = requestAnimationFrame(function tick() {
			scroll.loop();
			labels = moons.getScreenPositions(window.innerWidth, window.innerHeight);
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
			scroll.dispose();
			domCanvas.removeEventListener('click', onCanvasClick);
			moons.dispose();
			labels = [];
		};
	});
</script>

<svelte:head>
	<SvelteSeo title={`${m['skills.title']()} — ${m['seo.author']()}`} />
</svelte:head>

<!-- Matches the rest of the (bg) group's own sub-pages (About, Work, /skills/[slug]) — a plain fixed
     DOM overlay over the shared WebGL background, not SectionPage's chrome (AppNav/Cursor/its own
     "← Back" style), which belongs to the separate design-system page family (contact/faq/services/
     etc.) this page doesn't otherwise resemble any more now that the moons are the whole page. -->
<div class="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 p-8 text-white">
	<a href="/" class="pointer-events-auto w-fit text-sm text-white/60 underline hover:text-white">← Back</a>
	<p class="max-w-md text-sm text-white/70">
		Every skill I use, orbiting as its own moon — scroll to spin the ring, click one to read more about it.
	</p>
</div>

{#each labels as label (label.slug)}
	{#if label.visible}
		<span
			class="pointer-events-none fixed z-10 -translate-x-1/2 -translate-y-1/2 font-mono text-xs tracking-wide text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
			style="left: {label.x}px; top: {label.y}px;"
		>
			{label.name}
		</span>
	{/if}
{/each}

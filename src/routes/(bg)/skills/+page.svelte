<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import SvelteSeo from 'svelte-seo';
	import { m } from '$lib/paraglide/messages';
	import { skills } from '$lib/data';
	import { SkillMoons, type SkillMoonScreenPosition } from '$lib/three/scenes/skill-moons';
	import { Scroll } from '$lib/three/scenes/scroll';
	import { SEGERMAN_BG_CONTEXT, type SegermanBgContext } from '$lib/three/scenes/context';
	import { hexToRgb, getHillBiasForSkill } from '$lib/three/scenes/raymarch-planet';

	const bgContext = getContext<SegermanBgContext>(SEGERMAN_BG_CONTEXT);

	let labels: SkillMoonScreenPosition[] = $state([]);

	// Below this width, the 3D orbiting-moons interface gives way to a plain scrollable HTML list —
	// there's no comfortable room for a moon ring's own labels/click targets at phone-to-tablet sizes,
	// and the underlying content (name + pro/contra) is exactly as readable as flat text anyway.
	// matchMedia + its own 'change' event, not a `window.resize` listener — see spiral-layout.ts's own
	// getSpiralCenterX() comment on why a raw resize listener is the less reliable choice here (this
	// page's fallback doesn't touch the WebGL scene at all below the breakpoint, so there's no
	// scene.uniforms.uRes to key off either, unlike that one).
	const SKILLS_TABLET_BREAKPOINT = 768;
	let isTablet = $state(false);

	$effect(() => {
		const mq = window.matchMedia(`(max-width: ${SKILLS_TABLET_BREAKPOINT - 1}px)`);
		isTablet = mq.matches;
		const onChange = (e: MediaQueryListEvent) => {
			isTablet = e.matches;
		};
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	// m's keys are compiled 1:1 from messages/en.json's "skill_detail.<slug>.<field>" paths — see
	// skills/[slug]/+page.svelte's own identical comment (this list uses the exact same pro/contra
	// copy that page shows one skill at a time).
	const messages = m as unknown as Record<string, () => string>;

	$effect(() => {
		if (isTablet) return; // the HTML list below owns this size range instead — see its own comment.
		const ready = bgContext.getReady();
		const scene = bgContext.getScene();
		const earthPlanet = bgContext.getEarthPlanet();
		if (!ready || !scene || !earthPlanet) return;

		// Same shader-space position the route layout gives earthPlanet on this route (screenPosition
		// param — dead center, {x:0,y:0}) at its fixed z:-10 (see raymarch-planet.ts's commonUniforms).
		const moons = new SkillMoons(
			earthPlanet,
			{ x: 0, y: 0, z: -10 },
			skills.map((s) => ({ name: s.name, slug: s.slug, color: hexToRgb(s.primaryColor), hillBias: getHillBiasForSkill(s) }))
		);

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
		// Defense-in-depth against a stale listener outliving this page: the canvas is a single shared,
		// persistent element across every (bg) route (see this page's own header comment) — if a route
		// transition's cleanup (below) ever runs a beat later than expected (e.g. a View Transition in
		// flight — see the root layout's own onNavigate), this listener could still be attached when a
		// click actually happens on a DIFFERENT, already-navigated-to page, hit-testing this page's own
		// (possibly stale) `moons`/`earthPlanet` closures against a click that was never meant for
		// /skills at all. A plain local flag, not a route/pathname comparison — paraglide's URL
		// localization (see runtime.js's own urlPatterns) prefixes every non-default locale's pathname
		// (e.g. /de/skills), so comparing against a hardcoded '/skills' silently broke every click for
		// any such locale — this flag has no locale to get wrong.
		let disposed = false;
		const onCanvasClick = () => {
			if (disposed) return;
			const aspect = window.innerWidth / window.innerHeight;
			const slug = moons.raycastHit(scene.pointer.nx, scene.pointer.ny, aspect);
			if (slug) {
				goto(`/skills/${slug}`);
				return;
			}
			// A moon in front of Earth from the camera's own viewpoint already won above — falling
			// through here means the click landed on Earth itself (or empty space). Same generic
			// RaymarchPlanet.raycastHit() +layout.svelte's own handleCanvasClick uses for every other
			// earthPlanet route — see its own comment on why /skills handles this itself instead of
			// letting that shared listener do it (avoiding a race between the two on the same click).
			if (earthPlanet.raycastHit(scene.pointer.nx, scene.pointer.ny, aspect)) {
				goto('/about');
			}
		};
		domCanvas.addEventListener('click', onCanvasClick);

		return () => {
			disposed = true;
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

{#if isTablet}
	<!-- Plain scrollable HTML — see isTablet's own comment. Still sits over the shared WebGL background
	     like every other DOM-overlay page in this group (About, Gallery, Works), just with a near-opaque
	     backdrop of its own so a long list of text stays legible over whatever the 3D scene is doing
	     underneath. -->
	<div class="fixed inset-0 z-30 overflow-y-auto bg-[#00031f]/95 text-white">
		<div class="mx-auto flex max-w-2xl flex-col gap-6 p-8">
			<a href="/" class="w-fit text-sm text-white/60 underline hover:text-white">← Back</a>
			<h1 class="text-3xl font-black tracking-tight">{m['skills.title']()}</h1>
			<ul class="flex flex-col gap-4">
				{#each skills as skill (skill.slug)}
					<li>
						<a
							href="/skills/{skill.slug}"
							class="block rounded-lg border border-white/10 p-4 transition-colors hover:border-white/30"
						>
							<h2 class="text-lg font-bold" style="color: {skill.primaryColor}">{skill.name}</h2>
							<p class="mt-1 text-sm text-white/70">{messages[`skill_detail.${skill.slug}.description`]()}</p>
							<div class="mt-3 grid gap-2 sm:grid-cols-2">
								<div class="rounded border border-emerald-400/30 bg-emerald-400/10 p-2">
									<p class="text-[10px] font-bold tracking-widest text-emerald-300 uppercase">Pro</p>
									<p class="mt-0.5 text-xs text-white/85">{messages[`skill_detail.${skill.slug}.pro`]()}</p>
								</div>
								<div class="rounded border border-red-400/30 bg-red-400/10 p-2">
									<p class="text-[10px] font-bold tracking-widest text-red-300 uppercase">Contra</p>
									<p class="mt-0.5 text-xs text-white/85">{messages[`skill_detail.${skill.slug}.contra`]()}</p>
								</div>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</div>
{:else}
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
{/if}

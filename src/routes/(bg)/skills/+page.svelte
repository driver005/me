<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import SvelteSeo from 'svelte-seo';
	import { m } from '$lib/paraglide/messages';
	import { skills } from '$lib/data';
	import { SkillMoons, type SkillMoonScreenPosition } from '$lib/three/planet/skill-moons';
	import { Scroll } from '$lib/three/shared/scroll';
	import { BG_ENGINE_CONTEXT, type BgEngineContext } from '$lib/three/shared/context';
	import { hexToRgb, getHillBiasForSkill } from '$lib/three/planet/raymarch-planet';

	const bgContext = getContext<BgEngineContext>(BG_ENGINE_CONTEXT);

	let labels: SkillMoonScreenPosition[] = $state([]);

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

	const messages = m as unknown as Record<string, () => string>;

	$effect(() => {
		if (isTablet) return; // the HTML list below owns this size range instead — see its own comment.
		const ready = bgContext.getReady();
		const scene = bgContext.getScene();
		const earthPlanet = bgContext.getEarthPlanet();
		if (!ready || !scene || !earthPlanet) return;

		const moons = new SkillMoons(
			earthPlanet,
			{ x: 0, y: 0, z: -10 },
			skills.map((s) => ({ name: s.name, slug: s.slug, color: hexToRgb(s.primaryColor), hillBias: getHillBiasForSkill(s) }))
		);

		const scroll = new Scroll(scene, moons);

		let rafId = requestAnimationFrame(function tick() {
			scroll.loop();
			moons.loop();
			labels = moons.getScreenPositions(window.innerWidth, window.innerHeight);
			rafId = requestAnimationFrame(tick);
		});

		// Click-to-navigate — moons + earthPlanet click handling.
		const domCanvas = scene.renderer.domElement;
		let disposed = false;
		const onCanvasClick = () => {
			if (disposed) return;
			const aspect = window.innerWidth / window.innerHeight;
			const slug = moons.raycastHit(scene.pointer.nx, scene.pointer.ny, aspect);
			if (slug) {
				goto(`/skills/${slug}`);
				return;
			}
			// Fall through: click on Earth itself -> /about.
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
	<!-- Scrollable HTML list for tablet/mobile. -->
	<div class="fixed inset-0 z-30 overflow-y-auto bg-[#00031f]/95 text-white">
		<div class="mx-auto flex max-w-2xl flex-col gap-6 p-8">
			<a href="/" class="w-fit text-sm text-white/60 underline hover:text-white">{m['common.back_link']()}</a>
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
									<p class="text-[10px] font-bold tracking-widest text-emerald-300 uppercase">{m['skills.pro_label']()}</p>
									<p class="mt-0.5 text-xs text-white/85">{messages[`skill_detail.${skill.slug}.pro`]()}</p>
								</div>
								<div class="rounded border border-red-400/30 bg-red-400/10 p-2">
									<p class="text-[10px] font-bold tracking-widest text-red-300 uppercase">{m['skills.contra_label']()}</p>
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
	<!-- Fixed DOM overlay over shared WebGL background. -->
	<div class="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 p-8 text-white">
		<a href="/" class="pointer-events-auto w-fit text-sm text-white/60 underline hover:text-white">{m['common.back_link']()}</a>
		<p class="max-w-md text-sm text-white/70">
			{m['skills.moon_hint']()}
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

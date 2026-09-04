<!-- Shared WebGL background for the site's real Home ('/'), Work detail ('/works/[slug]') and About ('/about') pages. -->
<script lang="ts">
	import { onDestroy, onMount, setContext, type Snippet } from 'svelte';
	import { fade } from 'svelte/transition';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Canvas } from '@threlte/core';
	import * as THREE from 'three';
	import gsap from 'gsap';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, setLocale } from '$lib/paraglide/runtime.js';
	import { languages } from '$lib/data';
	import EngineRoot from '$lib/three/EngineRoot.svelte';
	import type { Scene } from '$lib/three/scene';
	import { Stars } from '$lib/three/layers/stars';
	import { Fog } from '$lib/three/layers/fog';
	import { FluidSim } from '$lib/three/layers/fluid';
	import { Planet } from '$lib/three/planet/planet';
	import { RaymarchPlanet, PLANET_LOOKS, hexToRgb, getHillBiasForSkill } from '$lib/three/planet/raymarch-planet';
	import { skills } from '$lib/data';
	import { PlanetSwitcher } from '$lib/three/planet/planet-switcher';
	import { Front } from '$lib/three/layers/front';
	import { Compositor, PAGE_LOOK } from '$lib/three/compositor';
	import { mode } from 'mode-watcher';
	import type { PlanetPageId } from '$lib/three/planet/planet';
	import { Gallery } from '$lib/three/gallery/gallery';
	import { WORK_PROJECTS } from '$lib/three/shared/work-content';
	import { SPIRAL_MOBILE_BREAKPOINT } from '$lib/three/spiral/spiral-layout';
	import { Scroll } from '$lib/three/shared/scroll';
	import { Images } from '$lib/three/layers/images';
	import { Video } from '$lib/three/layers/video';
	import { Texts } from '$lib/three/layers/texts';
	import Toggle from './Toggle.svelte';
	import CallScreen from '$lib/design/module/call-screen.svelte';
	import { BG_ENGINE_CONTEXT, type BgEngineContext } from '$lib/three/shared/context';

	let { children }: { children: Snippet } = $props();

	setContext<BgEngineContext>(BG_ENGINE_CONTEXT, {
		getScene: () => scene,
		getGallery: () => gallery,
		getReady: () => webglReady,
		getEarthPlanet: () => earthPlanet,
		getFluidTexture: () => fluid?.texture ?? null,
		getIsBackMode: () => mode.current === 'dark'
	});

	const MIN_LOADER_DURATION = 1200;
	const FOG_COLOR_DEFAULT = '#20447e';

	const isHomeRoute = $derived(page.url.pathname === '/');
	const isAboutRoute = $derived(page.url.pathname === '/about');
	const isSkillsRoute = $derived(page.url.pathname.startsWith('/skills'));
	const isLegalRoute = $derived(page.url.pathname === '/imprint' || page.url.pathname === '/privacy');

	const navLinkClass = $derived(
		isLegalRoute
			? 'text-black/70 hover:text-black'
			: mode.current === 'dark'
				? 'text-white/70 hover:text-white'
				: 'text-black/70 hover:text-black'
	);

	let webglSupported = $state(true);
	let webglFailed = $state(false);
	let webglReady = $state(false);
	let loaderVisible = $state(true);
	let loaderPercent = $state(0);
	let scene: Scene | null = null;
	let stars: Stars | null = null;
	let fog: Fog | null = null;
	let fluid: FluidSim | null = null;
	let planet: Planet | null = null;
	let planetSwitcher: PlanetSwitcher | null = null;
	let earthPlanet: RaymarchPlanet | null = null;
	let aboutEarthPlanet: RaymarchPlanet | null = null;
	let marsPlanet: RaymarchPlanet | null = null;
	let skillPlanet: RaymarchPlanet | null = null;
	let front: Front | null = null;
	let compositor: Compositor | null = null;
	let gallery: Gallery | null = null;
	let scroll: Scroll | null = null;
	let images: Images | null = null;
	let video: Video | null = null;
	let texts: Texts | null = null;
	let noiseTexture: THREE.Texture | null = null;
	let planetMapTexture: THREE.Texture | null = null;
	let crackedTexture: THREE.Texture | null = null;
	let crackedNormalTexture: THREE.Texture | null = null;
	let loaderStart = 0;
	let pointerCleanup: (() => void) | null = null;

	function trackLoadProgress(assetUrls: { textures: string[]; videos: string[] }): void {
		const total = assetUrls.textures.length + assetUrls.videos.length;
		if (total === 0) {
			loaderPercent = 100;
			return;
		}
		let loaded = 0;
		const bump = () => {
			loaded += 1;
			loaderPercent = Math.round((loaded / total) * 100);
		};
		for (const url of assetUrls.textures) {
			new THREE.TextureLoader().load(url, bump, undefined, bump);
		}
		for (const url of assetUrls.videos) {
			const el = document.createElement('video');
			el.muted = true;
			el.preload = 'auto';
			const done = () => {
				el.removeEventListener('loadeddata', done);
				el.removeEventListener('error', done);
				bump();
			};
			el.addEventListener('loadeddata', done);
			el.addEventListener('error', done);
			el.src = url;
			el.load();
		}
	}

	$effect(() => {
		if (loaderPercent < 100) return;
		const remaining = Math.max(0, MIN_LOADER_DURATION - (performance.now() - loaderStart));
		const timeout = setTimeout(() => {
			loaderVisible = false;
		}, remaining);
		return () => clearTimeout(timeout);
	});

	// Front/back crossfade — initial sync for dark mode on hard load.
	let crossfadeInitialized = false;
	$effect(() => {
		if (crossfadeInitialized || !webglReady || !scene) return;
		crossfadeInitialized = true;
		const isDark = mode.current === 'dark';
		scene.uniforms.uMode.value = isDark ? 0 : 1;
		scene.uniforms.uProgressFront.value = isDark ? 1 : 0;
		scene.uniforms.uProgressBack.value = isDark ? 1 : 0;
	});

	$effect(() => {
		if (!webglReady || !scene) return;
		if (isSkillsRoute) {
			gsap.killTweensOf(scene.uniforms.uMode, 'value');
			gsap.killTweensOf(scene.uniforms.uProgressFront, 'value');
			gsap.killTweensOf(scene.uniforms.uProgressBack, 'value');
			gsap.killTweensOf(scene.uniforms.uDirection, 'value');
			gsap.killTweensOf(scene.uniforms.uWarp, 'value');
			scene.uniforms.uMode.value = 0;
			scene.uniforms.uProgressFront.value = 1;
			scene.uniforms.uProgressBack.value = 1;
		} else {
			const isDark = mode.current === 'dark';
			scene.uniforms.uMode.value = isDark ? 0 : 1;
			scene.uniforms.uProgressFront.value = isDark ? 1 : 0;
			scene.uniforms.uProgressBack.value = isDark ? 1 : 0;
		}
	});

	$effect(() => {
		const pathname = page.url.pathname;
		const isHome = isHomeRoute;
		if (
			!webglReady ||
			!scene ||
			!gallery ||
			!planet ||
			!compositor ||
			!fog ||
			!planetSwitcher ||
			!earthPlanet ||
			!aboutEarthPlanet ||
			!marsPlanet ||
			!skillPlanet
		)
			return;
		// Hide home cards/titles — Home now uses Spiral overlay.
		gallery.setHomeVisible(false);

		const workSlug = pathname.startsWith('/works/') ? pathname.slice('/works/'.length) : null;
		const pageId: PlanetPageId = isHome ? 'home' : workSlug ? 'work' : pathname === '/skills' ? 'skills' : 'about';
		const project = workSlug ? WORK_PROJECTS[workSlug] : undefined;

		// Planet selection per route.
		const skillSlug = pathname.startsWith('/skills/') ? pathname.slice('/skills/'.length) : null;
		const skill = skillSlug ? skills.find((s) => s.slug === skillSlug) : undefined;
		if (pageId === 'work') {
			planetSwitcher.setActive(planet);
			planet.animate(pageId, project ? { light: project.lightColor, dark: project.darkColor } : undefined);
		} else if (isHome || pathname === '/skills') {
			planetSwitcher.setActive(earthPlanet);
		} else if (pathname === '/about') {
			planetSwitcher.setActive(aboutEarthPlanet);
		} else if (skill) {
			skillPlanet.setTintColor(hexToRgb(skill.primaryColor));
			skillPlanet.setTerrainBias(getHillBiasForSkill(skill));
			planetSwitcher.setActive(skillPlanet);
		} else {
			planetSwitcher.setActive(marsPlanet);
		}

		compositor.setPage(pageId);
		fog.setColor(project ? project.darkColor : FOG_COLOR_DEFAULT);
		fog.setEnabled(PAGE_LOOK[pageId].fog > 0);
	});

	// Fog intensity — gate: only show in dark mode.
	$effect(() => {
		const ready = webglReady;
		const currentMode = mode.current;
		const pathname = page.url.pathname;
		const isHome = isHomeRoute;

		if (!ready || !compositor || !fog) {
			if (import.meta.env.DEV) {
				console.log(`[fog] effect ran — ready=${ready} compositor=${!!compositor} fog=${!!fog}, skipping`);
			}
			return;
		}

		if (currentMode !== 'dark') {
			if (import.meta.env.DEV) console.log(`[fog] effect ran — mode=${currentMode}, forcing 0`);
			compositor.setFogIntensity(0);
			return;
		}
		const workSlug = pathname.startsWith('/works/') ? pathname.slice('/works/'.length) : null;
		const pageId: PlanetPageId = isHome ? 'home' : workSlug ? 'work' : pathname === '/skills' ? 'skills' : 'about';
		if (import.meta.env.DEV) {
			console.log(
				`[fog] effect ran — pathname=${pathname} pageId=${pageId} mode=${currentMode} fog=${PAGE_LOOK[pageId].fog} coverage=${PAGE_LOOK[pageId].fogCoverage}`
			);
		}
		compositor.setFogIntensity(PAGE_LOOK[pageId].fog);
		fog.setCoverage(PAGE_LOOK[pageId].fogCoverage);
	});

	// Click Earth -> /about (excluding /skills and mobile home spiral).
	function handleCanvasClick(): void {
		if (
			scene &&
			planetSwitcher &&
			earthPlanet &&
			planetSwitcher.activeSource === earthPlanet &&
			page.url.pathname !== '/skills' &&
			!(isHomeRoute && scene.uniforms.uRes.value.x < SPIRAL_MOBILE_BREAKPOINT)
		) {
			const aspect = window.innerWidth / window.innerHeight;
			if (earthPlanet.raycastHit(scene.pointer.nx, scene.pointer.ny, aspect)) {
				goto('/about');
				return;
			}
		}
		if (!gallery || gallery.hoveredIndex === null) return;
		const project = gallery.projects[gallery.hoveredIndex];
		if (project) goto(`/works/${project.slug}`);
	}

	onMount(() => {
		const testCanvas = document.createElement('canvas');
		const gl = testCanvas.getContext('webgl2');
		if (!gl) {
			webglSupported = false;
			webglFailed = true;
		}

		document.body.style.cursor = 'auto';
		return () => {
			document.body.style.cursor = '';
		};
	});

	function handleEngineReady(readyScene: Scene): void {
		loaderStart = performance.now();
		scene = readyScene;

		const textureLoader = new THREE.TextureLoader();
		noiseTexture = textureLoader.load(m['assets.bg_noise']());
		planetMapTexture = textureLoader.load(m['assets.bg_cracked_planet']());
		crackedTexture = textureLoader.load(m['assets.bg_cracked']());
		crackedNormalTexture = textureLoader.load(m['assets.bg_cracked_normal']());

		stars = new Stars(scene);
		fog = new Fog(scene, noiseTexture);
		fluid = new FluidSim(scene);
		planet = new Planet(scene, {
			map: planetMapTexture,
			cracked: crackedTexture,
			crackedNormal: crackedNormalTexture
		});

		// Raymarched planets.
		const starsTexture = textureLoader.load(m['assets.planet_stars']());
		const EARTH_SCREEN_POSITION = { x: 0, y: 0 };
		const CENTER_SCREEN_POSITION = { x: 0, y: 0 };
		earthPlanet = new RaymarchPlanet(
			scene,
			{
				type: 'earth',
				textures: {
					color: textureLoader.load(m['assets.planet_earth_color']()),
					clouds: textureLoader.load(m['assets.planet_earth_clouds']()),
					specular: textureLoader.load(m['assets.planet_earth_specular']()),
					bump: textureLoader.load(m['assets.planet_earth_bump']()),
					night: textureLoader.load(m['assets.planet_earth_night']()),
					stars: starsTexture
				}
			},
			EARTH_SCREEN_POSITION
		);
		// /about's close-up Earth — separate instance, frozen spin, aimed at Germany.
		aboutEarthPlanet = new RaymarchPlanet(
			scene,
			{
				type: 'earth',
				textures: {
					color: textureLoader.load(m['assets.planet_earth_color']()),
					clouds: textureLoader.load(m['assets.planet_earth_clouds']()),
					specular: textureLoader.load(m['assets.planet_earth_specular']()),
					bump: textureLoader.load(m['assets.planet_earth_bump']()),
					night: textureLoader.load(m['assets.planet_earth_night']()),
					stars: starsTexture
				}
			},
			CENTER_SCREEN_POSITION,
			{ radius: 5, rotationOffset: -0.109, spinSpeed: 0, latitudeTilt: -0.897 }
		);
		marsPlanet = new RaymarchPlanet(
			scene,
			{
				type: 'planet',
				textures: { color: textureLoader.load(m['assets.planet_mars']()), stars: starsTexture },
				look: PLANET_LOOKS.mars
			},
			CENTER_SCREEN_POSITION
		);
		// Procedural terrain planet — accepts tint color per skill.
		skillPlanet = new RaymarchPlanet(
			scene,
			{
				type: 'procedural',
				textures: { stars: starsTexture },
				look: { atmosphereColor: [1, 1, 1], atmosphereDensity: 0.05 }
			},
			CENTER_SCREEN_POSITION
		);
		planetSwitcher = new PlanetSwitcher(scene.isTouch);
		planetSwitcher.setActive(earthPlanet);

		const projects = Object.values(WORK_PROJECTS).map((p) => ({
			slug: p.slug,
			title: p.title,
			textureUrl: p.textureUrl,
			videoUrl: p.videoUrl
		}));

		trackLoadProgress({
			textures: [
				m['assets.bg_noise'](),
				m['assets.bg_cracked_planet'](),
				m['assets.bg_cracked'](),
				m['assets.bg_cracked_normal'](),
				m['assets.planet_stars'](),
				m['assets.planet_earth_color'](),
				m['assets.planet_earth_clouds'](),
				m['assets.planet_earth_specular'](),
				m['assets.planet_earth_bump'](),
				m['assets.planet_earth_night'](),
				m['assets.planet_mars'](),
				...projects.map((p) => p.textureUrl)
			],
			videos: []
		});

		// Gallery — cards hidden (Home uses Spiral overlay), kept alive for Work's videoScene.
		gallery = new Gallery(scene, projects, { center: { x: 58, y: 0, z: 0 } });

		scroll = new Scroll(scene, gallery);
		scene.addLayer(scroll);
		planet?.setScrollSource(gallery);

		images = new Images(scene, gallery);
		scene.addLayer(images);
		video = new Video(scene, gallery);
		scene.addLayer(video);
		texts = new Texts(scene, false);
		scene.addLayer(texts);

		front = new Front(scene, images, video, texts);

		scene.addLayer(stars);
		scene.addLayer(fog);
		scene.addLayer(fluid);
		scene.addLayer(planetSwitcher);
		scene.addLayer(front);

		fog.setFluidSim(fluid);
		fluid.setAspect(window.innerWidth / window.innerHeight);

		const domCanvas = scene.renderer.domElement;

		const onFluidMove = (event: PointerEvent) => {
			if (!scene || !fluid) return;
			fluid.updateRadiusFromSpeed(scene.pointer.speed);
			if (Math.abs(scene.pointer.dx) > 0.2 || Math.abs(scene.pointer.dy) > 0.2) {
				fluid.pushSplat(
					scene.pointer.x / window.innerWidth,
					1 - scene.pointer.y / window.innerHeight,
					scene.pointer.dx * 5,
					scene.pointer.dy * -5
				);
			}
		};
		const onTargetMove = (event: PointerEvent) => {
			const nx = (event.clientX / window.innerWidth) * 2 - 1;
			const ny = -(event.clientY / window.innerHeight) * 2 + 1;
			planet?.setPointerNDC(nx, ny);
			gallery?.setMouseTarget(nx, ny);
		};
		domCanvas.addEventListener('pointermove', onFluidMove);
		domCanvas.addEventListener('pointermove', onTargetMove);
		domCanvas.addEventListener('click', handleCanvasClick);
		const onResize = () => fluid?.setAspect(window.innerWidth / window.innerHeight);
		window.addEventListener('resize', onResize);

		pointerCleanup = () => {
			domCanvas.removeEventListener('pointermove', onFluidMove);
			domCanvas.removeEventListener('pointermove', onTargetMove);
			domCanvas.removeEventListener('click', handleCanvasClick);
			window.removeEventListener('resize', onResize);
		};

		compositor = new Compositor(scene, { stars, fog, fluid, planet: planetSwitcher, front, images, video, texts });
		scene.setOutput(() => compositor?.render());

		webglReady = true;
	}

	onDestroy(() => {
		pointerCleanup?.();
		compositor?.dispose();
		gallery?.dispose();
		// Dispose all planet instances.
		planet?.dispose();
		earthPlanet?.dispose();
		aboutEarthPlanet?.dispose();
		marsPlanet?.dispose();
		skillPlanet?.dispose();
		scene?.dispose();
		noiseTexture?.dispose();
		planetMapTexture?.dispose();
		crackedTexture?.dispose();
		crackedNormalTexture?.dispose();
		webglReady = false;
		scene = null;
		stars = null;
		fog = null;
		fluid = null;
		planet = null;
		planetSwitcher = null;
		earthPlanet = null;
		aboutEarthPlanet = null;
		marsPlanet = null;
		skillPlanet = null;
		front = null;
		compositor = null;
		gallery = null;
		scroll = null;
		images = null;
		video = null;
		texts = null;
		noiseTexture = null;
		planetMapTexture = null;
		crackedTexture = null;
		crackedNormalTexture = null;
	});
</script>

<svelte:head>
	<title>{m['footer.copyright']()}</title>
</svelte:head>

{#if webglFailed}
	<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-10 text-center text-white">
		<h1 class="text-2xl font-black uppercase">{m['webgl.title']()}</h1>
		<p class="mt-6 max-w-sm leading-tight">{m['webgl.description']()}</p>
		<a href={m['links.webgl_info']()} target="_blank" rel="noopener noreferrer" class="mt-8 underline">
			{m['webgl.link']()}
		</a>
	</div>
{:else if webglSupported}
	<!-- Canvas kept alive (not unmounted) on /imprint and /privacy to avoid rebuilding WebGL context. -->
	<div class="fixed inset-0 h-full w-full {isLegalRoute ? 'invisible' : ''}">
		<Canvas>
			<EngineRoot onReady={handleEngineReady} />
		</Canvas>
	</div>
	{#if webglReady && scene && fluid && texts && !isLegalRoute && !isSkillsRoute}
		<Toggle {scene} {fluid} {texts} />
	{/if}
	{#if webglReady && isHomeRoute}
		<div
			class="fixed top-8 left-1/2 z-20 -translate-x-1/2 pointer-events-none animate-[fadeIn_0.6s_ease-out,autoHide_4s_2s_ease-out_forwards] text-center font-mono text-[9px] tracking-[0.3em] uppercase {navLinkClass}"
		>
			{m['common.explore_hint']()}
		</div>
		<CallScreen />
	{/if}
	{#if !isAboutRoute}
		<nav class="fixed top-6 left-6 z-20 flex gap-4 text-sm">
			<a href="/about" class="underline {navLinkClass}">
				{m['common.info_link']()}
			</a>
			<a href="/imprint" class="underline {navLinkClass}">
				{m['app_nav.imprint']()}
			</a>
			<a href="/privacy" class="underline {navLinkClass}">
				{m['app_nav.privacy']()}
			</a>
		</nav>
	{/if}
	{#if webglReady}
		<div class="fixed top-6 right-6 z-20 flex items-center gap-1.5 text-xs">
			{#each languages as lang, i}
				{#if i > 0}<span class="{navLinkClass} opacity-40">|</span>{/if}
				<button
					onclick={() => setLocale(lang.id as 'en' | 'de')}
					class="uppercase {navLinkClass} {getLocale() === lang.id ? 'font-bold' : 'opacity-60'}"
				>
					{lang.id}
				</button>
			{/each}
		</div>
	{/if}
	{@render children()}
	{#if loaderVisible && !page.url.pathname.startsWith('/skills')}
		<div
			class="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-[#00031f]"
			out:fade={{ duration: 500 }}
		>
			<div class="h-10 w-10 animate-pulse rounded-full bg-white"></div>
			<span class="font-mono text-sm tracking-widest text-white/80">{loaderPercent}%</span>
		</div>
	{/if}
{/if}

<style>
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-8px); }
		to { opacity: 1; transform: translateY(0); }
	}
	@keyframes autoHide {
		0% { opacity: 1; }
		100% { opacity: 0; pointer-events: none; }
	}
</style>

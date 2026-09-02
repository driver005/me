<!-- Shared WebGL background for the site's real Home ('/'), Work detail ('/works/[slug]') and About
     ('/about') pages — ported from the /test prototype's own +layout.svelte. Canvas/renderer/camera
     lifecycle now goes through Threlte (<Canvas> + EngineRoot.svelte) instead of a hand-rolled
     `new THREE.WebGLRenderer()`; every layer class below (Stars/Fog/Planet/Gallery/Compositor/...) is
     untouched by that migration — they only ever needed a `Scene` handle, and EngineRoot builds one
     with the exact same shape from Threlte's own context. -->
<script lang="ts">
	import { onDestroy, onMount, setContext, type Snippet } from 'svelte';
	import { fade } from 'svelte/transition';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Canvas } from '@threlte/core';
	import gsap from 'gsap';
	import * as THREE from 'three';
	import { m } from '$lib/paraglide/messages';
	import EngineRoot from '$lib/three/scenes/segerman-bg/EngineRoot.svelte';
	import type { Scene } from '$lib/three/scenes/segerman-bg/scene';
	import { Stars } from '$lib/three/scenes/segerman-bg/stars';
	import { Fog } from '$lib/three/scenes/segerman-bg/fog';
	import { FluidSim } from '$lib/three/scenes/segerman-bg/fluid';
	import { Planet } from '$lib/three/scenes/segerman-bg/planet';
	import { Front } from '$lib/three/scenes/segerman-bg/front';
	import { Compositor } from '$lib/three/scenes/segerman-bg/compositor';
	import type { PlanetPageId } from '$lib/three/scenes/segerman-bg/planet';
	import { Gallery } from '$lib/three/scenes/segerman-bg/gallery';
	import { WORK_PROJECTS } from '$lib/three/scenes/segerman-bg/work-content';
	import { Scroll } from '$lib/three/scenes/segerman-bg/scroll';
	import { Images } from '$lib/three/scenes/segerman-bg/images';
	import { Video } from '$lib/three/scenes/segerman-bg/video';
	import { Texts } from '$lib/three/scenes/segerman-bg/texts';
	import Toggle from './Toggle.svelte';
	import { SEGERMAN_BG_CONTEXT, type SegermanBgContext } from '$lib/three/scenes/segerman-bg/context';

	let { children }: { children: Snippet } = $props();

	setContext<SegermanBgContext>(SEGERMAN_BG_CONTEXT, {
		getScene: () => scene,
		getGallery: () => gallery,
		getReady: () => webglReady
	});

	const MIN_LOADER_DURATION = 1200;
	/** Fog's own built-in default tint (fog.ts) — tweened back to this on any route without a project
	 *  color (home/about/error). */
	const FOG_COLOR_DEFAULT = '#20447e';

	/** Single source of truth for front/back mode — bound two-way with Toggle.svelte (its button also
	 *  flips this), and set here on every route change so a sub-page's forced back mode and Toggle's
	 *  own state can never go stale relative to each other. Also drives the nav link below: white text
	 *  over the white front plate is invisible. */
	let isBackMode = $state(false);

	const isHomeRoute = $derived(page.url.pathname === '/');
	const isAboutRoute = $derived(page.url.pathname === '/about');

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

	/** Real progress tracking (image/video preload), independent of Card/VideoCard's own loaders —
	 *  a redundant fetch is fine (browser HTTP cache), simpler than threading a shared loader through them. */
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

	// Route-driven mode transition — separate from Toggle's own click-driven state (see Toggle.svelte),
	// but both ultimately drive the same shared uniforms. Home shows the front/white view; any
	// sub-route (a project detail page, the about page) shows the immersive back view with its DOM
	// overlay content on top.
	//
	// Tweening uMode alone is NOT enough to actually show the back view — the output compositor's
	// front/back crossfade is driven by uProgressFront (see output-fragment.glsl's edgeFront), not
	// uMode directly. uMode only affects each layer's own internal treatment (fog/stars/planet grading,
	// this layout's own gallery visibility).
	let routeModeTimeline: gsap.core.Timeline | null = null;
	$effect(() => {
		const pathname = page.url.pathname;
		const isHome = isHomeRoute;
		// webglReady is a real $state — reading it here (unlike the plain scene/gallery/planet/compositor/
		// fog vars below, which create no reactive dependency) makes this effect re-run once EngineRoot's
		// onReady finishes populating them, even if this effect's first run raced ahead of that.
		if (!webglReady || !scene || !gallery || !planet || !compositor || !fog) return;
		isBackMode = !isHome;
		routeModeTimeline?.kill();
		routeModeTimeline = gsap.timeline();
		routeModeTimeline.to(scene.uniforms.uMode, { value: isHome ? 1 : 0, duration: 1, ease: 'power2.inOut' }, 0);
		routeModeTimeline.to(scene.uniforms.uProgressFront, { value: isHome ? 0 : 1, duration: 1, ease: 'power2.inOut' }, 0);
		// Sub-routes add their own 3D content (Work's media carousel, About's portrait) into the same
		// persistent scene — hide the home strip's cards/titles/videos so they don't show stacked
		// underneath a project/about page's own content.
		gallery.setHomeVisible(isHome);

		const workSlug = pathname.startsWith('/works/') ? pathname.slice('/works/'.length) : null;
		// Every non-home, non-work route reachable inside this (bg) group gets the 'info' treatment —
		// 'error' parks the planet off-screen at z:-200 and zeroes glow/fog, which is correct for a
		// route that's never actually shown but wrong for any real page, so nothing under this group
		// should ever hit it.
		const pageId: PlanetPageId = isHome ? 'home' : workSlug ? 'work' : 'info';
		const project = workSlug ? WORK_PROJECTS[workSlug] : undefined;
		planet.animate(pageId, project ? { light: project.lightColor, dark: project.darkColor } : undefined);
		compositor.setPage(pageId);
		fog.setColor(project ? project.darkColor : FOG_COLOR_DEFAULT);
		fog.setEnabled(isHome);
	});

	function handleCanvasClick(): void {
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
	});

	function handleEngineReady(readyScene: Scene): void {
		loaderStart = performance.now();
		scene = readyScene;

		const textureLoader = new THREE.TextureLoader();
		noiseTexture = textureLoader.load('/textures/segerman-bg/noise.png');
		planetMapTexture = textureLoader.load('/textures/segerman-bg/planet.webp');
		crackedTexture = textureLoader.load('/textures/segerman-bg/cracked.webp');
		crackedNormalTexture = textureLoader.load('/textures/segerman-bg/cracked-normal.webp');

		stars = new Stars(scene);
		fog = new Fog(scene, noiseTexture);
		fluid = new FluidSim(scene);
		planet = new Planet(scene, {
			map: planetMapTexture,
			cracked: crackedTexture,
			crackedNormal: crackedNormalTexture
		});

		const projects = Object.values(WORK_PROJECTS).map((p) => ({
			slug: p.slug,
			title: p.title,
			textureUrl: p.textureUrl,
			videoUrl: p.videoUrl
		}));

		trackLoadProgress({
			textures: [
				'/textures/segerman-bg/noise.png',
				'/textures/segerman-bg/planet.webp',
				'/textures/segerman-bg/cracked.webp',
				'/textures/segerman-bg/cracked-normal.webp',
				...projects.map((p) => p.textureUrl)
			],
			videos: projects.map((p) => p.videoUrl)
		});

		gallery = new Gallery(scene, projects);
		gallery.playEntrance();

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
		scene.addLayer(planet);
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

		compositor = new Compositor(scene, { stars, fog, fluid, planet, front, images, video, texts });
		scene.setOutput(() => compositor?.render());

		webglReady = true;
	}

	onDestroy(() => {
		pointerCleanup?.();
		routeModeTimeline?.kill();
		compositor?.dispose();
		gallery?.dispose();
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
	<title>Adrian Fernández</title>
</svelte:head>

{#if webglFailed}
	<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-10 text-center text-white">
		<h1 class="text-2xl font-black uppercase">{m['webgl.title']()}</h1>
		<p class="mt-6 max-w-sm leading-tight">{m['webgl.description']()}</p>
		<a href="https://get.webgl.org/" target="_blank" rel="noopener noreferrer" class="mt-8 underline">
			{m['webgl.link']()}
		</a>
	</div>
{:else if webglSupported}
	<div class="fixed inset-0 h-full w-full">
		<Canvas>
			<EngineRoot onReady={handleEngineReady} />
		</Canvas>
	</div>
	{#if webglReady && scene && fluid && texts && isHomeRoute}
		<Toggle {scene} {fluid} {texts} bind:isBackMode />
	{/if}
	{#if !isAboutRoute}
		<nav class="fixed top-6 left-6 z-20 text-sm">
			<a
				href="/about"
				class="underline {isBackMode ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'}"
			>
				Info
			</a>
		</nav>
	{/if}
	{@render children()}
	{#if loaderVisible}
		<div
			class="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-[#00031f]"
			out:fade={{ duration: 500 }}
		>
			<div class="h-10 w-10 animate-pulse rounded-full bg-white"></div>
			<span class="font-mono text-sm tracking-widest text-white/80">{loaderPercent}%</span>
		</div>
	{/if}
{/if}

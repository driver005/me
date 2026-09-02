<!-- src/routes/test/+layout.svelte -->
<script lang="ts">
	import { onMount, onDestroy, setContext, type Snippet } from 'svelte';
	import { fade } from 'svelte/transition';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import gsap from 'gsap';
	import * as THREE from 'three';
	import { m } from '$lib/paraglide/messages';
	import { Scene } from '$lib/three/scenes/segerman-bg/scene';
	import { Stars } from '$lib/three/scenes/segerman-bg/stars';
	import { Fog } from '$lib/three/scenes/segerman-bg/fog';
	import { FluidSim } from '$lib/three/scenes/segerman-bg/fluid';
	import { Planet } from '$lib/three/scenes/segerman-bg/planet';
	import { Front } from '$lib/three/scenes/segerman-bg/front';
	import { Compositor } from '$lib/three/scenes/segerman-bg/compositor';
	import { Gallery } from '$lib/three/scenes/segerman-bg/gallery';
	import { Scroll } from '$lib/three/scenes/segerman-bg/scroll';
	import { Images } from '$lib/three/scenes/segerman-bg/images';
	import { Video } from '$lib/three/scenes/segerman-bg/video';
	import { Texts } from '$lib/three/scenes/segerman-bg/texts';
	import Toggle from '$lib/components/sites/segerman/Toggle.svelte';
	import { SEGERMAN_BG_CONTEXT, type SegermanBgContext } from '$lib/three/scenes/segerman-bg/context';

	let { children }: { children: Snippet } = $props();

	setContext<SegermanBgContext>(SEGERMAN_BG_CONTEXT, {
		getScene: () => scene,
		getGallery: () => gallery
	});

	const MIN_LOADER_DURATION = 1200;

	let canvasRef: HTMLCanvasElement | null = $state(null);
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
	let handleFluidResize: (() => void) | null = null;
	let loaderStart = 0;

	/** Real progress tracking (image/video preload), independent of Card/VideoCard's own loaders —
	 *  a redundant fetch is fine (browser HTTP cache), simpler than threading a shared loader through them. */
	function trackLoadProgress(assetUrls: { textures: string[]; videos: string[] }): void {
		const total = assetUrls.textures.length + assetUrls.videos.length;
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
	// but both ultimately drive the same shared scene.uniforms.uMode. Home shows the front/white view;
	// any sub-route (a project detail page, the info page) shows the immersive back view with its DOM
	// overlay content on top, matching the original's behavior of the background going immersive on
	// project/info pages.
	let routeModeTimeline: gsap.core.Tween | null = null;
	$effect(() => {
		const isHome = page.url.pathname === '/test';
		if (!scene || !gallery) return;
		routeModeTimeline?.kill();
		routeModeTimeline = gsap.to(scene.uniforms.uMode, { value: isHome ? 1 : 0, duration: 1, ease: 'power2.inOut' });
		// Sub-routes add their own 3D content (Work's media carousel, Info's portrait) into the same
		// persistent scene — hide the home strip's cards/titles/videos so they don't show stacked
		// underneath a project/info page's own content.
		gallery.setHomeVisible(isHome);
	});

	function handleCanvasClick(): void {
		if (!gallery || gallery.hoveredIndex === null) return;
		const project = gallery.projects[gallery.hoveredIndex];
		if (project) goto(`/test/work/${project.slug}`);
	}

	onMount(() => {
		const testCanvas = document.createElement('canvas');
		const gl = testCanvas.getContext('webgl2');
		if (!gl) {
			webglFailed = true;
			return;
		}
		if (canvasRef) {
			loaderStart = performance.now();
			scene = new Scene(canvasRef);

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

			const projects = [
				{ slug: 'estrela', title: 'Estrela Studio' },
				{ slug: 'payjustnow', title: 'PayJustNow' },
				{ slug: 'vineyard', title: 'Vineyard Hotel' },
				{ slug: 'yucca', title: 'Yucca Packaging' },
				{ slug: 'zulik', title: 'Zulik' }
			].map(({ slug, title }) => ({
				slug,
				title,
				textureUrl: `/textures/segerman-bg/work/${slug}.webp`,
				videoUrl: `/videos/segerman-bg/work/${slug}.mp4`
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
			handleFluidResize = () => fluid?.setAspect(window.innerWidth / window.innerHeight);
			window.addEventListener('resize', handleFluidResize);

			canvasRef.addEventListener('pointermove', () => {
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
			});

			canvasRef.addEventListener('pointermove', (event) => {
				const nx = (event.clientX / window.innerWidth) * 2 - 1;
				const ny = -(event.clientY / window.innerHeight) * 2 + 1;
				planet?.setPointerNDC(nx, ny);
				gallery?.setMouseTarget(nx, ny);
			});

			canvasRef.addEventListener('click', handleCanvasClick);

			compositor = new Compositor(scene, { stars, fog, fluid, planet, front, images, video, texts });
			scene.setOutput(() => compositor?.render());

			scene.start();
			webglReady = true;
		}
	});

	onDestroy(() => {
		if (handleFluidResize) {
			window.removeEventListener('resize', handleFluidResize);
			handleFluidResize = null;
		}
		canvasRef?.removeEventListener('click', handleCanvasClick);
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
	<title>WebGL Background Test</title>
</svelte:head>

{#if webglFailed}
	<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-10 text-center text-white">
		<h1 class="text-2xl font-black uppercase">{m['webgl.title']()}</h1>
		<p class="mt-6 max-w-sm leading-tight">{m['webgl.description']()}</p>
		<a href="https://get.webgl.org/" target="_blank" rel="noopener noreferrer" class="mt-8 underline">
			{m['webgl.link']()}
		</a>
	</div>
{:else}
	<canvas bind:this={canvasRef} class="fixed inset-0 h-full w-full"></canvas>
	{#if webglReady && scene && fluid && texts}
		<Toggle {scene} {fluid} {texts} />
	{/if}
	<nav class="fixed top-6 left-6 z-20 text-sm">
		<a href="/test/info" class="text-white/70 underline hover:text-white">Info</a>
	</nav>
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

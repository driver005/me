<!-- src/routes/test/+page.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
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

	let canvasRef: HTMLCanvasElement | null = $state(null);
	let webglFailed = $state(false);
	let webglReady = $state(false);
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

	onMount(() => {
		const testCanvas = document.createElement('canvas');
		const gl = testCanvas.getContext('webgl2');
		if (!gl) {
			webglFailed = true;
			return;
		}
		if (canvasRef) {
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

			const projects = ['estrela', 'payjustnow', 'vineyard', 'yucca', 'zulik'].map((slug) => ({
				slug,
				textureUrl: `/textures/segerman-bg/work/${slug}.webp`,
				videoUrl: `/videos/segerman-bg/work/${slug}.mp4`
			}));
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
{/if}

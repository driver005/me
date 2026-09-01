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
	import { Compositor } from '$lib/three/scenes/segerman-bg/compositor';

	let canvasRef: HTMLCanvasElement | null = $state(null);
	let webglFailed = $state(false);
	let scene: Scene | null = null;
	let stars: Stars | null = null;
	let fog: Fog | null = null;
	let fluid: FluidSim | null = null;
	let planet: Planet | null = null;
	let compositor: Compositor | null = null;

	onMount(() => {
		const testCanvas = document.createElement('canvas');
		const gl = testCanvas.getContext('webgl2');
		if (!gl) {
			webglFailed = true;
			return;
		}
		if (canvasRef) {
			scene = new Scene(canvasRef);

			const noiseTexture = new THREE.TextureLoader().load('/textures/segerman-bg/noise.png');
			const textureLoader = new THREE.TextureLoader();

			stars = new Stars(scene);
			fog = new Fog(scene, noiseTexture);
			fluid = new FluidSim(scene);
			planet = new Planet(scene, {
				map: textureLoader.load('/textures/segerman-bg/planet.webp'),
				cracked: textureLoader.load('/textures/segerman-bg/cracked.webp'),
				crackedNormal: textureLoader.load('/textures/segerman-bg/cracked-normal.webp')
			});

			scene.addLayer(stars);
			scene.addLayer(fog);
			scene.addLayer(fluid);
			scene.addLayer(planet);

			fog.setFluidSim(fluid);
			fluid.setAspect(window.innerWidth / window.innerHeight);
			window.addEventListener('resize', () => fluid?.setAspect(window.innerWidth / window.innerHeight));

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
			});

			compositor = new Compositor(scene, { stars, fog, fluid, planet });
			scene.setOutput(() => compositor?.render());

			scene.start();
		}
	});

	onDestroy(() => {
		compositor?.dispose();
		scene?.dispose();
		scene = null;
		stars = null;
		fog = null;
		fluid = null;
		planet = null;
		compositor = null;
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
{/if}

<!-- src/routes/test/+page.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as THREE from 'three';
	import { m } from '$lib/paraglide/messages';
	import { Scene } from '$lib/three/scenes/segerman-bg/scene';
	import { Stars } from '$lib/three/scenes/segerman-bg/stars';
	import { Fog } from '$lib/three/scenes/segerman-bg/fog';

	let canvasRef: HTMLCanvasElement | null = $state(null);
	let webglFailed = $state(false);
	let scene: Scene | null = null;

	onMount(() => {
		const testCanvas = document.createElement('canvas');
		const gl = testCanvas.getContext('webgl2');
		if (!gl) {
			webglFailed = true;
			return;
		}
		if (canvasRef) {
			scene = new Scene(canvasRef);
			scene.start();

			// TEMPORARY: direct preview of a single layer, independently verifiable
			// before the real multi-layer compositor lands in Task 9. Both layers
			// render to their own RTs every frame regardless of which is blitted here.
			const stars = new Stars(scene);
			scene.addLayer(stars);

			const noiseTexture = new THREE.TextureLoader().load('/textures/segerman-bg/noise.png');
			const fog = new Fog(scene, noiseTexture);
			scene.addLayer(fog);
			scene.setOutput(() => {
				const blitMaterial = new THREE.ShaderMaterial({
					uniforms: { tMap: { value: fog.texture } },
					vertexShader:
						'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}',
					fragmentShader:
						'varying vec2 vUv; uniform sampler2D tMap; void main(){gl_FragColor=texture2D(tMap,vUv);}'
				});
				const blitMesh = new THREE.Mesh(scene!.fullScreenTriangle, blitMaterial);
				scene!.renderer.render(blitMesh, scene!.camera);
			});
		}
	});

	onDestroy(() => {
		scene?.dispose();
		scene = null;
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

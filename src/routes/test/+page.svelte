<!-- src/routes/test/+page.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import { Scene } from '$lib/three/scenes/segerman-bg/scene';

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

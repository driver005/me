<script lang="ts">
	import './layout.css';
	import '../app.css';
	import CanvasPortalTarget from '$lib/three/canvas/target.svelte';
	import { Canvas } from '@threlte/core';
	import type { Snippet } from 'svelte';
	import { WebGPURenderer } from 'three/webgpu';
	import { header_content } from '$lib/stores/html';
	import Timeline from '$lib/three/objects/life/timeline.svelte';
	let { children }: { children: Snippet } = $props();
</script>

<div id="test" class="canvas-wrapper">
	{#if $header_content.render}
		<header class="absolute top-0 z-10 flex w-full justify-center">
			<div class="flex w-1/5 flex-col gap-2 rounded-b-lg bg-white p-2">
				<h2 class="px-5 text-xl font-bold">{$header_content.info}</h2>

				{#if $header_content.text}
					<h3 class="px-5 font-bold text-amber-500">{@html $header_content.text}</h3>
				{/if}

				{#if $header_content.time}
					<Timeline time={$header_content.time} />
				{/if}
			</div>
		</header>
	{/if}

	{#if import.meta.env.MODE === 'development'}
		<Canvas><CanvasPortalTarget /></Canvas>
	{:else}
		<Canvas
			createRenderer={(canvas) => {
				return new WebGPURenderer({ canvas, antialias: true, forceWebGL: false });
			}}
		>
			<CanvasPortalTarget />
		</Canvas>
	{/if}
</div>

{@render children()}

<style>
	.canvas-wrapper {
		position: absolute;
		z-index: 100;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>

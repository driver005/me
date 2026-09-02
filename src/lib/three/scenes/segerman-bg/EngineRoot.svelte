<!--
	Generic Threlte plumbing for the segerman-bg engine — owns nothing specific to any particular layer
	(Stars/Fog/Planet/Gallery/...); those stay exactly as they were, each still just a plain TS class
	taking a `Scene` handle. This component's only job is to build that handle from Threlte's own
	`<Canvas>` context (renderer/camera/canvas lifecycle now owned by Threlte, not a hand-rolled
	`new THREE.WebGLRenderer()`) and drive the per-frame loop + resize, then hand the constructed
	`Scene` back to its parent via `onReady` so the parent can build the actual layer tree (exactly the
	way +layout.svelte's onMount already did before this migration — that part didn't need to change).
-->
<script lang="ts">
	import * as THREE from 'three';
	import { useThrelte, useTask } from '@threlte/core';
	import { onMount } from 'svelte';
	import { createScene, type Scene, type SceneInternal } from './scene';

	let { onReady }: { onReady: (scene: Scene) => void } = $props();

	const threlte = useThrelte();
	// Full manual control: this engine already has its own multi-pass render-target pipeline
	// (Stars/Fog/Fluid/Planet/Images/Video/Texts each render offscreen, Compositor combines them) —
	// Threlte's own auto-render of a declared scene graph isn't used at all here.
	threlte.autoRender.set(false);
	threlte.renderMode.set('always');

	let handle: (Scene & SceneInternal) | null = null;
	let elapsed = 0;

	function syncCameraAspect(width: number, height: number): void {
		const camera = threlte.camera.current as THREE.PerspectiveCamera;
		if (width === 0 || height === 0) return;
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	}

	onMount(() => {
		const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
		camera.position.z = 100;
		threlte.camera.set(camera);
		syncCameraAspect(threlte.size.current.width, threlte.size.current.height);

		const scene = createScene(threlte, threlte.canvas) as Scene & SceneInternal;
		handle = scene;
		onReady(scene);

		return () => {
			handle = null;
			scene.dispose();
		};
	});

	$effect(() => {
		const { width, height } = threlte.size.current;
		syncCameraAspect(width, height);
		handle?.__resize(width, height);
	});

	useTask((delta) => {
		if (!handle) return;
		elapsed += delta;
		handle.uniforms.uTime.value = elapsed;
		for (const layer of handle.__layers) layer.loop();
		threlte.renderer.setRenderTarget(null);
		threlte.renderer.clear();
		const output = handle.__getOutput();
		if (output) output();
	});
</script>

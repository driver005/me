<script lang="ts">
	import * as THREE from 'three';
	import { useThrelte, useTask } from '@threlte/core';
	import { onMount } from 'svelte';
	import { createScene, type Scene, type SceneInternal } from './scene';
	import { logFullReport, logGPUIdentity, logContextCreationError } from './shared/gpu-diagnostics';

	let { onReady }: { onReady: (scene: Scene) => void } = $props();

	const threlte = useThrelte();
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

		const renderer = threlte.renderer as THREE.WebGLRenderer;
		logGPUIdentity(renderer, 'startup');

		const reportTimeout = import.meta.env.DEV
			? setTimeout(() => logFullReport(renderer, threlte.scene, '(bg) engine, ~2s after mount'), 2000)
			: null;

		const onContextLost = (): void => {
			logFullReport(renderer, threlte.scene, 'at context loss');
		};
		// Fires on creation failure only.
		const onContextCreationError = (event: Event): void => {
			logContextCreationError(event, '(bg) engine');
		};
		renderer.domElement.addEventListener('webglcontextlost', onContextLost);
		renderer.domElement.addEventListener('webglcontextcreationerror', onContextCreationError);

		return () => {
			handle = null;
			scene.dispose();
			if (reportTimeout !== null) clearTimeout(reportTimeout);
			renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
			renderer.domElement.removeEventListener('webglcontextcreationerror', onContextCreationError);
			// forceContextLoss() frees the WebGL context deterministically — prevents context pile-up.
			try {
				renderer.forceContextLoss();
			} catch {
				// Best-effort cleanup — nothing else to do if the renderer's already in a bad state.
			}
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

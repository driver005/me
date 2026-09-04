<!--
	Generic Threlte plumbing for the shared WebGL background engine — owns nothing specific to any particular layer
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
	import { logFullReport, logGPUIdentity, logContextCreationError } from './shared/gpu-diagnostics';

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

		const renderer = threlte.renderer as THREE.WebGLRenderer;
		logGPUIdentity(renderer, 'startup');

		// This component only builds the bare Scene handle — the actual layer tree (Stars/Fog/Planet/
		// Gallery/...) gets constructed by whichever route's own onReady callback runs after this, so
		// there's no single "fully built" moment to hook here the way /home's HomeEngineRoot has (see
		// its own onFullyRevealed-driven logFullReport call). A one-shot report a couple seconds after
		// mount is a simple stand-in — by then a typical route's own layer construction has settled.
		const reportTimeout = import.meta.env.DEV
			? setTimeout(() => logFullReport(renderer, threlte.scene, '(bg) engine, ~2s after mount'), 2000)
			: null;

		// Dev-only diagnostic snapshot on context loss — see HomeEngineRoot.svelte's identical listener
		// for the full reasoning. This engine's own layer tree lives in the route's +layout.svelte, not
		// here, so unlike HomeEngineRoot this doesn't attempt a rebuild-on-restore — just visibility into
		// what was resident right before a loss, same as everywhere else in this codebase now.
		const onContextLost = (): void => {
			logFullReport(renderer, threlte.scene, 'at context loss');
		};
		// Only fires on an actual creation *failure* — see logContextCreationError's own comment for
		// what this actually captures and why nothing was capturing it before.
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
			// See HomeEngineRoot.svelte's identical line: Threlte's own renderer.dispose() (which runs
			// right after this in <Canvas>'s own cleanup) doesn't actually free the WebGL context —
			// forceContextLoss() does, and without it, repeated navigation in/out of the (bg) route group
			// can pile up contexts until the browser hits its per-page context limit.
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

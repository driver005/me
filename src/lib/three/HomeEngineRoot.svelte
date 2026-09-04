<!-- Threlte plumbing for /home's 3D scene — builds a camera + OrbitControls, hands renderer/scene/
	camera off to HomeScene (home-scene.ts), drives its `.loop(delta)` every frame via `useTask`
	(HomeScene.loop() itself throttles the actual render to 30fps — see its own comment). An on-demand
	requestAnimationFrame scheduler (only ticking while the camera moves/damps) was tried here and
	reverted — it broke in practice, back to the always-on loop. -->
<script lang="ts">
	import * as THREE from 'three';
	import { useThrelte, useTask } from '@threlte/core';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { onMount } from 'svelte';
	import { mode } from 'mode-watcher';
	import { HomeScene } from './home-scene';
	import {
		logFullReport,
		logGPUIdentity,
		logContextCreationError,
		logLoopHistory
	} from './shared/gpu-diagnostics';

	let { friendly = false, onReady }: { friendly?: boolean; onReady?: () => void } = $props();

	const threlte = useThrelte();
	// HomeScene.loop() does its own final render via Postprocessing — Threlte must not also auto-render.
	threlte.autoRender.set(false);

	let homeScene: HomeScene | null = null;
	let controls: OrbitControls | null = null;

	onMount(() => {
		const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
		camera.position.set(3.5, 3, 2.5);
		threlte.camera.set(camera);

		controls = new OrbitControls(camera, threlte.renderer.domElement);
		controls.target.set(0, 0.5, -0.5);
		controls.enablePan = false;
		controls.enableZoom = true;
		controls.enableRotate = true;
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.minDistance = 3;
		controls.maxDistance = 10;
		controls.minPolarAngle = 0;
		controls.maxPolarAngle = Math.PI / 2;
		controls.minAzimuthAngle = 0;
		controls.maxAzimuthAngle = Math.PI / 2;
		controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
		controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
		controls.mouseButtons.RIGHT = null;

		const renderer = threlte.renderer as THREE.WebGLRenderer;
		logGPUIdentity(renderer, 'startup');

		function buildScene(): void {
			// Context may still be lost right after a 'webglcontextrestored' event — that listener
			// below calls buildScene() again once it's actually usable.
			const gl = renderer.getContext();
			if (!gl || gl.isContextLost()) {
				if (import.meta.env.DEV) console.log('[gpu] buildScene() skipped — context still lost');
				return;
			}
			if (import.meta.env.DEV) console.log('[gpu] buildScene() building');

			homeScene = new HomeScene(renderer, threlte.scene, camera, () => {
				logFullReport(renderer, threlte.scene, 'room fully revealed');
				onReady?.();
			});
			homeScene.setDark(mode.current === 'dark');
			homeScene.setFriendly(friendly);
			homeScene.setSize(threlte.size.current.width, threlte.size.current.height);
		}
		buildScene();

		// Context loss kills every GPU resource this engine owns — tear the scene down and rebuild
		// fresh on restore rather than trying to patch up stale references.
		const onContextLost = (event: Event): void => {
			event.preventDefault();
			logFullReport(renderer, threlte.scene, 'at context loss');
			logLoopHistory('at context loss');
			homeScene?.dispose();
			homeScene = null;
		};
		const onContextRestored = (): void => {
			if (import.meta.env.DEV) console.log('[gpu] webglcontextrestored fired');
			buildScene();
		};
		const onContextCreationError = (event: Event): void => {
			logContextCreationError(event, 'home engine');
		};
		renderer.domElement.addEventListener('webglcontextlost', onContextLost);
		renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
		renderer.domElement.addEventListener('webglcontextcreationerror', onContextCreationError);

		return () => {
			renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
			renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
			renderer.domElement.removeEventListener('webglcontextcreationerror', onContextCreationError);
			controls?.dispose();
			homeScene?.dispose();
			homeScene = null;
			controls = null;
			// Frees the WebGL context deterministically instead of waiting on GC — repeated navigation
			// to/from /home otherwise piles up contexts until the browser hits its per-page limit.
			try {
				renderer.forceContextLoss();
			} catch {
				// best-effort
			}
		};
	});

	$effect(() => {
		homeScene?.setDark(mode.current === 'dark');
	});

	$effect(() => {
		homeScene?.setFriendly(friendly);
	});

	$effect(() => {
		const { width, height } = threlte.size.current;
		const camera = threlte.camera.current as THREE.PerspectiveCamera | undefined;
		if (camera && width > 0 && height > 0) {
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
		}
		homeScene?.setSize(width, height);
	});

	useTask((delta) => {
		controls?.update();
		homeScene?.loop(delta);
	});
</script>

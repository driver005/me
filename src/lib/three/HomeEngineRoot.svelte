<!--
	Generic Threlte plumbing for /home's own 3D scene — mirrors scenes/EngineRoot.svelte's own role for
	the (bg) engine exactly: the only thing here that touches Threlte directly is this file. It builds
	a camera + OrbitControls (the vanilla three/examples/jsm version — no @threlte/extras component)
	and hands renderer/scene/camera off to HomeScene (a plain class, see home-scene.ts), then just
	drives its `.loop(delta)` every frame via `useTask`. Everything HomeScene itself owns (skybox,
	lights, the room GLTF, rain/smoke/coffee steam, postprocessing) is plain TypeScript, no `<T.xxx>`
	components anywhere below this file.
-->
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
	// Postprocessing.render() (via HomeScene.loop()) is this scene's own final draw — Threlte must not
	// also auto-render the raw scene on top of it, same reasoning as scenes/EngineRoot.svelte's own
	// identical line for the (bg) engine's own compositor output.
	threlte.autoRender.set(false);

	let homeScene: HomeScene | null = null;
	let controls: OrbitControls | null = null;

	onMount(() => {
		const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
		camera.position.set(3.5, 3, 2.5);
		threlte.camera.set(camera);

		// Same limits camera/room.svelte's own <OrbitControls> passed — no pan, damped rotate/dolly,
		// left mouse only (right button freed up for the room's own right-click interactions).
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
		// GPU vendor/renderer/limits — doesn't change frame to frame, so once at startup is enough. The
		// one thing that actually distinguishes this environment's GPU from a normal one, which none of
		// the resident-state snapshots below can show on their own.
		logGPUIdentity(renderer, 'startup');

		function buildScene(): void {
			// EffectComposer's own constructor (via Postprocessing) reads
			// renderer.getContext().getContextAttributes() — that call returns null while the context is
			// lost, and past construction guarded against nothing, it threw straight out of a Svelte
			// onMount/event-listener callback. If the context isn't usable yet, skip building for now —
			// the 'webglcontextrestored' listener below calls buildScene() again once it actually is.
			const gl = renderer.getContext();
			if (!gl || gl.isContextLost()) {
				// Dev-only: a report of the scene staying black after backgrounding the tab / opening
				// devtools, with no obvious error, means either this guard is bailing over and over (context
				// never actually comes back as usable even though 'webglcontextrestored' fired) or the event
				// never fires at all (see the listener below, which now logs unconditionally on entry). This
				// line tells those two apart.
				if (import.meta.env.DEV) console.log('[gpu] buildScene() skipped — context still lost');
				return;
			}
			if (import.meta.env.DEV) console.log('[gpu] buildScene() building');

			homeScene = new HomeScene(renderer, threlte.scene, camera, () => {
				// Full geometry/texture/shader dump the moment the room's actually done revealing —
				// the real "everything that's resident once /home is fully loaded" report.
				logFullReport(renderer, threlte.scene, 'room fully revealed');
				onReady?.();
			});
			homeScene.setDark(mode.current === 'dark');
			homeScene.setFriendly(friendly);
			homeScene.setSize(threlte.size.current.width, threlte.size.current.height);
		}
		buildScene();

		// A WebGL context loss (whatever causes it — a driver crash, or the browser reclaiming a
		// context, which the GPU logs as "Context Lost") kills every GPU-side resource this engine
		// owns (materials' compiled shader programs, the room's textures, postprocessing's render
		// targets) out from under it. Three.js's own WebGLRenderer already calls preventDefault() on
		// 'webglcontextlost' so the browser attempts automatic restoration, but restoration only resets
		// the renderer's own internal state — it can't recreate resources this engine's own classes
		// created and are still holding stale references to, which is what produced the
		// "Shader Error 1282 - VALIDATE_STATUS false" spam after a loss. Tearing the whole scene down on
		// loss and rebuilding it fresh on restore sidesteps that entirely instead of trying to patch up
		// partial state.
		const onContextLost = (event: Event): void => {
			event.preventDefault();
			// Dev-only snapshot of what the renderer had resident right before it died — program/
			// geometry/texture counts especially, since a spike there (redundant materials, mainly) is
			// the kind of thing that actually exhausts a GPU. Read before disposing anything below.
			logFullReport(renderer, threlte.scene, 'at context loss');
			// Per-frame loop timing history — see gpu-diagnostics.ts's own recordLoopFrame() comment.
			// Losses reported happening well after load (steady-state looping, not the startup compile
			// burst) need this instead: what was the loop actually doing in the frames right before it died.
			logLoopHistory('at context loss');
			homeScene?.dispose();
			homeScene = null;
		};
		const onContextRestored = (): void => {
			// Dev-only: a report of the scene staying black after backgrounding/devtools with no error in
			// between means either this event never fired at all (nothing logs between the loss and
			// whenever the tab was checked again) or it fired but buildScene() bailed (see its own log).
			if (import.meta.env.DEV) console.log('[gpu] webglcontextrestored fired');
			buildScene();
		};
		// Only fires on an actual creation *failure* (e.g. the browser trying and failing to recreate a
		// context after a loss) — see logContextCreationError's own comment. This is the one piece of
		// driver-supplied diagnostic text WebGL gives out at all; nothing here was capturing it before.
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
			// Threlte's own <Canvas> cleanup calls renderer.dispose() right after this, but dispose()
			// alone doesn't release the underlying WebGL context — only the canvas element getting
			// garbage-collected does, and GC timing isn't guaranteed. Repeated navigation to/from /home
			// piles up not-yet-collected contexts until the browser hits its per-page context limit
			// ("Could not create a WebGL context ... GL_VENDOR = Disabled"). forceContextLoss() frees it
			// immediately and deterministically instead of waiting on GC.
			try {
				renderer.forceContextLoss();
			} catch {
				// Best-effort cleanup — nothing else to do if the renderer's already in a bad state.
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

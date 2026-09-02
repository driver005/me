<script lang="ts">
	import { onMount } from 'svelte';
	import { T, useTask, useThrelte } from '@threlte/core';
	import * as THREE from 'three';
	import { PLANET_VERTEX, PLANET_FRAGMENT } from './planet-shaders';
	import { RevealTrail } from './reveal-trail';

	const ASSET_BASE = '/sites/segerman-dev-86ede42f/root-7944de32';

	let {
		position = [0, 0, 0],
		scale = 50,
		interactive = false,
		uRimPow = 4.5,
		uGlowPow = 3.2,
		uGlowStr = 1,
		uRimStr = 0.9,
		uGlowBiasX = -0.6,
		uTerrainScale = 3.9,
	}: {
		position?: [number, number, number];
		scale?: number;
		interactive?: boolean;
		uRimPow?: number;
		uGlowPow?: number;
		uGlowStr?: number;
		uRimStr?: number;
		uGlowBiasX?: number;
		uTerrainScale?: number;
	} = $props();

	const { renderer, camera } = useThrelte();

	let sphereGeo: THREE.SphereGeometry | undefined = $state();
	let mesh: THREE.Mesh | undefined = $state();
	let trail: RevealTrail | null = null;
	let raycaster = new THREE.Raycaster();
	let pointerNDC = new THREE.Vector2(0, 0);
	let mouseWorld = new THREE.Vector3(0, 0, 1000);
	let mouseWorldTarget = new THREE.Vector3(0, 0, 1000);
	let mouseHover = 0;
	let mouseHoverTarget = 0;

	const uniforms: Record<string, { value: unknown }> = {
		tMap: { value: null },
		tCracked: { value: null },
		tCrackedNormal: { value: null },
		uTrailMap: { value: null },
		uColor: { value: new THREE.Color(0x00060a).convertLinearToSRGB() },
		uTime: { value: 0 },
		uMode: { value: 1 },
		uIsMobile: { value: 0 },
		uIsIntro: { value: 0 },
		uRimPow: { value: uRimPow },
		uGlowPow: { value: uGlowPow },
		uGlowStr: { value: uGlowStr },
		uRimStr: { value: uRimStr },
		uLightColor: { value: new THREE.Color('#81aeca') },
		uDarkColor: { value: new THREE.Color('#436eb1') },
		uLightStart: { value: 0.4 },
		uLightEnd: { value: 1 },
		uGlowBiasX: { value: uGlowBiasX },
		uGlowBiasY: { value: 0 },
		uBiasGlowStr: { value: 1.5 },
		uBiasGlowPow: { value: 7 },
		uCrackStr: { value: 2 },
		uNormalStr: { value: 1.2 },
		uCrackActive: { value: 0 },
		uMouseWorld: { value: mouseWorld },
		uMouseRadius: { value: 0.9 },
		uMouseStrength: { value: 0 },
		uTerrainScale: { value: uTerrainScale },
		uTerrainHeight: { value: 0.7 },
		uTerrainDetail: { value: 1.5 },
		uTerrainTime: { value: 0 },
	};

	onMount(() => {
		if (sphereGeo) sphereGeo.computeTangents();

		const placeholder = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
		placeholder.needsUpdate = true;
		uniforms.uTrailMap.value = placeholder;

		const loader = new THREE.TextureLoader();
		loader.load(`${ASSET_BASE}/textures/planet.webp`, (tex) => {
			tex.colorSpace = THREE.SRGBColorSpace;
			uniforms.tMap.value = tex;
		});
		loader.load(`${ASSET_BASE}/textures/cracked.webp`, (tex) => {
			tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
			uniforms.tCracked.value = tex;
		});
		loader.load(`${ASSET_BASE}/textures/cracked-normal.webp`, (tex) => {
			tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
			uniforms.tCrackedNormal.value = tex;
		});

		if (!interactive) return;

		trail = new RevealTrail(renderer);
		uniforms.uTrailMap.value = trail.texture;

		const onMove = (e: PointerEvent) => {
			pointerNDC.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
		};
		window.addEventListener('pointermove', onMove, { passive: true });
		return () => {
			window.removeEventListener('pointermove', onMove);
			trail?.dispose();
			trail = null;
		};
	});

	useTask((delta) => {
		(uniforms.uTime.value as number) += delta;
		(uniforms.uTerrainTime.value as number) += delta * 0.001 * 100; // matches their terrainTime += n*0.001*speed with speed~0.1, scaled for a delta-in-seconds task

		if (interactive && mesh) {
			raycaster.setFromCamera(pointerNDC, camera.current);
			const hits = raycaster.intersectObject(mesh);
			if (hits.length > 0 && hits[0].uv) {
				mouseWorldTarget.copy(hits[0].point);
				mouseHoverTarget = 1;
				trail?.setMouse(hits[0].uv.x, 1 - hits[0].uv.y, true);
			} else {
				mouseHoverTarget = 0;
				trail?.setInactive();
			}

			mouseHover += (mouseHoverTarget - mouseHover) * 0.04;
			if (mouseHoverTarget === 1) mouseWorld.lerp(mouseWorldTarget, 0.06);

			uniforms.uCrackActive.value = 1;
			uniforms.uMouseStrength.value = mouseHover * 0.9;

			trail?.step();
			uniforms.uTrailMap.value = trail?.texture ?? uniforms.uTrailMap.value;
		}
	});
</script>

<T.Mesh bind:ref={mesh} position={position} scale={scale} frustumCulled={false}>
	<T.SphereGeometry bind:ref={sphereGeo} args={[1, 64, 64]} />
	<T.ShaderMaterial vertexShader={PLANET_VERTEX} fragmentShader={PLANET_FRAGMENT} {uniforms} />
</T.Mesh>

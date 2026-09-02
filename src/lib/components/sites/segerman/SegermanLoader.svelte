<script lang="ts">
	import { onMount } from 'svelte';
	import { Canvas, T } from '@threlte/core';
	import MoonMesh from './MoonMesh.svelte';
	import { SEGERMAN_WORKS } from './data';

	let { done = $bindable(false) }: { done?: boolean } = $props();

	let progress = $state(0); // real, from asset loads
	let displayProgress = $state(0); // eased toward `progress`, what we show
	let fading = $state(false);
	let webglOk = $state(true);

	const VERTEX = /* glsl */ `
		varying vec3 vNormal;
		varying vec3 vWorldPos;
		void main () {
			vNormal = normalize(normalMatrix * normal);
			vec4 worldPos = modelMatrix * vec4(position, 1.0);
			vWorldPos = worldPos.xyz;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`;

	// Fresnel rim/corona term adapted from segerman.dev's own "moon" fragment
	// shader (world.js) — texture/crack-reveal inputs stripped since those
	// PNGs weren't part of the scrape; the glow math itself is verbatim.
	const FRAGMENT = /* glsl */ `
		varying vec3 vNormal;
		varying vec3 vWorldPos;
		uniform vec3 uColor;
		uniform vec3 uLightColor;
		uniform vec3 uDarkColor;
		uniform float uRimPow;
		uniform float uGlowPow;
		uniform float uRimStr;
		uniform float uGlowStr;
		uniform float uLightStart;
		uniform float uLightEnd;
		void main () {
			vec3 viewDir = normalize(cameraPosition - vWorldPos);
			float NdotV = max(dot(vNormal, viewDir), 0.0);
			float fresnel = 1.0 - NdotV;
			float rim = pow(fresnel, uRimPow);
			float glow = pow(fresnel, uGlowPow);
			float warmth = vNormal.y * 0.5 + 0.5;
			vec3 rimColor = mix(uDarkColor, uLightColor, smoothstep(uLightStart, uLightEnd, warmth));
			vec3 corona = rimColor * glow * uGlowStr + rimColor * rim * uRimStr;
			gl_FragColor = vec4(uColor + corona, 1.0);
		}
	`;

	const uniforms = {
		uColor: { value: [0.0, 0.01, 0.06] },
		uLightColor: { value: [0.45, 0.68, 1.0] },
		uDarkColor: { value: [0.0, 0.005, 0.03] },
		uRimPow: { value: 3.0 },
		uGlowPow: { value: 2.2 },
		uRimStr: { value: 1.6 },
		uGlowStr: { value: 1.0 },
		uLightStart: { value: 0.1 },
		uLightEnd: { value: 0.8 },
	};

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			webglOk = false;
		}
		try {
			const test = document.createElement('canvas').getContext('webgl2');
			if (!test) webglOk = false;
		} catch {
			webglOk = false;
		}

		const tasks: Promise<unknown>[] = [];
		for (const work of SEGERMAN_WORKS) {
			tasks.push(
				new Promise((resolve) => {
					const img = new Image();
					img.onload = img.onerror = resolve;
					img.src = work.image;
				}),
			);
		}
		tasks.push(document.fonts.ready.catch(() => {}));

		let finished = 0;
		const total = tasks.length;
		progress = total === 0 ? 100 : 0;
		tasks.forEach((t) =>
			t.then(() => {
				finished += 1;
				progress = Math.round((finished / total) * 100);
			}),
		);

		const start = performance.now();
		let raf = 0;
		const tick = () => {
			displayProgress += (progress - displayProgress) * 0.08;
			if (progress >= 100 && displayProgress > 99.3 && performance.now() - start > 600) {
				displayProgress = 100;
				fading = true;
				setTimeout(() => (done = true), 500);
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<div class="loader" class:is-fading={fading} aria-hidden="true">
	{#if webglOk}
		<div class="loader-canvas">
			<Canvas>
				<T.PerspectiveCamera makeDefault position={[0.9, 0.3, 1.55]} fov={38} lookAt={[0, 0, 0]} />
				<MoonMesh vertexShader={VERTEX} fragmentShader={FRAGMENT} {uniforms} />
			</Canvas>
		</div>
	{/if}

	<div class="loader-overlay">
		<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" class="loader-moon">
			<path
				d="M6 0C6.36 0 6.72 0.03 7.06 0.09C5.76 0.42 4.8 1.6 4.8 3C4.8 4.66 6.14 6 7.8 6C9.46 6 10.8 4.66 10.8 3C10.8 2.75 10.77 2.52 10.71 2.29C11.52 3.31 12 4.6 12 6C12 9.31 9.31 12 6 12C2.69 12 0 9.31 0 6C0 2.69 2.69 0 6 0Z"
				fill="white"
			/>
		</svg>
		<span class="loader-pct">{Math.round(displayProgress)}%</span>
	</div>
</div>

<style>
	.loader {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: #030712;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 0.5s ease;
	}
	.loader.is-fading {
		opacity: 0;
		pointer-events: none;
	}
	.loader-canvas {
		position: absolute;
		inset: 0;
	}
	.loader-overlay {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
		font-family: sans-serif;
	}
	.loader-moon {
		width: 2.4rem;
		height: 2.4rem;
	}
	.loader-pct {
		color: #fff;
		font-size: 1.4rem;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
</style>

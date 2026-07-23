<script lang="ts">
	import * as THREE from 'three';

	let { image, onclose }: { image: { src: string } | null; onclose: () => void } = $props();

	let canvasRef: HTMLCanvasElement | null = $state(null);
	let containerRef: HTMLElement | null = $state(null);
	let webglFailed = $state(false);
	let closing = $state(false);
	const prefersReduced = typeof window !== 'undefined'
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;

	const OPEN_MS = 650;
	const CLOSE_MS = 260;
	const PEAK_STRENGTH = 0.8;

	// Ported from bizarro/infinite-webl-gallery (demo-1/vertex.glsl + fragment.glsl):
	// sine-wave Z-displacement "page-curl" bulge + aspect-correct cover-fit UV sampling.
	const vertexShader = `
		#define PI 3.14159265359
		uniform float uStrength;
		uniform vec2 uViewportSizes;
		varying vec2 vUv;
		void main() {
			vec4 newPosition = modelViewMatrix * vec4(position, 1.0);
			newPosition.z += sin(newPosition.y / uViewportSizes.y * PI + PI / 2.0) * -uStrength;
			vUv = uv;
			gl_Position = projectionMatrix * newPosition;
		}
	`;

	const fragmentShader = `
		precision highp float;
		uniform vec2 uImageSizes;
		uniform vec2 uPlaneSizes;
		uniform sampler2D tMap;
		varying vec2 vUv;
		void main() {
			vec2 ratio = vec2(
				min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
				min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
			);
			vec2 uv = vec2(
				vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
				vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
			);
			gl_FragColor = vec4(texture2D(tMap, uv).rgb, 1.0);
		}
	`;

	function close() {
		if (closing) return;
		closing = true;
		setTimeout(onclose, prefersReduced ? 0 : CLOSE_MS);
	}

	function onKeydown(e: KeyboardEvent) {
		if (image && e.key === 'Escape') close();
	}

	$effect(() => {
		if (!image || prefersReduced) return;
		const canvas = canvasRef;
		if (!canvas?.parentElement) return;

		let isMounted = true;
		let rafId = 0;

		try {
			const container = canvas.parentElement;
			const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

			const scene = new THREE.Scene();
			const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
			camera.position.set(0, 0, 5);

			const mat = new THREE.ShaderMaterial({
				uniforms: {
					tMap: { value: null as THREE.Texture | null },
					uStrength: { value: PEAK_STRENGTH },
					uViewportSizes: { value: new THREE.Vector2(1, 1) },
					uPlaneSizes: { value: new THREE.Vector2(1, 1) },
					uImageSizes: { value: new THREE.Vector2(1, 1) }
				},
				vertexShader,
				fragmentShader,
				transparent: true
			});
			const geo = new THREE.PlaneGeometry(1, 1, 32, 32);
			const mesh = new THREE.Mesh(geo, mat);
			scene.add(mesh);

			function fitPlane(imgW: number, imgH: number) {
				const w = container.clientWidth;
				const h = container.clientHeight;
				renderer.setSize(w, h);
				camera.aspect = w / h;
				camera.updateProjectionMatrix();

				const vFOV = (camera.fov * Math.PI) / 180;
				const visibleH = 2 * Math.tan(vFOV / 2) * camera.position.z;
				const visibleW = visibleH * camera.aspect;

				const boxW = visibleW * 0.9;
				const boxH = visibleH * 0.9;
				const imgAspect = imgW / imgH;
				const boxAspect = boxW / boxH;

				const planeW = imgAspect > boxAspect ? boxW : boxH * imgAspect;
				const planeH = imgAspect > boxAspect ? boxW / imgAspect : boxH;

				mesh.scale.set(planeW, planeH, 1);
				mat.uniforms.uViewportSizes.value.set(visibleW, visibleH);
				mat.uniforms.uPlaneSizes.value.set(planeW, planeH);
				mat.uniforms.uImageSizes.value.set(imgW, imgH);
			}

			const loader = new THREE.TextureLoader();
			loader.load(
				image.src,
				(tex) => {
					if (!isMounted) return;
					tex.colorSpace = THREE.SRGBColorSpace;
					mat.uniforms.tMap.value = tex;
					fitPlane(tex.image.width, tex.image.height);
				},
				undefined,
				() => { webglFailed = true; }
			);

			const onResize = () => {
				const imgSize = mat.uniforms.uImageSizes.value as THREE.Vector2;
				if (mat.uniforms.tMap.value) fitPlane(imgSize.x, imgSize.y);
			};
			window.addEventListener('resize', onResize);

			const openStart = performance.now();
			let closeStart = 0;
			let wasClosing = false;

			const tick = () => {
				rafId = requestAnimationFrame(tick);
				if (closing && !wasClosing) {
					wasClosing = true;
					closeStart = performance.now();
				}
				if (closing) {
					const t = Math.min(1, (performance.now() - closeStart) / CLOSE_MS);
					mat.uniforms.uStrength.value = PEAK_STRENGTH * t;
				} else {
					const t = Math.min(1, (performance.now() - openStart) / OPEN_MS);
					const eased = 1 - Math.pow(1 - t, 3);
					mat.uniforms.uStrength.value = PEAK_STRENGTH * (1 - eased);
				}
				renderer.render(scene, camera);
			};
			tick();

			return () => {
				isMounted = false;
				cancelAnimationFrame(rafId);
				window.removeEventListener('resize', onResize);
				geo.dispose();
				mat.dispose();
				(mat.uniforms.tMap.value as THREE.Texture | null)?.dispose();
				renderer.dispose();
			};
		} catch (e) {
			console.warn('WebGL not supported, showing fallback:', e);
			webglFailed = true;
		}
	});
</script>

{#if image}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0A]/95"
		style:opacity={closing ? 0 : 1}
		style:transition="opacity {CLOSE_MS}ms var(--ease-out-expo)"
		onclick={(e) => { if (e.target === e.currentTarget) close(); }}
		onkeydown={onKeydown}
		role="dialog"
		aria-modal="true"
		aria-label="Image preview"
		tabindex="-1"
	>
		<button
			type="button"
			class="absolute top-4 right-4 sm:top-8 sm:right-8 z-10 font-mono text-xs uppercase tracking-[0.25em] text-[#F3F2EE] border border-[#F3F2EE]/30 rounded-full px-4 py-2 hover:bg-[#F3F2EE] hover:text-[#0A0A0A] transition-colors"
			onclick={close}
		>
			Close
		</button>
		<a
			href="/spiral"
			class="absolute top-4 right-4 sm:top-8 sm:right-8 z-10 font-mono text-xs uppercase tracking-[0.25em] text-[#F3F2EE] border border-[#F3F2EE]/30 rounded-full px-4 py-2 hover:bg-[#F3F2EE] hover:text-[#0A0A0A] transition-colors"
			style="right: calc(100px + 1rem);"
		>
			Spiral →
		</a>

		{#if webglFailed || prefersReduced}
			<img src={image.src} alt="" class="max-w-[90vw] max-h-[90vh] object-contain" />
		{:else}
			<div bind:this={containerRef} class="w-[92vw] h-[86vh]">
				<canvas bind:this={canvasRef} class="w-full h-full"></canvas>
			</div>
		{/if}
	</div>
{/if}

<svelte:window onkeydown={onKeydown} />

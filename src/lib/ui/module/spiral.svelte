<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { buildGalleryImages } from '$lib/data/gallery-images';

	const IMAGES = buildGalleryImages();
	const TOTAL = IMAGES.length;
	const CENTER = Math.floor(TOTAL / 2);

	// Deterministically mark ~30% of images as clickable
	const clickableSet = new Set<number>();
	{
		let seed = 99;
		for (let i = 0; i < TOTAL; i++) {
			seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			if (((t ^ (t >>> 14)) >>> 0) / 4294967296 < 0.3) clickableSet.add(i);
		}
	}
	const VERTICAL_GAP = 0.5;
	const ANGLE_GAP = 0.85;
	const BASE_RADIUS = 2;
	const MIN_WHEEL_SPEED = 0.002;
	const EASING = 0.1;

	let canvasRef: HTMLCanvasElement | null = $state(null);
	let webglFailed = $state(false);
	const prefersReduced = typeof window !== 'undefined'
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;

	const vertexShader = `
		varying vec2 vUv;
		varying vec3 vWorldPosition;
		#define PI 3.14159265359

		uniform float uScrollSpeed;

		void main() {
			vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
			vec3 newPosition = position;
			newPosition.z = sin(uv.x * PI) * 0.2;

			vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
			vec4 viewPosition = viewMatrix * modelPosition;
			viewPosition.x += pow(worldPosition.y, 2.0) * 0.1;
			viewPosition.x += sin(uv.y * PI) * uScrollSpeed * 2.0;
			vec4 projectedPosition = projectionMatrix * viewPosition;
			gl_Position = projectedPosition;

			vUv = uv;
		}
	`;

	const fragmentShader = `
		uniform sampler2D uTexture;
		uniform float uColorStrength;
		uniform float uZoom;
		uniform vec2 uPlaneSizes;
		uniform vec2 uImageSizes;
		uniform float uRevealProgress;

		varying vec2 vUv;

		float roundedRectSDF(vec2 uv, vec2 size, float radius) {
			vec2 d = abs(uv - 0.5) - size * 0.5 + radius;
			return length(max(d, 0.0)) - radius;
		}

		void main() {
			vec2 ratio = vec2(
				min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
				min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
			);

			vec2 uv = vec2(
				vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
				vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
			);

			vec2 zoomedUv = (uv - 0.5) / uZoom + 0.5;

			vec4 color;

			if (gl_FrontFacing) {
				color = texture2D(uTexture, zoomedUv);
				color = mix(color, vec4(0.0, 0.0, 0.0, 1.0), uColorStrength);
			} else {
				float offset = 40.0 / 1024.0;
				vec4 c = vec4(0.0);
				c += texture2D(uTexture, uv + vec2(-offset, -offset)) * 1.0;
				c += texture2D(uTexture, uv + vec2( 0.0,    -offset)) * 2.0;
				c += texture2D(uTexture, uv + vec2( offset, -offset)) * 1.0;
				c += texture2D(uTexture, uv + vec2(-offset,  0.0))    * 2.0;
				c += texture2D(uTexture, uv)                          * 4.0;
				c += texture2D(uTexture, uv + vec2( offset,  0.0))    * 2.0;
				c += texture2D(uTexture, uv + vec2(-offset,  offset)) * 1.0;
				c += texture2D(uTexture, uv + vec2( 0.0,     offset)) * 2.0;
				c += texture2D(uTexture, uv + vec2( offset,  offset)) * 1.0;
				c /= 16.0;
				color = c;
			}

			float reveal = clamp(uRevealProgress, 0.0, 1.0);
			vec2 revealSize = vec2(reveal);
			float baseRadius = 0.05;
			float radius = baseRadius * reveal;
			float sdf = roundedRectSDF(vUv, revealSize, radius);
			float edge = 0.002;
			float alpha = 1.0 - smoothstep(0.0, edge, sdf);
			alpha *= smoothstep(0.1, 1.0, uRevealProgress);

			gl_FragColor = vec4(color.rgb, alpha);
		}
	`;

	interface CardState {
		mesh: THREE.Mesh;
		mat: THREE.ShaderMaterial;
		hoverProgress: number;
		hoverTarget: number;
		hiddenProgress: number;
		hiddenTarget: number;
		isHidden: boolean;
	}

	onMount(() => {
		let isMounted = true;
		const canvas = canvasRef;
		if (!canvas?.parentElement) return;

		try {
		const container = canvas.parentElement;
		const w = container.clientWidth;
		const h = container.clientHeight;

		const geo = new THREE.PlaneGeometry(1.7, 1, 8, 8);

		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
		renderer.setClearColor(0x0a0a0a, 1);
		renderer.setSize(w, h);

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 20);
		camera.position.set(0, 0, 8);

		let scrollOffset = 0;
		let wheelDelta = MIN_WHEEL_SPEED;
		let targetWheelDelta = MIN_WHEEL_SPEED;
		let wheelDirection = 1;

		const cardStates: CardState[] = [];

		let rafId: number;
		let lastTime = performance.now();

		const tick = () => {
			rafId = requestAnimationFrame(tick);
			const now = performance.now();
			const delta = (now - lastTime) / 1000;
			lastTime = now;

			wheelDelta += (targetWheelDelta - wheelDelta) * EASING;
			scrollOffset += wheelDelta;
			if (Math.abs(targetWheelDelta) < MIN_WHEEL_SPEED) {
				targetWheelDelta = wheelDirection * MIN_WHEEL_SPEED;
			}
			targetWheelDelta *= 0.9;

			for (let i = 0; i < cardStates.length; i++) {
				const cs = cardStates[i];
				if (!cs) continue;

				// hover easing
				const hoverRate = cs.hoverTarget > 0 ? 0.09 : 0.07;
				const hoverEase = 1 - Math.pow(1 - hoverRate, delta * 200);
				cs.hoverProgress += (cs.hoverTarget - cs.hoverProgress) * hoverEase;

				// hidden easing
				const hiddenEase = 1 - Math.pow(1 - 0.05, delta * 150);
				cs.hiddenProgress += (cs.hiddenTarget - cs.hiddenProgress) * hiddenEase;

				// position
				const hideSign = cs.isHidden ? 1.5 : -1.5;
				let ws = i - scrollOffset;
				ws = ((ws % TOTAL) + TOTAL) % TOTAL;
				const Ba = ws - CENTER;
				const Va = Ba * VERTICAL_GAP - 0.8 - cs.hiddenProgress * hideSign;
				const Ga = BASE_RADIUS * (1 - cs.hiddenProgress / 2);
				const Ha = Ba * ANGLE_GAP;

				cs.mesh.position.set(Math.cos(Ha) * Ga, Va, Math.sin(Ha) * Ga);
				cs.mesh.rotation.y = -Ha + Math.PI / 2;

				// uniforms
				const u = cs.mat.uniforms;
				u.uColorStrength.value = 0.55 * cs.hoverProgress;
				u.uZoom.value = 1 + 0.05 * cs.hoverProgress;
				u.uRevealProgress.value = (1 - cs.hoverProgress * 0.05) * (1 - cs.hiddenProgress);
				u.uScrollSpeed.value = wheelDelta;
			}

			renderer.render(scene, camera);
		};
		tick();

		const onWheel = (e: WheelEvent) => {
			if (prefersReduced) return;
			targetWheelDelta = THREE.MathUtils.clamp(
				targetWheelDelta + e.deltaY * 15e-5,
				-2, 2
			);
			wheelDirection = e.deltaY > 0 ? 1 : -1;
		};
		canvas.addEventListener('wheel', onWheel, { passive: true });

		const onResize = () => {
			const cw = container.clientWidth;
			const ch = container.clientHeight;
			camera.aspect = cw / ch;
			camera.updateProjectionMatrix();
			renderer.setSize(cw, ch);
		};
		window.addEventListener('resize', onResize);

		// Raycaster and hover state (declared here, populated after textures load)
		const raycaster = new THREE.Raycaster();
		const mouse = new THREE.Vector2();
		let hoveredIndex = -1;

		const onPointerMove = (e: PointerEvent) => {
			const rect = canvas.getBoundingClientRect();
			mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(mouse, camera);
			const meshes = cardStates.map(cs => cs.mesh);
			const hits = raycaster.intersectObjects(meshes);
			const newHoveredIndex = hits.length > 0 ? meshes.indexOf(hits[0].object as THREE.Mesh) : -1;
			if (newHoveredIndex !== hoveredIndex) {
				if (hoveredIndex >= 0 && cardStates[hoveredIndex]) cardStates[hoveredIndex].hoverTarget = 0;
				if (newHoveredIndex >= 0 && cardStates[newHoveredIndex]) cardStates[newHoveredIndex].hoverTarget = 1;
				hoveredIndex = newHoveredIndex;
			canvas.style.cursor = newHoveredIndex >= 0 && clickableSet.has(newHoveredIndex) ? 'pointer' : 'default';
			}
		};
		canvas.addEventListener('pointermove', onPointerMove);

		const onPointerClick = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(mouse, camera);
			const meshes = cardStates.map(cs => cs.mesh);
			const hits = raycaster.intersectObjects(meshes);
			if (hits.length > 0) {
				const idx = meshes.indexOf(hits[0].object as THREE.Mesh);
				if (idx >= 0 && idx < IMAGES.length && clickableSet.has(idx)) {
					window.open(IMAGES[idx].src, '_blank', 'noopener,noreferrer');
				}
			}
		};
		canvas.addEventListener('click', onPointerClick);

		// Load all gallery textures, then create cards
		const loader = new THREE.TextureLoader();
		const textures: THREE.Texture[] = new Array(IMAGES.length);
		let loadedTextures: THREE.Texture[] = [];
		let loadedCount = 0;
		const timeoutIds: ReturnType<typeof setTimeout>[] = [];

		const onAllTexturesLoaded = () => {
			if (!isMounted) return;
			loadedTextures = textures;
			for (let i = 0; i < TOTAL; i++) {
				const tex = textures[i % IMAGES.length];
				const imgW = tex.image?.width ?? 1024;
				const imgH = tex.image?.height ?? 683;
				const mat = new THREE.ShaderMaterial({
					uniforms: {
						uTexture: { value: tex },
						uColorStrength: { value: 0 },
						uZoom: { value: 1 },
						uPlaneSizes: { value: new THREE.Vector2(1.7, 1) },
						uImageSizes: { value: new THREE.Vector2(imgW, imgH) },
						uRevealProgress: { value: 0 },
						uScrollSpeed: { value: 0 },
					},
					vertexShader,
					fragmentShader,
					transparent: true,
					side: THREE.DoubleSide,
				});
				const mesh = new THREE.Mesh(geo, mat);
				scene.add(mesh);

				cardStates.push({
					mesh, mat,
					hoverProgress: 0, hoverTarget: 0,
					hiddenProgress: 1, hiddenTarget: 1,
					isHidden: true,
				});

				// staggered reveal delay: (i % 4) * 50ms
				timeoutIds.push(setTimeout(() => {
					const cs = cardStates[i];
					if (cs) { cs.hiddenTarget = 0; cs.isHidden = false; }
				}, (i % 4) * 50));
			}
		};

		IMAGES.forEach((img, idx) => {
			loader.load(img.src, (tex) => {
				tex.colorSpace = THREE.SRGBColorSpace;
				textures[idx] = tex;
				loadedCount++;
				if (loadedCount === IMAGES.length) {
					onAllTexturesLoaded();
				}
			});
		});

		return () => {
			isMounted = false;
			cancelAnimationFrame(rafId);
			timeoutIds.forEach(id => clearTimeout(id));
			canvas.removeEventListener('wheel', onWheel);
			canvas.removeEventListener('pointermove', onPointerMove);
			canvas.removeEventListener('click', onPointerClick);
			window.removeEventListener('resize', onResize);
			cardStates.forEach(cs => {
				cs.mat.dispose();
			});
			loadedTextures.forEach(t => t.dispose());
			geo.dispose();
			renderer.dispose();
		};
		} catch (e) {
			console.warn('WebGL not supported, showing fallback:', e);
			webglFailed = true;
			return () => { isMounted = false; };
		}
	});
</script>

<section
	id="spiral"
	data-testid="spiral-section"
	class="relative bg-[#0A0A0A] text-[#F3F2EE] border-b border-black overflow-hidden"
>

	<div class="relative h-screen w-full">
		{#if webglFailed}
			<div class="absolute inset-0 z-0 flex items-center justify-center bg-[#0A0A0A]">
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-8 max-w-4xl overflow-auto max-h-full">
					{#each IMAGES as img}
						<div class="border border-[#F3F2EE]/20 p-3">
							<img src={img.src} alt="" class="w-full aspect-[3/2] object-cover mb-2" loading="lazy" />
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<canvas
				bind:this={canvasRef}
				class="absolute inset-0 z-0 w-full h-full"
			></canvas>
		{/if}

		<div class="absolute bottom-10 left-1/2 -translate-x-1/2 z-30">
			<div class="font-mono text-[10px] uppercase tracking-[0.3em] px-4 py-2 border border-[#F3F2EE]/30 rounded-full text-[#F3F2EE]/80 backdrop-blur-sm">
				{m['spiral.meta_hint']()}
			</div>
		</div>

		<div class="absolute inset-0 z-20 pointer-events-none" style="background: radial-gradient(ellipse at center, transparent 35%, rgba(10,10,10,0.85) 100%);"></div>
		<div class="absolute bottom-0 left-0 right-0 pointer-events-none z-30" style="height: 38%; background: linear-gradient(to bottom, transparent, #0A0A0A);"></div>
	</div>
</section>

<script lang="ts">
	import { browser } from '$app/environment';
	import * as THREE from 'three';
	import {
		CHUNK_SIZE,
		RENDER_DISTANCE,
		CHUNK_FADE_MARGIN,
		DEPTH_FADE_START,
		DEPTH_FADE_END,
		INITIAL_CAMERA_Z,
		INVIS_THRESHOLD,
		KEYBOARD_SPEED,
		VELOCITY_LERP,
		VELOCITY_DECAY,
		MAX_VELOCITY,
		PAN_SENSITIVITY,
		TOUCH_SENSITIVITY,
		SCROLL_SENSITIVITY,
		SCROLL_DECAY,
		DRIFT_AMOUNT,
		DRIFT_LERP,
		DRIFT_LERP_ZOOMING,
		PLANE_OPACITY_LERP,
		ITEMS_PER_CHUNK,
		CHUNK_OFFSETS,
		clamp,
		lerp,
		createInitialState,
		generateChunkPlanesCached,
		getChunkUpdateThrottleMs,
		shouldThrottleUpdate,
		getTouchDistance,
		type PlaneData,
		type CameraGridState,
		type CanvasState
	} from '$lib/util/infinite-canvas-utils';

	let containerEl: HTMLElement | null = $state(null);
	let canvasEl: HTMLCanvasElement | null = $state(null);

	let renderer: THREE.WebGLRenderer | null = null;
	let scene: THREE.Scene | null = null;
	let camera: THREE.PerspectiveCamera | null = null;
	let animationId = 0;
	let isDragging = $state(false);

	const PLANE_GEOMETRY = new THREE.PlaneGeometry(1, 1);

	const textureLoader = new THREE.TextureLoader();
	const textureCache = new Map<string, THREE.Texture>();

	// Texture URLs from the portfolio, with their real pixel dimensions
	// (screenshots are tall/portrait, not 16:9 — aspect must come from real size)
	const textureSources: { url: string; width: number; height: number }[] = [
		{ url: '/images/works/teclab-preview.png', width: 1280, height: 1928 },
		{ url: '/images/works/hhmodle-preview.png', width: 1280, height: 1218 },
		{ url: '/images/works/congelado-preview.png', width: 1280, height: 1828 },
		{ url: '/images/works/blog-preview.png', width: 1280, height: 3855 },
		{ url: '/images/works/me-preview.png', width: 1280, height: 2582 },
		{ url: '/images/works/fuzzyboard-preview.png', width: 1280, height: 5400 }
	];
	const textureUrls = textureSources.map((s) => s.url);

	function getTexture(url: string): THREE.Texture {
		const cached = textureCache.get(url);
		if (cached) return cached;
		const tex = textureLoader.load(url);
		tex.minFilter = THREE.LinearMipmapLinearFilter;
		tex.magFilter = THREE.LinearFilter;
		tex.generateMipmaps = true;
		tex.anisotropy = 4;
		tex.colorSpace = THREE.SRGBColorSpace;
		textureCache.set(url, tex);
		return tex;
	}

	// Mutable controller state (not reactive — mutated in rAF loop)
	let _ctrl: CanvasState;
	let _cameraGrid: CameraGridState;
	const _chunkMeshes = new Map<string, THREE.Mesh[]>();
	let _pendingChunks: { cx: number; cy: number; cz: number } | null = null;
	let _lastChunkKey = '';
	let _lastChunkUpdate = 0;

	// Plane _ctrl for per-frame culling
	const _planeStates = new Map<string, { opacity: number; mesh: THREE.Mesh; planeData: PlaneData; chunkCx: number; chunkCy: number; chunkCz: number }>();

	function createMeshesForChunk(cx: number, cy: number, cz: number): THREE.Mesh[] {
		const planes = generateChunkPlanesCached(cx, cy, cz);
		const meshes: THREE.Mesh[] = [];

		for (const pd of planes) {
			const urlIndex = Math.abs(pd.textureIndex) % textureUrls.length;
			const tex = getTexture(textureUrls[urlIndex]);

			const source = textureSources[urlIndex];
			const aspect = source.width / source.height;
			const displayScale = new THREE.Vector3(pd.scale.y * aspect, pd.scale.y, 1);

			const material = new THREE.MeshBasicMaterial({
				map: tex,
				transparent: true,
				opacity: 0,
				side: THREE.DoubleSide
			});

			const mesh = new THREE.Mesh(PLANE_GEOMETRY, material);
			mesh.position.copy(pd.position);
			mesh.scale.copy(displayScale);
			mesh.visible = false;
			scene!.add(mesh);

			meshes.push(mesh);
			_planeStates.set(pd.id, {
				opacity: 0,
				mesh,
				planeData: pd,
				chunkCx: cx,
				chunkCy: cy,
				chunkCz: cz
			});
		}

		return meshes;
	}

	function removeChunkMeshes(cx: number, cy: number, cz: number) {
		const key = `${cx},${cy},${cz}`;
		const existing = _chunkMeshes.get(key);
		if (existing) {
			for (const mesh of existing) {
				scene?.remove(mesh);
				(mesh.material as THREE.Material).dispose();
				// Remove from _planeStates
				_planeStates.forEach((v, k) => {
					if (v.mesh === mesh) _planeStates.delete(k);
				});
			}
			_chunkMeshes.delete(key);
		}
	}

	function setChunks(newChunks: { cx: number; cy: number; cz: number }[]) {
		const newKeys = new Set(newChunks.map((c) => `${c.cx},${c.cy},${c.cz}`));

		// Remove old chunks not in new set
		for (const [key] of _chunkMeshes) {
			if (!newKeys.has(key)) {
				const [cx, cy, cz] = key.split(',').map(Number);
				removeChunkMeshes(cx, cy, cz);
			}
		}

		// Add new chunks
		for (const c of newChunks) {
			const key = `${c.cx},${c.cy},${c.cz}`;
			if (!_chunkMeshes.has(key)) {
				const meshes = createMeshesForChunk(c.cx, c.cy, c.cz);
				_chunkMeshes.set(key, meshes);
			}
		}
	}

	function updatePerPlaneVisibility() {
		const cam = _cameraGrid;

		_planeStates.forEach((ps) => {
			const mesh = ps.mesh;
			const pd = ps.planeData;

			if (!mesh.visible && ps.opacity < INVIS_THRESHOLD) return;

			const dist = Math.max(
				Math.abs(ps.chunkCx - cam.cx),
				Math.abs(ps.chunkCy - cam.cy),
				Math.abs(ps.chunkCz - cam.cz)
			);
			const absDepth = Math.abs(pd.position.z - cam.camZ);

			if (absDepth > DEPTH_FADE_END + 50) {
				ps.opacity = 0;
				(mesh.material as THREE.MeshBasicMaterial).opacity = 0;
				mesh.visible = false;
				return;
			}

			const gridFade =
				dist <= RENDER_DISTANCE
					? 1
					: Math.max(0, 1 - (dist - RENDER_DISTANCE) / Math.max(CHUNK_FADE_MARGIN, 0.0001));

			const depthFade =
				absDepth <= DEPTH_FADE_START
					? 1
					: Math.max(
							0,
							1 -
								(absDepth - DEPTH_FADE_START) /
									Math.max(DEPTH_FADE_END - DEPTH_FADE_START, 0.0001)
					  );

			const target = Math.min(gridFade, depthFade * depthFade);

			ps.opacity =
				target < INVIS_THRESHOLD && ps.opacity < INVIS_THRESHOLD
					? 0
					: lerp(ps.opacity, target, PLANE_OPACITY_LERP);

			const mat = mesh.material as THREE.MeshBasicMaterial;
			const isFullyOpaque = ps.opacity > 0.99;
			mat.opacity = isFullyOpaque ? 1 : ps.opacity;
			mat.depthWrite = isFullyOpaque;
			mesh.visible = ps.opacity > INVIS_THRESHOLD;
		});
	}

	function animate(time: number) {
		if (!camera || !renderer || !scene) {
			animationId = requestAnimationFrame(animate);
			return;
		}

		if (keysDown.has('forward')) _ctrl.targetVel.z -= KEYBOARD_SPEED;
		if (keysDown.has('backward')) _ctrl.targetVel.z += KEYBOARD_SPEED;
		if (keysDown.has('left')) _ctrl.targetVel.x -= KEYBOARD_SPEED;
		if (keysDown.has('right')) _ctrl.targetVel.x += KEYBOARD_SPEED;
		if (keysDown.has('down')) _ctrl.targetVel.y -= KEYBOARD_SPEED;
		if (keysDown.has('up')) _ctrl.targetVel.y += KEYBOARD_SPEED;

		const isZooming = Math.abs(_ctrl.velocity.z) > 0.05;
		const zoomFactor = clamp(camera.position.z / 50, 0.3, 2.0);
		const driftAmount = DRIFT_AMOUNT * zoomFactor;
		const driftLerp = isZooming ? DRIFT_LERP_ZOOMING : DRIFT_LERP;

		if (_ctrl.isDragging) {
			// Freeze drift during drag
		} else {
			_ctrl.drift.x = lerp(_ctrl.drift.x, _ctrl.mouse.x * driftAmount, driftLerp);
			_ctrl.drift.y = lerp(_ctrl.drift.y, _ctrl.mouse.y * driftAmount, driftLerp);
		}

		_ctrl.targetVel.z += _ctrl.scrollAccum;
		_ctrl.scrollAccum *= SCROLL_DECAY;

		_ctrl.targetVel.x = clamp(_ctrl.targetVel.x, -MAX_VELOCITY, MAX_VELOCITY);
		_ctrl.targetVel.y = clamp(_ctrl.targetVel.y, -MAX_VELOCITY, MAX_VELOCITY);
		_ctrl.targetVel.z = clamp(_ctrl.targetVel.z, -MAX_VELOCITY, MAX_VELOCITY);

		_ctrl.velocity.x = lerp(_ctrl.velocity.x, _ctrl.targetVel.x, VELOCITY_LERP);
		_ctrl.velocity.y = lerp(_ctrl.velocity.y, _ctrl.targetVel.y, VELOCITY_LERP);
		_ctrl.velocity.z = lerp(_ctrl.velocity.z, _ctrl.targetVel.z, VELOCITY_LERP);

		_ctrl.basePos.x += _ctrl.velocity.x;
		_ctrl.basePos.y += _ctrl.velocity.y;
		_ctrl.basePos.z += _ctrl.velocity.z;

		camera.position.set(
			_ctrl.basePos.x + _ctrl.drift.x,
			_ctrl.basePos.y + _ctrl.drift.y,
			_ctrl.basePos.z
		);

		_ctrl.targetVel.x *= VELOCITY_DECAY;
		_ctrl.targetVel.y *= VELOCITY_DECAY;
		_ctrl.targetVel.z *= VELOCITY_DECAY;

		// Update chunk grid
		const cx = Math.floor(_ctrl.basePos.x / CHUNK_SIZE);
		const cy = Math.floor(_ctrl.basePos.y / CHUNK_SIZE);
		const cz = Math.floor(_ctrl.basePos.z / CHUNK_SIZE);

		_cameraGrid.cx = cx;
		_cameraGrid.cy = cy;
		_cameraGrid.cz = cz;
		_cameraGrid.camZ = _ctrl.basePos.z;

		const key = `${cx},${cy},${cz}`;
		if (key !== _lastChunkKey) {
			_pendingChunks = { cx, cy, cz };
			_lastChunkKey = key;
		}

		const now = performance.now();
		const throttleMs = getChunkUpdateThrottleMs(isZooming, Math.abs(_ctrl.velocity.z));

		if (_pendingChunks && shouldThrottleUpdate(_lastChunkUpdate, throttleMs, now)) {
			const { cx: ucx, cy: ucy, cz: ucz } = _pendingChunks;
			_pendingChunks = null;
			_lastChunkUpdate = now;

			const chunks = CHUNK_OFFSETS.map((o) => ({
				cx: ucx + o.dx,
				cy: ucy + o.dy,
				cz: ucz + o.dz
			}));

			setChunks(chunks);
		}

		updatePerPlaneVisibility();

		renderer.render(scene, camera);
		animationId = requestAnimationFrame(animate);
	}

	function onResize() {
		if (!renderer || !camera) return;
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	function onPointerDown(e: PointerEvent) {
		_ctrl.isDragging = true;
		_ctrl.lastMouse.set(e.clientX, e.clientY);
		isDragging = true;
	}

	function onPointerMove(e: PointerEvent) {
		_ctrl.mouse.set(
			(e.clientX / window.innerWidth) * 2 - 1,
			-(e.clientY / window.innerHeight) * 2 + 1
		);
		if (_ctrl.isDragging) {
			_ctrl.targetVel.x -= (e.clientX - _ctrl.lastMouse.x) * PAN_SENSITIVITY;
			_ctrl.targetVel.y += (e.clientY - _ctrl.lastMouse.y) * PAN_SENSITIVITY;
			_ctrl.lastMouse.set(e.clientX, e.clientY);
		}
	}

	function onPointerUp() {
		_ctrl.isDragging = false;
		isDragging = false;
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		_ctrl.scrollAccum += e.deltaY * SCROLL_SENSITIVITY;
	}

	function onTouchStart(e: TouchEvent) {
		e.preventDefault();
		_ctrl.lastTouches = Array.from(e.touches) as Touch[];
		_ctrl.lastTouchDist = getTouchDistance(_ctrl.lastTouches);
	}

	function onTouchMove(e: TouchEvent) {
		e.preventDefault();
		const touches = Array.from(e.touches) as Touch[];
		if (touches.length === 1 && _ctrl.lastTouches.length >= 1) {
			const touch = touches[0];
			const last = _ctrl.lastTouches[0];
			if (touch && last) {
				_ctrl.targetVel.x -= (touch.clientX - last.clientX) * TOUCH_SENSITIVITY;
				_ctrl.targetVel.y += (touch.clientY - last.clientY) * TOUCH_SENSITIVITY;
			}
		} else if (touches.length === 2 && _ctrl.lastTouchDist > 0) {
			const dist = getTouchDistance(touches);
			_ctrl.scrollAccum += (_ctrl.lastTouchDist - dist) * SCROLL_SENSITIVITY;
			_ctrl.lastTouchDist = dist;
		}
		_ctrl.lastTouches = touches;
	}

	function onTouchEnd() {
		_ctrl.lastTouches = [];
		_ctrl.lastTouchDist = 0;
	}

	const KEY_MAP: Record<string, 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down'> = {
		w: 'forward',
		arrowup: 'forward',
		s: 'backward',
		arrowdown: 'backward',
		a: 'left',
		arrowleft: 'left',
		d: 'right',
		arrowright: 'right',
		e: 'up',
		q: 'down'
	};
	const keysDown = new Set<string>();

	function onKeyDown(e: KeyboardEvent) {
		const action = KEY_MAP[e.key.toLowerCase()];
		if (action) keysDown.add(action);
	}

	function onKeyUp(e: KeyboardEvent) {
		const action = KEY_MAP[e.key.toLowerCase()];
		if (action) keysDown.delete(action);
	}

	function isTouchDevice(): boolean {
		return (
			'ontouchstart' in window ||
			navigator.maxTouchPoints > 0 ||
			(window.matchMedia?.('(pointer: coarse)').matches ?? false)
		);
	}

	$effect(() => {
		if (!browser || !containerEl || !canvasEl) return;

		_ctrl = createInitialState(INITIAL_CAMERA_Z);
		_cameraGrid = { cx: 0, cy: 0, cz: 0, camZ: INITIAL_CAMERA_Z };

		// Scene setup
		scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2(0x0a0a0a, 0.008);

		camera = new THREE.PerspectiveCamera(
			60,
			window.innerWidth / window.innerHeight,
			1,
			500
		);
		camera.position.set(0, 0, INITIAL_CAMERA_Z);

		renderer = new THREE.WebGLRenderer({
			canvas: canvasEl,
			antialias: false,
			powerPreference: 'high-performance'
		});
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouchDevice() ? 1.25 : 1.5));
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(0x0a0a0a);

		// Initial chunks
		const initialChunks = CHUNK_OFFSETS.map((o) => ({
			cx: o.dx,
			cy: o.dy,
			cz: o.dz
		}));
		setChunks(initialChunks);

		_lastChunkKey = '0,0,0';
		animationId = requestAnimationFrame(animate);
		window.addEventListener('resize', onResize);
		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('resize', onResize);
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('keyup', onKeyUp);

			// Cleanup all meshes
			_chunkMeshes.forEach((meshes, key) => {
				const [cx, cy, cz] = key.split(',').map(Number);
				removeChunkMeshes(cx, cy, cz);
			});
			_planeStates.clear();

			textureCache.forEach((tex) => tex.dispose());
			textureCache.clear();

			renderer?.dispose();
			renderer = null;
			scene = null;
			camera = null;
		};
	});
</script>

<section
	data-testid="infinite-canvas-section"
	class="relative bg-[#0A0A0A] border-b border-[#F3F2EE]/10 h-screen overflow-hidden"
>
	<span
		class="pointer-events-none absolute top-6 sm:top-10 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#F3F2EE]/40 z-20"
	>
		Infinite canvas — drag to pan, scroll to zoom
	</span>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={containerEl}
		class="absolute inset-0 touch-none select-none {isDragging ? 'cursor-grabbing' : 'cursor-grab'}"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		onpointerleave={onPointerUp}
		onwheel={onWheel}
		ontouchstart={onTouchStart}
		ontouchmove={onTouchMove}
		ontouchend={onTouchEnd}
	>
		<canvas bind:this={canvasEl} class="absolute inset-0 w-full h-full"></canvas>
	</div>
</section>

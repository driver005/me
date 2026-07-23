import * as THREE from 'three';

// --- Constants (exact from reference) ---
export const CHUNK_SIZE = 110;
export const RENDER_DISTANCE = 2;
export const CHUNK_FADE_MARGIN = 1;
export const MAX_VELOCITY = 3.2;
export const DEPTH_FADE_START = 140;
export const DEPTH_FADE_END = 260;
export const INVIS_THRESHOLD = 0.01;
export const KEYBOARD_SPEED = 0.18;
export const VELOCITY_LERP = 0.16;
export const VELOCITY_DECAY = 0.9;
export const INITIAL_CAMERA_Z = 50;
export const PAN_SENSITIVITY = 0.025;
export const TOUCH_SENSITIVITY = 0.02;
export const SCROLL_SENSITIVITY = 0.006;
export const SCROLL_DECAY = 0.8;
export const DRIFT_AMOUNT = 8.0;
export const DRIFT_LERP = 0.12;
export const DRIFT_LERP_ZOOMING = 0.2;
export const PLANE_OPACITY_LERP = 0.18;
export const ITEMS_PER_CHUNK = 5;
export const PLANE_SIZE_MIN = 12;
export const PLANE_SIZE_RANGE = 8;
export const MAX_PLANE_CACHE = 256;
export const CHUNK_UPDATE_THROTTLE_SLOW = 500;
export const CHUNK_UPDATE_THROTTLE_ZOOMING = 400;
export const CHUNK_UPDATE_THROTTLE_DEFAULT = 100;

// --- Math utilities ---
export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const seededRandom = (seed: number): number => {
	const x = Math.sin(seed * 9999) * 10000;
	return x - Math.floor(x);
};

export const hashString = (str: string): number => {
	let h = 0;
	for (let i = 0; i < str.length; i++) {
		h = ((h << 5) - h + str.charCodeAt(i)) | 0;
	}
	return Math.abs(h);
};

// --- Types ---
export interface PlaneData {
	id: string;
	position: THREE.Vector3;
	scale: THREE.Vector3;
	textureIndex: number;
}

export interface ChunkData {
	key: string;
	cx: number;
	cy: number;
	cz: number;
	planes: PlaneData[] | null;
}

export interface CameraGridState {
	cx: number;
	cy: number;
	cz: number;
	camZ: number;
}

export interface CanvasState {
	velocity: THREE.Vector3;
	targetVel: THREE.Vector3;
	basePos: THREE.Vector3;
	drift: THREE.Vector2;
	mouse: THREE.Vector2;
	lastMouse: THREE.Vector2;
	scrollAccum: number;
	isDragging: boolean;
	lastTouches: Touch[];
	lastTouchDist: number;
	lastChunkKey: string;
	lastChunkUpdate: number;
	pendingChunk: { cx: number; cy: number; cz: number } | null;
}

// --- Chunk offsets (Chebyshev distance ≤ RENDER_DISTANCE + CHUNK_FADE_MARGIN) ---
export type ChunkOffset = { dx: number; dy: number; dz: number; dist: number };

const maxDist = RENDER_DISTANCE + CHUNK_FADE_MARGIN;
export const CHUNK_OFFSETS: ChunkOffset[] = [];
for (let dx = -maxDist; dx <= maxDist; dx++) {
	for (let dy = -maxDist; dy <= maxDist; dy++) {
		for (let dz = -maxDist; dz <= maxDist; dz++) {
			const dist = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
			if (dist > maxDist) continue;
			CHUNK_OFFSETS.push({ dx, dy, dz, dist });
		}
	}
}

// --- Chunk plane generation (seeded PRNG) ---
export const generateChunkPlanes = (cx: number, cy: number, cz: number): PlaneData[] => {
	const planes: PlaneData[] = [];
	const seed = hashString(`${cx},${cy},${cz}`);

	for (let i = 0; i < ITEMS_PER_CHUNK; i++) {
		const s = seed + i * 1000;
		const r = (n: number) => seededRandom(s + n);
		const size = PLANE_SIZE_MIN + r(4) * PLANE_SIZE_RANGE;

		planes.push({
			id: `${cx}-${cy}-${cz}-${i}`,
			position: new THREE.Vector3(
				cx * CHUNK_SIZE + r(0) * CHUNK_SIZE,
				cy * CHUNK_SIZE + r(1) * CHUNK_SIZE,
				cz * CHUNK_SIZE + r(2) * CHUNK_SIZE
			),
			scale: new THREE.Vector3(size, size, 1),
			textureIndex: Math.floor(r(5) * 1_000_000)
		});
	}

	return planes;
};

// --- LRU cache for chunk planes ---
const planeCache = new Map<string, PlaneData[]>();

const touchPlaneCache = (key: string) => {
	const v = planeCache.get(key);
	if (!v) return;
	planeCache.delete(key);
	planeCache.set(key, v);
};

const evictPlaneCache = () => {
	while (planeCache.size > MAX_PLANE_CACHE) {
		const firstKey = planeCache.keys().next().value;
		if (!firstKey) break;
		planeCache.delete(firstKey);
	}
};

export const generateChunkPlanesCached = (cx: number, cy: number, cz: number): PlaneData[] => {
	const key = `${cx},${cy},${cz}`;
	const cached = planeCache.get(key);
	if (cached) {
		touchPlaneCache(key);
		return cached;
	}
	const planes = generateChunkPlanes(cx, cy, cz);
	planeCache.set(key, planes);
	evictPlaneCache();
	return planes;
};

// --- Chunk update throttle ---
export const getChunkUpdateThrottleMs = (isZooming: boolean, zoomSpeed: number): number => {
	if (zoomSpeed > 1.0) return CHUNK_UPDATE_THROTTLE_SLOW;
	if (isZooming) return CHUNK_UPDATE_THROTTLE_ZOOMING;
	return CHUNK_UPDATE_THROTTLE_DEFAULT;
};

export const shouldThrottleUpdate = (
	lastUpdateTime: number,
	throttleMs: number,
	currentTime: number
): boolean => currentTime - lastUpdateTime >= throttleMs;

// --- Touch distance ---
export const getTouchDistance = (touches: Touch[]): number => {
	if (touches.length < 2) return 0;
	const [t1, t2] = touches;
	const dx = t1.clientX - t2.clientX;
	const dy = t1.clientY - t2.clientY;
	return Math.sqrt(dx * dx + dy * dy);
};

// --- Create initial controller state ---
export const createInitialState = (camZ: number): CanvasState => ({
	velocity: new THREE.Vector3(),
	targetVel: new THREE.Vector3(),
	basePos: new THREE.Vector3(0, 0, camZ),
	drift: new THREE.Vector2(),
	mouse: new THREE.Vector2(),
	lastMouse: new THREE.Vector2(),
	scrollAccum: 0,
	isDragging: false,
	lastTouches: [],
	lastTouchDist: 0,
	lastChunkKey: '',
	lastChunkUpdate: 0,
	pendingChunk: null
});

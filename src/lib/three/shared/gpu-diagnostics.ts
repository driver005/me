import * as THREE from 'three';

// Dev-only WebGL diagnostics — all exports are no-ops outside dev.

/** Logs renderer GPU state: programs, geometries, textures, draw calls, triangles. */
export function logRendererInfo(renderer: THREE.WebGLRenderer, label: string): void {
	if (!import.meta.env.DEV) return;

	const info = renderer.info;
	console.log(`[gpu] ${label} — programs: ${info.programs?.length ?? 0}`);
	console.log(`[gpu] ${label} — geometries: ${info.memory.geometries} | textures: ${info.memory.textures}`);
	console.log(`[gpu] ${label} — draw calls: ${info.render.calls} | triangles: ${info.render.triangles}`);
	if (info.programs && info.programs.length > 0) {
		const list = info.programs
			.map((program) => `${program.name} (used ${program.usedTimes}x, key ${program.cacheKey})`)
			.join('\n  ');
		console.log(`[gpu] ${label} — programs:\n  ${list}`);
	}
}

/** Wraps a sync step and logs its duration. */
export function timeStep<T>(label: string, fn: () => T): T {
	if (!import.meta.env.DEV) return fn();

	const start = performance.now();
	const result = fn();
	const ms = performance.now() - start;
	console.log(`[timing] ${label}: ${ms.toFixed(2)}ms`);
	return result;
}

/** One frame's per-stage timing record. */
export interface LoopFrameRecord {
	frame: number;
	delta: number;
	skybox: number;
	room: number;
	coffeeSteam: number;
	rain: number;
	smoke: number;
	postprocess: number;
	total: number;
}

/** Ring buffer of recent per-frame loop timings. */
const LOOP_HISTORY_CAP = 300;
const loopHistory: LoopFrameRecord[] = [];
let loopFrameCounter = 0;

/** Records one frame's per-stage timing into the ring buffer. */
export function recordLoopFrame(record: Omit<LoopFrameRecord, 'frame'>): void {
	if (!import.meta.env.DEV) return;

	loopHistory.push({ frame: loopFrameCounter++, ...record });
	if (loopHistory.length > LOOP_HISTORY_CAP) loopHistory.shift();
}

/** Dumps last ~300 loop frames — last 20 in full, older summarized as min/max/avg. */
export function logLoopHistory(label: string): void {
	if (!import.meta.env.DEV) return;
	if (loopHistory.length === 0) {
		console.log(`[gpu] ${label} — no loop frames recorded yet`);
		return;
	}

	const recent = loopHistory.slice(-20);
	const older = loopHistory.slice(0, -20);

	console.log(`[gpu] ${label} — last ${recent.length} loop frames (of ${loopHistory.length} recorded):`);
	for (const r of recent) {
		console.log(
			`[gpu]   frame ${r.frame}: delta=${r.delta.toFixed(4)}s skybox=${r.skybox.toFixed(2)}ms ` +
				`room=${r.room.toFixed(2)}ms coffeeSteam=${r.coffeeSteam.toFixed(2)}ms rain=${r.rain.toFixed(2)}ms ` +
				`smoke=${r.smoke.toFixed(2)}ms postprocess=${r.postprocess.toFixed(2)}ms total=${r.total.toFixed(2)}ms`
		);
	}

	if (older.length > 0) {
		const stages = ['skybox', 'room', 'coffeeSteam', 'rain', 'smoke', 'postprocess', 'total'] as const;
		const summary = stages
			.map((stage) => {
				const values = older.map((r) => r[stage]);
				const min = Math.min(...values);
				const max = Math.max(...values);
				const avg = values.reduce((a, b) => a + b, 0) / values.length;
				return `${stage}: min=${min.toFixed(2)} avg=${avg.toFixed(2)} max=${max.toFixed(2)}`;
			})
			.join(' | ');
		console.log(`[gpu] ${label} — earlier ${older.length} frames (ms): ${summary}`);
	}
}

/** Logs pixel dimensions and estimated VRAM for every texture in the scene. */
export function logTextureSizes(scene: THREE.Scene): void {
	if (!import.meta.env.DEV) return;

	const seen = new Set<THREE.Texture>();
	const rows: { source: string; size: string; approxMB: number }[] = [];

	scene.traverse((obj) => {
		if (!(obj instanceof THREE.Mesh)) return;
		const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
		for (const mat of materials) {
			if (!mat) continue;
			for (const key of Object.keys(mat)) {
				const value = (mat as unknown as Record<string, unknown>)[key];
				if (!value || typeof value !== 'object' || !(value as THREE.Texture).isTexture) continue;
				const tex = value as THREE.Texture;
				if (seen.has(tex)) continue;
				seen.add(tex);
				const image = tex.image as { width?: number; height?: number } | undefined;
				const width = image?.width ?? 0;
				const height = image?.height ?? 0;
				const isCompressed = (tex as THREE.CompressedTexture).isCompressedTexture === true;
				const bytesPerPixel = isCompressed ? 0.75 : 4 * 1.33; // *1.33 for the uncompressed mipmap chain
				const approxMB = (width * height * bytesPerPixel) / (1024 * 1024);
				const label = isCompressed ? 'compressed' : 'uncompressed';
				rows.push({
					source: `${obj.name || '(unnamed mesh)'}.${key} [${tex.name || 'unnamed'}] (${label})`,
					size: `${width}x${height}`,
					approxMB: Math.round(approxMB * 10) / 10
				});
			}
		}
	});

	rows.sort((a, b) => b.approxMB - a.approxMB);
	const total = rows.reduce((sum, r) => sum + r.approxMB, 0);
	console.log(`[gpu] texture scan — ${rows.length} unique textures, ~${Math.round(total)}MB estimated total`);
	for (const row of rows) {
		console.log(`  ${row.source}: ${row.size} (~${row.approxMB}MB)`);
	}
}

/** Logs per-mesh vertex/triangle counts and real buffer memory, sorted heaviest first. */
export function logGeometryMemory(scene: THREE.Scene, label: string): void {
	if (!import.meta.env.DEV) return;

	const seen = new Set<THREE.BufferGeometry>();
	const rows: { name: string; vertices: number; triangles: number; bytes: number }[] = [];

	scene.traverse((obj) => {
		if (!(obj instanceof THREE.Mesh)) return;
		const geometry = obj.geometry;
		if (!geometry || seen.has(geometry)) return;
		seen.add(geometry);

		let bytes = 0;
		for (const key of Object.keys(geometry.attributes)) {
			const attr = geometry.attributes[key] as THREE.BufferAttribute;
			bytes += attr.array.byteLength;
		}
		if (geometry.index) bytes += geometry.index.array.byteLength;

		const vertexCount = geometry.attributes.position?.count ?? 0;
		const triangleCount = Math.round(geometry.index ? geometry.index.count / 3 : vertexCount / 3);

		rows.push({ name: obj.name || '(unnamed mesh)', vertices: vertexCount, triangles: triangleCount, bytes });
	});

	rows.sort((a, b) => b.bytes - a.bytes);
	const totalBytes = rows.reduce((sum, r) => sum + r.bytes, 0);
	const totalVertices = rows.reduce((sum, r) => sum + r.vertices, 0);
	const totalTriangles = rows.reduce((sum, r) => sum + r.triangles, 0);
	console.log(
		`[gpu] ${label} — geometry scan: ${rows.length} unique geometries, ${totalVertices} vertices, ` +
			`${totalTriangles} triangles, ~${(totalBytes / (1024 * 1024)).toFixed(2)}MB total buffer memory`
	);
	for (const row of rows) {
		console.log(`  ${row.name}: ${row.vertices}v / ${row.triangles}tri, ~${(row.bytes / 1024).toFixed(1)}KB`);
	}
}

/** Logs GPU vendor/renderer, context attributes, and hardware limits. Call once per session. */
export function logGPUIdentity(renderer: THREE.WebGLRenderer, label: string): void {
	if (!import.meta.env.DEV) return;

	const gl = renderer.getContext();
	if (!gl) {
		console.log(`[gpu] ${label} — GPU identity: context unavailable (already lost?)`);
		return;
	}

	const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
	const unmaskedVendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '(WEBGL_debug_renderer_info unavailable)';
	const unmaskedRenderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '(WEBGL_debug_renderer_info unavailable)';

	console.log(`[gpu] ${label} — GPU identity:`);
	console.log(`  unmasked vendor: ${unmaskedVendor}`);
	console.log(`  unmasked renderer: ${unmaskedRenderer}`);
	console.log(`  masked vendor/renderer: ${gl.getParameter(gl.VENDOR)} / ${gl.getParameter(gl.RENDERER)}`);
	console.log(`  GL version: ${gl.getParameter(gl.VERSION)} | GLSL: ${gl.getParameter(gl.SHADING_LANGUAGE_VERSION)}`);
	console.log(`  isWebGL2: ${renderer.capabilities.isWebGL2}`);
	console.log(`  context attributes: ${JSON.stringify(gl.getContextAttributes())}`);
	console.log(
		`  limits: MAX_TEXTURE_SIZE=${gl.getParameter(gl.MAX_TEXTURE_SIZE)} MAX_TEXTURE_IMAGE_UNITS=${gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)} ` +
			`MAX_VERTEX_ATTRIBS=${gl.getParameter(gl.MAX_VERTEX_ATTRIBS)} MAX_RENDERBUFFER_SIZE=${gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)} ` +
			`MAX_VIEWPORT_DIMS=${gl.getParameter(gl.MAX_VIEWPORT_DIMS)}`
	);
	console.log(`  navigator.userAgent: ${navigator.userAgent}`);
}

/** Logs a webglcontextcreationerror event's statusMessage. Only fires on creation failure. */
export function logContextCreationError(event: Event, label: string): void {
	if (!import.meta.env.DEV) return;

	const statusMessage = (event as Event & { statusMessage?: string }).statusMessage;
	console.log(`[gpu] ${label} — webglcontextcreationerror: ${statusMessage ?? '(no statusMessage on this event)'}`);
}

/** Full debug dump: GPU identity, renderer state, geometry memory, texture VRAM. */
export function logFullReport(renderer: THREE.WebGLRenderer, scene: THREE.Scene, label: string): void {
	if (!import.meta.env.DEV) return;

	console.log(`[gpu] ==================== full report: ${label} ====================`);
	logGPUIdentity(renderer, label);
	logRendererInfo(renderer, label);
	logGeometryMemory(scene, label);
	logTextureSizes(scene);
	console.log(`[gpu] ==================== end report: ${label} ====================`);
}

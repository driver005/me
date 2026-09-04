import * as THREE from 'three';

/**
 * Dev-only WebGL diagnostics. Exists because tracking down /home's context-loss crash needed exactly
 * this kind of visibility and didn't have it — the actual cause (a dozen-plus redundant transmissive
 * materials, each forcing its own render pass — see room.ts's own glassMaterial/waterMaterial comment)
 * would have shown up immediately in `renderer.info.programs`'s per-program `usedTimes`/name list instead
 * of taking several rounds of reading `postprocessing`'s own source by hand to find. Both this file's
 * exports are no-ops outside dev (`import.meta.env.DEV`) — never runs in production.
 */

/** Logs a snapshot of the renderer's own tracked GPU state: how many distinct shader programs are
 *  currently compiled (each one is a real GPU resource — the more unique material/geometry/lighting
 *  combinations a scene has, the more of these there are), how many geometries/textures are resident,
 *  and this frame's draw-call/triangle count. Call it after building a scene, and again from inside a
 *  'webglcontextlost' handler (before tearing anything down) to see what state the renderer was in right
 *  before it died. */
export function logRendererInfo(renderer: THREE.WebGLRenderer, label: string): void {
	if (!import.meta.env.DEV) return;

	// Plain console.log lines, not console.group/console.table — both collapse or render as rich
	// widgets in devtools that a plain-text copy/paste of the console output drops entirely, which is
	// exactly what happened the first time this ran (the group's contents never made it into the
	// pasted log).
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

/** Wraps a synchronous construction step and logs how long it took — the "what takes the longest"
 *  half of this: run each sub-system's construction through this (see home-scene.ts) to get a per-step
 *  breakdown instead of only knowing the total. */
export function timeStep<T>(label: string, fn: () => T): T {
	if (!import.meta.env.DEV) return fn();

	const start = performance.now();
	const result = fn();
	const ms = performance.now() - start;
	console.log(`[timing] ${label}: ${ms.toFixed(2)}ms`);
	return result;
}

/** One frame's worth of per-stage timing, recorded by recordLoopFrame() below. Every field is a
 *  duration in ms except `delta` (the frame's own THREE clock delta, seconds) and `frame` (a running
 *  counter since the scene was built). */
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

/** Ring buffer of the most recent per-frame loop timings — see recordLoopFrame()/logLoopHistory(). A
 *  fixed cap so a long-running session doesn't leak an ever-growing array; only the frames right
 *  before whatever's being investigated (a context loss, a stall) actually matter. */
const LOOP_HISTORY_CAP = 300;
const loopHistory: LoopFrameRecord[] = [];
let loopFrameCounter = 0;

/** Records one frame's per-stage timing into the ring buffer — call this from HomeScene.loop() every
 *  frame (dev-only, see below) after timing each sub-system's own loop()/render() call. Exists because
 *  a context loss has been reported happening well AFTER the room finishes loading — i.e. during
 *  steady-state looping, not the startup shader-compile burst every previous crash investigation in
 *  this file focused on. Nothing here can prove which loop caused a loss on its own, but logLoopHistory
 *  (called from HomeEngineRoot.svelte's own 'webglcontextlost' handler, right where logFullReport
 *  already runs) shows exactly what the last ~300 frames were spending time on, including any stage
 *  that was ballooning or a delta spike right before the loss. */
export function recordLoopFrame(record: Omit<LoopFrameRecord, 'frame'>): void {
	if (!import.meta.env.DEV) return;

	loopHistory.push({ frame: loopFrameCounter++, ...record });
	if (loopHistory.length > LOOP_HISTORY_CAP) loopHistory.shift();
}

/** Dumps the last ~300 recorded loop frames — see recordLoopFrame()'s own comment for why this exists.
 *  Only the last 20 print in full (one line each); older frames are summarized as min/max/avg per stage
 *  so a long history doesn't flood the console, while still surfacing an outlier that happened earlier
 *  in the window. */
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

/** Walks the scene for every texture actually assigned to a material (map, envMap, normalMap, etc.) and
 *  logs its pixel dimensions and an estimated VRAM footprint (width × height × 4 bytes/pixel × ~1.33 for
 *  the mipmap chain — an approximation, not an exact GPU accounting, but enough to spot a single
 *  oversized texture). `renderer.info.memory.textures` only gives a *count*, which can't tell a scene
 *  full of small textures apart from one with a single huge one — this can. */
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
				// KTX2Loader produces THREE.CompressedTexture instances — a block-compressed GPU format
				// stays compressed in VRAM instead of expanding to raw RGBA, at roughly 0.5-1 byte/pixel
				// for ETC1S/BC7-class formats vs 4 bytes/pixel uncompressed. Without this branch, every
				// KTX2 texture here would report the same inflated size as an uncompressed one, which is
				// exactly the stale number this function gave right after room.ts started using KTX2.
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

/** Walks the scene for every unique `BufferGeometry` and sums each of its attribute buffers' (position,
 *  normal, uv, color, skinIndex/Weight, index, ...) actual byte length — an exact figure, not an
 *  estimate like logTextureSizes' texture-dimension guess, since a geometry's buffers are just typed
 *  arrays with a real `.byteLength`. Logs per-mesh vertex/triangle counts and memory, sorted heaviest
 *  first, plus scene-wide totals. */
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

/** Logs what actually distinguishes this run's GPU/driver from a normal one — the thing every other
 *  function in this file is missing. `renderer.info`/geometry/texture scans only show what's *resident*
 *  in the scene; none of that says anything about the underlying hardware or why a context might be
 *  fragile in the first place. This reads the real GPU vendor/renderer strings (via the
 *  `WEBGL_debug_renderer_info` extension — masked by default unless that extension is actually
 *  available, in which case it unmasks the true hardware string instead of a generic one), the actual
 *  context attributes the renderer ended up with, hardware limits (max texture size, texture units,
 *  vertex attributes), and whether this is WebGL1 or WebGL2. Call once per session — this doesn't change
 *  frame to frame, so there's no reason to call it from a hot path the way the others are. */
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

/** Logs a `webglcontextcreationerror` event's own `statusMessage` — the ONE piece of driver-supplied
 *  diagnostic text WebGL actually gives out (three.js's own WebGLRenderer already prints this by
 *  default via console.error, which is the *only* reason it's ever been visible at all so far — nothing
 *  in this file was actually listening for the event itself before now). Wire a
 *  `renderer.domElement.addEventListener('webglcontextcreationerror', (e) => logContextCreationError(e,
 *  label))` wherever a context might get (re)created — this only fires on creation *failure*, not on an
 *  already-successful context later being lost (that's 'webglcontextlost', a different event — see
 *  logFullReport for that one). */
export function logContextCreationError(event: Event, label: string): void {
	if (!import.meta.env.DEV) return;

	const statusMessage = (event as Event & { statusMessage?: string }).statusMessage;
	console.log(`[gpu] ${label} — webglcontextcreationerror: ${statusMessage ?? '(no statusMessage on this event)'}`);
}

/** Everything above, run together under one label — the actual "full debug dump": GPU identity/limits,
 *  renderer state (program count/list, draw calls, triangles this frame), every geometry's real buffer
 *  memory, and every texture's estimated VRAM footprint. Call this once after a scene finishes building,
 *  and again from a 'webglcontextlost' handler right before tearing anything down, to compare a healthy
 *  snapshot against the state at the moment something actually broke. */
export function logFullReport(renderer: THREE.WebGLRenderer, scene: THREE.Scene, label: string): void {
	if (!import.meta.env.DEV) return;

	console.log(`[gpu] ==================== full report: ${label} ====================`);
	logGPUIdentity(renderer, label);
	logRendererInfo(renderer, label);
	logGeometryMemory(scene, label);
	logTextureSizes(scene);
	console.log(`[gpu] ==================== end report: ${label} ====================`);
}

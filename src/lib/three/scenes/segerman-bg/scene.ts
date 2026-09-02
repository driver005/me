import * as THREE from 'three';
import type { ThrelteContext } from '@threlte/core';
import type { Layer } from './layer';
import type { PointerState, SceneUniforms } from './types';
import { createFullscreenTriangle } from './fullscreen-triangle';

/**
 * The engine's renderer/camera/uniform/render-target handle — every Layer class (Stars, Fog, Planet,
 * Gallery, Compositor, ...) takes this as `scene: Scene` and is otherwise untouched by the Threlte
 * migration below. Was a class owning its own `THREE.WebGLRenderer`; now an interface backed by
 * `createScene()`, which builds this same shape from Threlte's own `<Canvas>` context instead —
 * Threlte owns the renderer/canvas/camera lifecycle, this only adds the engine's own uniforms/pointer/
 * render-target bookkeeping and per-frame layer loop on top.
 */
export interface Scene {
	renderer: THREE.WebGLRenderer;
	camera: THREE.PerspectiveCamera;
	scene: THREE.Scene;
	fullScreenTriangle: THREE.BufferGeometry;

	uniforms: SceneUniforms;
	pointer: PointerState;

	readonly widthAtZ: number;
	readonly heightAtZ: number;

	isTouch: boolean;
	isLowDpr: boolean;
	isMobile: boolean;
	dpr: number;

	addLayer(layer: Layer): void;
	createRenderTarget(scale: number, options?: THREE.RenderTargetOptions): THREE.WebGLRenderTarget;
	/** The final draw call each frame — set once by the compositor. Before that, defaults to a black clear. */
	setOutput(drawFn: () => void): void;
	dispose(): void;
}

/**
 * Builds a `Scene` handle from an already-mounted Threlte `<Canvas>` context (call from inside a
 * component that is itself a descendant of `<Canvas>`, so `useThrelte()` has something to return).
 * The caller owns driving `resize()`/the per-frame loop via Threlte's own `size` store and `useTask` —
 * see EngineRoot.svelte, which is the only thing that constructs this.
 */
export function createScene(threlte: ThrelteContext<THREE.WebGLRenderer>, canvas: HTMLCanvasElement): Scene {
	const isTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
	const isLowDpr = window.devicePixelRatio <= 1.5;
	const isMobile = window.matchMedia('(max-width: 767px)').matches;

	const renderer = threlte.renderer as THREE.WebGLRenderer;
	const camera = threlte.camera.current as THREE.PerspectiveCamera;
	const innerScene = threlte.scene;
	const fullScreenTriangle = createFullscreenTriangle();

	const uniforms: SceneUniforms = {
		uTime: { value: 0 },
		uRes: { value: new THREE.Vector2() },
		uDpr: { value: threlte.dpr.current },
		uMode: { value: 1 },
		uIsTouch: { value: isTouch ? 1 : 0 },
		uCurveX: { value: 0.00005 },
		uCurveZ: { value: 0.01 },
		uToggleCoords: { value: new THREE.Vector2(0.9, 0.9) },
		uToggleProgress: { value: 0 },
		uDirection: { value: 0 },
		uProgressFront: { value: 0 },
		uProgressBack: { value: 0 },
		uWarp: { value: 0 }
	};

	const pointer: PointerState = { x: 0, y: 0, dx: 0, dy: 0, nx: 0, ny: 0, speed: 0, isDown: false };

	const layers: Layer[] = [];
	const rts: { rt: THREE.WebGLRenderTarget; scaleFn: () => number }[] = [];
	let outputFn: (() => void) | null = null;
	let width = 0;
	let height = 0;
	let widthAtZ = 0;
	let heightAtZ = 0;

	function onPointerMove(event: PointerEvent): void {
		const nx = (event.clientX / width) * 2 - 1;
		const ny = -(event.clientY / height) * 2 + 1;
		pointer.dx = event.clientX - pointer.x;
		pointer.dy = event.clientY - pointer.y;
		pointer.x = event.clientX;
		pointer.y = event.clientY;
		pointer.nx = nx;
		pointer.ny = ny;
		pointer.speed = Math.abs(pointer.dx) + Math.abs(pointer.dy);
	}
	function onPointerDown(event: PointerEvent): void {
		pointer.isDown = true;
		pointer.x = event.clientX;
		pointer.y = event.clientY;
	}
	function onPointerUp(): void {
		pointer.isDown = false;
	}
	canvas.addEventListener('pointermove', onPointerMove, { passive: true });
	canvas.addEventListener('pointerdown', onPointerDown, { passive: true });
	canvas.addEventListener('pointerup', onPointerUp, { passive: true });
	canvas.addEventListener('pointercancel', onPointerUp, { passive: true });

	function resize(w: number, h: number): void {
		width = w;
		height = h;
		// Threlte's own `makeDefault` camera already gets its aspect/projection-matrix updated on
		// resize — this only recomputes the engine's own derived widthAtZ/heightAtZ on top of that.
		const fovRad = (camera.fov * Math.PI) / 180;
		heightAtZ = 2 * Math.tan(fovRad / 2) * camera.position.z;
		widthAtZ = heightAtZ * camera.aspect;
		uniforms.uRes.value.set(w, h);
		uniforms.uDpr.value = threlte.dpr.current;
		for (const { rt, scaleFn } of rts) {
			rt.setSize(Math.round(w * scaleFn()), Math.round(h * scaleFn()));
		}
		for (const layer of layers) layer.dirty();
	}
	resize(canvas.clientWidth, canvas.clientHeight);

	const handle: Scene = {
		renderer,
		camera,
		scene: innerScene,
		fullScreenTriangle,
		uniforms,
		pointer,
		get widthAtZ() {
			return widthAtZ;
		},
		get heightAtZ() {
			return heightAtZ;
		},
		isTouch,
		isLowDpr,
		isMobile,
		get dpr() {
			return threlte.dpr.current;
		},
		addLayer(layer: Layer): void {
			layers.push(layer);
		},
		createRenderTarget(scale: number, options: THREE.RenderTargetOptions = {}): THREE.WebGLRenderTarget {
			const scaleFn = () => scale;
			const rt = new THREE.WebGLRenderTarget(
				Math.round(width * scale),
				Math.round(height * scale),
				{ minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false, ...options }
			);
			rt.texture.generateMipmaps = false;
			rts.push({ rt, scaleFn });
			return rt;
		},
		setOutput(drawFn: () => void): void {
			outputFn = drawFn;
		},
		dispose(): void {
			canvas.removeEventListener('pointermove', onPointerMove);
			canvas.removeEventListener('pointerdown', onPointerDown);
			canvas.removeEventListener('pointerup', onPointerUp);
			canvas.removeEventListener('pointercancel', onPointerUp);
			for (const layer of layers) layer.dispose?.();
			for (const { rt } of rts) rt.dispose();
			fullScreenTriangle.dispose();
		}
	};

	// Exposed for EngineRoot.svelte, which drives both from a Threlte useTask/size-watch instead of
	// this module owning its own requestAnimationFrame/resize-listener (Threlte owns that loop now).
	(handle as Scene & { __resize: typeof resize; __layers: Layer[]; __getOutput: () => (() => void) | null }).__resize = resize;
	(handle as Scene & { __resize: typeof resize; __layers: Layer[]; __getOutput: () => (() => void) | null }).__layers = layers;
	(handle as Scene & { __resize: typeof resize; __layers: Layer[]; __getOutput: () => (() => void) | null }).__getOutput = () => outputFn;

	return handle;
}

/** Internal handle for EngineRoot.svelte's resize-watch/useTask — not part of the public `Scene` shape
 *  every Layer class sees. */
export interface SceneInternal {
	__resize: (width: number, height: number) => void;
	__layers: Layer[];
	__getOutput: () => (() => void) | null;
}

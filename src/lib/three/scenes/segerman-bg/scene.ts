import * as THREE from 'three';
import type { Layer } from './layer';
import type { PointerState, SceneUniforms } from './types';
import { createFullscreenTriangle } from './fullscreen-triangle';

export class Scene {
	canvas: HTMLCanvasElement;
	renderer: THREE.WebGLRenderer;
	camera: THREE.PerspectiveCamera;
	scene = new THREE.Scene();
	fullScreenTriangle = createFullscreenTriangle();

	uniforms: SceneUniforms;
	pointer: PointerState = { x: 0, y: 0, dx: 0, dy: 0, nx: 0, ny: 0, speed: 0, isDown: false };

	get widthAtZ(): number {
		return this._widthAtZ;
	}

	get heightAtZ(): number {
		return this._heightAtZ;
	}

	isTouch: boolean;
	isLowDpr: boolean;
	isMobile: boolean;
	dpr: number;

	private layers: Layer[] = [];
	private rts: { rt: THREE.WebGLRenderTarget; scaleFn: () => number }[] = [];
	private outputFn: (() => void) | null = null;
	private rafId = 0;
	private width = 0;
	private height = 0;
	private _widthAtZ = 0;
	private _heightAtZ = 0;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.isTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
		this.dpr = Math.min(window.devicePixelRatio, 2);
		this.isLowDpr = window.devicePixelRatio <= 1.5;
		this.isMobile = window.matchMedia('(max-width: 767px)').matches;

		this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, powerPreference: 'high-performance' });
		this.renderer.autoClear = false;
		this.renderer.setPixelRatio(this.dpr);
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;

		this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
		this.camera.position.z = 100;

		this.uniforms = {
			uTime: { value: 0 },
			uRes: { value: new THREE.Vector2() },
			uDpr: { value: this.dpr },
			uMode: { value: 1 },
			uIsTouch: { value: 0 },
			uCurveX: { value: 0.00005 },
			uCurveZ: { value: 0.01 },
			uToggleCoords: { value: new THREE.Vector2(0.9, 0.9) },
			uToggleProgress: { value: 0 },
			uDirection: { value: 0 },
			uProgressFront: { value: 0 },
			uProgressBack: { value: 0 },
			uWarp: { value: 0 }
		};
		this.uniforms.uIsTouch.value = this.isTouch ? 1 : 0;

		window.addEventListener('resize', this.handleWindowResize);
		canvas.addEventListener('pointermove', this.onPointerMove, { passive: true });
		canvas.addEventListener('pointerdown', this.onPointerDown, { passive: true });
		canvas.addEventListener('pointerup', this.onPointerUp, { passive: true });
		canvas.addEventListener('pointercancel', this.onPointerUp, { passive: true });

		this.handleWindowResize();
	}

	addLayer(layer: Layer): void {
		this.layers.push(layer);
	}

	createRenderTarget(scale: number, options: THREE.RenderTargetOptions = {}): THREE.WebGLRenderTarget {
		const scaleFn = () => scale;
		const rt = new THREE.WebGLRenderTarget(
			Math.round(this.width * scale),
			Math.round(this.height * scale),
			{ minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false, ...options }
		);
		rt.texture.generateMipmaps = false;
		this.rts.push({ rt, scaleFn });
		return rt;
	}

	/** The final draw call each frame — set once by the compositor (Task 9). Before that, defaults to a black clear. */
	setOutput(drawFn: () => void): void {
		this.outputFn = drawFn;
	}

	private onPointerMove = (event: PointerEvent): void => {
		const nx = (event.clientX / this.width) * 2 - 1;
		const ny = -(event.clientY / this.height) * 2 + 1;
		this.pointer.dx = event.clientX - this.pointer.x;
		this.pointer.dy = event.clientY - this.pointer.y;
		this.pointer.x = event.clientX;
		this.pointer.y = event.clientY;
		this.pointer.nx = nx;
		this.pointer.ny = ny;
		this.pointer.speed = Math.abs(this.pointer.dx) + Math.abs(this.pointer.dy);
	};

	private onPointerDown = (event: PointerEvent): void => {
		this.pointer.isDown = true;
		this.pointer.x = event.clientX;
		this.pointer.y = event.clientY;
	};

	private onPointerUp = (): void => {
		this.pointer.isDown = false;
	};

	private handleWindowResize = (): void => {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.dpr = Math.min(window.devicePixelRatio, 2);
		this.resize(this.width, this.height);
	};

	resize(width: number, height: number): void {
		this.width = width;
		this.height = height;
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		const fovRad = (this.camera.fov * Math.PI) / 180;
		this._heightAtZ = 2 * Math.tan(fovRad / 2) * this.camera.position.z;
		this._widthAtZ = this._heightAtZ * this.camera.aspect;
		this.uniforms.uRes.value.set(width, height);
		this.uniforms.uDpr.value = this.dpr;
		this.renderer.setPixelRatio(this.dpr);
		this.renderer.setSize(width, height);
		for (const { rt, scaleFn } of this.rts) {
			rt.setSize(Math.round(width * scaleFn()), Math.round(height * scaleFn()));
		}
		for (const layer of this.layers) layer.dirty();
	}

	private loop = (t: number): void => {
		this.uniforms.uTime.value = t / 1000;
		for (const layer of this.layers) layer.loop();
		this.renderer.setRenderTarget(null);
		this.renderer.clear();
		if (this.outputFn) {
			this.outputFn();
		}
		this.rafId = requestAnimationFrame(this.loop);
	};

	start(): void {
		this.rafId = requestAnimationFrame(this.loop);
	}

	dispose(): void {
		cancelAnimationFrame(this.rafId);
		window.removeEventListener('resize', this.handleWindowResize);
		this.canvas.removeEventListener('pointermove', this.onPointerMove);
		this.canvas.removeEventListener('pointerdown', this.onPointerDown);
		this.canvas.removeEventListener('pointerup', this.onPointerUp);
		this.canvas.removeEventListener('pointercancel', this.onPointerUp);
		for (const layer of this.layers) layer.dispose?.();
		for (const { rt } of this.rts) rt.dispose();
		this.fullScreenTriangle.dispose();
		this.renderer.dispose();
	}
}

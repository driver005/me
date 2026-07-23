import { browser } from '$app/environment';

type MaybeGetter<T> = T | (() => T);

export interface DragPanOptions {
	wrapX?: MaybeGetter<number>;
	wrapY?: MaybeGetter<number>;
	boundsX?: MaybeGetter<[number, number]>;
	boundsY?: MaybeGetter<[number, number]>;
}

function resolve<T>(v: MaybeGetter<T> | undefined): T | undefined {
	return typeof v === 'function' ? (v as () => T)() : v;
}

export function useDragPan(options: DragPanOptions = {}) {
	let x = $state(0);
	let y = $state(0);
	let dragging = $state(false);

	let vx = 0;
	let vy = 0;
	let lastX = 0;
	let lastY = 0;
	let lastT = 0;
	let rafId = 0;

	function clampDelta(nx: number, ny: number) {
		const wrapX = resolve(options.wrapX);
		const wrapY = resolve(options.wrapY);
		const boundsX = resolve(options.boundsX);
		const boundsY = resolve(options.boundsY);
		if (wrapX) nx = ((nx % wrapX) + wrapX) % wrapX;
		if (wrapY) ny = ((ny % wrapY) + wrapY) % wrapY;
		if (boundsX) nx = Math.max(boundsX[0], Math.min(boundsX[1], nx));
		if (boundsY) ny = Math.max(boundsY[0], Math.min(boundsY[1], ny));
		return [nx, ny];
	}

	function applyDelta(dx: number, dy: number) {
		const [nx, ny] = clampDelta(x + dx, y + dy);
		x = nx;
		y = ny;
	}

	function onPointerDown(e: PointerEvent) {
		if (!browser) return;
		dragging = true;
		lastX = e.clientX;
		lastY = e.clientY;
		lastT = performance.now();
		vx = 0;
		vy = 0;
		cancelAnimationFrame(rafId);
		(e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;
		const dx = e.clientX - lastX;
		const dy = e.clientY - lastY;
		const now = performance.now();
		const dt = Math.max(1, now - lastT);
		vx = dx / dt;
		vy = dy / dt;
		applyDelta(dx, dy);
		lastX = e.clientX;
		lastY = e.clientY;
		lastT = now;
	}

	function inertia() {
		const tick = () => {
			vx *= 0.94;
			vy *= 0.94;
			if (Math.abs(vx) < 0.01 && Math.abs(vy) < 0.01) return;
			applyDelta(vx * 16, vy * 16);
			rafId = requestAnimationFrame(tick);
		};
		rafId = requestAnimationFrame(tick);
	}

	function onPointerUp() {
		if (!dragging) return;
		dragging = false;
		inertia();
	}

	return {
		get x() { return x; },
		get y() { return y; },
		get dragging() { return dragging; },
		onPointerDown,
		onPointerMove,
		onPointerUp,
		destroy() { cancelAnimationFrame(rafId); }
	};
}
